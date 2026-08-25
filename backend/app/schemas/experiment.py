"""
Pydantic v2 Schemas for CNN Optimization Benchmark API.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


class ExperimentCreateRequest(BaseModel):
    title: str = Field("ResNet-18 Benchmark on CIFAR-10", description="Experiment Title")
    description: Optional[str] = Field("", description="Detailed research notes")
    preset: str = Field("STANDARD", description="QUICK_TEST, STANDARD, RESEARCH")
    is_demo: bool = Field(False, description="Run in demo data mode or live PyTorch execution")

    # Step 1: Dataset
    dataset_name: str = Field("CIFAR-10", description="CIFAR-10, CIFAR-100, ImageNet, Custom")
    dataset_split: str = Field("train:50000,test:10000")
    input_resolution: str = Field("32x32x3")
    batch_size: int = Field(128, ge=1, le=1024)

    # Step 2: CNN Model
    cnn_model_name: str = Field("ResNet-18", description="ResNet-18, MobileNetV2, VGG-16, EfficientNet-B0")
    checkpoint_name: str = Field("torchvision_pretrained")

    # Step 3: Quantization
    quantization_type: str = Field("INT8", description="FP32, FP16, INT8, INT8_DYNAMIC")

    # Step 4: Pruning
    pruning_method: str = Field("STRUCTURED_CHANNEL", description="NONE, UNSTRUCTURED, STRUCTURED_CHANNEL, STRUCTURED_FILTER")
    pruning_ratio: float = Field(0.40, ge=0.0, le=0.90)

    # Step 5: Selected Algorithms
    selected_algorithms: List[str] = Field(
        default=["GWO", "WOA", "ALO", "MFO", "GOA", "MVO", "SCA", "AOA", "MGO", "GMO"],
        min_length=1,
        description="List of algorithm acronyms to benchmark"
    )

    # Step 6: Search Hyperparameters
    population_size: int = Field(20, ge=4, le=100)
    max_iterations: int = Field(30, ge=1, le=500)

    # Step 7: Evaluation & Multi-Run
    number_of_runs: int = Field(5, ge=1, le=20)
    random_seed_policy: str = Field("FIXED_PER_RUN", description="FIXED_PER_RUN, INCREMENTAL")
    base_seed: int = Field(42)
    warmup_runs: int = Field(50, ge=0, le=500)
    measured_runs: int = Field(200, ge=10, le=2000)

    # Step 8: Multi-Objective Weights
    weight_accuracy: float = Field(0.40, ge=0.0, le=1.0)
    weight_latency: float = Field(0.25, ge=0.0, le=1.0)
    weight_model_size: float = Field(0.20, ge=0.0, le=1.0)
    weight_energy: float = Field(0.15, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def validate_weights_and_preset(self):
        total_weight = self.weight_accuracy + self.weight_latency + self.weight_model_size + self.weight_energy
        if not (0.98 <= total_weight <= 1.02):
            raise ValueError(f"Objective weights must sum to 1.0 (100%). Current sum: {total_weight:.3f}")
        return self


class WeightUpdateRequest(BaseModel):
    weight_accuracy: float = Field(0.40, ge=0.0, le=1.0)
    weight_latency: float = Field(0.25, ge=0.0, le=1.0)
    weight_model_size: float = Field(0.20, ge=0.0, le=1.0)
    weight_energy: float = Field(0.15, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def validate_sum(self):
        total = self.weight_accuracy + self.weight_latency + self.weight_model_size + self.weight_energy
        if not (0.98 <= total <= 1.02):
            raise ValueError(f"Weights must sum to 1.0 (100%). Current sum: {total:.3f}")
        return self


class FairnessValidationResult(BaseModel):
    is_valid: bool
    status: str
    message: str
    guarantees: List[Dict[str, Any]]
    warnings: List[str]


class StatisticalMetricSummary(BaseModel):
    mean: float
    std: float
    median: float
    min_val: float
    max_val: float
    ci_95_lower: float
    ci_95_upper: float


class AlgorithmRunStats(BaseModel):
    algorithm: str
    runs_count: int
    accuracy: StatisticalMetricSummary
    latency_ms: StatisticalMetricSummary
    model_size_mb: StatisticalMetricSummary
    energy_j: StatisticalMetricSummary
    overall_score: StatisticalMetricSummary
    pareto_optimal: bool
    rank: int


class ParetoPoint(BaseModel):
    algorithm: str
    run_index: int
    accuracy: float
    latency_ms: float
    model_size_mb: float
    energy_j: float
    overall_score: float
    is_pareto: bool
    config_summary: str


class ExperimentResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    is_demo: bool
    preset: str
    dataset_name: str
    dataset_split: str
    input_resolution: str
    batch_size: int
    cnn_model_name: str
    checkpoint_name: str
    quantization_type: str
    pruning_method: str
    pruning_ratio: float
    selected_algorithms: List[str]
    population_size: int
    max_iterations: int
    number_of_runs: int
    random_seed_policy: str
    base_seed: int
    warmup_runs: int
    measured_runs: int
    weight_accuracy: float
    weight_latency: float
    weight_model_size: float
    weight_energy: float
    baseline: Dict[str, float]
    best_algorithm: Optional[str]
    best_algorithm_reason: Optional[str]
    pareto_optimal_algorithms: List[str]
    error_message: Optional[str]
    created_at: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    hardware: Optional[Dict[str, Any]]


class CompareSelectedRequest(BaseModel):
    algorithm_acronyms: List[str] = Field(..., min_length=1)
    stat_mode: str = Field("MEAN", description="MEAN, MEDIAN, BEST")
