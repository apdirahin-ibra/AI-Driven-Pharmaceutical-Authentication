# Pharma Authentication System

An image-classification prototype for identifying medicine images as **Real**, **Fake**, or **Suspicious**.

Before classification, the API validates that the upload is a supported medicine-product
image. The current classifier supports direct photos of consumer medicine packaging:
labeled boxes/cartons, sachets, bottles, tubes, and tablet/capsule blister packs. It does
not support selfies, ordinary photos, documents, cartoons, unrelated screenshots, or
clinical scan modalities.

## Project structure

```text
pharma-auth-system/
├── frontend/          React + Tailwind CSS (Phase 4)
├── backend/           FastAPI prediction API
├── models/            Keras model files
├── docs/              Screenshots, diagrams, and notes
└── README.md
```

## Backend quick start

1. Copy `cnn_best_model.keras` into `models/`.
2. Create and activate a virtual environment:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. Start the API from the `backend` folder:

   ```powershell
   uvicorn app.main:app --reload
   ```

4. Open `http://127.0.0.1:8000/docs` to test the API.

The two trained classes default to `Fake,Real`. Predictions below the configurable
confidence threshold are returned as `Suspicious`. If the model was trained with a
different class order, set `MODEL_CLASS_NAMES` before starting, for example:

```powershell
$env:MODEL_CLASS_NAMES="Real,Fake"
$env:SUSPICIOUS_THRESHOLD="0.75"
```

Configure the AI image-validation service using environment variables (never commit the
real key):

```powershell
$env:IMAGE_VALIDATOR_API_KEY="your-key"
$env:IMAGE_VALIDATOR_BASE_URL="https://router.requesty.ai/v1"
$env:IMAGE_VALIDATOR_MODEL="openai/gpt-4o"
```

If validation is not configured or temporarily unavailable, `/predict` fails safely with
a structured `503` response and does not run the Fake/Real classifier.

## API

- `GET /` — API information
- `GET /health` — service and model readiness
- `POST /predict` — upload a JPEG, PNG, or WebP image (maximum 10 MB)
