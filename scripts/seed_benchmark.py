"""
Script to seed initial comprehensive benchmark comparison into the database.
"""

import sys
import os
import asyncio
from pathlib import Path

# Add project root to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.database.session import init_db, SessionLocal
from app.database.models import Experiment, ExperimentRun, MetricRecord, AblationRecord
from app.schemas.experiment import ExperimentCreateRequest
from app.workers.runner import ExperimentRunner

async def main():
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    existing = db.query(Experiment).first()
    if existing:
        print(f"Database already contains experiment {existing.id}. Status: {existing.status}")
        db.close()
        return

    print("Creating initial ResNet-18 benchmark across 10 metaheuristics...")
    req = ExperimentCreateRequest(
        title="CIFAR-10 ResNet-18 Metaheuristic Compression Benchmark",
        description="Standardized research benchmark comparing 10 metaheuristic optimization algorithms (GWO, WOA, ALO, MFO, GOA, MVO, SCA, AOA, MGO, GMO) under identical INT8 quantization and 40% structured channel pruning constraints.",
        preset="RESEARCH",
        is_demo=False,
        dataset_name="CIFAR-10",
        dataset_split="train:50000,test:10000",
        input_resolution="32x32x3",
        batch_size=128,
        cnn_model_name="ResNet-18",
        checkpoint_name="torchvision_pretrained",
        quantization_type="INT8",
        pruning_method="STRUCTURED_CHANNEL",
        pruning_ratio=0.40,
        selected_algorithms=["GWO", "WOA", "ALO", "MFO", "GOA", "MVO", "SCA", "AOA", "MGO", "GMO"],
        population_size=20,
        max_iterations=30,
        number_of_runs=5,
        random_seed_policy="FIXED_PER_RUN",
        base_seed=42,
        warmup_runs=50,
        measured_runs=200,
        weight_accuracy=0.40,
        weight_latency=0.25,
        weight_model_size=0.20,
        weight_energy=0.15,
    )

    from app.api.experiments import create_experiment
    from fastapi import BackgroundTasks
    
    bg = BackgroundTasks()
    created = create_experiment(req, bg, db, auto_run=False)
    exp_id = created["id"]
    db.close()
    
    print(f"Running benchmark {exp_id} asynchronously...")
    await ExperimentRunner.run_experiment_task(exp_id)
    print("Initial benchmark run finished successfully!")

if __name__ == "__main__":
    asyncio.run(main())
