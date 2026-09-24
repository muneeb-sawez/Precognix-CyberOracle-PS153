# ===============================================================================
# PRECOGNIX: Autonomous Cyber Attack Forecasting System (SIH 2026 PS 26153)
# One-Click Evaluator Launcher (PowerShell Edition)
# ===============================================================================

$Host.UI.RawUI.WindowTitle = "PRECOGNIX - Autonomous Cyber Attack Forecasting (SIH 2026 PS 26153)"
Clear-Host

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  PRECOGNIX: AI-BASED CYBER ATTACK FORECASTING SYSTEM" -ForegroundColor White
Write-Host "  Smart India Hackathon 2026  |  Problem Statement 26153 (NTRO)" -ForegroundColor Yellow
Write-Host "  CSE-CIC-IDS2018 Telemetry Pipeline  |  Autoregressive World Model Dynamics" -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Self-contained path resolution
if (Test-Path "$ScriptDir\api_server.py") {
    $BackendDir = $ScriptDir
} elseif (Test-Path "$ScriptDir\Precognix-PS153") {
    $BackendDir = "$ScriptDir\Precognix-PS153"
} else {
    $BackendDir = $ScriptDir
}

if (Test-Path "$BackendDir\frontend") {
    $FrontendDir = "$BackendDir\frontend"
} elseif (Test-Path "$ScriptDir\cyber-oracle") {
    $FrontendDir = "$ScriptDir\cyber-oracle"
} else {
    $FrontendDir = "$BackendDir\frontend"
}

# 1. Verify Python Environment
Write-Host "[*] Step 1/4: Checking Python Runtime..." -ForegroundColor Cyan
try {
    $pyVer = python -c "import sys; print(sys.version.split()[0])"
    Write-Host "    Found Python $pyVer [OK]" -ForegroundColor Green
} catch {
    Write-Error "[FAIL] Python not detected in PATH. Please install Python 3.10+."
    Read-Host "Press Enter to exit..."
    exit 1
}

# 2. Check Environment & Smoke Test
Write-Host "`n[*] Step 2/4: Running Hardware Acceleration Smoke Test..." -ForegroundColor Cyan
Push-Location $BackendDir
python step0_check_env.py
Pop-Location

# 3. Launch Backend API Server
Write-Host "`n[*] Step 3/4: Spawning FastAPI REST Engine (Port 8000)..." -ForegroundColor Cyan
$BackendProcess = Start-Process python -ArgumentList "api_server.py" -WorkingDirectory $BackendDir -WindowStyle Minimized -PassThru

# 4. Launch Frontend SOC Interface
Write-Host "`n[*] Step 4/4: Spawning Cyber-Oracle React Frontend (Port 5173)..." -ForegroundColor Cyan
if (Test-Path $FrontendDir) {
    $FrontendProcess = Start-Process cmd -ArgumentList "/c npm run dev" -WorkingDirectory $FrontendDir -WindowStyle Minimized -PassThru
} else {
    Write-Host "    [!] Frontend not found; starting offline Streamlit dashboard instead..." -ForegroundColor Yellow
    Start-Process streamlit -ArgumentList "run step5_demo.py" -WorkingDirectory $BackendDir -WindowStyle Minimized
}

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  SERVICES RUNNING IN BACKGROUND:" -ForegroundColor White
Write-Host "    - React Enterprise SOC : http://localhost:5173" -ForegroundColor Cyan
Write-Host "    - FastAPI REST Server  : http://localhost:8000 (Swagger: http://localhost:8000/docs)" -ForegroundColor Cyan
Write-Host "    - WebSocket Stream     : ws://localhost:8000/ws/telemetry" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Enter to exit this launcher window (services keep running)..." -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Green
Read-Host
