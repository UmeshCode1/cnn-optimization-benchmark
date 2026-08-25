"""
Database Session Management and Initialization.
"""

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base, HardwareProfile
import platform

DB_PATH = os.environ.get("DB_PATH", str(Path(__file__).parent.parent.parent / "benchmark.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def detect_system_hardware() -> HardwareProfile:
    """Detect current host system hardware and return HardwareProfile."""
    cpu_model = platform.processor() or "Multi-Core CPU"
    os_info = f"{platform.system()} {platform.release()}"
    python_ver = platform.python_version()
    
    device_name = "Host CPU"
    device_type = "CPU"
    gpu_model = "None (CPU Execution)"
    gpu_mem = 0.0
    cuda_ver = "N/A"
    torch_ver = "2.2+"

    try:
        import psutil
        ram_gb = round(psutil.virtual_memory().total / (1024**3), 1)
        cpu_cores = psutil.cpu_count(logical=True) or 4
    except Exception:
        ram_gb = 16.0
        cpu_cores = 8

    try:
        import torch
        torch_ver = torch.__version__
        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name(0)
            device_type = "GPU"
            gpu_model = device_name
            gpu_mem = round(torch.cuda.get_device_properties(0).total_memory / (1024**2), 1)
            cuda_ver = torch.version.cuda or "CUDA Available"
    except Exception:
        pass

    return HardwareProfile(
        device_name=device_name,
        device_type=device_type,
        cpu_model=cpu_model,
        cpu_cores=cpu_cores,
        gpu_model=gpu_model,
        gpu_memory_mb=gpu_mem,
        ram_gb=ram_gb,
        os_info=os_info,
        cuda_version=cuda_ver,
        torch_version=torch_ver,
        python_version=python_ver,
    )


def init_db():
    """Create all database tables and bootstrap hardware profile."""
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        existing = session.query(HardwareProfile).first()
        if not existing:
            profile = detect_system_hardware()
            session.add(profile)
            session.commit()
