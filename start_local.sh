#!/usr/bin/env bash
# =========================================================================
#  CNN Optimization Benchmark — 1-Click Local Startup (Linux / macOS / WSL)
# =========================================================================

set -e
cd "$(dirname "$0")"

echo ""
echo "========================================================================="
echo "  CNN Optimization Benchmark — Local Setup & Launcher"
echo "========================================================================="
echo ""

# 1. Virtual environment handling
if [ -d ".venv" ]; then
    echo "[*] Activating isolated virtual environment (.venv)..."
    source .venv/bin/activate
else
    echo "[!] No .venv found. Checking Python 3..."
    if ! command -v python3 &> /dev/null; then
        echo "[ERROR] Python 3 is not installed or not in your PATH."
        exit 1
    fi
    echo "[*] Initializing virtual environment (.venv)..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip -q
    pip install -r backend/requirements.txt -q
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu -q
fi

# 2. Check frontend distribution
if [ ! -f "frontend/dist/index.html" ]; then
    echo "[!] Pre-compiled frontend not found. Checking npm..."
    if command -v npm &> /dev/null; then
        echo "[*] Building frontend assets..."
        (cd frontend && npm install && npm run build)
    fi
fi

# 3. Hardware check
echo "[*] Checking hardware capabilities..."
python3 local_runner.py --check

# 4. Launch in browser & start server
echo "[*] Starting server on http://localhost:8000 ..."
if command -v xdg-open &> /dev/null; then
    (sleep 2 && xdg-open http://localhost:8000) &
elif command -v open &> /dev/null; then
    (sleep 2 && open http://localhost:8000) &
fi

python3 local_runner.py --server
