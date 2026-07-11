# PharmaGuard AI Deployment

Recommended setup:

- Frontend: Vercel, root directory `frontend`
- Backend: Render Web Service, using `render.yaml`
- Database/Auth: Supabase

## 1. Push the project to GitHub

Make sure these files are committed:

- `frontend/vercel.json`
- `render.yaml`
- `backend/requirements.txt`
- `models/cnn_best_model.keras`

Do not commit `.env` files.

## 2. Deploy the backend on Render

Create a new Render Blueprint from this repository, or create a Python Web Service manually.

Manual backend settings:

- Root directory: repository root
- Build command: `pip install -r backend/requirements.txt`
- Start command: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`

Set these Render environment variables:

```text
PYTHON_VERSION=3.11.9
MODEL_PATH=models/cnn_best_model.keras
MODEL_CLASS_NAMES=Fake,Real
SUSPICIOUS_THRESHOLD=0.75
MAX_UPLOAD_MB=10
IMAGE_VALIDATOR_API_KEY=your_requesty_or_validator_key
IMAGE_VALIDATOR_BASE_URL=https://router.requesty.ai/v1
IMAGE_VALIDATOR_MODEL=openai/gpt-4o
IMAGE_VALIDATOR_TIMEOUT_SECONDS=30
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SCAN_IMAGE_BUCKET=medicine-scans
FRONTEND_ORIGINS=https://your-vercel-domain.vercel.app
```

After deploy, test:

```text
https://your-render-backend.onrender.com/health
```

## 3. Deploy the frontend on Vercel

Before deploying backend code that writes scan images, apply the SQL migrations in `supabase/migrations/` through the Supabase SQL editor. The migration creates the private `medicine-scans` bucket and ownership columns required by the API.

Create a new Vercel project from the same repository.

Frontend settings:

- Root directory: `frontend`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set these Vercel environment variables:

```text
VITE_API_BASE_URL=https://your-render-backend.onrender.com
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

## 4. Update Render CORS

After Vercel gives you the frontend URL, update Render:

```text
FRONTEND_ORIGINS=https://your-vercel-domain.vercel.app
```

Redeploy/restart the backend after changing it.

## 5. Supabase security notes

- Frontend uses the public anon/publishable key.
- Backend uses the service role key.
- Never put the service role key in Vercel or browser code.
- Keep Row Level Security enabled for database tables.
