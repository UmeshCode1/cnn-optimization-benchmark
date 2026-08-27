"""
Simulation Engine — Deterministic Demo Benchmark.

This engine implements the demo/simulation benchmark.
It uses an analytical degradation model to estimate metric values.

SCIENTIFIC GUARANTEES:
  - All accuracy values have provenance=SIMULATED, source=SIMULATION_MODEL
  - All latency values have provenance=SIMULATED, source=SIMULATION_MODEL
  - All energy values have provenance=ESTIMATED, source=TDP_MODEL
  - NEVER produces provenance=MEASURED for any metric
  - Results are fully deterministic given the same seed

The engine is self-contained and MUST NOT call RealExperimentEngine
or any real evaluation pipeline (torch inference, NVML, RAPL).

Use this engine when:
  - Running in Demo Mode (is_demo=True or execution_mode='DEMO')
  - Real Mode dependencies (PyTorch, datasets) are unavailable

DEMO DATA — NOT EXPERIMENTAL RESULTS
"""

import json
import time
import threading
import math
from typing import Dict, Any, Optional, Callable, List

import numpy as np

from .base import (
    BaseExperimentEngine,
    RunResult,
    BenchmarkResult,
    ExperimentCancelledError,
    EngineValidationError,
)
from ..optimizers.registry import get_optimizer
from ..evaluation.fitness import MultiObjectiveFitness
from ..evaluation.flops import FlopsEvaluator
from ..evaluation.pruning import PruningManager
from ..evaluation.quantization import QuantizationManager


# ── Baseline accuracy from published literature (NOT hardware-measured) ─────
# These are literature reference values for the DEFAULT checkpoint.
# They are NOT measured by this platform and must NEVER be labeled MEASURED.
LITERATURE_BASELINE_ACCURACY = {
    "CIFAR-10": 93.4,
    "CIFAR-100": 76.8,
    "MNIST": 99.1,
    "FASHION-MNIST": 92.4,
    "FASHION_MNIST": 92.4,
    "IMAGENET-1K": 81.2,
    "IMAGENET": 81.2,
}

# Latency reference: ResNet-18 @batch=1 on modern CPU (ms)
REFERENCE_LATENCY_MS = 14.2

# Energy reference: ResNet-18 estimated at 28W CPU inference utilization
REFERENCE_ENERGY_J_PER_INF = 0.38


class SimulationEngine(BaseExperimentEngine):
    """
    Deterministic simulation benchmark engine.

    Uses analytical models to simulate benchmark metrics.
    All outputs are explicitly labeled SIMULATED or ESTIMATED.
    """

    @classmethod
    def get_execution_mode(cls) -> str:
        return "DEMO"

    @classmethod
    def validate_config(cls, experiment_config: Dict[str, Any]) -> Dict[str, Any]:
        """Simulation engine accepts all configurations (no hardware constraints)."""
        errors = []
        pop = experiment_config.get("population_size", 20)
        iters = experiment_config.get("max_iterations", 30)
        runs = experiment_config.get("number_of_runs", 5)
        pruning_ratio = experiment_config.get("pruning_ratio", 0.4)
        weights = {
            "accuracy": experiment_config.get("weight_accuracy", 0.4),
            "latency": experiment_config.get("weight_latency", 0.25),
            "size": experiment_config.get("weight_model_size", 0.2),
            "energy": experiment_config.get("weight_energy", 0.15),
        }

        if pop < 1:
            errors.append("population_size must be >= 1")
        if iters < 1:
            errors.append("max_iterations must be >= 1")
        if runs < 1:
            errors.append("number_of_runs must be >= 1")
        if not (0.0 <= pruning_ratio <= 0.95):
            errors.append("pruning_ratio must be in [0.0, 0.95]")

        total_weight = sum(weights.values())
        if abs(total_weight - 1.0) > 0.01:
            errors.append(f"Weights must sum to 1.0 (got {total_weight:.3f})")

        if errors:
            return {"ok": False, "errors": errors}
        return {"ok": True}

    def _get_baseline_accuracy(self, dataset_name: str) -> float:
        """
        Return literature-referenced baseline accuracy for dataset.
        These are ESTIMATED values from published benchmarks, NOT measured.
        """
        ds = (dataset_name or "").upper().replace("-", "_")
        for key, val in LITERATURE_BASELINE_ACCURACY.items():
            if key.upper().replace("-", "_") in ds or ds in key.upper().replace("-", "_"):
                return val
        # Unknown dataset — use conservative default, clearly not measured
        return 88.0

    def _simulate_accuracy(
        self,
        baseline_acc: float,
        pruning_ratio: float,
        quantization_type: str,
        optimizer_solution: np.ndarray,
    ) -> Dict[str, Any]:
        """
        SIMULATION ONLY: Analytical accuracy degradation model.
        
        PROVENANCE: SIMULATED
        SOURCE: SIMULATION_MODEL
        
        Based on published structured pruning + PTQ literature calibration.
        Does NOT run any real model inference.
        """
        solution_score = float(np.mean(optimizer_solution))

        # Pruning degradation (calibrated against published structured pruning results)
        if pruning_ratio <= 0.30:
            prune_penalty = pruning_ratio * 1.5
        elif pruning_ratio <= 0.60:
            prune_penalty = 0.45 + (pruning_ratio - 0.30) * 4.0
        else:
            prune_penalty = 1.65 + (pruning_ratio - 0.60) * 12.0

        # Quantization penalty (calibrated against INT8 PTQ literature on CIFAR)
        quant_penalty = {"INT8": 0.35, "INT8_DYNAMIC": 0.40, "FP16": 0.05, "FP32": 0.0}.get(
            quantization_type, 0.0
        )

        # Optimizer layer-wise recovery (better solution → better accuracy recovery)
        optimizer_recovery = min(prune_penalty * 0.75, solution_score * 2.2)

        final_acc = max(10.0, min(99.9, baseline_acc - prune_penalty - quant_penalty + optimizer_recovery))
        accuracy_drop = round(baseline_acc - final_acc, 2)

        return {
            "accuracy": round(final_acc, 2),
            "accuracy_drop": accuracy_drop,
            "provenance": "SIMULATED",
            "source": "SIMULATION_MODEL",
            "method": (
                "Analytical pruning-quantization-optimizer degradation model. "
                "DEMO DATA — NOT EXPERIMENTAL RESULTS. "
                "No real model inference was performed."
            ),
            "sample_count": None,
        }

    def run_experiment(
        self,
        experiment_config: Dict[str, Any],
        progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    ) -> BenchmarkResult:
        """
        Run deterministic simulation benchmark.
        All metrics are SIMULATED or ESTIMATED — never MEASURED.
        """
        validation = self.validate_config(experiment_config)
        if not validation["ok"]:
            raise EngineValidationError(
                "Simulation engine config validation failed",
                errors=validation["errors"],
            )

        exp_id = experiment_config["id"]
        selected_algs = experiment_config["selected_algorithms"]
        num_runs = experiment_config["number_of_runs"]
        max_iter = experiment_config["max_iterations"]
        pop_size = experiment_config["population_size"]
        dataset_name = experiment_config["dataset_name"]
        model_name = experiment_config["cnn_model_name"]
        pruning_ratio = experiment_config["pruning_ratio"]
        pruning_method = experiment_config["pruning_method"]
        quantization_type = experiment_config["quantization_type"]
        base_seed = experiment_config.get("base_seed", 42)
        w_acc = experiment_config["weight_accuracy"]
        w_lat = experiment_config["weight_latency"]
        w_size = experiment_config["weight_model_size"]
        w_energy = experiment_config["weight_energy"]

        # ── Baseline (ESTIMATED from literature / FLOPs model) ─────────────
        base_specs = FlopsEvaluator.count_parameters_and_flops(
            model_name=model_name,
            pruning_ratio=0.0,
            quantization_type="FP32",
        )
        baseline_accuracy = self._get_baseline_accuracy(dataset_name)
        flops_scale = max(0.2, base_specs["flops_m"] / 556.0)
        baseline_latency_ms = round(REFERENCE_LATENCY_MS * flops_scale, 2)
        baseline_size_mb = base_specs["model_size_mb"]
        baseline_energy_j = round(REFERENCE_ENERGY_J_PER_INF * flops_scale, 4)
        baseline_params_m = base_specs["parameters_m"]
        baseline_flops_m = base_specs["flops_m"]

        if progress_callback:
            progress_callback({
                "event": "BASELINE_COMPLETED",
                "experiment_id": exp_id,
                "execution_mode": "DEMO",
                "baseline": {
                    "accuracy": baseline_accuracy,
                    "accuracy_provenance": "ESTIMATED",
                    "accuracy_source": "REFERENCE_PAPER",
                    "latency_ms": baseline_latency_ms,
                    "latency_provenance": "ESTIMATED",
                    "latency_source": "ANALYTICAL_FLOPS",
                    "model_size_mb": baseline_size_mb,
                    "energy_j": baseline_energy_j,
                    "parameters_m": baseline_params_m,
                    "flops_m": baseline_flops_m,
                },
            })

        # ── Compression specs ───────────────────────────────────────────────
        pruning_info = PruningManager.evaluate_pruning_impact(
            pruning_method=pruning_method,
            pruning_ratio=pruning_ratio,
            base_params_m=baseline_params_m,
            base_flops_m=baseline_flops_m,
        )
        quant_info = QuantizationManager.apply_quantization({}, quantization_type)

        # Fixed compression output (same for all algorithms — fairness requirement)
        fixed_lat = baseline_latency_ms * quant_info["latency_multiplier"] * pruning_info["latency_factor"]
        fixed_size = baseline_size_mb * (1.0 / quant_info["compression_factor"]) * (1.0 - pruning_ratio)
        fixed_energy = baseline_energy_j * quant_info["latency_multiplier"]
        final_params_m = pruning_info["effective_params_m"]
        final_flops_m = pruning_info["effective_flops_m"]

        # ── Fitness evaluator ───────────────────────────────────────────────
        fitness_evaluator = MultiObjectiveFitness(
            weight_accuracy=w_acc,
            weight_latency=w_lat,
            weight_model_size=w_size,
            weight_energy=w_energy,
            baseline_acc=baseline_accuracy,
            baseline_lat_ms=baseline_latency_ms,
            baseline_size_mb=baseline_size_mb,
            baseline_energy_j=baseline_energy_j,
        )

        total_steps = len(selected_algs) * num_runs
        current_step = 0
        all_runs: List[RunResult] = []

        for alg_idx, alg_key in enumerate(selected_algs):
            for run_idx in range(1, num_runs + 1):
                self.check_cancellation()

                current_step += 1
                seed = base_seed + (run_idx * 100) + alg_idx

                if progress_callback:
                    progress_callback({
                        "event": "RUN_START",
                        "experiment_id": exp_id,
                        "execution_mode": "DEMO",
                        "algorithm": alg_key,
                        "run_index": run_idx,
                        "total_runs": num_runs,
                        "progress_pct": round(((current_step - 1) / total_steps) * 100.0, 1),
                    })

                # ── Run optimizer ───────────────────────────────────────────
                optimizer = get_optimizer(
                    key=alg_key,
                    population_size=pop_size,
                    max_iterations=max_iter,
                    seed=seed,
                )

                dimension = 4  # Layer-wise compression parameter vector
                lb = np.zeros(dimension)
                ub = np.ones(dimension)

                def evaluate_candidate_metrics(cand: np.ndarray):
                    c0, c1, c2, c3 = cand[0], cand[1], cand[2], cand[3]
                    acc = self._simulate_accuracy(
                        baseline_accuracy, pruning_ratio, quantization_type, cand
                    )["accuracy"]
                    lat = max(0.5, fixed_lat * (0.88 + 0.24 * (1.0 - c2)))
                    size = max(0.5, fixed_size * (0.90 + 0.20 * (1.0 - c0 * 0.5)))
                    eng = max(0.01, fixed_energy * (0.88 + 0.24 * (1.0 - c3)))
                    return acc, lat, size, eng

                def objective_fn(candidate: np.ndarray) -> float:
                    acc, lat, size, eng = evaluate_candidate_metrics(candidate)
                    return fitness_evaluator.calculate_cost_to_minimize(
                        accuracy=acc,
                        latency_ms=lat,
                        model_size_mb=size,
                        energy_j=eng,
                    )

                t_start = time.perf_counter()
                opt_result = optimizer.optimize(
                    objective_fn=objective_fn,
                    dimension=dimension,
                    lower_bounds=lb,
                    upper_bounds=ub,
                    callback=None,
                )
                opt_time = time.perf_counter() - t_start

                self.check_cancellation()

                # ── Final evaluation of best solution ───────────────────────
                best_solution = np.array(opt_result.best_solution)
                final_acc, final_lat, final_size, final_eng = evaluate_candidate_metrics(best_solution)
                acc_info = self._simulate_accuracy(
                    baseline_accuracy, pruning_ratio, quantization_type, best_solution
                )
                final_acc = acc_info["accuracy"]

                score = fitness_evaluator.compute_overall_score_100(
                    accuracy=final_acc,
                    latency_ms=final_lat,
                    model_size_mb=final_size,
                    energy_j=final_eng,
                )

                # Derived metrics (CALCULATED from ESTIMATED inputs → ESTIMATED)
                compression_ratio = round(baseline_size_mb / max(0.01, final_size), 2)
                speedup = round(baseline_latency_ms / max(0.01, final_lat), 2)
                size_reduction_pct = round(((baseline_size_mb - final_size) / baseline_size_mb) * 100.0, 1)
                energy_reduction_pct = round(((baseline_energy_j - final_eng) / baseline_energy_j) * 100.0, 1)

                run = RunResult(
                    algorithm=alg_key,
                    run_index=run_idx,
                    seed=seed,
                    status="COMPLETED",
                    # Accuracy — SIMULATED
                    accuracy=final_acc,
                    accuracy_provenance="SIMULATED",
                    accuracy_source="SIMULATION_MODEL",
                    accuracy_method=acc_info["method"],
                    accuracy_sample_count=None,
                    accuracy_drop=acc_info["accuracy_drop"],
                    # Latency — SIMULATED (compression formula + layer parameter optimization)
                    latency_mean_ms=round(final_lat, 3),
                    latency_median_ms=round(final_lat, 3),
                    latency_p95_ms=round(final_lat * 1.05, 3),
                    latency_p99_ms=round(final_lat * 1.08, 3),
                    latency_min_ms=round(final_lat * 0.95, 3),
                    latency_max_ms=round(final_lat * 1.10, 3),
                    latency_std_ms=round(final_lat * 0.03, 3),
                    latency_provenance="SIMULATED",
                    latency_source="SIMULATION_MODEL",
                    latency_method="Compression-factor formula applied to FLOPs-scaled reference.",
                    latency_sample_count=None,
                    # Model size — ESTIMATED (params * bytes)
                    model_size_mb=round(final_size, 3),
                    model_size_provenance="ESTIMATED",
                    model_size_method="Analytical: pruned parameters × dtype bytes",
                    # Energy — ESTIMATED (TDP model)
                    energy_j=round(fixed_energy, 6),
                    energy_per_inference_j=round(fixed_energy, 6),
                    avg_power_watts=0.0,
                    energy_provenance="ESTIMATED",
                    energy_source="TDP_MODEL",
                    energy_method="FLOPs-scaled TDP model. NOT hardware-measured.",
                    # Parameters & FLOPs — ESTIMATED
                    parameters_m=round(final_params_m, 3),
                    parameters_provenance="ESTIMATED",
                    flops_m=round(final_flops_m, 1),
                    flops_provenance="ESTIMATED",
                    # Derived
                    compression_ratio=compression_ratio,
                    speedup=speedup,
                    size_reduction_pct=size_reduction_pct,
                    energy_reduction_pct=energy_reduction_pct,
                    derived_metrics_provenance="ESTIMATED",
                    # Optimizer
                    best_fitness=round(opt_result.best_fitness, 4),
                    overall_score=round(score, 2),
                    optimization_time_seconds=round(opt_time, 3),
                    candidate_evaluations=opt_result.all_candidate_evaluations,
                    convergence_curve=opt_result.convergence_curve,
                    execution_mode="DEMO",
                )
                all_runs.append(run)

                if progress_callback:
                    progress_callback({
                        "event": "RUN_COMPLETED",
                        "experiment_id": exp_id,
                        "execution_mode": "DEMO",
                        "algorithm": alg_key,
                        "run_index": run_idx,
                        "progress_pct": round((current_step / total_steps) * 100.0, 1),
                        "metrics": {
                            "accuracy": final_acc,
                            "accuracy_provenance": "SIMULATED",
                            "latency_ms": fixed_lat,
                            "latency_provenance": "SIMULATED",
                            "overall_score": score,
                        },
                    })

        return BenchmarkResult(
            experiment_id=exp_id,
            execution_mode="DEMO",
            execution_environment="Demo/Simulation Mode — No real hardware measurement",
            measurement_capabilities={
                "mode": "DEMO",
                "real_inference": False,
                "nvml": False,
                "rapl": False,
                "note": "DEMO DATA — NOT EXPERIMENTAL RESULTS",
            },
            baseline_accuracy=baseline_accuracy,
            baseline_accuracy_provenance="ESTIMATED",
            baseline_latency_ms=baseline_latency_ms,
            baseline_latency_provenance="ESTIMATED",
            baseline_size_mb=baseline_size_mb,
            baseline_energy_j=baseline_energy_j,
            baseline_params_m=baseline_params_m,
            baseline_flops_m=baseline_flops_m,
            runs=all_runs,
        )
