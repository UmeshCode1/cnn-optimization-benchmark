"""
Abstract Experiment Engine Base Class.

Defines the common interface that both SimulationEngine and RealExperimentEngine
must implement. The runner.py uses this interface and never calls engine-specific
internal methods directly.

CONTRACT:
  Both engines must return a BenchmarkResult with identical schema.
  The only difference is the provenance attached to each metric.

  SimulationEngine → metrics have provenance=SIMULATED, source=SIMULATION_MODEL
  RealEngine       → metrics have provenance=MEASURED/CALCULATED, source=MODEL_INFERENCE/NVML/etc.

  The runner MUST NOT mix engines within a single experiment.
  Cancellation is handled via a threading.Event that both engines check periodically.
"""

import threading
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Callable


@dataclass
class RunResult:
    """
    Result for a single optimizer run (one algorithm, one independent run).
    Both engines return this schema — provenance differentiates data origin.
    """
    algorithm: str
    run_index: int
    seed: int
    status: str  # COMPLETED | FAILED | CANCELLED

    # Primary metrics with provenance
    accuracy: float
    accuracy_provenance: str           # MEASURED | SIMULATED
    accuracy_source: str               # MODEL_INFERENCE | SIMULATION_MODEL
    accuracy_method: str
    accuracy_sample_count: Optional[int]

    accuracy_drop: float

    latency_mean_ms: float
    latency_median_ms: float
    latency_p95_ms: float
    latency_p99_ms: float
    latency_min_ms: float
    latency_max_ms: float
    latency_std_ms: float
    latency_provenance: str           # MEASURED | ESTIMATED | SIMULATED
    latency_source: str               # MODEL_INFERENCE | TDP_MODEL | SIMULATION_MODEL
    latency_method: str
    latency_sample_count: Optional[int]

    model_size_mb: float
    model_size_provenance: str        # MEASURED | CALCULATED | ESTIMATED
    model_size_method: str

    energy_j: float
    energy_per_inference_j: float
    avg_power_watts: float
    energy_provenance: str            # MEASURED | ESTIMATED | SIMULATED
    energy_source: str                # NVIDIA_NVML | CPU_RAPL | TDP_MODEL | SIMULATION_MODEL
    energy_method: str

    parameters_m: float
    parameters_provenance: str        # MEASURED (from model.parameters()) | ESTIMATED
    flops_m: float
    flops_provenance: str             # MEASURED | ESTIMATED | SIMULATED

    compression_ratio: float
    speedup: float
    size_reduction_pct: float
    energy_reduction_pct: float
    derived_metrics_provenance: str   # CALCULATED (if from measured) | ESTIMATED | SIMULATED

    # Optimizer tracking
    best_fitness: float
    overall_score: float
    optimization_time_seconds: float
    candidate_evaluations: int
    convergence_curve: List[float]

    # Execution mode: DEMO | REAL
    execution_mode: str

    # Error info if failed
    error_message: Optional[str] = None


@dataclass
class BenchmarkResult:
    """
    Complete result for one experiment (all algorithms, all runs).
    This is what the runner persists to the database.
    """
    experiment_id: str
    execution_mode: str               # DEMO | REAL
    execution_environment: str        # e.g. "Render Free Tier CPU" | "NVIDIA RTX 3090"
    measurement_capabilities: Dict[str, Any] = field(default_factory=dict)

    # Baseline metrics
    baseline_accuracy: float = 0.0
    baseline_accuracy_provenance: str = "SIMULATED"
    baseline_latency_ms: float = 0.0
    baseline_latency_provenance: str = "SIMULATED"
    baseline_size_mb: float = 0.0
    baseline_energy_j: float = 0.0
    baseline_params_m: float = 0.0
    baseline_flops_m: float = 0.0

    # Per-run results
    runs: List[RunResult] = field(default_factory=list)

    # Whether the experiment was cancelled
    cancelled: bool = False
    error_message: Optional[str] = None


class BaseExperimentEngine(ABC):
    """
    Abstract base for all experiment execution engines.

    Subclasses MUST:
    1. Implement run_experiment() returning a BenchmarkResult
    2. Never mix their own provenance with the other engine's
    3. Periodically check cancel_event.is_set() and raise CancellationError
    4. Never call each other's internal evaluation methods
    """

    def __init__(self, cancel_event: Optional[threading.Event] = None):
        self.cancel_event = cancel_event or threading.Event()

    def is_cancelled(self) -> bool:
        return self.cancel_event.is_set()

    def check_cancellation(self):
        """Call this periodically inside long-running loops."""
        if self.is_cancelled():
            raise ExperimentCancelledError("Experiment was cancelled by user request.")

    @abstractmethod
    def run_experiment(
        self,
        experiment_config: Dict[str, Any],
        progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    ) -> BenchmarkResult:
        """
        Execute the full benchmark pipeline and return a BenchmarkResult.

        Args:
            experiment_config: Complete experiment configuration dict.
            progress_callback: Optional function called with progress updates.

        Returns:
            BenchmarkResult with all metrics and provenance attached.

        Raises:
            ExperimentCancelledError: If cancellation was requested.
            EngineValidationError: If configuration is invalid for this engine.
            ExperimentFailedError: If execution fails.
        """
        ...

    @classmethod
    @abstractmethod
    def get_execution_mode(cls) -> str:
        """Return 'DEMO' or 'REAL'."""
        ...

    @classmethod
    @abstractmethod
    def validate_config(cls, experiment_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate config before execution.
        Returns {'ok': True} or {'ok': False, 'errors': [...]}
        Never silently adjust config — return errors instead.
        """
        ...


class ExperimentCancelledError(Exception):
    """Raised when the cancel_event is set during execution."""
    pass


class EngineValidationError(Exception):
    """Raised when the experiment config is invalid for this engine."""
    def __init__(self, message: str, errors: List[str] = None):
        super().__init__(message)
        self.errors = errors or []


class ExperimentFailedError(Exception):
    """Raised when execution fails for an internal reason."""
    pass
