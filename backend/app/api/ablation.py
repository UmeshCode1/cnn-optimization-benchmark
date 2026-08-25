"""
Ablation Study API Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import Experiment

router = APIRouter(prefix="/api/ablation", tags=["Ablation"])


@router.get("/{exp_id}")
def get_ablation_study(exp_id: str, db: Session = Depends(get_db)):
    """Retrieve the 5-stage ablation decomposition for an experiment."""
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    ablations = [a.to_dict() for a in exp.ablations]
    return {
        "experiment_id": exp.id,
        "stages": ablations,
    }
