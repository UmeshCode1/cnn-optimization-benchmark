"""
Automated Local Installer & Preflight Diagnostics API.

Generates and serves customized one-click installation scripts for Windows (PowerShell/Batch),
macOS, and Linux, enabling users to automatically configure and run genuine PyTorch REAL MODE
locally on their laptops with full hardware telemetry.
"""

import sys
import platform
import os
from typing import Dict, Any
from fastapi import APIRouter, Request, Response
from fastapi.responses import PlainTextResponse, JSONResponse
from ..services.capability_service import CapabilityService

router = APIRouter(prefix="/api/installer", tags=["Installer"])


WINDOWS_PS1_TEMPLATE = """# ==============================================================================
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
"""


UNIX_SH_TEMPLATE = """#!/usr/bin/env bash
# ==============================================================================
#  CNN Optimization & Benchmarking Platform — 1-Click Automated Setup (macOS / Linux / WSL)
#  Website: https://cnn.umeshlabs.in
# ==============================================================================

set -e

CYAN='\\033[0;36m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
RED='\\033[0;31m'
NC='\\033[0m' # No Color

echo ""
echo -e "${CYAN}==============================================================================${NC}"
echo -e "${YELLOW}  CNN BENCHMARK PLATFORM — AUTOMATED LAPTOP / WORKSTATION INSTALLER${NC}"
echo -e "${CYAN}  Target: Real Mode PyTorch Inference with Hardware Telemetry${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo ""

INSTALL_DIR="$HOME/cnn-benchmark-local"
REPO_URL="https://github.com/UmeshCode1/cnn-optimization-benchmark.git"

# ── 1. Pre-flight Checks ──────────────────────────────────────────────────────
echo -e "${GREEN}[1/5] Scanning laptop hardware & system environment...${NC}"
OS_TYPE="$(uname -s)"
ARCH="$(uname -m)"
echo -e "  * OS:          $OS_TYPE ($ARCH)"

HAS_CUDA=false
if command -v nvidia-smi &> /dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -n 1 || echo "NVIDIA GPU")
    HAS_CUDA=true
    echo -e "  * GPU:         ${GREEN}$GPU_NAME (NVIDIA CUDA Enabled)${NC}"
elif [[ "$OS_TYPE" == "Darwin" ]]; then
    echo -e "  * GPU:         ${GREEN}Apple Silicon Metal (MPS Acceleration Enabled)${NC}"
else
    echo -e "  * GPU:         ${YELLOW}Standard CPU (CPU Real Mode enabled)${NC}"
fi

# ── 2. Python Environment ─────────────────────────────────────────────────────
echo -e "\\n${GREEN}[2/5] Checking Python 3.9+ runtime...${NC}"
PYTHON_BIN=""
for cmd in python3 python; do
    if command -v $cmd &> /dev/null; then
        VER=$($cmd -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)
        if [[ "$VER" =~ ^3\\.(9|10|11|12|13|14)$ ]]; then
            PYTHON_BIN="$cmd"
            echo -e "  * Found: Python $VER ($cmd)"
            break
        fi
    fi
done

if [ -z "$PYTHON_BIN" ]; then
    echo -e "${RED}[ERROR] Python 3.9+ is required. Please install Python and re-run.${NC}"
    exit 1
fi

# ── 3. Clone Repository ───────────────────────────────────────────────────────
echo -e "\\n${GREEN}[3/5] Setting up project at $INSTALL_DIR...${NC}"
if [ -d "$INSTALL_DIR/.git" ]; then
    echo "  * Existing installation found. Updating..."
    cd "$INSTALL_DIR" && git pull || true
else
    if command -v git &> /dev/null; then
        git clone "$REPO_URL" "$INSTALL_DIR"
    else
        mkdir -p "$INSTALL_DIR"
        curl -fsSL "https://github.com/UmeshCode1/cnn-optimization-benchmark/archive/refs/heads/main.tar.gz" | tar -xz -C "$INSTALL_DIR" --strip-components=1
    fi
fi

cd "$INSTALL_DIR"

# ── 4. Virtual Environment & Dependencies ─────────────────────────────────────
echo -e "\\n${GREEN}[4/5] Creating Python virtual environment (.venv) & installing PyTorch...${NC}"
if [ ! -d ".venv" ]; then
    $PYTHON_BIN -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip -q

if [ "$HAS_CUDA" = true ]; then
    echo -e "  * Installing CUDA PyTorch..."
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121 -q
else
    echo -e "  * Installing CPU/MPS PyTorch..."
    pip install torch torchvision -q
fi

pip install -r backend/requirements.txt -q
pip install psutil pynvml thop -q

# ── 5. Configure & Launch ─────────────────────────────────────────────────────
echo -e "\\n${GREEN}[5/5] Configuring Real Mode & Launching...${NC}"
cat << 'EOF' > .env
EXECUTION_MODE=REAL
DEFAULT_EXECUTION_MODE=REAL
PORT=8000
DATABASE_URL=sqlite:///./benchmark.db
ENABLE_NVML=true
EOF

cat << 'EOF' > start.sh
#!/usr/bin/env bash
cd "$(dirname "$0")"
source .venv/bin/activate
python local_runner.py --server
EOF
chmod +x start.sh

echo ""
echo -e "${CYAN}==============================================================================${NC}"
echo -e "${YELLOW}  SUCCESS! CNN Benchmark is ready on your machine in REAL MODE.${NC}"
echo -e "${GREEN}  Local Workstation: http://localhost:8000${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo ""

# Attempt to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8000 &
elif command -v open &> /dev/null; then
    open http://localhost:8000 &
fi

python local_runner.py --server
"""


WINDOWS_BAT_TEMPLATE = """@echo off
title CNN Benchmark Local Installer
echo ==============================================================================
echo   CNN BENCHMARK PLATFORM — 1-CLICK AUTOMATED WINDOWS INSTALLER
echo ==============================================================================
echo.
echo Launching PowerShell automated environment configurer...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $script = (New-Object Net.WebClient).DownloadString('https://cnn.umeshlabs.in/install.ps1'); Invoke-Expression $script"
if %errorlevel% neq 0 (
    echo.
    echo Online installer fetch failed or network offline. Falling back to local scripts...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\\install_windows.ps1"
)
pause
"""


@router.get("/preflight")
def get_installer_preflight_info(request: Request) -> Dict[str, Any]:
    """
    Return hardware checklist, system requirements, and pre-generated commands
    for automated 1-click laptop installation.
    """
    caps = CapabilityService.detect()
    base_url = str(request.base_url).rstrip("/")
    
    return {
        "server_status": "ONLINE",
        "current_server_mode": "DEMO" if not caps.real_mode_feasible else "REAL",
        "system_requirements": {
            "os": ["Windows 10/11 (64-bit)", "macOS 12+ (Intel & Apple Silicon)", "Ubuntu / Debian / Fedora / Arch", "Windows Subsystem for Linux (WSL2)"],
            "ram_minimum_gb": 8,
            "ram_recommended_gb": 16,
            "python_minimum": "3.9+",
            "python_recommended": "3.10 / 3.11",
            "gpu_support": "NVIDIA CUDA 11.8+ / 12.X (Optional for GPU speedup & NVML telemetry, CPU fully supported)",
            "disk_space_gb": 2.5,
        },
        "commands": {
            "windows_powershell": f"powershell -ExecutionPolicy Bypass -Command \"irm {base_url}/install.ps1 | iex\"",
            "mac_linux_bash": f"curl -fsSL {base_url}/install.sh | bash",
            "docker_compose": "git clone https://github.com/UmeshCode1/cnn-optimization-benchmark.git && cd cnn-optimization-benchmark && docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build",
            "python_manual": "git clone https://github.com/UmeshCode1/cnn-optimization-benchmark.git\ncd cnn-optimization-benchmark\npip install -r backend/requirements.txt\npython local_runner.py --server",
        },
        "download_urls": {
            "windows_bat": f"{base_url}/api/installer/scripts/windows-bat",
            "windows_ps1": f"{base_url}/api/installer/scripts/windows-ps1",
            "unix_sh": f"{base_url}/api/installer/scripts/unix-sh",
        }
    }


@router.get("/scripts/windows-ps1", response_class=PlainTextResponse)
def get_windows_powershell_installer():
    """Serve the raw PowerShell automated setup script."""
    return Response(
        content=WINDOWS_PS1_TEMPLATE,
        media_type="text/plain",
        headers={"Content-Disposition": 'attachment; filename="install.ps1"'}
    )


@router.get("/scripts/windows-bat", response_class=PlainTextResponse)
def get_windows_batch_installer():
    """Serve the double-clickable Windows .bat wrapper installer."""
    return Response(
        content=WINDOWS_BAT_TEMPLATE,
        media_type="text/plain",
        headers={"Content-Disposition": 'attachment; filename="install.bat"'}
    )


@router.get("/scripts/unix-sh", response_class=PlainTextResponse)
def get_unix_shell_installer():
    """Serve the raw macOS / Linux bash automated setup script."""
    return Response(
        content=UNIX_SH_TEMPLATE,
        media_type="text/plain",
        headers={"Content-Disposition": 'attachment; filename="install.sh"'}
    )
