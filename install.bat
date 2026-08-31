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
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $script = (New-Object Net.WebClient).DownloadString('https://cnn.umeshlabs.in/install.ps1'); Invoke-Expression $script"
if %errorlevel% neq 0 (
    echo.
    echo Online installer fetch failed or network offline. Falling back to local script...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install_windows.ps1"
)
pause
