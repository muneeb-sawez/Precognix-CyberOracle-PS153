@echo off
setlocal enabledelayedexpansion
title PRECOGNIX - Autonomous Cyber Attack Forecasting System (SIH 2026 PS 26153)

cls
echo ===============================================================================
echo   PRECOGNIX: AI-BASED CYBER ATTACK FORECASTING SYSTEM
echo   Smart India Hackathon 2026  ^|  Problem Statement 26153 (NTRO)
echo   CSE-CIC-IDS2018 Telemetry Pipeline  ^|  Autoregressive World Model Dynamics
echo ===============================================================================
echo.

set "BACKEND_DIR=%~dp0"
if exist "%~dp0frontend" (
    set "FRONTEND_DIR=%~dp0frontend"
) else (
    set "FRONTEND_DIR=%~dp0..\cyber-oracle"
)

:: Step 1: Check Python
echo [*] Step 1/4: Verifying Python Environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python 3.10+.
    pause
    exit /b 1
)

:: Step 2: Environment test
echo.
echo [*] Step 2/4: Running Hardware Acceleration Smoke Test...
python step0_check_env.py

:: Step 3: Launch FastAPI
echo.
echo [*] Step 3/4: Starting Precognix REST API Server (Port 8000)...
start "Precognix API Server (Port 8000)" /min cmd /c "cd /d "%BACKEND_DIR%" && python api_server.py"

:: Step 4: Launch Frontend
echo.
echo [*] Step 4/4: Starting Cyber-Oracle SOC Interface (Port 5173)...
if exist "%FRONTEND_DIR%" (
    start "Cyber-Oracle SOC Interface (Port 5173)" /min cmd /c "cd /d "%FRONTEND_DIR%" && npm run dev"
) else (
    start "Precognix Streamlit Demo" /min cmd /c "cd /d "%BACKEND_DIR%" && streamlit run step5_demo.py"
)

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ===============================================================================
echo   SERVICES ACTIVE:
echo     - React Enterprise SOC : http://localhost:5173
echo     - FastAPI REST Engine  : http://localhost:8000 (Swagger: /docs)
echo     - Offline Streamlit    : python step5_demo.py (Port 8501)
echo.
echo   Press any key to close launcher monitor (servers keep running in background)...
echo ===============================================================================
pause >nul
