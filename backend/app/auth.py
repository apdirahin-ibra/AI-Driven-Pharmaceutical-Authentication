from __future__ import annotations

import asyncio
import logging
from time import monotonic

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Literal

from .config import Settings, get_settings
from .roles import normalize_role


security = HTTPBearer(auto_error=False)
AUTH_TIMEOUT_SECONDS = 30
AUTH_CACHE_SECONDS = 60
AUTH_ATTEMPTS = 3
_auth_cache: dict[str, tuple[float, "AuthenticatedUser"]] = {}
logger = logging.getLogger(__name__)


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
        response = await fetch_supabase_user(settings, credentials.credentials)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "INVALID_AUTH_TOKEN",
                    "message": "Your session is invalid or expired.",
                    "retryable": False,
                },
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "AUTH_SERVICE_UNAVAILABLE",
                "message": "Supabase Auth could not verify your session. Please try again.",
                "retryable": True,
            },
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "AUTH_SERVICE_UNAVAILABLE",
                "message": "Supabase Auth could not verify your session. Please try again.",
                "retryable": True,
            },
        ) from exc

    data = response.json()
    metadata = data.get("user_metadata") or {}
    app_metadata = data.get("app_metadata") or {}
    email = data.get("email") or "unknown@example.com"
    name = metadata.get("full_name") or metadata.get("name") or email.split("@")[0]
    role = normalize_role(app_metadata.get("role") or metadata.get("role"))
    user = AuthenticatedUser(id=data["id"], email=email, name=name, role=role)
    _auth_cache[credentials.credentials] = (monotonic() + AUTH_CACHE_SECONDS, user)
    return user


async def fetch_supabase_user(settings: Settings, access_token: str) -> httpx.Response:
    timeout = httpx.Timeout(AUTH_TIMEOUT_SECONDS, connect=10)
    last_error: httpx.HTTPError | None = None
    for attempt in range(AUTH_ATTEMPTS):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(
                    f"{settings.supabase_url}/auth/v1/user",
                    headers={
                        "apikey": settings.supabase_service_role_key or "",
                        "Authorization": f"Bearer {access_token}",
                    },
                )
            response.raise_for_status()
            return response
        except httpx.HTTPStatusError:
            raise
        except httpx.HTTPError as exc:
            last_error = exc
            logger.warning(
                "Supabase Auth session verification failed on attempt %s/%s: %s",
                attempt + 1,
                AUTH_ATTEMPTS,
                type(exc).__name__,
            )
            if attempt < AUTH_ATTEMPTS - 1:
                await asyncio.sleep(0.75 * (attempt + 1))
    assert last_error is not None
    raise last_error


def require_admin(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    if user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ADMIN_REQUIRED", "message": "Admin access is required."},
        )
    return user
