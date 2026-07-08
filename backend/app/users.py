from __future__ import annotations

from typing import Literal

import httpx
from pydantic import BaseModel, Field


UserRole = Literal["Admin", "Pharmacist"]
REQUEST_TIMEOUT_SECONDS = 20


class CreateUserRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)
    full_name: str = Field(alias="fullName", min_length=2)
    role: UserRole


class UpdateUserRequest(BaseModel):
    email: str | None = Field(default=None, min_length=3)
    password: str | None = Field(default=None, min_length=6)
    full_name: str | None = Field(default=None, alias="fullName", min_length=2)
    role: UserRole | None = None


class SupabaseUserAdminError(RuntimeError):
    pass


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

    def create_user(self, request: CreateUserRequest) -> dict:
        data = self._request(
            "POST",
            "/auth/v1/admin/users",
            json={
                "email": request.email,
                "password": request.password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": request.full_name,
                    "role": request.role,
                },
                "app_metadata": {
                    "role": request.role,
                },
            },
        )
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
            user_metadata["role"] = request.role
            app_metadata["role"] = request.role

        if user_metadata:
            payload["user_metadata"] = user_metadata
        if app_metadata:
            payload["app_metadata"] = app_metadata
        if not payload:
            raise SupabaseUserAdminError("No user changes were provided.")

        data = self._request("PATCH", f"/auth/v1/admin/users/{user_id}", json=payload)
        return user_from_supabase(data)

    def delete_user(self, user_id: str) -> None:
        self._request("DELETE", f"/auth/v1/admin/users/{user_id}")

    def _request(self, method: str, path: str, *, json: dict | None = None):
        if not self.is_configured:
            raise SupabaseUserAdminError("Supabase is not configured.")

        try:
            response = httpx.request(
                method,
                f"{self.supabase_url}{path}",
                headers={
                    "apikey": self.service_role_key or "",
                    "Authorization": f"Bearer {self.service_role_key}",
                    "Content-Type": "application/json",
                },
                json=json,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            message = extract_error_message(exc.response)
            raise SupabaseUserAdminError(message) from exc
        except httpx.HTTPError as exc:
            raise SupabaseUserAdminError(f"Supabase Auth request failed: {exc}") from exc

        if not response.content:
            return {}
        return response.json()


def user_from_supabase(row: dict) -> dict:
    metadata = row.get("user_metadata") or {}
    app_metadata = row.get("app_metadata") or {}
    email = row.get("email") or ""
    role = app_metadata.get("role") or metadata.get("role") or "Pharmacist"
    if role not in {"Admin", "Pharmacist"}:
        role = "Pharmacist"
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
