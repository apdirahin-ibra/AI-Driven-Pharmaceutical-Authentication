import base64
import json
from contextlib import asynccontextmanager
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from .auth import AuthenticatedUser, get_current_user, require_admin
from .config import get_settings
from .image_validator import MedicalImageValidator, SUPPORTED_IMAGE_DESCRIPTION
from .model_service import ModelService, PredictionError
from .records import (
    NewScanRequest,
    SupabaseNotConfiguredError,
    SupabaseRecordsError,
    SupabaseRecordStore,
    UpdateRiskReportRequest,
)
from .users import CreateUserRequest, SupabaseUserAdmin, SupabaseUserAdminError, UpdateUserRequest


settings = get_settings()
model_service = ModelService(
    settings.model_path, settings.class_names, settings.suspicious_threshold
)
image_validator = MedicalImageValidator(
    settings.validator_api_key,
    settings.validator_base_url,
    settings.validator_model,
    settings.validator_timeout_seconds,
)
record_store = SupabaseRecordStore(
    settings.supabase_url,
    settings.supabase_service_role_key,
    settings.scan_image_bucket,
)
user_admin = SupabaseUserAdmin(settings.supabase_url, settings.supabase_service_role_key)
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Loading remains lazy so the API can expose health information before the
    # model artifact has been copied into the project.
    yield


app = FastAPI(
    title="Pharma Authentication API",
    description="Classifies medicine images as Real, Fake, or Suspicious.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.frontend_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict:
    return {"name": app.title, "version": app.version, "docs": "/docs"}


@app.get("/health")
def health() -> dict:
    model_ready = model_service.is_ready
    validator_ready = image_validator.is_configured
    return {
        "status": "ready" if model_ready and validator_ready else "degraded",
        "model_loaded": model_service._model is not None,
        "model_path": str(settings.model_path),
        "suspicious_threshold": settings.suspicious_threshold,
        "image_validator_configured": validator_ready,
        "supabase_configured": record_store.is_configured,
        "supported_images": SUPPORTED_IMAGE_DESCRIPTION,
    }


@app.get("/diagnostics/dependencies")
async def dependency_diagnostics(_: AuthenticatedUser = Depends(require_admin)) -> dict:
    diagnostics: dict[str, dict | list[str] | str] = {
        "status": "ok",
        "frontend_origins": list(settings.frontend_origins),
        "supabase_config": safe_supabase_config_summary(),
        "model": {
            "path": str(settings.model_path),
            "path_exists": settings.model_path.exists(),
            "loaded": model_service._model is not None,
        },
        "image_validator": {"configured": image_validator.is_configured},
        "supabase_database": {"configured": record_store.is_configured},
        "supabase_auth_admin": {"configured": user_admin.is_configured},
    }

    failed = False
    if record_store.is_configured:
        try:
            diagnostics["supabase_database"] = await run_in_threadpool(record_store.ping)
        except Exception as exc:  # pragma: no cover - diagnostic endpoint
            failed = True
            diagnostics["supabase_database"] = {
                "ok": False,
                "error_type": type(exc).__name__,
                "message": str(exc),
            }

    if user_admin.is_configured:
        try:
            diagnostics["supabase_auth_admin"] = await run_in_threadpool(user_admin.ping)
        except Exception as exc:  # pragma: no cover - diagnostic endpoint
            failed = True
            diagnostics["supabase_auth_admin"] = {
                "ok": False,
                "error_type": type(exc).__name__,
                "message": str(exc),
            }

    diagnostics["status"] = "degraded" if failed else "ok"
    return diagnostics


def safe_supabase_config_summary() -> dict:
    parsed_url = urlparse(settings.supabase_url or "")
    return {
        "url_host": parsed_url.netloc or None,
        "service_role_key": jwt_summary(settings.supabase_service_role_key),
    }


def jwt_summary(token: str | None) -> dict:
    if not token:
        return {"present": False}
    summary: dict[str, bool | int | str | None] = {
        "present": True,
        "length": len(token),
        "looks_like_jwt": token.count(".") == 2,
    }
    parts = token.split(".")
    if len(parts) != 3:
        return summary
    try:
        payload_segment = parts[1] + "=" * (-len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_segment.encode("ascii")))
    except (ValueError, TypeError):
        summary["payload_readable"] = False
        return summary
    summary.update(
        {
            "payload_readable": True,
            "role": payload.get("role"),
            "issuer": payload.get("iss"),
            "project_ref": payload.get("ref"),
        }
    )
    return summary


def validation_error(code: str, message: str, stage: str, retryable: bool, status_code: int) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message,
            "stage": stage,
            "retryable": retryable,
            "supported_images": SUPPORTED_IMAGE_DESCRIPTION,
        },
    )


def records_error(exc: Exception) -> HTTPException:
    if isinstance(exc, SupabaseNotConfiguredError):
        return HTTPException(
            status_code=503,
            detail={
                "code": "SUPABASE_NOT_CONFIGURED",
                "message": str(exc),
                "retryable": False,
            },
        )
    return HTTPException(
        status_code=503,
        detail={
            "code": "SUPABASE_REQUEST_FAILED",
            "message": str(exc),
            "retryable": True,
        },
    )


def user_admin_error(exc: Exception) -> HTTPException:
    if isinstance(exc, SupabaseUserAdminError):
        return HTTPException(
            status_code=exc.status_code,
            detail={"code": exc.code, "message": str(exc), "retryable": exc.retryable},
        )
    return HTTPException(
        status_code=503,
        detail={
            "code": "USER_ADMIN_REQUEST_FAILED",
            "message": str(exc),
            "retryable": True,
        },
    )


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise validation_error(
            "UNSUPPORTED_FILE_TYPE",
            "Upload a JPEG, PNG, or WebP image.",
            "upload_validation",
            False,
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        )

    image_bytes = await file.read(settings.max_upload_bytes + 1)
    await file.close()
    if len(image_bytes) > settings.max_upload_bytes:
        raise validation_error("FILE_TOO_LARGE", "Uploaded image is too large.", "upload_validation", False, 413)
    if not image_bytes:
        raise validation_error("EMPTY_FILE", "Uploaded image is empty.", "upload_validation", False, 400)

    validation = await run_in_threadpool(image_validator.validate, image_bytes)
    if not validation.valid:
        raise validation_error(
            validation.code,
            validation.message,
            validation.stage,
            validation.retryable,
            503 if validation.retryable else 422,
        )

    try:
        prediction = await run_in_threadpool(model_service.predict, image_bytes)
        prediction["validation"] = {
            "status": "passed",
            "code": validation.code,
            "supported_domain": "consumer_medicine_packaging",
        }
        return prediction
    except PredictionError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/scans")
async def list_scans(user: AuthenticatedUser = Depends(get_current_user)) -> list[dict]:
    try:
        return await run_in_threadpool(record_store.list_scans, user.id, user.name, user.role == "Admin")
    except (SupabaseNotConfiguredError, SupabaseRecordsError) as exc:
        raise records_error(exc) from exc


@app.post("/scans", status_code=status.HTTP_201_CREATED)
async def create_scan(request: NewScanRequest, user: AuthenticatedUser = Depends(get_current_user)) -> dict:
    try:
        return await run_in_threadpool(record_store.create_scan, request, user.id, user.name)
    except (SupabaseNotConfiguredError, SupabaseRecordsError) as exc:
        raise records_error(exc) from exc


@app.get("/reports")
async def list_reports(user: AuthenticatedUser = Depends(get_current_user)) -> list[dict]:
    try:
        return await run_in_threadpool(record_store.list_reports, user.id, user.name, user.role == "Admin")
    except (SupabaseNotConfiguredError, SupabaseRecordsError) as exc:
        raise records_error(exc) from exc


@app.patch("/reports/{report_id}")
async def update_report(
    report_id: str,
    request: UpdateRiskReportRequest,
    _: AuthenticatedUser = Depends(require_admin),
) -> list[dict]:
    try:
        return await run_in_threadpool(record_store.update_report, report_id, request)
    except (SupabaseNotConfiguredError, SupabaseRecordsError) as exc:
        raise records_error(exc) from exc


@app.get("/scans/{scan_id}/image-url")
async def scan_image_url(scan_id: str, user: AuthenticatedUser = Depends(get_current_user)) -> dict:
    try:
        return await run_in_threadpool(
            record_store.get_scan_image_url,
            scan_id,
            user.id,
            user.name,
            user.role == "Admin",
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "IMAGE_ACCESS_DENIED", "message": str(exc), "retryable": False},
        ) from exc
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SCAN_IMAGE_NOT_FOUND", "message": str(exc), "retryable": False},
        ) from exc
    except (SupabaseNotConfiguredError, SupabaseRecordsError) as exc:
        raise records_error(exc) from exc


@app.get("/users")
async def list_users(_: AuthenticatedUser = Depends(require_admin)) -> list[dict]:
    try:
        return await run_in_threadpool(user_admin.list_users)
    except SupabaseUserAdminError as exc:
        raise user_admin_error(exc) from exc


@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    request: CreateUserRequest,
    _: AuthenticatedUser = Depends(require_admin),
) -> dict:
    try:
        return await run_in_threadpool(user_admin.create_user, request)
    except SupabaseUserAdminError as exc:
        raise user_admin_error(exc) from exc


@app.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    _: AuthenticatedUser = Depends(require_admin),
) -> dict:
    try:
        return await run_in_threadpool(user_admin.update_user, user_id, request)
    except SupabaseUserAdminError as exc:
        raise user_admin_error(exc) from exc


@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    user: AuthenticatedUser = Depends(require_admin),
) -> None:
    if user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_DELETE_SELF", "message": "You cannot delete your own active admin account."},
        )
    try:
        await run_in_threadpool(user_admin.delete_user, user_id)
    except SupabaseUserAdminError as exc:
        raise user_admin_error(exc) from exc
