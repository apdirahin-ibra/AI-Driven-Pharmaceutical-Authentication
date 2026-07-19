[CmdletBinding()]
param(
    [switch]$IncludeDevDependencies
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$PythonVersion = "3.12.3"
$PythonMajorMinor = "3.12"
$NodeVersion = "24.15.0"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Refresh-Path {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"
}

function Test-Command([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-WingetPackage {
    param(
        [Parameter(Mandatory)][string]$Id,
        [string]$Version,
        [string]$FallbackId
    )

    $arguments = @("install", "--id", $Id, "--exact", "--accept-package-agreements", "--accept-source-agreements", "--silent")
    if ($Version) { $arguments += @("--version", $Version) }

    & winget @arguments
    if ($LASTEXITCODE -ne 0 -and $Version) {
        Write-Warning "Exact version $Version was unavailable. Installing the latest compatible $Id release."
        & winget install --id $Id --exact --accept-package-agreements --accept-source-agreements --silent
    }
    if ($LASTEXITCODE -ne 0 -and $FallbackId) {
        Write-Warning "Trying fallback package $FallbackId."
        & winget install --id $FallbackId --exact --accept-package-agreements --accept-source-agreements --silent
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Could not install $Id with winget. Install it manually, then run this script again."
    }
    Refresh-Path
}

Write-Host "PharmaGuard AI - Windows local setup" -ForegroundColor Green
Write-Host "Project: $ProjectRoot"

if (-not (Test-Command "winget")) {
    throw "Windows Package Manager (winget) is required. Install 'App Installer' from Microsoft Store, then run this script again."
}

Write-Step "Checking Python $PythonMajorMinor"
$PythonLauncher = $null
if (Test-Command "py") {
    & py "-$PythonMajorMinor" --version 2>$null
    if ($LASTEXITCODE -eq 0) { $PythonLauncher = @("py", "-$PythonMajorMinor") }
}
if (-not $PythonLauncher) {
    Install-WingetPackage -Id "Python.Python.3.12" -Version $PythonVersion
    if (Test-Command "py") {
        $PythonLauncher = @("py", "-$PythonMajorMinor")
    } elseif (Test-Command "python") {
        $PythonLauncher = @("python")
    } else {
        throw "Python was installed but is not visible in PATH. Restart PowerShell and run this script again."
    }
}

Write-Step "Checking Node.js 24 and npm"
$NodeIsCompatible = $false
if (Test-Command "node") {
    $installedNode = (& node --version).TrimStart("v")
    $NodeIsCompatible = $installedNode.StartsWith("24.")
}
if (-not $NodeIsCompatible) {
    Install-WingetPackage -Id "OpenJS.NodeJS.LTS" -Version $NodeVersion -FallbackId "OpenJS.NodeJS"
}
if (-not (Test-Command "node") -or -not (Test-Command "npm")) {
    throw "Node.js/npm was installed but is not visible in PATH. Restart PowerShell and run this script again."
}

Write-Step "Creating the backend Python virtual environment"
if (-not (Test-Path $VenvPython)) {
    if ($PythonLauncher[0] -eq "py") {
        & py $PythonLauncher[1] -m venv (Join-Path $BackendDir ".venv")
    } else {
        & python -m venv (Join-Path $BackendDir ".venv")
    }
}
& $VenvPython -m pip install --upgrade pip setuptools wheel
& $VenvPython -m pip install -r (Join-Path $BackendDir "requirements.txt")
if ($IncludeDevDependencies) {
    & $VenvPython -m pip install -r (Join-Path $BackendDir "requirements-dev.txt")
}

Write-Step "Installing exact frontend dependencies from package-lock.json"
Push-Location $FrontendDir
try {
    & npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed." }
    & npm run typecheck
    if ($LASTEXITCODE -ne 0) { throw "Frontend typecheck failed." }
} finally {
    Pop-Location
}

Write-Step "Preparing local environment files"
foreach ($pair in @(
    @((Join-Path $BackendDir ".env.example"), (Join-Path $BackendDir ".env")),
    @((Join-Path $FrontendDir ".env.example"), (Join-Path $FrontendDir ".env"))
)) {
    if (-not (Test-Path $pair[1])) {
        Copy-Item -LiteralPath $pair[0] -Destination $pair[1]
        Write-Warning "Created $($pair[1]). Replace placeholder values before starting the application."
    }
}

Write-Step "Setup complete"
Write-Host "Python: $(& $VenvPython --version)"
Write-Host "Node:   $(& node --version)"
Write-Host "npm:    $(& npm --version)"
Write-Host ""
Write-Host "1. Fill in backend\.env and frontend\.env with your private values."
Write-Host "2. Run .\start-local.ps1"
