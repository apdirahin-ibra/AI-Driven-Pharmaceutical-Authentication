[CmdletBinding()]
param(
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectName = Split-Path $ProjectRoot -Leaf
$DateStamp = Get-Date -Format "yyyyMMdd"
if (-not $OutputPath) {
    $OutputPath = Join-Path (Split-Path $ProjectRoot -Parent) "PharmaGuard-AI-local-transfer-$DateStamp.zip"
}
$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$StagingRoot = Join-Path ([System.IO.Path]::GetTempPath()) "pharmaguard-transfer-$([guid]::NewGuid().ToString('N'))"
$StagingProject = Join-Path $StagingRoot $ProjectName

try {
    New-Item -ItemType Directory -Path $StagingProject -Force | Out-Null

    $excludedDirectories = @(
        ".git", ".venv", "venv", "node_modules", "dist", ".pytest_cache",
        ".npm-cache", "__pycache__", ".vercel"
    )
    $excludedFiles = @(".env", "*.pyc", "*.pyo", "*.log", "*.zip", ".DS_Store")

    $robocopyArguments = @(
        $ProjectRoot,
        $StagingProject,
        "/E",
        "/R:1",
        "/W:1",
        "/NFL",
        "/NDL",
        "/NJH",
        "/NJS",
        "/NP",
        "/XD"
    ) + $excludedDirectories + @("/XF") + $excludedFiles

    & robocopy @robocopyArguments | Out-Null
    if ($LASTEXITCODE -gt 7) {
        throw "Failed to prepare the transfer files (robocopy exit code $LASTEXITCODE)."
    }

    if (Test-Path $OutputPath) { Remove-Item -LiteralPath $OutputPath -Force }
    Compress-Archive -Path $StagingProject -DestinationPath $OutputPath -CompressionLevel Optimal

    $archive = Get-Item -LiteralPath $OutputPath
    Write-Host "Transfer ZIP created successfully:" -ForegroundColor Green
    Write-Host $archive.FullName
    Write-Host ("Size: {0:N1} MB" -f ($archive.Length / 1MB))
} finally {
    if (Test-Path $StagingRoot) {
        Remove-Item -LiteralPath $StagingRoot -Recurse -Force
    }
}

