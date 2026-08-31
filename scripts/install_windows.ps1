# ==============================================================================
#  CNN Optimization & Benchmarking Platform — 1-Click Automated Laptop Setup
#  Website: https://cnn.umeshlabs.in
#  Platform: Windows PowerShell Automated Installer
# ==============================================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  CNN BENCHMARK PLATFORM — AUTOMATED LOCAL LAPTOP INSTALLER" -ForegroundColor Yellow
Write-Host "  Target: Real Mode PyTorch Inference with Hardware Telemetry" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$INSTALL_DIR = "$HOME\\cnn-benchmark-local"
$REPO_URL = "https://github.com/UmeshCode1/cnn-optimization-benchmark.git"

# ── 1. Hardware & System Pre-flight Checks ────────────────────────────────────
Write-Host "[1/6] Scanning laptop hardware & system environment..." -ForegroundColor Green

$OS_NAME = (Get-CimInstance Win32_OperatingSystem).Caption
$CPU_NAME = (Get-CimInstance Win32_Processor).Name
$TOTAL_RAM_GB = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)

Write-Host "  * OS:         $OS_NAME" -ForegroundColor Gray
Write-Host "  * CPU:        $CPU_NAME" -ForegroundColor Gray
Write-Host "  * System RAM: $TOTAL_RAM_GB GB" -ForegroundColor Gray

# Check NVIDIA GPU / CUDA
$HAS_NVIDIA = $false
$GPU_INFO = "CPU Only"
try {
    $nvidiaSmi = Get-Command "nvidia-smi" -ErrorAction SilentlyContinue
    if ($nvidiaSmi) {
        $gpuOut = & nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>$null
        if ($gpuOut) {
            $HAS_NVIDIA = $true
            $GPU_INFO = "$gpuOut (NVIDIA CUDA Acceleration Enabled)"
            Write-Host "  * GPU:        $GPU_INFO" -ForegroundColor Green
        }
    }
} catch {}

if (-not $HAS_NVIDIA) {
    Write-Host "  * GPU:        Standard CPU / Integrated Graphics (CPU Real Mode enabled)" -ForegroundColor Yellow
}

# ── 2. Check Python Environment ───────────────────────────────────────────────
Write-Host "`n[2/6] Verifying Python 3.9+ runtime..." -ForegroundColor Green

$PYTHON_CMD = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python 3\\.(9|10|11|12|13|14)") {
            $PYTHON_CMD = $cmd
            Write-Host "  * Found: $ver using command '$cmd'" -ForegroundColor Gray
            break
        }
    } catch {}
}

if (-not $PYTHON_CMD) {
    Write-Host "  [!] Python 3.10+ was not detected in your PATH." -ForegroundColor Yellow
    Write-Host "      Attempting automatic installation via Windows Package Manager (winget)..." -ForegroundColor Cyan
    try {
        & winget install -e --id Python.Python.3.11 --accept-source-agreements --accept-package-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        $PYTHON_CMD = "python"
    } catch {
        Write-Host "  [ERROR] Could not auto-install Python. Please install Python 3.10+ from https://python.org and re-run." -ForegroundColor Red
        Exit 1
    }
}

# ── 3. Clone or Update Repository ─────────────────────────────────────────────
Write-Host "`n[3/6] Setting up project workspace at $INSTALL_DIR..." -ForegroundColor Green

if (Test-Path "$INSTALL_DIR\\.git") {
    Write-Host "  * Existing installation found. Pulling latest updates..." -ForegroundColor Gray
    Push-Location $INSTALL_DIR
    try { & git pull } catch {}
    Pop-Location
} else {
    $GIT_CMD = Get-Command "git" -ErrorAction SilentlyContinue
    if ($GIT_CMD) {
        Write-Host "  * Cloning repository from GitHub..." -ForegroundColor Gray
        & git clone $REPO_URL $INSTALL_DIR
    } else {
        Write-Host "  * Git not found. Downloading ZIP archive..." -ForegroundColor Gray
        $ZIP_PATH = "$env:TEMP\\cnn-benchmark.zip"
        Invoke-WebRequest -Uri "https://github.com/UmeshCode1/cnn-optimization-benchmark/archive/refs/heads/main.zip" -OutFile $ZIP_PATH
        Expand-Archive -Path $ZIP_PATH -DestinationPath "$env:TEMP\\cnn-extracted" -Force
        if (-not (Test-Path $INSTALL_DIR)) { New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null }
        Copy-Item -Path "$env:TEMP\\cnn-extracted\\cnn-optimization-benchmark-main\\*" -Destination $INSTALL_DIR -Recurse -Force
    }
}

Set-Location $INSTALL_DIR

# ── 4. Create Virtual Environment & Install PyTorch ───────────────────────────
Write-Host "`n[4/6] Initializing isolated Python virtual environment (.venv)..." -ForegroundColor Green

if (-not (Test-Path "$INSTALL_DIR\\.venv")) {
    & $PYTHON_CMD -m venv .venv
}

$VENV_PYTHON = "$INSTALL_DIR\\.venv\\Scripts\\python.exe"
$VENV_PIP = "$INSTALL_DIR\\.venv\\Scripts\\pip.exe"

Write-Host "  * Upgrading pip wheel installer..." -ForegroundColor Gray
& $VENV_PYTHON -m pip install --upgrade pip -q

Write-Host "  * Installing PyTorch & Computer Vision Engine..." -ForegroundColor Cyan
if ($HAS_NVIDIA) {
    Write-Host "    -> Installing CUDA-accelerated PyTorch (cu121)..." -ForegroundColor Green
    & $VENV_PIP install torch torchvision --index-url https://download.pytorch.org/whl/cu121 -q
} else {
    Write-Host "    -> Installing CPU-optimized PyTorch..." -ForegroundColor Gray
    & $VENV_PIP install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q
}

Write-Host "  * Installing FastAPI, Web telemetry, and optimizer modules..." -ForegroundColor Gray
& $VENV_PIP install -r backend/requirements.txt -q
& $VENV_PIP install psutil pynvml thop -q

# ── 5. Configure Real Mode Environment & Initialize DB ────────────────────────
Write-Host "`n[5/6] Configuring Real Mode hardware environment..." -ForegroundColor Green

$ENV_FILE = "$INSTALL_DIR\\.env"
@"
EXECUTION_MODE=REAL
DEFAULT_EXECUTION_MODE=REAL
PORT=8000
DATABASE_URL=sqlite:///./benchmark.db
ENABLE_NVML=true
"@ | Out-File -FilePath $ENV_FILE -Encoding utf8

# Build / Setup Launch Script
$LAUNCHER_BAT = "$INSTALL_DIR\\Start-CNN-Benchmark.bat"
@"
@echo off
title CNN Optimization Benchmark - Local Workstation
cd /d "%~dp0"
echo Starting CNN Benchmark Local Real-Mode Server...
call .venv\\Scripts\\activate.bat
start http://localhost:8000
python local_runner.py --server
pause
"@ | Out-File -FilePath $LAUNCHER_BAT -Encoding ascii

# Create Desktop Shortcut
try {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$HOME\\Desktop\\CNN Benchmark Workstation.lnk")
    $Shortcut.TargetPath = "$INSTALL_DIR\\Start-CNN-Benchmark.bat"
    $Shortcut.WorkingDirectory = "$INSTALL_DIR"
    $Shortcut.Description = "Launch CNN Optimization Benchmark Platform in Real Mode"
    $Shortcut.Save()
    Write-Host "  * Created Desktop Shortcut: 'CNN Benchmark Workstation'" -ForegroundColor Green
} catch {}

# ── 6. Launch Local Workstation ───────────────────────────────────────────────
Write-Host "`n[6/6] Installation Complete! Launching Local Workstation..." -ForegroundColor Green
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  SUCCESS! CNN Benchmark is now configured for REAL MODE on your laptop." -ForegroundColor Yellow
Write-Host "  Server URL: http://localhost:8000" -ForegroundColor Green
Write-Host "  Desktop Launcher: $LAUNCHER_BAT" -ForegroundColor Gray
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

Start-Process "http://localhost:8000"
& $VENV_PYTHON local_runner.py --server
