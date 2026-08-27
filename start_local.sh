#!/usr/bin/env bash
# =========================================================================
#  CNN Optimization Benchmark — One-Click Local Startup (Linux / macOS)
# =========================================================================

set -e

echo ""
echo "========================================================================="
echo "  CNN Optimization Benchmark — Local Setup & Real-Mode Launcher"
echo "========================================================================="
echo ""

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed or not in your PATH."
    exit 1
fi

# 2. Install dependencies
echo "[1/3] Verifying Python dependencies..."
python3 -m pip install -q -r backend/requirements.txt

# 3. Hardware check
echo "[2/3] Checking hardware capabilities for Real Mode..."
python3 local_runner.py --check

# 4. Launch Application
echo "[3/3] Starting backend server on http://localhost:8000 ..."
python3 local_runner.py --server
