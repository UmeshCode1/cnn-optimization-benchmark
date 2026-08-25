"""
Experiments API Endpoints.
Handles benchmark creation, listing, cloning, re-running, weight adjustments, and status polling.
"""

import json
import uuid
from datetime import datetime
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
from ..workers.runner import ExperimentRunner

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
    exp_count = db.query(Experiment).count() + 1
    today_str = datetime.utcnow().strftime("%Y%m%d")
    exp_id = f"EXP-{today_str}-{exp_count:04d}"

    hw = db.query(HardwareProfile).first()

    exp = Experiment(
        id=exp_id,
        title=request.title,
        description=request.description or "",
        status="QUEUED" if auto_run else "DRAFT",
        is_demo=request.is_demo,
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

    # Clear prior runs if re-running
    db.query(ExperimentRun).filter(ExperimentRun.experiment_id == exp_id).delete()
    db.query(MetricRecord).filter(MetricRecord.experiment_id == exp_id).delete()
    db.query(AblationRecord).filter(AblationRecord.experiment_id == exp_id).delete()
    
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

    exp_count = db.query(Experiment).count() + 1
    today_str = datetime.utcnow().strftime("%Y%m%d")
    new_id = f"EXP-{today_str}-{exp_count:04d}"

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
