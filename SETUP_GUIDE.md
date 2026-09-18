# CNN Optimization Benchmark — Laptop Setup & Troubleshooting Guide

This guide ensures smooth installation and execution on **any other laptop or desktop** (Windows, macOS, Linux, or offline machines).

---

## ⚡ Quick Start (Zero Setup Needed)

### On Windows (Recommended)
Simply **double-click** either:
* **`start_local.bat`**: Instant launcher. Activates or creates `.venv`, verifies dependencies, and automatically opens your browser to **`http://localhost:8000`**.
* **`install.bat`**: Full automated installer. Performs hardware audit, installs CPU or CUDA PyTorch, creates a Desktop shortcut, and starts the workstation.

> [!NOTE]
> **No Node.js Required!**
> The complete React frontend UI is pre-compiled in `frontend/dist`. The Python FastAPI backend automatically serves the full web platform directly on `http://localhost:8000`. You only need Python installed.

---

### On macOS / Linux / WSL
Open your terminal in the project folder and run:
```bash
chmod +x start_local.sh install.sh
./start_local.sh
```
Or for full setup:
```bash
./install.sh
```

---

## 🛠️ Step-by-Step Manual Setup

If you prefer using the command line manually:

### 1. Requirements
* **Python 3.9, 3.10, 3.11, or 3.12** installed and added to your `PATH`.
* *(Optional)* **Node.js 18+** (only if you want to develop or modify the React frontend code).

### 2. Create Virtual Environment
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Backend Dependencies
```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

#### Installing PyTorch (Fast Lightweight Method):
* **Laptops without NVIDIA GPU (CPU Mode - Only ~180 MB, fast download)**:
  ```bash
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
  ```
* **Laptops with NVIDIA RTX/GTX GPU (CUDA Accelerated)**:
  ```bash
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
  ```

### 4. Run the Workstation
```bash
python local_runner.py --server
```
Then open your browser at **`http://localhost:8000`**.

---

## 🔍 Troubleshooting Common Issues on Other Laptops

### Issue 1: "python is not recognized as an internal or external command"
* **Cause**: Python was installed without checking the "Add Python to PATH" box.
* **Fix**:
  1. Download Python 3.11 from [python.org](https://www.python.org/downloads/).
  2. In the installer, **check the box: "Add python.exe to PATH"** before clicking Install.
  3. Or run in PowerShell as Administrator:
     ```powershell
     winget install Python.Python.3.11
     ```

---

### Issue 2: "File ... cannot be loaded because running scripts is disabled on this system"
* **Cause**: Windows default PowerShell execution policy restricts `.ps1` scripts.
* **Fix**:
  * Double-click **`start_local.bat`** or **`install.bat`** instead of running `.ps1` directly (they automatically bypass this restriction using `-ExecutionPolicy Bypass`).
  * Or in PowerShell, run:
    ```powershell
    Set-ExecutionPolicy -Scope Process Bypass
    .\install.ps1
    ```

---

### Issue 3: PyTorch download takes forever, hangs, or fails
* **Cause**: Standard `pip install torch` tries to download a massive 2.6 GB CUDA wheel from PyPI which times out on slower WiFi.
* **Fix**:
  Install the CPU-optimized wheel which is only ~180 MB and installs in under 30 seconds:
  ```bash
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
  ```

---

### Issue 4: "404 Not Found" or Blank White Screen on `http://localhost:8000`
* **Cause**: The production frontend bundle was missing.
* **Fix**:
  * We have bundled `frontend/dist` in the repository so this is already resolved!
  * If you modified the frontend and want to rebuild it:
    ```bash
    cd frontend
    npm install
    npm run build
    cd ..
    ```

---

### Issue 5: Port 8000 is already in use
* **Fix**:
  Run the server on another port (e.g. 8080):
  ```bash
  python local_runner.py --server --port 8080
  ```
  Then open `http://localhost:8080`.

---

## 💻 System Architecture & Ports

| Component | URL | Description |
| :--- | :--- | :--- |
| **Complete Unified Platform** | `http://localhost:8000` | Full React Web UI + FastAPI backend combined |
| **Interactive API Documentation** | `http://localhost:8000/docs` | Swagger / OpenAPI endpoints testing |
| **Vite Dev Server (Frontend Devs)** | `http://localhost:5173` | Hot-reloading development server (`npm run dev`) |
