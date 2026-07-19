# Transfer PharmaGuard AI to another Windows laptop

## What is included

The transfer ZIP contains the application source, trained Keras model, database migrations,
PowerShell setup/start scripts, and locked dependency files. Generated dependencies, build
output, caches, Git history, deployment metadata, and private `.env` files are excluded.

The setup script installs only Python, Node.js, and the dependencies declared by this
project. It does not install Visual Studio or the Microsoft Visual C++ Redistributable.

## New laptop setup

1. Extract the ZIP to a normal writable folder, such as `C:\Projects\pharma-auth-system`.
2. Open PowerShell in the extracted project folder.
3. Run:

   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\setup-local.ps1
   ```

4. Open `backend\.env` and `frontend\.env`, then replace every placeholder with the
   corresponding private value from the original laptop or deployment dashboards.
5. Start both services:

   ```powershell
   .\start-local.ps1
   ```

6. Open `http://127.0.0.1:5173`. Backend documentation is available at
   `http://127.0.0.1:8000/docs`.

The launcher starts FastAPI on port `8000`, waits for its health endpoint, and only then
starts Vite on port `5173`. The Vite `/api` development proxy also targets port `8000`.

To install backend test dependencies too, use:

```powershell
.\setup-local.ps1 -IncludeDevDependencies
```

## Secrets

Do not email or upload the real `.env` files in an unencrypted ZIP. Transfer them separately
using a password manager, encrypted USB drive, or another secure channel. Never place the
Supabase service-role key in the frontend environment file.
