from fastapi.testclient import TestClient

from app.image_validator import ValidationResult
from app.main import app
import app.main as main_module


client = TestClient(app)


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
