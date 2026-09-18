@echo off
REM ==============================================================================
REM  CNN Optimization Benchmark — 1-Click Windows Automated Setup
REM ==============================================================================
title CNN Benchmark Local Installer
echo ==============================================================================
echo   CNN BENCHMARK PLATFORM — 1-CLICK AUTOMATED WINDOWS INSTALLER
echo ==============================================================================
echo.
cd /d "%~dp0"
echo Launching PowerShell automated environment configurer...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [!] PowerShell installer exited with code %errorlevel%.
    echo     If you received a permission or network warning, please review the messages above.
)
pause
