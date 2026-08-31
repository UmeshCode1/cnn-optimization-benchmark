"""
Experiments API Endpoints.
Handles benchmark creation, listing, cloning, re-running, weight adjustments, and status polling.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session

from ..database.session import get_db
from ..database.models import Experiment, ExperimentRun, MetricRecord, AblationRecord, HardwareProfile
from ..schemas.experiment import (
    ExperimentCreateRequest,
    WeightUpdateRequest,
    FairnessValidationResult,
    CompareSelectedRequest,
)
from ..services.fairness_service import FairnessService
from ..services.statistics_service import StatisticsService
from ..services.scoring_service import ScoringService
from ..services.pareto_service import ParetoService
from ..services.capability_service import CapabilityService
from ..evaluation.dataset_registry import get_dataset_definition
from ..evaluation.confusion_matrix import ConfusionMatrixEvaluator
from ..workers.runner import ExperimentRunner, request_cancellation
from ..engines import get_engine, get_default_mode
from ..engines.base import EngineValidationError

router = APIRouter(prefix="/api/experiments", tags=["Experiments"])


@router.post("/validate-fairness", response_model=FairnessValidationResult)
def validate_experiment_fairness(request: ExperimentCreateRequest):
    """Verify that all selected algorithms will run under identical experimental conditions."""
    return FairnessService.validate_fairness(request.model_dump())


@router.post("", response_model=Dict[str, Any])
def create_experiment(
    request: ExperimentCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    auto_run: bool = Query(True, description="Immediately queue and execute benchmark"),
):
    """Create a new CNN Optimization Benchmark."""
    # Generate collision-safe human-readable ID.
    # Format: EXP-YYYYMMDD-XXXX where XXXX is a short UUID fragment.
    # This preserves readability while guaranteeing uniqueness under concurrency.
    today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    short_uid = uuid.uuid4().hex[:6].upper()
    exp_id = f"EXP-{today_str}-{short_uid}"

    hw = db.query(HardwareProfile).first()

    # ── Input validation ────────────────────────────────────────────────────
    errors = []
    weight_sum = request.weight_accuracy + request.weight_latency + request.weight_model_size + request.weight_energy
    if abs(weight_sum - 1.0) > 0.01:
        errors.append(f"Objective weights must sum to 1.0 (got {weight_sum:.3f})")
    if not (0.0 <= request.pruning_ratio <= 0.95):
        errors.append(f"pruning_ratio must be in [0.0, 0.95] (got {request.pruning_ratio})")
    if request.population_size < 1:
        errors.append("population_size must be >= 1")
    if request.max_iterations < 1:
        errors.append("max_iterations must be >= 1")
    if request.number_of_runs < 1:
        errors.append("number_of_runs must be >= 1")
    if not request.selected_algorithms:
        errors.append("At least one algorithm must be selected")
    if errors:
        raise HTTPException(status_code=422, detail={"errors": errors})

    # ── Execution mode ──────────────────────────────────────────────────────
    requested_mode = getattr(request, "execution_mode", None) or get_default_mode()

    caps_check = CapabilityService.validate_for_real_experiment(
        model_name=request.cnn_model_name,
        dataset_name=request.dataset_name,
        quantization_type=request.quantization_type,
        pruning_method=request.pruning_method,
    )

    if requested_mode == "AUTO":
        effective_mode = "REAL" if caps_check["ok"] else "DEMO"
    elif requested_mode == "REAL":
        if caps_check["ok"]:
            effective_mode = "REAL"
        else:
            # If user explicitly requested REAL but environment lacks PyTorch, fallback to calibrated DEMO mode
            effective_mode = "DEMO"
    else:
        effective_mode = "DEMO"

    exp = Experiment(
        id=exp_id,
        title=request.title,
        description=request.description or "",
        status="QUEUED" if auto_run else "DRAFT",
        is_demo=(effective_mode == "DEMO"),
        execution_mode=effective_mode,
        preset=request.preset,
        dataset_name=request.dataset_name,
        dataset_split=request.dataset_split,
        input_resolution=request.input_resolution,
        batch_size=request.batch_size,
        cnn_model_name=request.cnn_model_name,
        checkpoint_name=request.checkpoint_name,
        quantization_type=request.quantization_type,
        pruning_method=request.pruning_method,
        pruning_ratio=request.pruning_ratio,
        selected_algorithms_json=json.dumps(request.selected_algorithms),
        population_size=request.population_size,
        max_iterations=request.max_iterations,
        number_of_runs=request.number_of_runs,
        random_seed_policy=request.random_seed_policy,
        base_seed=request.base_seed,
        warmup_runs=request.warmup_runs,
        measured_runs=request.measured_runs,
        weight_accuracy=request.weight_accuracy,
        weight_latency=request.weight_latency,
        weight_model_size=request.weight_model_size,
        weight_energy=request.weight_energy,
        hardware_id=hw.id if hw else None,
    )

    db.add(exp)
    db.commit()
    db.refresh(exp)

    if auto_run:
        background_tasks.add_task(ExperimentRunner.run_experiment_task, exp.id)

    return exp.to_dict()


@router.get("", response_model=List[Dict[str, Any]])
def list_experiments(
    dataset: Optional[str] = None,
    model: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List historical benchmarks with optional filtering."""
    query = db.query(Experiment).order_by(Experiment.created_at.desc())
    if dataset:
        query = query.filter(Experiment.dataset_name == dataset)
    if model:
        query = query.filter(Experiment.cnn_model_name == model)
    if status:
        query = query.filter(Experiment.status == status)

    experiments = query.limit(limit).all()
    return [e.to_dict() for e in experiments]


@router.get("/{exp_id}", response_model=Dict[str, Any])
def get_experiment_details(exp_id: str, db: Session = Depends(get_db)):
    """Retrieve complete metadata and runs for an experiment."""
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    runs = [r.to_dict() for r in exp.runs]
    stats_by_alg = StatisticsService.aggregate_algorithm_runs(runs)
    ranked = ScoringService.recalculate_overall_scores(
        aggregated_stats=stats_by_alg,
        weight_accuracy=exp.weight_accuracy,
        weight_latency=exp.weight_latency,
        weight_model_size=exp.weight_model_size,
        weight_energy=exp.weight_energy,
        stat_mode="MEAN",
    )

    pareto_points = ParetoService.compute_pareto_front(ranked)
    pareto_set = {p["algorithm"] for p in pareto_points if p.get("is_pareto", False)}
    for r in ranked:
        r["is_pareto"] = r["algorithm"] in pareto_set
        r["is_pareto_optimal"] = r["is_pareto"]

    return {
        "experiment": exp.to_dict(),
        "runs": runs,
        "statistics_by_algorithm": stats_by_alg,
        "ranked_algorithms": ranked,
        "pareto_points": pareto_points,
        "ablations": [a.to_dict() for a in exp.ablations],
    }


@router.post("/{exp_id}/run")
def run_experiment(
    exp_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Trigger execution of an existing draft or re-run."""
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # DO NOT delete historical run data when re-running.
    # Historical data is preserved for reproducibility research.
    # A re-run creates new ExperimentRun records alongside the originals.
    # To start fresh, clone the experiment instead.
    exp.status = "QUEUED"
    exp.error_message = None
    db.commit()

    background_tasks.add_task(ExperimentRunner.run_experiment_task, exp.id)
    return {"status": "QUEUED", "experiment_id": exp.id}


@router.post("/{exp_id}/clone", response_model=Dict[str, Any])
def clone_experiment(exp_id: str, db: Session = Depends(get_db)):
    """Clone an existing experiment configuration for reproduction or modification."""
    original = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Experiment not found")

    today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    short_uid = uuid.uuid4().hex[:6].upper()
    new_id = f"EXP-{today_str}-{short_uid}"

    cloned = Experiment(
        id=new_id,
        title=f"Clone of {original.title}",
        description=f"Cloned from {original.id}. {original.description}",
        status="DRAFT",
        is_demo=original.is_demo,
        preset=original.preset,
        dataset_name=original.dataset_name,
        dataset_split=original.dataset_split,
        input_resolution=original.input_resolution,
        batch_size=original.batch_size,
        cnn_model_name=original.cnn_model_name,
        checkpoint_name=original.checkpoint_name,
        quantization_type=original.quantization_type,
        pruning_method=original.pruning_method,
        pruning_ratio=original.pruning_ratio,
        selected_algorithms_json=original.selected_algorithms_json,
        population_size=original.population_size,
        max_iterations=original.max_iterations,
        number_of_runs=original.number_of_runs,
        random_seed_policy=original.random_seed_policy,
        base_seed=original.base_seed,
        warmup_runs=original.warmup_runs,
        measured_runs=original.measured_runs,
        weight_accuracy=original.weight_accuracy,
        weight_latency=original.weight_latency,
        weight_model_size=original.weight_model_size,
        weight_energy=original.weight_energy,
        hardware_id=original.hardware_id,
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return cloned.to_dict()


@router.post("/{exp_id}/cancel")
def cancel_experiment_endpoint(exp_id: str, db: Session = Depends(get_db)):
    """Cancel execution of a running experiment."""
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    was_active = request_cancellation(exp_id)
    exp.status = "CANCELLED"
    exp.error_message = "Benchmark cancelled by user."
    exp.completed_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "CANCELLED",
        "experiment_id": exp_id,
        "worker_signalled": was_active,
        "message": f"Experiment {exp_id} cancelled successfully",
    }


@router.delete("/{exp_id}")
def delete_experiment(exp_id: str, db: Session = Depends(get_db)):
    """Delete an experiment and all associated runs, metrics, and ablation records."""
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    request_cancellation(exp_id)
    db.delete(exp)
    db.commit()
    return {"status": "DELETED", "experiment_id": exp_id}


@router.post("/{exp_id}/recalculate-weights")
def recalculate_weights(
    exp_id: str,
    weights: WeightUpdateRequest,
    stat_mode: str = Query("MEAN", description="MEAN, MEDIAN, BEST"),
    db: Session = Depends(get_db),
):
    """Interactively recalculate overall weighted scores and winner rationale on the fly."""
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Update weights in experiment
    exp.weight_accuracy = weights.weight_accuracy
    exp.weight_latency = weights.weight_latency
    exp.weight_model_size = weights.weight_model_size
    exp.weight_energy = weights.weight_energy
    db.commit()

    runs = [r.to_dict() for r in exp.runs]
    stats_by_alg = StatisticsService.aggregate_algorithm_runs(runs)
    ranked = ScoringService.recalculate_overall_scores(
        aggregated_stats=stats_by_alg,
        weight_accuracy=weights.weight_accuracy,
        weight_latency=weights.weight_latency,
        weight_model_size=weights.weight_model_size,
        weight_energy=weights.weight_energy,
        stat_mode=stat_mode,
    )

    hw_name = exp.hardware.device_name if exp.hardware else "Host System"
    winner_info = ScoringService.identify_winners_and_rationale(
        ranked_results=ranked,
        baseline={
            "accuracy": exp.baseline_accuracy,
            "latency_ms": exp.baseline_latency_ms,
            "model_size_mb": exp.baseline_size_mb,
            "energy_j": exp.baseline_energy_j,
        },
        weights=weights.model_dump(),
        dataset=exp.dataset_name,
        cnn_model=exp.cnn_model_name,
        hardware=hw_name,
    )

    return {
        "ranked_algorithms": ranked,
        "winner_info": winner_info,
    }


@router.post("/{exp_id}/compare-selected")
def compare_selected(
    exp_id: str,
    request: CompareSelectedRequest,
    db: Session = Depends(get_db),
):
    """Focused comparison view containing only selected subset of algorithms."""
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    selected_set = set([a.upper() for a in request.algorithm_acronyms])
    filtered_runs = [r.to_dict() for r in exp.runs if r.algorithm_acronym.upper() in selected_set]
    
    stats_by_alg = StatisticsService.aggregate_algorithm_runs(filtered_runs)
    ranked = ScoringService.recalculate_overall_scores(
        aggregated_stats=stats_by_alg,
        weight_accuracy=exp.weight_accuracy,
        weight_latency=exp.weight_latency,
        weight_model_size=exp.weight_model_size,
        weight_energy=exp.weight_energy,
        stat_mode=request.stat_mode,
    )

    pareto_points = ParetoService.compute_pareto_front(ranked)

    return {
        "ranked_algorithms": ranked,
        "statistics_by_algorithm": stats_by_alg,
        "pareto_points": pareto_points,
        "runs": filtered_runs,
    }


@router.get("/{exp_id}/confusion-matrix")
def get_experiment_confusion_matrix(
    exp_id: str,
    algorithm: Optional[str] = Query(None, description="Algorithm acronym to inspect"),
    compare_algorithm: Optional[str] = Query(None, description="Optional algorithm acronym for Algorithm A vs B differential"),
    run_index: Optional[int] = Query(None, description="Specific run index (defaults to best run)"),
    normalized: bool = Query(True, description="Whether matrices are row-normalized (%)"),
    comparison: str = Query("BASELINE", description="Comparison mode: BASELINE, ALGORITHM, NONE"),
    db: Session = Depends(get_db),
):
    """
    Retrieve research-grade confusion matrix, per-class metrics, degradation analysis,
    top confused pairs, and differential delta matrices for an experiment run.
    Supports both REAL (actual inference) and SIMULATION (calibrated synthetic) modes.
    """
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    if not exp.runs:
        raise HTTPException(
            status_code=422,
            detail="No completed runs found for this experiment. Please run the benchmark first.",
        )

    # Determine primary algorithm
    target_alg = algorithm
    if not target_alg:
        target_alg = exp.best_algorithm or exp.runs[0].algorithm_acronym

    # Filter runs matching target algorithm
    alg_runs = [r for r in exp.runs if r.algorithm_acronym.upper() == target_alg.upper()]
    if not alg_runs:
        raise HTTPException(
            status_code=404,
            detail=f"Algorithm '{target_alg}' not found in experiment runs. Available: {list(set(r.algorithm_acronym for r in exp.runs))}",
        )

    # Select specific run or best run by overall score / accuracy
    selected_run = None
    if run_index is not None:
        matched = [r for r in alg_runs if r.run_index == run_index]
        if not matched:
            raise HTTPException(
                status_code=404,
                detail=f"Run index #{run_index} not found for algorithm '{target_alg}'. Available runs: {[r.run_index for r in alg_runs]}",
            )
        selected_run = matched[0]
    else:
        # Default to highest accuracy run
        selected_run = max(alg_runs, key=lambda r: r.accuracy)

    dataset_def = get_dataset_definition(exp.dataset_name)

    # Check execution mode and compute matrix
    execution_mode = exp.execution_mode or "DEMO"
    
    # Execution mode evaluation
    # Real mode requires actual prediction arrays. If not serialized, generate calibrated simulation with explicit SIMULATED_MODEL tag.
    raw_preds = getattr(selected_run, "raw_predictions", None)
    raw_targets = getattr(selected_run, "raw_targets", None)

    if execution_mode == "REAL" and raw_preds is not None and raw_targets is not None:
        eval_result = ConfusionMatrixEvaluator.calculate_from_predictions(
            y_true=raw_targets,
            y_pred=raw_preds,
            dataset_def=dataset_def,
            algorithm_name=selected_run.algorithm_acronym,
            run_index=selected_run.run_index,
            cnn_model_name=exp.cnn_model_name,
            extra_metadata={
                "experiment_id": exp.id,
                "execution_mode": "REAL",
                "accuracy_provenance": "ACTUAL_PREDICTIONS",
                "synthetic": False,
            },
        )
    else:
        eval_result = ConfusionMatrixEvaluator.calculate_from_simulation(
            dataset_def=dataset_def,
            accuracy_pct=selected_run.accuracy,
            baseline_accuracy_pct=exp.baseline_accuracy,
            seed=selected_run.seed,
            pruning_ratio=exp.pruning_ratio,
            quantization_type=exp.quantization_type,
            algorithm_name=selected_run.algorithm_acronym,
            run_index=selected_run.run_index,
            cnn_model_name=exp.cnn_model_name,
            extra_metadata={
                "experiment_id": exp.id,
                "execution_mode": "SIMULATION" if execution_mode == "DEMO" else "REAL_SIMULATED_FALLBACK",
                "accuracy_provenance": "SIMULATED_MODEL",
                "synthetic": True,
                "notes": (
                    "DEMO DATA — Statistically synthesized via analytical degradation & semantic affinity model."
                    if execution_mode == "DEMO"
                    else "REAL execution mode without raw sample array serialization. Calibrated simulation rendered."
                ),
            },
        )

    # Optional Algorithm A vs Algorithm B comparison
    algorithm_comparison = None
    if compare_algorithm and comparison.upper() == "ALGORITHM":
        comp_runs = [r for r in exp.runs if r.algorithm_acronym.upper() == compare_algorithm.upper()]
        if not comp_runs:
            raise HTTPException(
                status_code=404,
                detail=f"Comparison algorithm '{compare_algorithm}' not found in experiment runs.",
            )
        comp_run = max(comp_runs, key=lambda r: r.accuracy)
        comp_eval = ConfusionMatrixEvaluator.calculate_from_simulation(
            dataset_def=dataset_def,
            accuracy_pct=comp_run.accuracy,
            baseline_accuracy_pct=exp.baseline_accuracy,
            seed=comp_run.seed,
            pruning_ratio=exp.pruning_ratio,
            quantization_type=exp.quantization_type,
            algorithm_name=comp_run.algorithm_acronym,
            run_index=comp_run.run_index,
            cnn_model_name=exp.cnn_model_name,
        )
        algorithm_comparison = ConfusionMatrixEvaluator.calculate_algorithm_differential(
            eval_a=eval_result,
            eval_b=comp_eval,
        )

    # Extract all available algorithms and runs for UI controls
    available_algorithms = sorted(list(set(r.algorithm_acronym for r in exp.runs)))
    algorithm_runs_map = {
        alg: [r.run_index for r in exp.runs if r.algorithm_acronym == alg]
        for alg in available_algorithms
    }

    return {
        "experiment_id": exp.id,
        "experiment_title": exp.title,
        "dataset_name": exp.dataset_name,
        "cnn_model_name": exp.cnn_model_name,
        "selected_algorithm": target_alg,
        "selected_run_index": selected_run.run_index,
        "available_algorithms": available_algorithms,
        "algorithm_runs_map": algorithm_runs_map,
        "evaluation": eval_result,
        "algorithm_comparison": algorithm_comparison,
        "comparison_mode": comparison.upper(),
        "baseline_accuracy": exp.baseline_accuracy,
        "model_accuracy": selected_run.accuracy,
        "accuracy_drop": selected_run.accuracy_drop,
    }


@router.post("/{exp_id}/cancel")
def cancel_experiment(
    exp_id: str,
    db: Session = Depends(get_db),
):
    """
    Cancel a running experiment.
    Signals the worker's cancellation event and updates DB status.
    If no worker is running (e.g., already completed), returns appropriate message.
    """
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    if exp.status not in ("RUNNING", "QUEUED"):
        return {
            "status": exp.status,
            "message": f"Experiment is not running (current status: {exp.status}). No action taken.",
        }

    # Signal the worker thread to stop
    worker_signalled = request_cancellation(exp_id)

    # Update DB immediately (worker will also update, but this ensures
    # the UI sees CANCELLED even if WebSocket is disconnected)
    exp.status = "CANCELLED"
    exp.error_message = "Cancelled by user request via API."
    db.commit()

    return {
        "status": "CANCELLED",
        "experiment_id": exp_id,
        "worker_signalled": worker_signalled,
        "message": (
            "Cancellation signal sent to worker. Results collected so far have been preserved."
            if worker_signalled
            else "No active worker found. Status set to CANCELLED in database."
        ),
    }


@router.get("/capabilities")
def get_execution_capabilities():
    """
    Return what this deployment can actually do.
    Frontend uses this to show/hide Real Mode option.
    """
    caps = CapabilityService.detect()
    return {
        "default_mode": get_default_mode(),
        "demo_mode_available": True,  # always
        "real_mode_available": caps.real_mode_feasible,
        "real_mode_reason": caps.real_mode_reason,
        "capabilities": caps.to_dict(),
        "deployment_note": (
            "This is a Render Free Tier deployment. Real Mode requires PyTorch, "
            "a dataset directory, and sufficient RAM. "
            "Run locally for GPU/CUDA-accelerated real benchmarks."
            if not caps.pytorch_available else
            f"PyTorch {caps.pytorch_version} detected. "
            f"{'GPU available: ' + caps.gpu_model if caps.cuda_available else 'CPU-only inference available.'}"
        ),
    }
