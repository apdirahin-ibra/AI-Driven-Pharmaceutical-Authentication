import base64
import logging
from dataclasses import dataclass
from io import BytesIO

import httpx
import numpy as np
from PIL import Image, UnidentifiedImageError


logger = logging.getLogger(__name__)

SUPPORTED_IMAGE_DESCRIPTION = (
    "A direct, clear photo of consumer medicine packaging, such as a labeled medicine "
    "box/carton, sachet, bottle, tube, or a tablet/capsule blister pack."
)


@dataclass(frozen=True)
class ValidationResult:
    valid: bool
    code: str
    message: str
    stage: str
    retryable: bool = False


class MedicalImageValidator:
    """Validates the image domain before the authenticity classifier runs."""

    def __init__(
        self,
        api_key: str | None,
        base_url: str,
        model: str,
        timeout_seconds: float = 30,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def validate(self, image_bytes: bytes) -> ValidationResult:
        basic_result = self._basic_validation(image_bytes)
        if not basic_result.valid:
            return basic_result

        if not self.api_key:
            return ValidationResult(
                valid=False,
                code="VALIDATION_SERVICE_UNAVAILABLE",
                message=(
                    "Medical-image validation is not configured. Set "
                    "IMAGE_VALIDATOR_API_KEY and try again."
                ),
                stage="ai_validation",
                retryable=True,
            )

        try:
            return self._ai_validation(image_bytes)
        except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError) as exc:
            logger.warning("Medical-image AI validation unavailable: %s", type(exc).__name__)
            return ValidationResult(
                valid=False,
                code="VALIDATION_SERVICE_UNAVAILABLE",
                message="Medical-image validation is temporarily unavailable. Please try again later.",
                stage="ai_validation",
                retryable=True,
            )

    @staticmethod
    def _basic_validation(image_bytes: bytes) -> ValidationResult:
        try:
            with Image.open(BytesIO(image_bytes)) as source:
                source.verify()
            with Image.open(BytesIO(image_bytes)) as source:
                image = source.convert("RGB")
                width, height = image.size
                if width < 128 or height < 128:
                    return ValidationResult(
                        False,
                        "IMAGE_TOO_SMALL",
                        "Image is too small. Upload a clear medicine-package photo at least 128 × 128 pixels.",
                        "basic_validation",
                    )
                if width * height > 40_000_000:
                    return ValidationResult(
                        False,
                        "IMAGE_DIMENSIONS_TOO_LARGE",
                        "Image dimensions are too large. Resize the image and try again.",
                        "basic_validation",
                    )
                aspect_ratio = width / height
                if not 0.15 <= aspect_ratio <= 6.5:
                    return ValidationResult(
                        False,
                        "EXTREME_ASPECT_RATIO",
                        "Image shape is not suitable. Upload a standard photo of medicine packaging.",
                        "basic_validation",
                    )

                sample = image.copy()
                sample.thumbnail((512, 512))
                pixels = np.asarray(sample, dtype=np.float32)
                gray = pixels.mean(axis=2)
                brightness = float(gray.mean())
                contrast = float(gray.std())
                color_variance = float(np.var(pixels, axis=(0, 1)).mean())

                if brightness < 5 or brightness > 250:
                    return ValidationResult(
                        False,
                        "EXTREME_BRIGHTNESS",
                        "Image is too dark or bright to validate. Upload a well-lit medicine-package photo.",
                        "basic_validation",
                    )
                if contrast < 3 or color_variance < 25:
                    return ValidationResult(
                        False,
                        "LOW_IMAGE_DETAIL",
                        "Image has too little visual detail. Upload a clear photo of medicine packaging.",
                        "basic_validation",
                    )
        except (UnidentifiedImageError, OSError, ValueError):
            return ValidationResult(
                False,
                "INVALID_IMAGE",
                "The uploaded file could not be decoded as an image.",
                "basic_validation",
            )

        return ValidationResult(True, "BASIC_VALIDATION_PASSED", "Basic image checks passed.", "basic_validation")

    def _ai_validation(self, image_bytes: bytes) -> ValidationResult:
        image_data_url = self._prepare_image_data_url(image_bytes)
        prompt = (
            "You are a strict input gatekeeper for a pharmaceutical package-authentication "
            "classifier. Do not judge whether a medicine is fake or real. Decide only whether "
            "the image belongs to the classifier's supported visual domain.\n\n"
            "ACCEPT ONLY when the primary subject is a physical consumer medicine product and "
            "its packaging is clearly visible: labeled medicine boxes/cartons, sachets, bottles, "
            "jars, tubes, or tablet/capsule blister packs. A tightly cropped photo combining the "
            "medicine with its packaging is acceptable when the packaging remains the main subject.\n\n"
            "REJECT selfies, faces, people, body parts, ordinary household objects, food, animals, "
            "vehicles, landscapes, buildings, documents, forms, book pages, cartoons, drawings, "
            "memes, website/app screenshots, unrelated screenshots, and unrelated medical imagery "
            "such as X-rays, MRI, CT, ultrasound, microscopy, retinal, or pathology images. Also "
            "reject loose unidentified pills without medicine packaging, and images too unclear to "
            "establish that medicine packaging is the main subject.\n\n"
            "Respond with exactly VALID or INVALID. Do not include a probability, percentage, or explanation."
        )
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You validate whether images match a medicine-packaging classifier's input domain.",
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_data_url}},
                    ],
                },
            ],
            "max_tokens": 5,
            "temperature": 0,
        }
        response = httpx.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json=payload,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        answer = response.json()["choices"][0]["message"]["content"].strip().upper()

        if answer == "VALID":
            return ValidationResult(
                True,
                "MEDICAL_IMAGE_VALIDATED",
                "Image matches the supported medicine-packaging domain.",
                "ai_validation",
            )
        if answer == "INVALID":
            return ValidationResult(
                False,
                "UNSUPPORTED_IMAGE",
                f"This image is not supported. Upload {SUPPORTED_IMAGE_DESCRIPTION.lower()}",
                "ai_validation",
            )
        raise ValueError("Unexpected validation response")

    @staticmethod
    def _prepare_image_data_url(image_bytes: bytes) -> str:
        with Image.open(BytesIO(image_bytes)) as source:
            image = source.convert("RGB")
            image.thumbnail((1024, 1024))
            output = BytesIO()
            image.save(output, format="JPEG", quality=85, optimize=True)
        encoded = base64.b64encode(output.getvalue()).decode("ascii")
        return f"data:image/jpeg;base64,{encoded}"
