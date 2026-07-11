from fastapi.testclient import TestClient
import pytest

from app.auth import AuthenticatedUser, get_current_user
from app.image_validator import ValidationResult
from app.main import app
import app.main as main_module
from app.users import SupabaseUserAdminError


client = TestClient(app)

ADMIN = AuthenticatedUser(id="admin-1", email="admin@example.com", name="System Admin", role="Admin")
PHARMACIST = AuthenticatedUser(id="pharmacist-1", email="pharmacist@example.com", name="Test Pharmacist", role="Pharmacist")


@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def test_root() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["docs"] == "/docs"


def test_health_reports_model_state() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] in {"ready", "degraded"}
    assert "image_validator_configured" in response.json()


def test_predict_rejects_non_image() -> None:
    response = client.post(
        "/predict", files={"file": ("notes.txt", b"not an image", "text/plain")}
    )
    assert response.status_code == 415
    detail = response.json()["detail"]
    assert detail["code"] == "UNSUPPORTED_FILE_TYPE"
    assert detail["stage"] == "upload_validation"


def test_non_medical_image_never_reaches_classifier(monkeypatch) -> None:
    monkeypatch.setattr(
        main_module.image_validator,
        "validate",
        lambda _: ValidationResult(
            False,
            "UNSUPPORTED_IMAGE",
            "Upload a supported medicine-package image.",
            "ai_validation",
        ),
    )
    classifier_called = False

    def classifier(_):
        nonlocal classifier_called
        classifier_called = True

    monkeypatch.setattr(main_module.model_service, "predict", classifier)
    response = client.post(
        "/predict", files={"file": ("portrait.png", b"image-data", "image/png")}
    )

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "UNSUPPORTED_IMAGE"
    assert classifier_called is False


def test_validator_outage_returns_structured_503(monkeypatch) -> None:
    monkeypatch.setattr(
        main_module.image_validator,
        "validate",
        lambda _: ValidationResult(
            False,
            "VALIDATION_SERVICE_UNAVAILABLE",
            "Validation is temporarily unavailable.",
            "ai_validation",
            retryable=True,
        ),
    )
    response = client.post(
        "/predict", files={"file": ("medicine.png", b"image-data", "image/png")}
    )

    assert response.status_code == 503
    assert response.json()["detail"]["retryable"] is True


def test_validated_image_runs_classifier(monkeypatch) -> None:
    monkeypatch.setattr(
        main_module.image_validator,
        "validate",
        lambda _: ValidationResult(
            True,
            "MEDICAL_IMAGE_VALIDATED",
            "Supported image.",
            "ai_validation",
        ),
    )
    monkeypatch.setattr(
        main_module.model_service,
        "predict",
        lambda _: {
            "prediction": "Real",
            "model_prediction": "Real",
            "confidence": 0.9,
            "scores": {"Fake": 0.1, "Real": 0.9},
        },
    )
    response = client.post(
        "/predict", files={"file": ("medicine.png", b"image-data", "image/png")}
    )

    assert response.status_code == 200
    assert response.json()["validation"]["status"] == "passed"


@pytest.mark.parametrize("role", ["Admin", "Pharmacist"])
def test_admin_can_create_canonical_users(monkeypatch, role: str) -> None:
    app.dependency_overrides[get_current_user] = lambda: ADMIN
    monkeypatch.setattr(
        main_module.user_admin,
        "create_user",
        lambda request: {
            "id": f"created-{role.lower()}",
            "email": request.email,
            "fullName": request.full_name,
            "role": request.role,
        },
    )

    response = client.post(
        "/users",
        json={"email": f"{role.lower()}@example.com", "password": "Temporary123", "fullName": "Created User", "role": role},
    )

    assert response.status_code == 201
    assert response.json()["role"] == role


def test_pharmacist_cannot_create_user() -> None:
    app.dependency_overrides[get_current_user] = lambda: PHARMACIST

    response = client.post(
        "/users",
        json={"email": "blocked@example.com", "password": "Temporary123", "fullName": "Blocked User", "role": "Pharmacist"},
    )

    assert response.status_code == 403


def test_create_user_duplicate_email_is_structured(monkeypatch) -> None:
    app.dependency_overrides[get_current_user] = lambda: ADMIN

    def duplicate(_):
        raise SupabaseUserAdminError(
            "A user with this email already exists.",
            code="DUPLICATE_EMAIL",
            status_code=409,
            retryable=False,
        )

    monkeypatch.setattr(main_module.user_admin, "create_user", duplicate)
    response = client.post(
        "/users",
        json={"email": "existing@example.com", "password": "Temporary123", "fullName": "Existing User", "role": "Pharmacist"},
    )

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "DUPLICATE_EMAIL"


def test_create_user_rejects_invalid_role() -> None:
    app.dependency_overrides[get_current_user] = lambda: ADMIN
    response = client.post(
        "/users",
        json={"email": "invalid@example.com", "password": "Temporary123", "fullName": "Invalid User", "role": "pharmacy"},
    )
    assert response.status_code == 422


def test_pharmacist_scan_list_is_owner_scoped(monkeypatch) -> None:
    app.dependency_overrides[get_current_user] = lambda: PHARMACIST
    received = {}

    def list_scans(user_id, user_name, is_admin):
        received.update({"user_id": user_id, "user_name": user_name, "is_admin": is_admin})
        return []

    monkeypatch.setattr(main_module.record_store, "list_scans", list_scans)
    response = client.get("/scans")
    assert response.status_code == 200
    assert received == {"user_id": PHARMACIST.id, "user_name": PHARMACIST.name, "is_admin": False}


def test_pharmacist_cannot_update_risk_report() -> None:
    app.dependency_overrides[get_current_user] = lambda: PHARMACIST
    response = client.patch("/reports/RISK-1", json={"status": "Resolved", "notes": "Blocked"})
    assert response.status_code == 403


def test_dependency_diagnostics_requires_admin() -> None:
    app.dependency_overrides[get_current_user] = lambda: PHARMACIST
    response = client.get("/diagnostics/dependencies")
    assert response.status_code == 403
