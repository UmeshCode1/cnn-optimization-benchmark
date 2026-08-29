"""
CNN Optimization Benchmark - FastAPI Backend Application.

Deployment Modes:
  DEMO (default) — Works on Render Free Tier. Uses SimulationEngine.
  REAL           — Requires PyTorch + datasets. Use locally or on GPU server.
"""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure backend root is in python path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.session import init_db
from app.api.datasets import router as datasets_router
from app.api.models import router as models_router
from app.api.experiments import router as experiments_router
from app.api.algorithms import router as algorithms_router
from app.api.hardware import router as hardware_router
from app.api.pareto import router as pareto_router
from app.api.ablation import router as ablation_router
from app.api.reports import router as reports_router
from app.api.websocket import router as websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────
    # Initialize base schema
    init_db()

    # Run additive migrations (safe on existing DBs — skips existing columns)
    try:
        from app.database.migrations.add_execution_mode import run_migration
        run_migration()
    except Exception as e:
        print(f"[Startup] Migration warning (non-fatal): {e}")

    # Pre-warm capability detection cache
    try:
        from app.services.capability_service import CapabilityService
        from app.engines import get_default_mode
        caps = CapabilityService.detect()
        mode = get_default_mode()
        print(f"[Startup] Execution mode: {mode}")
        print(f"[Startup] PyTorch: {caps.pytorch_available}, CUDA: {caps.cuda_available}, NVML: {caps.nvml_available}")
        print(f"[Startup] Real Mode feasible: {caps.real_mode_feasible} — {caps.real_mode_reason}")
    except Exception as e:
        print(f"[Startup] Capability detection warning: {e}")

    yield
    # ── Shutdown ───────────────────────────────────────────────────────────


app = FastAPI(
    title="CNN Optimization Benchmark API",
    description=(
        "Research-grade benchmarking platform for comparing CNN metaheuristic optimization algorithms.\n\n"
        "Supports two execution modes:\n"
        "- **DEMO**: Deterministic simulation (works on Render Free Tier)\n"
        "- **REAL**: Actual PyTorch model inference (requires local/GPU deployment)\n\n"
        "All metrics include explicit provenance: MEASURED | CALCULATED | ESTIMATED | SIMULATED"
    ),
    version="2.5.0",
    lifespan=lifespan,
)

# Enable CORS for React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(datasets_router)
app.include_router(models_router)
app.include_router(experiments_router)
app.include_router(algorithms_router)
app.include_router(hardware_router)
app.include_router(pareto_router)
app.include_router(ablation_router)
app.include_router(reports_router)
app.include_router(websocket_router)


@app.get("/api/health")
def health_check():
    """
    Health and capability check endpoint.
    Returns current execution capabilities so the frontend can decide
    which modes to offer without hardcoding deployment assumptions.
    """
    try:
        from app.services.capability_service import CapabilityService
        from app.engines import get_default_mode
        caps = CapabilityService.detect()
        mode = get_default_mode()
    except Exception:
        caps = None
        mode = "DEMO"

    return {
        "status": "HEALTHY",
        "service": "CNN Optimization Benchmark Platform",
        "version": "2.5.0",
        "algorithms_count": 10,
        "default_execution_mode": mode,
        "demo_mode_available": True,
        "real_mode_available": caps.real_mode_feasible if caps else False,
        "real_mode_reason": caps.real_mode_reason if caps else "Capability detection unavailable",
        "capabilities": caps.to_dict() if caps else {},
        "deployment_note": (
            "Render Free Tier — Demo Mode only. "
            "Clone and run locally for Real Mode with actual PyTorch inference."
            if (not caps or not caps.pytorch_available) else
            f"PyTorch {caps.pytorch_version} detected — Real Mode available."
        ),
    }


@app.get("/api/capabilities")
def get_capabilities():
    """Shortcut to capability matrix — used by frontend to render mode selector."""
    try:
        from app.services.capability_service import CapabilityService
        from app.engines import get_default_mode
        caps = CapabilityService.detect()
        return {
            "default_mode": get_default_mode(),
            "capabilities": caps.to_dict(),
        }
    except Exception as e:
        return {"default_mode": "DEMO", "error": str(e), "capabilities": {}}


# Serve frontend build in production if present
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

