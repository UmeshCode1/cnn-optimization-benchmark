@echo off
REM =========================================================================
REM  CNN Optimization Benchmark — 1-Click Local Startup (Windows)
REM =========================================================================
title CNN Optimization Benchmark - Workstation
cd /d "%~dp0"

echo.
echo =========================================================================
echo   CNN Optimization Benchmark — Local Setup & Launcher
echo =========================================================================
echo.

REM 1. Activate or create virtual environment
if exist .venv\Scripts\activate.bat (
    echo [*] Activating isolated Python virtual environment (.venv)...
    call .venv\Scripts\activate.bat
) else (
    echo [!] No .venv found. Checking Python runtime...
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Python was not found in your PATH!
        echo Please run install.bat or install Python 3.10+ from https://python.org/downloads
        echo (Remember to check 'Add python.exe to PATH' during installation!)
        echo.
        pause
        exit /b 1
    )
    echo [*] Initializing virtual environment (.venv)...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    echo [*] Installing backend dependencies...
    python -m pip install --upgrade pip -q
    python -m pip install -r backend\requirements.txt -q
    python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q
)

REM 2. Verify frontend distribution
if not exist "frontend\dist\index.html" (
    echo [!] Pre-compiled frontend not found. Checking Node.js...
    where npm.cmd >nul 2>&1
    if %errorlevel% equ 0 (
        echo [*] Building frontend user interface...
        pushd frontend
        call npm.cmd install
        call npm.cmd run build
        popd
    ) else (
        echo [!] Warning: Node.js not detected.
    )
)

REM 3. Hardware and Capabilities Diagnostic
echo [*] Checking hardware capabilities...
python local_runner.py --check

REM 4. Launch Application in Browser & Start Server
echo [*] Launching workstation on http://localhost:8000 ...
start http://localhost:8000
python local_runner.py --server

pause
