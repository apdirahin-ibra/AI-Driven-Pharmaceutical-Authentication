from __future__ import annotations

import logging
from time import sleep
import httpx
from pydantic import BaseModel, Field, field_validator

from .roles import UserRole, normalize_role


REQUEST_TIMEOUT_SECONDS = 20
REQUEST_ATTEMPTS = 3
RETRYABLE_HTTP_STATUSES = {429, 500, 502, 503, 504}
logger = logging.getLogger(__name__)


class CreateUserRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)
    full_name: str = Field(alias="fullName", min_length=2)
    role: UserRole

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Enter a valid email address.")
        return normalized


class UpdateUserRequest(BaseModel):
    email: str | None = Field(default=None, min_length=3)
    password: str | None = Field(default=None, min_length=8)
    full_name: str | None = Field(default=None, alias="fullName", min_length=2)
    role: UserRole | None = None


class SupabaseUserAdminError(RuntimeError):
    def __init__(self, message: str, *, code: str = "USER_ADMIN_REQUEST_FAILED", status_code: int = 503, retryable: bool = True) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.retryable = retryable


class SupabaseUserAdmin:
    def __init__(self, supabase_url: str | None, service_role_key: str | None) -> None:
        self.supabase_url = supabase_url
        self.service_role_key = service_role_key

    @property
    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.service_role_key)

    def list_users(self) -> list[dict]:
        data = self._request("GET", "/auth/v1/admin/users")
        users = data.get("users", []) if isinstance(data, dict) else []
        return [user_from_supabase(row) for row in users]

    def ping(self) -> dict:
        data = self._request("GET", "/auth/v1/admin/users")
        users = data.get("users", []) if isinstance(data, dict) else []
        return {"ok": True, "users_sampled": min(len(users), 1)}

    def create_user(self, request: CreateUserRequest) -> dict:
        if self.find_user_by_email(request.email):
            raise SupabaseUserAdminError(
                "A user with this email already exists.",
                code="DUPLICATE_EMAIL",
                status_code=409,
                retryable=False,
            )
        payload = {
            "email": request.email,
            "password": request.password,
            "email_confirm": True,
            "user_metadata": {"full_name": request.full_name, "role": request.role},
            "app_metadata": {"role": request.role},
        }
        try:
            data = self._request("POST", "/auth/v1/admin/users", json=payload, attempts=1)
        except SupabaseUserAdminError as exc:
            if exc.code == "USER_ADMIN_UNAVAILABLE":
                recovered = self.find_user_by_email(request.email)
                if recovered:
                    logger.warning("Recovered a successful user creation after an uncertain upstream response.")
                    return recovered
            raise
        return user_from_supabase(data)

    def update_user(self, user_id: str, request: UpdateUserRequest) -> dict:
        payload: dict = {}
        user_metadata: dict = {}
        app_metadata: dict = {}

        if request.email:
            payload["email"] = request.email
        if request.password:
            payload["password"] = request.password
        if request.full_name:
            user_metadata["full_name"] = request.full_name
        if request.role:
            self.ensure_admin_continuity(user_id, request.role)
            user_metadata["role"] = request.role
            app_metadata["role"] = request.role

        if user_metadata:
            payload["user_metadata"] = user_metadata
        if app_metadata:
            payload["app_metadata"] = app_metadata
        if not payload:
            raise SupabaseUserAdminError("No user changes were provided.")

        data = self._request("PUT", f"/auth/v1/admin/users/{user_id}", json=payload)
        return user_from_supabase(data)

    def delete_user(self, user_id: str) -> None:
        self.ensure_admin_continuity(user_id, None)
        self._request("DELETE", f"/auth/v1/admin/users/{user_id}")

    def find_user_by_email(self, email: str) -> dict | None:
        normalized = email.strip().lower()
        return next((user for user in self.list_users() if user["email"].lower() == normalized), None)

    def ensure_admin_continuity(self, user_id: str, next_role: UserRole | None) -> None:
        users = self.list_users()
        target = next((user for user in users if user["id"] == user_id), None)
        if not target or target["role"] != "Admin" or next_role == "Admin":
            return
        if sum(user["role"] == "Admin" for user in users) <= 1:
            raise SupabaseUserAdminError(
                "The final active administrator cannot be removed or changed to Pharmacist.",
                code="FINAL_ADMIN_REQUIRED",
                status_code=409,
                retryable=False,
            )

    def _request(self, method: str, path: str, *, json: dict | None = None, attempts: int = REQUEST_ATTEMPTS):
        if not self.is_configured:
            raise SupabaseUserAdminError("Supabase is not configured.")

        response = self._send_request(method, path, json=json, attempts=attempts)

        if not response.content:
            return {}
        return response.json()

    def _send_request(self, method: str, path: str, *, json: dict | None, attempts: int) -> httpx.Response:
        timeout = httpx.Timeout(REQUEST_TIMEOUT_SECONDS, connect=10)
        last_error: httpx.HTTPError | None = None
        headers = {
            "apikey": self.service_role_key or "",
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json",
        }
        for attempt in range(attempts):
            try:
                response = httpx.request(
                    method,
                    f"{self.supabase_url}{path}",
                    headers=headers,
                    json=json,
                    timeout=timeout,
                )
                if response.status_code in RETRYABLE_HTTP_STATUSES and attempt < attempts - 1:
                    logger.warning(
                        "Supabase user-admin request returned retryable status %s on attempt %s/%s.",
                        response.status_code,
                        attempt + 1,
                        attempts,
                    )
                    sleep(0.75 * (attempt + 1))
                    continue
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as exc:
                message = extract_error_message(exc.response)
                duplicate = exc.response.status_code in {400, 409, 422} and "already" in message.lower()
                raise SupabaseUserAdminError(
                    "A user with this email already exists." if duplicate else "Supabase could not complete the user operation.",
                    code="DUPLICATE_EMAIL" if duplicate else "USER_ADMIN_REJECTED",
                    status_code=409 if duplicate else 502,
                    retryable=False,
                ) from exc
            except httpx.HTTPError as exc:
                last_error = exc
                logger.warning(
                    "Supabase user-admin request failed on attempt %s/%s: %s",
                    attempt + 1,
                    attempts,
                    type(exc).__name__,
                )
                if attempt < attempts - 1:
                    sleep(0.75 * (attempt + 1))
        assert last_error is not None
        raise SupabaseUserAdminError(
            "Supabase Auth did not return a reliable response.",
            code="USER_ADMIN_UNAVAILABLE",
            status_code=503,
            retryable=True,
        ) from last_error


def user_from_supabase(row: dict) -> dict:
    metadata = row.get("user_metadata") or {}
    app_metadata = row.get("app_metadata") or {}
    email = row.get("email") or ""
    role = normalize_role(app_metadata.get("role") or metadata.get("role"))
    full_name = metadata.get("full_name") or metadata.get("name") or email.split("@")[0]
    return {
        "id": row.get("id"),
        "email": email,
        "fullName": full_name,
        "role": role,
        "createdAt": row.get("created_at"),
        "lastSignInAt": row.get("last_sign_in_at"),
    }


def extract_error_message(response: httpx.Response) -> str:
    try:
        data = response.json()
    except ValueError:
        return response.text or "Supabase Auth request failed."
    for key in ("msg", "message", "error_description", "error"):
        value = data.get(key)
        if isinstance(value, str):
            return value
    return "Supabase Auth request failed."
