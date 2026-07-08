import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    model_path: Path
    class_names: tuple[str, ...]
    suspicious_threshold: float
    max_upload_bytes: int
    validator_api_key: str | None
    validator_base_url: str
    validator_model: str
    validator_timeout_seconds: float
    supabase_url: str | None
    supabase_service_role_key: str | None
    frontend_origins: tuple[str, ...]


def get_settings() -> Settings:
    model_path = Path(
        os.getenv("MODEL_PATH", str(BACKEND_DIR.parent / "models" / "cnn_best_model.keras"))
    ).expanduser()
    if not model_path.is_absolute():
        model_path = (BACKEND_DIR / model_path).resolve()

    class_names = tuple(
        name.strip()
        for name in os.getenv("MODEL_CLASS_NAMES", "Fake,Real").split(",")
        if name.strip()
    )
    suspicious_threshold = float(os.getenv("SUSPICIOUS_THRESHOLD", "0.75"))
    if not 0 <= suspicious_threshold <= 1:
        raise ValueError("SUSPICIOUS_THRESHOLD must be between 0 and 1.")
    max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", "10"))
    validator_api_key = (
        os.getenv("IMAGE_VALIDATOR_API_KEY")
        or os.getenv("REQUESTY_API_KEY")
        or os.getenv("REQWESTY_AI_KEY")
    )
    validator_base_url = os.getenv(
        "IMAGE_VALIDATOR_BASE_URL", "https://router.requesty.ai/v1"
    ).rstrip("/")
    validator_model = os.getenv("IMAGE_VALIDATOR_MODEL", "openai/gpt-4o")
    validator_timeout_seconds = float(os.getenv("IMAGE_VALIDATOR_TIMEOUT_SECONDS", "30"))
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_role_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
    )
    frontend_origins = tuple(
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    )
    return Settings(
        model_path,
        class_names,
        suspicious_threshold,
        max_upload_mb * 1024 * 1024,
        validator_api_key,
        validator_base_url,
        validator_model,
        validator_timeout_seconds,
        supabase_url.rstrip("/") if supabase_url else None,
        supabase_service_role_key,
        frontend_origins,
    )
