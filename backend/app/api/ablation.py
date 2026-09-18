"""
Ablation Study API Endpoints.
"""

import json
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


@router.get("/{exp_id}/layer-wise")
def get_layer_wise_optimization(exp_id: str, db: Session = Depends(get_db)):
    """
    Retrieve Section A: Layer-Wise Optimization Result Table matching research paper:
    Layer, Sensitivity, Pruning Ratio, Precision, Validation Accuracy Impact.
    """
    from ..services.device_hardware_service import DeviceHardwareService
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    opt_name = exp.best_algorithm or (json.loads(exp.selected_algorithms_json)[0] if exp.selected_algorithms_json else "SCA")
    layers = DeviceHardwareService.generate_layer_wise_optimization_table(
        model_name=exp.cnn_model_name,
        baseline_accuracy=exp.baseline_accuracy or 93.4,
        optimizer_name=opt_name,
        global_pruning_ratio=exp.pruning_ratio or 0.40,
        default_precision=exp.quantization_type or "INT8",
    )

    return {
        "experiment_id": exp.id,
        "model_name": exp.cnn_model_name,
        "dataset_name": exp.dataset_name,
        "optimizer_name": opt_name,
        "layers": layers,
    }


@router.get("/{exp_id}/research-answers")
def get_research_ablation_answers(exp_id: str, db: Session = Depends(get_db)):
    """
    Retrieve Section B: Quantitative and empirical answers to the four research paper ablation questions:
    Q1: Does quantization reduce model size and latency?
    Q2: Does structured pruning reduce parameters and computation?
    Q3: Does layer sensitivity improve accuracy-efficiency trade-off compared with fixed compression?
    Q4: Does SCA find a better feasible configuration than manually selected compression?
    """
    from ..services.device_hardware_service import DeviceHardwareService
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    opt_name = exp.best_algorithm or (json.loads(exp.selected_algorithms_json)[0] if exp.selected_algorithms_json else "SCA")

    return DeviceHardwareService.generate_research_ablation_answers(
        model_name=exp.cnn_model_name,
        dataset_name=exp.dataset_name,
        baseline_acc=exp.baseline_accuracy or 93.4,
        baseline_latency_ms=exp.baseline_latency_ms or 14.2,
        baseline_size_mb=exp.baseline_size_mb or 44.7,
        baseline_flops_m=exp.baseline_flops_m or 556.0,
        baseline_params_m=exp.baseline_params_m or 11.17,
        optimizer_name=opt_name,
    )

