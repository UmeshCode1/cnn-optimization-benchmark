"""
Asynchronous Experiment Runner.

Executes experiments using the dual-engine architecture:
  - DEMO mode → SimulationEngine
  - REAL mode → RealExperimentEngine

Cancellation is supported via a threading.Event mapped by experiment ID.
Database is authoritative — WebSocket is only a live transport.
"""

import asyncio
import json
import threading
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

import numpy as np

from ..database.session import SessionLocal
from ..database.models import Experiment, ExperimentRun, MetricRecord, AblationRecord, HardwareProfile
from ..engines import get_engine
from ..engines.base import ExperimentCancelledError, EngineValidationError, BenchmarkResult
from ..services.pareto_service import ParetoService
from ..services.statistics_service import StatisticsService
from ..services.scoring_service import ScoringService
from ..services.ablation_service import AblationService


# ── WebSocket Subscriber Registry ──────────────────────────────────────────
# In-memory only — database is authoritative for experiment state.
active_websocket_subscribers: Dict[str, List[asyncio.Queue]] = {}

# ── Cancellation Registry ───────────────────────────────────────────────────
# Maps experiment_id → threading.Event
# Setting the event requests cancellation of the running worker.
_cancel_events: Dict[str, threading.Event] = {}


def register_ws_subscriber(exp_id: str, queue: asyncio.Queue):
    if exp_id not in active_websocket_subscribers:
        active_websocket_subscribers[exp_id] = []
    active_websocket_subscribers[exp_id].append(queue)


def unregister_ws_subscriber(exp_id: str, queue: asyncio.Queue):
    if exp_id in active_websocket_subscribers:
        try:
            active_websocket_subscribers[exp_id].remove(queue)
        except ValueError:
            pass


async def broadcast_progress(exp_id: str, payload: Dict[str, Any]):
    """Send progress update to all WebSocket subscribers for this experiment."""
    if exp_id in active_websocket_subscribers:
        for q in list(active_websocket_subscribers[exp_id]):
            try:
                await q.put(payload)
            except Exception:
                pass


def request_cancellation(exp_id: str) -> bool:
    """
    Signal the running worker to cancel.
    Returns True if a running worker was found, False if no active worker.
    """
    if exp_id in _cancel_events:
        _cancel_events[exp_id].set()
        return True
    return False


def _cleanup_cancel_event(exp_id: str):
    _cancel_events.pop(exp_id, None)


class ExperimentRunner:
    """Core worker that bridges the API layer and the execution engines."""

    @classmethod
    async def run_experiment_task(cls, experiment_id: str):
        """
        Main async task. Selects engine based on experiment.execution_mode,
        runs benchmark, persists results to DB.
        
        Database is updated directly — WebSocket is secondary transport.
        """
        db = SessionLocal()
        cancel_event = threading.Event()
        _cancel_events[experiment_id] = cancel_event

        exp: Optional[Experiment] = None

        try:
            exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
            if not exp:
                return

            # State: QUEUED → RUNNING
            exp.status = "RUNNING"
            exp.started_at = datetime.now(timezone.utc)
            db.commit()

            execution_mode = getattr(exp, "execution_mode", "DEMO") or "DEMO"

            # ── Select engine ───────────────────────────────────────────────
            try:
                engine = get_engine(mode=execution_mode, cancel_event=cancel_event)
            except EngineValidationError as e:
                # REAL mode requested but not feasible — fail immediately
                exp.status = "FAILED"
                exp.error_message = (
                    f"Cannot run in {execution_mode} mode: {str(e)}. "
                    f"Errors: {'; '.join(e.errors)}"
                )
                db.commit()
                await broadcast_progress(experiment_id, {
                    "event": "BENCHMARK_FAILED",
                    "experiment_id": experiment_id,
                    "error": exp.error_message,
                    "execution_mode": execution_mode,
                })
                return

            # Build config dict for engine
            experiment_config = {
                "id": exp.id,
                "execution_mode": execution_mode,
                "dataset_name": exp.dataset_name,
                "cnn_model_name": exp.cnn_model_name,
                "pruning_method": exp.pruning_method,
                "pruning_ratio": exp.pruning_ratio,
                "quantization_type": exp.quantization_type,
                "selected_algorithms": exp.get_selected_algorithms(),
                "population_size": exp.population_size,
                "max_iterations": exp.max_iterations,
                "number_of_runs": exp.number_of_runs,
                "base_seed": exp.base_seed,
                "warmup_runs": exp.warmup_runs,
                "measured_runs": exp.measured_runs,
                "weight_accuracy": exp.weight_accuracy,
                "weight_latency": exp.weight_latency,
                "weight_model_size": exp.weight_model_size,
                "weight_energy": exp.weight_energy,
                "batch_size": exp.batch_size,
            }

            # ── Progress callback ────────────────────────────────────────────
            loop = asyncio.get_event_loop()

            def progress_callback(payload: Dict[str, Any]):
                try:
                    asyncio.run_coroutine_threadsafe(
                        broadcast_progress(experiment_id, payload), loop
                    )
                except Exception as cb_err:
                    print(f"[Runner] Progress broadcast error: {cb_err}")

            # ── Run engine in background worker thread to prevent event loop blocking ───────
            result: BenchmarkResult = await asyncio.to_thread(
                engine.run_experiment,
                experiment_config,
                progress_callback,
            )

            # ── Persist baseline ────────────────────────────────────────────
            exp.baseline_accuracy = result.baseline_accuracy
            exp.baseline_latency_ms = result.baseline_latency_ms
            exp.baseline_size_mb = result.baseline_size_mb
            exp.baseline_energy_j = result.baseline_energy_j
            exp.baseline_params_m = result.baseline_params_m
            exp.baseline_flops_m = result.baseline_flops_m
            db.commit()

            # ── Persist each run ────────────────────────────────────────────
            all_saved_runs = []
            for run in result.runs:
                run_record = ExperimentRun(
                    experiment_id=exp.id,
                    algorithm_acronym=str(run.algorithm),
                    run_index=int(run.run_index),
                    seed=int(run.seed),
                    status=str(run.status),
                    accuracy=float(run.accuracy),
                    accuracy_drop=float(run.accuracy_drop),
                    latency_ms=float(run.latency_mean_ms),
                    latency_p95_ms=float(run.latency_p95_ms),
                    latency_min_ms=float(run.latency_min_ms),
                    latency_max_ms=float(run.latency_max_ms),
                    model_size_mb=float(run.model_size_mb),
                    energy_j=float(run.energy_j),
                    energy_source=str(run.energy_source),
                    parameters_m=float(run.parameters_m),
                    flops_m=float(run.flops_m),
                    compression_ratio=float(run.compression_ratio),
                    speedup=float(run.speedup),
                    size_reduction_pct=float(run.size_reduction_pct),
                    energy_reduction_pct=float(run.energy_reduction_pct),
                    best_fitness=float(run.best_fitness),
                    overall_score=float(run.overall_score),
                    optimization_time_seconds=float(run.optimization_time_seconds),
                    candidate_evaluations=int(run.candidate_evaluations),
                    convergence_curve_json=json.dumps([float(x) for x in run.convergence_curve]),
                    best_candidate_config_json="{}",
                    # Provenance fields
                    accuracy_provenance=str(run.accuracy_provenance),
                    latency_provenance=str(run.latency_provenance),
                    energy_provenance=str(run.energy_provenance),
                    execution_mode=str(run.execution_mode),
                )
                db.add(run_record)
                db.commit()
                all_saved_runs.append(run_record.to_dict())

                # Metric records with correct provenance
                db.add(MetricRecord(
                    experiment_id=exp.id,
                    algorithm_acronym=str(run.algorithm),
                    metric_name="accuracy",
                    metric_value=float(run.accuracy),
                    unit="%",
                    provenance=str(run.accuracy_provenance),
                    measurement_method=str(run.accuracy_method),
                ))
                db.add(MetricRecord(
                    experiment_id=exp.id,
                    algorithm_acronym=str(run.algorithm),
                    metric_name="latency",
                    metric_value=float(run.latency_mean_ms),
                    unit="ms",
                    provenance=str(run.latency_provenance),
                    measurement_method=str(run.latency_method),
                ))
                db.add(MetricRecord(
                    experiment_id=exp.id,
                    algorithm_acronym=str(run.algorithm),
                    metric_name="energy",
                    metric_value=float(run.energy_j),
                    unit="J",
                    provenance=str(run.energy_provenance),
                    measurement_method=str(run.energy_method),
                ))
                db.commit()

            # ── Compute statistics and ranking ──────────────────────────────
            stats_by_alg = StatisticsService.aggregate_algorithm_runs(all_saved_runs)
            ranked_algs = ScoringService.recalculate_overall_scores(
                aggregated_stats=stats_by_alg,
                weight_accuracy=exp.weight_accuracy,
                weight_latency=exp.weight_latency,
                weight_model_size=exp.weight_model_size,
                weight_energy=exp.weight_energy,
                stat_mode="MEAN",
            )
            pareto_results = ParetoService.compute_pareto_front(ranked_algs)
            pareto_algorithms = [p["algorithm"] for p in pareto_results if p.get("is_pareto")]

            exp.pareto_optimal_algorithms_json = json.dumps(pareto_algorithms)

            hw_name = exp.hardware.device_name if exp.hardware else result.execution_environment
            winner_info = ScoringService.identify_winners_and_rationale(
                ranked_results=ranked_algs,
                baseline={
                    "accuracy": result.baseline_accuracy,
                    "latency_ms": result.baseline_latency_ms,
                    "model_size_mb": result.baseline_size_mb,
                    "energy_j": result.baseline_energy_j,
                },
                weights={
                    "weight_accuracy": exp.weight_accuracy,
                    "weight_latency": exp.weight_latency,
                    "weight_model_size": exp.weight_model_size,
                    "weight_energy": exp.weight_energy,
                },
                dataset=exp.dataset_name,
                cnn_model=exp.cnn_model_name,
                hardware=hw_name,
            )

            exp.best_algorithm = (
                winner_info["best_overall"]["algorithm"]
                if winner_info.get("best_overall") else
                (ranked_algs[0]["algorithm"] if ranked_algs else None)
            )
            exp.best_algorithm_reason = winner_info.get("rationale", "")

            # ── Ablation records ────────────────────────────────────────────
            best_alg_summary = winner_info["best_overall"] if winner_info.get("best_overall") else (ranked_algs[0] if ranked_algs else {})
            ablation_list = AblationService.generate_ablation_records(
                baseline={
                    "accuracy": result.baseline_accuracy,
                    "latency_ms": result.baseline_latency_ms,
                    "model_size_mb": result.baseline_size_mb,
                    "energy_j": result.baseline_energy_j,
                    "parameters_m": result.baseline_params_m,
                    "flops_m": result.baseline_flops_m,
                },
                quantization_type=exp.quantization_type,
                pruning_method=exp.pruning_method,
                pruning_ratio=exp.pruning_ratio,
                best_optimizer_result=best_alg_summary,
            )
            for ab in ablation_list:
                db.add(AblationRecord(
                    experiment_id=exp.id,
                    stage_name=str(ab["stage_name"]),
                    stage_order=int(ab["stage_order"]),
                    accuracy=float(ab["accuracy"]),
                    latency_ms=float(ab["latency_ms"]),
                    model_size_mb=float(ab["model_size_mb"]),
                    energy_j=float(ab["energy_j"]),
                    parameters_m=float(ab["parameters_m"]),
                    flops_m=float(ab["flops_m"]),
                    description=str(ab.get("description", "")),
                ))

            exp.status = "COMPLETED"
            exp.completed_at = datetime.now(timezone.utc)
            db.commit()

            await broadcast_progress(experiment_id, {
                "event": "BENCHMARK_COMPLETED",
                "experiment_id": experiment_id,
                "execution_mode": execution_mode,
                "best_algorithm": exp.best_algorithm,
                "pareto_algorithms": pareto_algorithms,
                "ranked_results": ranked_algs,
            })

        except ExperimentCancelledError:
            try:
                db.rollback()
                exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
                if exp:
                    exp.status = "CANCELLED"
                    exp.error_message = "Cancelled by user request."
                    exp.completed_at = datetime.now(timezone.utc)
                    db.commit()
            except Exception as dbe:
                print(f"[Runner] Error recording cancellation: {dbe}")
            await broadcast_progress(experiment_id, {
                "event": "BENCHMARK_CANCELLED",
                "experiment_id": experiment_id,
            })

        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            print(f"[Runner] Experiment {experiment_id} FAILED:\n{tb}")
            try:
                db.rollback()
                exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
                if exp:
                    exp.status = "FAILED"
                    exp.error_message = f"{type(e).__name__}: {str(e)}"
                    exp.completed_at = datetime.now(timezone.utc)
                    db.commit()
            except Exception as dbe:
                print(f"[Runner] Error recording failure: {dbe}")
            await broadcast_progress(experiment_id, {
                "event": "BENCHMARK_FAILED",
                "experiment_id": experiment_id,
                "error": str(e),
            })

        finally:
            _cleanup_cancel_event(experiment_id)
            try:
                db.close()
            except Exception:
                pass
