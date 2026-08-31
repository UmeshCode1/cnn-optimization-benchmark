@echo off
REM ==============================================================================
REM  CNN Optimization Benchmark — 1-Click Windows Automated Setup
REM ==============================================================================
title CNN Benchmark Local Installer
echo ==============================================================================
echo   CNN BENCHMARK PLATFORM — 1-CLICK AUTOMATED WINDOWS INSTALLER
echo ==============================================================================
echo.
echo Launching PowerShell automated environment configurer...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_windows.ps1"
if %errorlevel% neq 0 (
    echo.
    echo PowerShell installer failed. Please check error messages above.
)
pause
