#!/usr/bin/env bash
# ==============================================================================
#  CNN Optimization & Benchmarking Platform — 1-Click Automated Setup (macOS / Linux / WSL)
#  Website: https://cnn.umeshlabs.in
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}==============================================================================${NC}"
echo -e "${YELLOW}  CNN BENCHMARK PLATFORM — AUTOMATED LAPTOP / WORKSTATION INSTALLER${NC}"
echo -e "${CYAN}  Target: Real Mode PyTorch Inference with Hardware Telemetry${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/backend/main.py" ] && [ -d "$SCRIPT_DIR/frontend" ]; then
    INSTALL_DIR="$SCRIPT_DIR"
    IS_LOCAL_SOURCE=true
    echo -e "${GREEN}[SETUP] Using local project files at $INSTALL_DIR${NC}"
else
    INSTALL_DIR="$HOME/cnn-benchmark-local"
    IS_LOCAL_SOURCE=false
    echo -e "${CYAN}[SETUP] Target installation directory: $INSTALL_DIR${NC}"
fi

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
echo -e "\n${GREEN}[2/5] Checking Python 3.9+ runtime...${NC}"
PYTHON_BIN=""
for cmd in python3 python; do
    if command -v $cmd &> /dev/null; then
        VER=$($cmd -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)
        if [[ "$VER" =~ ^3\.(9|10|11|12|13|14)$ ]]; then
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

# ── 3. Clone or Validate Repository ───────────────────────────────────────────
echo -e "\n${GREEN}[3/5] Validating project directory at $INSTALL_DIR...${NC}"
if [ "$IS_LOCAL_SOURCE" = true ]; then
    echo "  * Local files verified. No network download needed."
else
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
fi

cd "$INSTALL_DIR"

# ── 4. Virtual Environment & Dependencies ─────────────────────────────────────
echo -e "\n${GREEN}[4/5] Creating Python virtual environment (.venv) & installing PyTorch...${NC}"
if [ ! -d ".venv" ]; then
    $PYTHON_BIN -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip -q

if [ "$HAS_CUDA" = true ]; then
    echo -e "  * Installing CUDA PyTorch..."
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121 -q
elif [[ "$OS_TYPE" == "Darwin" ]]; then
    echo -e "  * Installing Apple Silicon Metal PyTorch..."
    pip install torch torchvision -q
else
    echo -e "  * Installing CPU-optimized PyTorch..."
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q
fi

pip install -r backend/requirements.txt -q
pip install psutil pynvml thop -q

# ── 5. Configure & Launch ─────────────────────────────────────────────────────
echo -e "\n${GREEN}[5/5] Configuring Real Mode & Launching...${NC}"
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
