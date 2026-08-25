"""
Reports and Export API Endpoints.
Supports CSV, JSON, and Markdown formatted research reports.
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import Experiment
from ..services.statistics_service import StatisticsService
from ..services.scoring_service import ScoringService
from ..services.export_service import ExportService

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/{exp_id}/csv")
def export_csv(exp_id: str, db: Session = Depends(get_db)):
    """Export comparison results to CSV format."""
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

    csv_content = ExportService.generate_csv(exp.to_dict(), ranked)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={exp.id}_results.csv"},
    )


@router.get("/{exp_id}/markdown")
def export_markdown(exp_id: str, db: Session = Depends(get_db)):
    """Export comprehensive scientific research report in GitHub-flavored Markdown."""
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

    hw_name = exp.hardware.device_name if exp.hardware else "Host System"
    winner_info = ScoringService.identify_winners_and_rationale(
        ranked_results=ranked,
        baseline={
            "accuracy": exp.baseline_accuracy,
            "latency_ms": exp.baseline_latency_ms,
            "model_size_mb": exp.baseline_size_mb,
            "energy_j": exp.baseline_energy_j,
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

    ablations = [a.to_dict() for a in exp.ablations]
    md_content = ExportService.generate_markdown_report(exp.to_dict(), ranked, winner_info, ablations)
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={exp.id}_report.md"},
    )


@router.get("/{exp_id}/json")
def export_json(exp_id: str, db: Session = Depends(get_db)):
    """Export complete experiment state, runs, stats, and metadata as raw JSON."""
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

    return {
        "experiment": exp.to_dict(),
        "ranked_algorithms": ranked,
        "statistics_by_algorithm": stats,
        "runs": runs,
        "ablations": [a.to_dict() for a in exp.ablations],
    }
