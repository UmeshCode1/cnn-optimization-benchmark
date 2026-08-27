@echo off
REM =========================================================================
REM  CNN Optimization Benchmark — One-Click Local Startup (Windows)
REM =========================================================================

echo.
echo =========================================================================
echo   CNN Optimization Benchmark — Local Setup & Real-Mode Launcher
echo =========================================================================
echo.

REM 1. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 is not installed or not in your PATH.
    echo Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

REM 2. Install / Verify dependencies
echo [1/3] Verifying Python dependencies...
python -m pip install -q -r backend\requirements.txt

REM 3. Hardware and Capabilities Diagnostic
echo [2/3] Checking hardware capabilities for Real Mode...
python local_runner.py --check

REM 4. Launch Application
echo [3/3] Starting backend server on http://localhost:8000 ...
python local_runner.py --server

pause
