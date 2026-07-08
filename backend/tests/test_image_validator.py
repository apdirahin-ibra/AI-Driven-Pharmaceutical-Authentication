from io import BytesIO

import httpx
import numpy as np
from PIL import Image

from app.image_validator import MedicalImageValidator


def image_bytes(color: tuple[int, int, int] | None = None) -> bytes:
    output = BytesIO()
    if color:
        image = Image.new("RGB", (256, 256), color)
    else:
        values = np.indices((256, 256)).sum(axis=0) % 2
        pixels = np.stack((values * 220 + 20, values * 80 + 40, values * 150 + 50), axis=2)
        image = Image.fromarray(pixels.astype(np.uint8), "RGB")
    image.save(output, format="PNG")
    return output.getvalue()


def make_validator(api_key: str | None = "test-key") -> MedicalImageValidator:
    return MedicalImageValidator(api_key, "https://validator.example/v1", "vision-model", 5)


def test_basic_validation_rejects_solid_image() -> None:
    result = make_validator().validate(image_bytes((128, 128, 128)))

    assert result.valid is False
    assert result.code == "LOW_IMAGE_DETAIL"
    assert result.stage == "basic_validation"


def test_missing_ai_key_fails_closed_after_basic_checks() -> None:
    result = make_validator(None).validate(image_bytes())

    assert result.valid is False
    assert result.code == "VALIDATION_SERVICE_UNAVAILABLE"
    assert result.retryable is True


def test_ai_validation_accepts_supported_image(monkeypatch) -> None:
    request = httpx.Request("POST", "https://validator.example/v1/chat/completions")
    response = httpx.Response(
        200,
        request=request,
        json={"choices": [{"message": {"content": "VALID"}}]},
    )
    monkeypatch.setattr(httpx, "post", lambda *args, **kwargs: response)

    result = make_validator().validate(image_bytes())

    assert result.valid is True
    assert result.code == "MEDICAL_IMAGE_VALIDATED"


def test_ai_validation_rejects_unrelated_image(monkeypatch) -> None:
    request = httpx.Request("POST", "https://validator.example/v1/chat/completions")
    response = httpx.Response(
        200,
        request=request,
        json={"choices": [{"message": {"content": "INVALID"}}]},
    )
    monkeypatch.setattr(httpx, "post", lambda *args, **kwargs: response)

    result = make_validator().validate(image_bytes())

    assert result.valid is False
    assert result.code == "UNSUPPORTED_IMAGE"
    assert "probability" not in result.message.lower()
    assert "%" not in result.message


def test_ai_service_error_is_safe_and_retryable(monkeypatch) -> None:
    def fail(*args, **kwargs):
        raise httpx.ConnectError("offline")

    monkeypatch.setattr(httpx, "post", fail)

    result = make_validator().validate(image_bytes())

    assert result.valid is False
    assert result.code == "VALIDATION_SERVICE_UNAVAILABLE"
    assert result.retryable is True
