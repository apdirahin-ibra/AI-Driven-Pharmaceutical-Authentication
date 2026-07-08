from __future__ import annotations

from time import monotonic

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Literal

from .config import Settings, get_settings


security = HTTPBearer(auto_error=False)
AUTH_TIMEOUT_SECONDS = 8
AUTH_CACHE_SECONDS = 60
_auth_cache: dict[str, tuple[float, "AuthenticatedUser"]] = {}


class AuthenticatedUser(BaseModel):
    id: str
    email: str
    name: str
    role: Literal["Admin", "Pharmacist"]


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_REQUIRED", "message": "Sign in with Supabase Auth first."},
        )
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "SUPABASE_NOT_CONFIGURED", "message": "Supabase Auth is not configured on the backend."},
        )

    cached = _auth_cache.get(credentials.credentials)
    if cached and cached[0] > monotonic():
        return cached[1]

    try:
        response = httpx.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {credentials.credentials}",
            },
            timeout=AUTH_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_AUTH_TOKEN", "message": "Your session is invalid or expired."},
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "AUTH_SERVICE_UNAVAILABLE", "message": "Supabase Auth could not be reached."},
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "AUTH_SERVICE_UNAVAILABLE", "message": "Supabase Auth could not be reached."},
        ) from exc

    data = response.json()
    metadata = data.get("user_metadata") or {}
    app_metadata = data.get("app_metadata") or {}
    email = data.get("email") or "unknown@example.com"
    name = metadata.get("full_name") or metadata.get("name") or email.split("@")[0]
    role = app_metadata.get("role") or metadata.get("role") or "Pharmacist"
    if role not in {"Admin", "Pharmacist"}:
        role = "Pharmacist"
    user = AuthenticatedUser(id=data["id"], email=email, name=name, role=role)
    _auth_cache[credentials.credentials] = (monotonic() + AUTH_CACHE_SECONDS, user)
    return user


def require_admin(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    if user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ADMIN_REQUIRED", "message": "Admin access is required."},
        )
    return user
