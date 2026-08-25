"""
Pareto API Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import Experiment
from ..services.statistics_service import StatisticsService
from ..services.scoring_service import ScoringService
from ..services.pareto_service import ParetoService

router = APIRouter(prefix="/api/pareto", tags=["Pareto"])


@router.get("/{exp_id}")
def get_pareto_front(
    exp_id: str,
    x_axis: str = Query("latency_ms", description="latency_ms, model_size_mb, energy_j"),
    y_axis: str = Query("accuracy", description="accuracy"),
    only_pareto: bool = Query(False, description="Filter only non-dominated solutions"),
    db: Session = Depends(get_db),
):
    """Retrieve multi-objective Pareto frontier data points."""
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    runs = [r.to_dict() for r in exp.runs]
    stats = StatisticsService.aggregate_algorithm_runs(runs)
    ranked = ScoringService.recalculate_overall_scores(
        aggregated_stats=stats,
        weight_accuracy=exp.weight_accuracy,
        weight_latency=exp.weight_latency,
        weight_model_size=exp.weight_model_size,
        weight_energy=exp.weight_energy,
        stat_mode="MEAN",
    )

    pareto_points = ParetoService.compute_pareto_front(ranked)
    
    if only_pareto:
        pareto_points = [p for p in pareto_points if p.get("is_pareto")]

    pareto_algs = [p["algorithm"] for p in pareto_points if p.get("is_pareto")]
    explanation = ParetoService.get_pareto_explanation(len(pareto_algs), len(ranked), pareto_algs)

    return {
        "x_axis": x_axis,
        "y_axis": y_axis,
        "points": pareto_points,
        "pareto_algorithms": pareto_algs,
        "explanation": explanation,
    }
