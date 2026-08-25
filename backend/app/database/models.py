"""
SQLAlchemy Database Models for CNN Optimization Benchmark.
Designed for SQLite with PostgreSQL compatibility.
"""

from datetime import datetime
from typing import Optional, List
import json
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class HardwareProfile(Base):
    __tablename__ = "hardware_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    device_name = Column(String(128), nullable=False)
    device_type = Column(String(32), default="GPU")  # GPU, CPU
    cpu_model = Column(String(128), default="Unknown CPU")
    cpu_cores = Column(Integer, default=4)
    gpu_model = Column(String(128), default="N/A")
    gpu_memory_mb = Column(Float, default=0.0)
    ram_gb = Column(Float, default=16.0)
    os_info = Column(String(128), default="Unknown OS")
    cuda_version = Column(String(32), default="N/A")
    torch_version = Column(String(32), default="N/A")
    python_version = Column(String(32), default="N/A")
    created_at = Column(DateTime, default=datetime.utcnow)

    experiments = relationship("Experiment", back_populates="hardware")

    def to_dict(self):
        return {
            "id": self.id,
            "device_name": self.device_name,
            "device_type": self.device_type,
            "cpu_model": self.cpu_model,
            "cpu_cores": self.cpu_cores,
            "gpu_model": self.gpu_model,
            "gpu_memory_mb": self.gpu_memory_mb,
            "ram_gb": self.ram_gb,
            "os_info": self.os_info,
            "cuda_version": self.cuda_version,
            "torch_version": self.torch_version,
            "python_version": self.python_version,
        }


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(64), primary_key=True)  # e.g., EXP-2026-0825-0001
    title = Column(String(256), nullable=False)
    description = Column(Text, default="")
    status = Column(String(32), default="DRAFT")  # DRAFT, QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED
    is_demo = Column(Boolean, default=False)
    preset = Column(String(32), default="STANDARD")  # QUICK_TEST, STANDARD, RESEARCH

    # Core fair experimental conditions
    dataset_name = Column(String(64), nullable=False, default="CIFAR-10")
    dataset_split = Column(String(64), default="train:50000,test:10000")
    input_resolution = Column(String(32), default="32x32x3")
    batch_size = Column(Integer, default=128)
    cnn_model_name = Column(String(64), nullable=False, default="ResNet-18")
    checkpoint_name = Column(String(128), default="torchvision_pretrained")
    
    # Compression configuration
    quantization_type = Column(String(32), default="INT8")  # FP32, FP16, INT8, INT8_DYNAMIC
    pruning_method = Column(String(32), default="STRUCTURED_CHANNEL")  # NONE, UNSTRUCTURED, STRUCTURED_CHANNEL, STRUCTURED_FILTER
    pruning_ratio = Column(Float, default=0.40)  # 0.0 - 0.90
    
    # Optimizer search hyper-parameters
    selected_algorithms_json = Column(Text, nullable=False)  # JSON list of algorithm acronyms
    population_size = Column(Integer, default=20)
    max_iterations = Column(Integer, default=30)
    number_of_runs = Column(Integer, default=5)
    random_seed_policy = Column(String(32), default="FIXED_PER_RUN")  # FIXED_PER_RUN, INCREMENTAL
    base_seed = Column(Integer, default=42)
    warmup_runs = Column(Integer, default=50)
    measured_runs = Column(Integer, default=200)

    # Multi-Objective Weights (must sum to 100%)
    weight_accuracy = Column(Float, default=0.40)
    weight_latency = Column(Float, default=0.25)
    weight_model_size = Column(Float, default=0.20)
    weight_energy = Column(Float, default=0.15)

    # Baseline snapshot
    baseline_accuracy = Column(Float, default=0.0)
    baseline_latency_ms = Column(Float, default=0.0)
    baseline_size_mb = Column(Float, default=0.0)
    baseline_energy_j = Column(Float, default=0.0)
    baseline_params_m = Column(Float, default=0.0)
    baseline_flops_m = Column(Float, default=0.0)

    # Results summary
    best_algorithm = Column(String(32), nullable=True)
    best_algorithm_reason = Column(Text, nullable=True)
    pareto_optimal_algorithms_json = Column(Text, default="[]")
    
    # Error message if failed
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    hardware_id = Column(Integer, ForeignKey("hardware_profiles.id"), nullable=True)
    hardware = relationship("HardwareProfile", back_populates="experiments")
    
    runs = relationship("ExperimentRun", back_populates="experiment", cascade="all, delete-orphan")
    metric_records = relationship("MetricRecord", back_populates="experiment", cascade="all, delete-orphan")
    ablations = relationship("AblationRecord", back_populates="experiment", cascade="all, delete-orphan")

    def get_selected_algorithms(self) -> List[str]:
        try:
            return json.loads(self.selected_algorithms_json)
        except Exception:
            return []

    def set_selected_algorithms(self, algs: List[str]):
        self.selected_algorithms_json = json.dumps(algs)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "is_demo": self.is_demo,
            "preset": self.preset,
            "dataset_name": self.dataset_name,
            "dataset_split": self.dataset_split,
            "input_resolution": self.input_resolution,
            "batch_size": self.batch_size,
            "cnn_model_name": self.cnn_model_name,
            "checkpoint_name": self.checkpoint_name,
            "quantization_type": self.quantization_type,
            "pruning_method": self.pruning_method,
            "pruning_ratio": self.pruning_ratio,
            "selected_algorithms": self.get_selected_algorithms(),
            "population_size": self.population_size,
            "max_iterations": self.max_iterations,
            "number_of_runs": self.number_of_runs,
            "random_seed_policy": self.random_seed_policy,
            "base_seed": self.base_seed,
            "warmup_runs": self.warmup_runs,
            "measured_runs": self.measured_runs,
            "weight_accuracy": self.weight_accuracy,
            "weight_latency": self.weight_latency,
            "weight_model_size": self.weight_model_size,
            "weight_energy": self.weight_energy,
            "baseline": {
                "accuracy": self.baseline_accuracy,
                "latency_ms": self.baseline_latency_ms,
                "model_size_mb": self.baseline_size_mb,
                "energy_j": self.baseline_energy_j,
                "parameters_m": self.baseline_params_m,
                "flops_m": self.baseline_flops_m,
            },
            "best_algorithm": self.best_algorithm,
            "best_algorithm_reason": self.best_algorithm_reason,
            "pareto_optimal_algorithms": json.loads(self.pareto_optimal_algorithms_json or "[]"),
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "hardware": self.hardware.to_dict() if self.hardware else None,
        }


class ExperimentRun(Base):
    __tablename__ = "experiment_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(String(64), ForeignKey("experiments.id"), nullable=False)
    algorithm_acronym = Column(String(32), nullable=False)
    run_index = Column(Integer, nullable=False)  # 1 to N
    seed = Column(Integer, nullable=False)
    status = Column(String(32), default="COMPLETED")  # RUNNING, COMPLETED, FAILED

    # Measured primary metrics
    accuracy = Column(Float, nullable=False)
    latency_ms = Column(Float, nullable=False)
    latency_p95_ms = Column(Float, default=0.0)
    latency_min_ms = Column(Float, default=0.0)
    latency_max_ms = Column(Float, default=0.0)
    model_size_mb = Column(Float, nullable=False)
    energy_j = Column(Float, nullable=False)
    energy_source = Column(String(64), default="ESTIMATED")  # MEASURED_GPU, MEASURED_RAPL, ESTIMATED

    # Calculated secondary metrics
    parameters_m = Column(Float, nullable=False)
    flops_m = Column(Float, nullable=False)
    compression_ratio = Column(Float, default=1.0)
    accuracy_drop = Column(Float, default=0.0)
    speedup = Column(Float, default=1.0)
    size_reduction_pct = Column(Float, default=0.0)
    energy_reduction_pct = Column(Float, default=0.0)

    # Optimization metrics
    best_fitness = Column(Float, nullable=False)
    overall_score = Column(Float, default=0.0)
    optimization_time_seconds = Column(Float, default=0.0)
    candidate_evaluations = Column(Integer, default=0)
    convergence_curve_json = Column(Text, default="[]")  # list of floats per iteration
    best_candidate_config_json = Column(Text, default="{}")

    created_at = Column(DateTime, default=datetime.utcnow)

    experiment = relationship("Experiment", back_populates="runs")

    def to_dict(self):
        return {
            "id": self.id,
            "experiment_id": self.experiment_id,
            "algorithm": self.algorithm_acronym,
            "run_index": self.run_index,
            "seed": self.seed,
            "status": self.status,
            "accuracy": self.accuracy,
            "accuracy_drop": self.accuracy_drop,
            "latency_ms": self.latency_ms,
            "latency_p95_ms": self.latency_p95_ms,
            "latency_min_ms": self.latency_min_ms,
            "latency_max_ms": self.latency_max_ms,
            "speedup": self.speedup,
            "model_size_mb": self.model_size_mb,
            "compression_ratio": self.compression_ratio,
            "size_reduction_pct": self.size_reduction_pct,
            "energy_j": self.energy_j,
            "energy_source": self.energy_source,
            "energy_reduction_pct": self.energy_reduction_pct,
            "parameters_m": self.parameters_m,
            "flops_m": self.flops_m,
            "best_fitness": self.best_fitness,
            "overall_score": self.overall_score,
            "optimization_time_seconds": self.optimization_time_seconds,
            "candidate_evaluations": self.candidate_evaluations,
            "convergence_curve": json.loads(self.convergence_curve_json or "[]"),
            "best_candidate_config": json.loads(self.best_candidate_config_json or "{}"),
        }


class MetricRecord(Base):
    __tablename__ = "metric_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(String(64), ForeignKey("experiments.id"), nullable=False)
    algorithm_acronym = Column(String(32), nullable=False)
    metric_name = Column(String(64), nullable=False)  # accuracy, latency, model_size, energy, etc.
    metric_value = Column(Float, nullable=False)
    unit = Column(String(32), nullable=False)  # %, ms, MB, J, M, MFLOPs
    provenance = Column(String(32), default="MEASURED")  # MEASURED, CALCULATED, ESTIMATED, DEMO DATA
    measurement_method = Column(Text, default="")
    source = Column(String(128), default="Local Benchmark Worker")
    timestamp = Column(DateTime, default=datetime.utcnow)

    experiment = relationship("Experiment", back_populates="metric_records")

    def to_dict(self):
        return {
            "id": self.id,
            "algorithm": self.algorithm_acronym,
            "metric_name": self.metric_name,
            "metric_value": self.metric_value,
            "unit": self.unit,
            "provenance": self.provenance,
            "measurement_method": self.measurement_method,
            "source": self.source,
            "timestamp": self.timestamp.isoformat(),
        }


class AblationRecord(Base):
    __tablename__ = "ablation_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(String(64), ForeignKey("experiments.id"), nullable=False)
    stage_name = Column(String(128), nullable=False)
    # e.g.: Baseline, +Quantization, +Pruning, +Quant+Pruning, +Optimizer
    stage_order = Column(Integer, default=1)
    accuracy = Column(Float, nullable=False)
    latency_ms = Column(Float, nullable=False)
    model_size_mb = Column(Float, nullable=False)
    energy_j = Column(Float, nullable=False)
    parameters_m = Column(Float, nullable=False)
    flops_m = Column(Float, nullable=False)
    description = Column(Text, default="")

    experiment = relationship("Experiment", back_populates="ablations")

    def to_dict(self):
        return {
            "id": self.id,
            "stage_name": self.stage_name,
            "stage_order": self.stage_order,
            "accuracy": self.accuracy,
            "latency_ms": self.latency_ms,
            "model_size_mb": self.model_size_mb,
            "energy_j": self.energy_j,
            "parameters_m": self.parameters_m,
            "flops_m": self.flops_m,
            "description": self.description,
        }
