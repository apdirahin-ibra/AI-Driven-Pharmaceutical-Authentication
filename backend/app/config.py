import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


def clean_env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    if value is None:
        return None
    return value.strip().strip('"').strip("'").strip()


def clean_secret_env(name: str) -> str | None:
    value = clean_env(name)
    if value is None:
        return None
    return "".join(value.split())


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
        clean_env("MODEL_PATH", str(BACKEND_DIR.parent / "models" / "cnn_best_model.keras")) or ""
    ).expanduser()
    if not model_path.is_absolute():
        backend_relative_path = (BACKEND_DIR / model_path).resolve()
        repo_relative_path = (BACKEND_DIR.parent / model_path).resolve()
        model_path = backend_relative_path if backend_relative_path.exists() else repo_relative_path

    class_names = tuple(
        name.strip()
        for name in (clean_env("MODEL_CLASS_NAMES", "Fake,Real") or "Fake,Real").split(",")
        if name.strip()
    )
    suspicious_threshold = float(clean_env("SUSPICIOUS_THRESHOLD", "0.75") or "0.75")
    if not 0 <= suspicious_threshold <= 1:
        raise ValueError("SUSPICIOUS_THRESHOLD must be between 0 and 1.")
    max_upload_mb = int(clean_env("MAX_UPLOAD_MB", "10") or "10")
    validator_api_key = (
        clean_secret_env("IMAGE_VALIDATOR_API_KEY")
        or clean_secret_env("REQUESTY_API_KEY")
        or clean_secret_env("REQWESTY_AI_KEY")
    )
    validator_base_url = clean_env(
        "IMAGE_VALIDATOR_BASE_URL", "https://router.requesty.ai/v1"
    ).rstrip("/")
    validator_model = clean_env("IMAGE_VALIDATOR_MODEL", "openai/gpt-4o") or "openai/gpt-4o"
    validator_timeout_seconds = float(clean_env("IMAGE_VALIDATOR_TIMEOUT_SECONDS", "30") or "30")
    supabase_url = clean_env("SUPABASE_URL")
    supabase_service_role_key = (
        clean_secret_env("SUPABASE_SERVICE_ROLE_KEY")
        or clean_secret_env("SUPABASE_KEY")
    )
    frontend_origins = tuple(
        origin.strip()
        for origin in (clean_env(
            "FRONTEND_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ) or "").split(",")
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
