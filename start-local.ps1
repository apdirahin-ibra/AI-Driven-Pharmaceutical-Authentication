[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    throw "Local dependencies are not installed. Run .\setup-local.ps1 first."
}
if (-not (Test-Path (Join-Path $BackendDir ".env")) -or -not (Test-Path (Join-Path $FrontendDir ".env"))) {
    throw "Missing environment files. Copy the .env.example files, add your private values, and try again."
}

Write-Host "Starting PharmaGuard AI locally..." -ForegroundColor Green
$backend = Start-Process -FilePath $VenvPython -ArgumentList "-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "127.0.0.1", "--port", "8000", "--reload" -WorkingDirectory $ProjectRoot -PassThru

Write-Host "Waiting for FastAPI to become ready..."
$backendReady = $false
for ($attempt = 1; $attempt -le 60; $attempt++) {
    if ($backend.HasExited) {
        throw "FastAPI stopped during startup. Review the backend window for the error."
    }
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2
        if ($health.status) {
            $backendReady = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}
if (-not $backendReady) {
    throw "FastAPI did not become ready within 60 seconds. Review the backend window for the error."
}

$frontend = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $FrontendDir -PassThru

Write-Host "Backend: http://127.0.0.1:8000/docs (PID $($backend.Id))"
Write-Host "Frontend: http://127.0.0.1:5173 (PID $($frontend.Id))"
Write-Host "Close the two server windows to stop the application."
