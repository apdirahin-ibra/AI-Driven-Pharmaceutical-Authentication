from io import BytesIO
from pathlib import Path
from threading import Lock

import numpy as np
from PIL import Image, UnidentifiedImageError


class PredictionError(Exception):
    """Raised when an uploaded image cannot be classified."""


class ModelService:
    def __init__(
        self,
        model_path: Path,
        class_names: tuple[str, ...],
        suspicious_threshold: float,
    ) -> None:
        self.model_path = model_path
        self.class_names = class_names
        self.suspicious_threshold = suspicious_threshold
        self._model = None
        self._lock = Lock()

    @property
    def is_ready(self) -> bool:
        return self.model_path.is_file()

    def _load_model(self):
        if self._model is None:
            with self._lock:
                if self._model is None:
                    if not self.model_path.is_file():
                        raise PredictionError(
                            f"Model not found at {self.model_path}. Add cnn_best_model.keras first."
                        )
                    from tensorflow.keras.models import load_model

                    self._model = load_model(self.model_path, compile=False)
        return self._model

    @staticmethod
    def _input_size(model) -> tuple[int, int]:
        shape = model.input_shape
        if isinstance(shape, list):
            shape = shape[0]
        if len(shape) != 4 or shape[1] is None or shape[2] is None:
            raise PredictionError(f"Unsupported model input shape: {shape}")
        return int(shape[2]), int(shape[1])

    def predict(self, image_bytes: bytes) -> dict:
        model = self._load_model()
        try:
            with Image.open(BytesIO(image_bytes)) as image:
                image = image.convert("RGB").resize(self._input_size(model))
                # The trained model contains Rescaling(1./255), so it must receive
                # raw 0-255 pixel values. Scaling here would normalize the image twice.
                batch = np.expand_dims(np.asarray(image, dtype=np.float32), axis=0)
        except (UnidentifiedImageError, OSError) as exc:
            raise PredictionError("The uploaded file is not a valid image.") from exc

        raw = np.asarray(model.predict(batch, verbose=0)).squeeze()
        probabilities = self._as_probabilities(raw)
        if len(probabilities) != len(self.class_names):
            raise PredictionError(
                f"Model returned {len(probabilities)} classes, but MODEL_CLASS_NAMES has "
                f"{len(self.class_names)} names."
            )

        best_index = int(np.argmax(probabilities))
        confidence = float(probabilities[best_index])
        model_prediction = self.class_names[best_index]
        scores = {
            name: round(float(score), 6)
            for name, score in zip(self.class_names, probabilities, strict=True)
        }
        return {
            "prediction": (
                "Suspicious" if confidence < self.suspicious_threshold else model_prediction
            ),
            "model_prediction": model_prediction,
            "confidence": round(confidence, 6),
            "scores": scores,
        }

    @staticmethod
    def _as_probabilities(raw: np.ndarray) -> np.ndarray:
        values = np.atleast_1d(raw).astype(np.float64)
        if values.size == 1:
            probability = float(values[0])
            if not 0 <= probability <= 1:
                probability = 1 / (1 + np.exp(-probability))
            return np.array([1 - probability, probability])

        if np.all(values >= 0) and np.all(values <= 1) and np.isclose(values.sum(), 1, atol=1e-3):
            return values / values.sum()
        shifted = values - np.max(values)
        exponentials = np.exp(shifted)
        return exponentials / exponentials.sum()
