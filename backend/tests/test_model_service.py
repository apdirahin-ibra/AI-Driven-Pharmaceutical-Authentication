from pathlib import Path

import numpy as np

from app.model_service import ModelService


class FakeModel:
    input_shape = (None, 8, 8, 3)

    def __init__(self, output: list[float]) -> None:
        self.output = output
        self.received_batch = None

    def predict(self, batch, verbose: int = 0) -> np.ndarray:
        self.received_batch = batch
        return np.array([self.output])


def make_service(output: list[float]) -> ModelService:
    service = ModelService(Path("unused.keras"), ("Fake", "Real"), 0.75)
    service._model = FakeModel(output)
    return service


def test_low_confidence_prediction_is_suspicious() -> None:
    from io import BytesIO

    from PIL import Image

    buffer = BytesIO()
    Image.new("RGB", (8, 8)).save(buffer, format="PNG")

    result = make_service([0.4, 0.6]).predict(buffer.getvalue())

    assert result["prediction"] == "Suspicious"
    assert result["model_prediction"] == "Real"
    assert result["confidence"] == 0.6


def test_high_confidence_prediction_keeps_model_class() -> None:
    from io import BytesIO

    from PIL import Image

    buffer = BytesIO()
    Image.new("RGB", (8, 8)).save(buffer, format="PNG")

    result = make_service([0.8, 0.2]).predict(buffer.getvalue())

    assert result["prediction"] == "Fake"
    assert result["model_prediction"] == "Fake"
    assert result["confidence"] == 0.8


def test_model_receives_raw_pixel_values() -> None:
    from io import BytesIO

    from PIL import Image

    buffer = BytesIO()
    Image.new("RGB", (8, 8), color=(255, 128, 0)).save(buffer, format="PNG")
    service = make_service([0.8, 0.2])

    service.predict(buffer.getvalue())

    assert service._model.received_batch.dtype == np.float32
    assert service._model.received_batch.max() == 255.0
    assert service._model.received_batch[0, 0, 0, 1] == 128.0
