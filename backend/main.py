"""
CNN Optimization Benchmark - FastAPI Backend Application.
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
from app.api.experiments import router as experiments_router
from app.api.algorithms import router as algorithms_router
from app.api.hardware import router as hardware_router
from app.api.pareto import router as pareto_router
from app.api.ablation import router as ablation_router
from app.api.reports import router as reports_router
from app.api.websocket import router as websocket_router

# Initialize database schema immediately on import
init_db()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown


app = FastAPI(
    title="CNN Optimization Benchmark API",
    description="Research-grade benchmarking platform for comparing 10 CNN metaheuristic optimization algorithms under identical conditions.",
    version="1.0.0",
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
app.include_router(experiments_router)
app.include_router(algorithms_router)
app.include_router(hardware_router)
app.include_router(pareto_router)
app.include_router(ablation_router)
app.include_router(reports_router)
app.include_router(websocket_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "CNN Optimization Benchmark Platform",
        "algorithms_count": 10,
        "version": "1.0.0",
    }

# Serve frontend build in production if present
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
