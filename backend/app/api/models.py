"""
CNN Model Architectures API Router.
Provides catalog of built-in CNN models and allows registering custom CNN architectures.
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/models", tags=["Models"])

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "custom_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
METADATA_FILE = MODELS_DIR / "models_metadata.json"

BUILTIN_MODELS = [
    {
        "id": "resnet-18",
        "name": "ResNet-18",
        "parameters_m": 11.17,
        "flops_m": 556.0,
        "base_accuracy": 93.4,
        "is_custom": False,
        "description": "18-layer Residual Network standard baseline for computer vision compression.",
    },
    {
        "id": "mobilenet-v2",
        "name": "MobileNetV2",
        "parameters_m": 2.23,
        "flops_m": 314.0,
        "base_accuracy": 91.8,
        "is_custom": False,
        "description": "Inverted residual bottleneck architecture optimized for edge devices.",
    },
    {
        "id": "shufflenet-v2",
        "name": "ShuffleNetV2",
        "parameters_m": 1.36,
        "flops_m": 149.0,
        "base_accuracy": 89.4,
        "is_custom": False,
        "description": "Channel shuffle and split architecture for ultra-high compute efficiency.",
    },
    {
        "id": "simple-cnn",
        "name": "SimpleCNN",
        "parameters_m": 0.85,
        "flops_m": 88.0,
        "base_accuracy": 86.2,
        "is_custom": False,
        "description": "Compact 4-layer convolutional neural network for rapid prototyping.",
    },
    {
        "id": "vgg-16",
        "name": "VGG-16",
        "parameters_m": 14.72,
        "flops_m": 313.0,
        "base_accuracy": 92.6,
        "is_custom": False,
        "description": "Classic 16-layer homogeneous 3x3 convolution deep network.",
    },
    {
        "id": "efficientnet-b0",
        "name": "EfficientNet-B0",
        "parameters_m": 4.02,
        "flops_m": 390.0,
        "base_accuracy": 92.9,
        "is_custom": False,
        "description": "Compound scaling baseline CNN balanced across depth, width, and resolution.",
    },
]


def load_metadata() -> Dict[str, Any]:
    if METADATA_FILE.exists():
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_metadata(data: Dict[str, Any]):
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


class ModelRegisterRequest(BaseModel):
    name: str = Field(..., description="Model name (e.g. CustomConvNet-X)")
    parameters_m: float = Field(..., gt=0.0, description="Number of parameters in millions")
    flops_m: float = Field(..., gt=0.0, description="Theoretical MFLOPs")
    base_accuracy: float = Field(88.0, ge=10.0, le=100.0, description="Baseline FP32 accuracy %")
    description: Optional[str] = Field("User-defined custom CNN model architecture", description="Architecture summary")


@router.get("", response_model=List[Dict[str, Any]])
def list_models():
    """List all built-in and custom registered CNN models."""
    custom_models = list(load_metadata().values())
    return BUILTIN_MODELS + custom_models


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def register_model(req: ModelRegisterRequest):
    """Register a new custom CNN model architecture."""
    model_id = req.name.lower().replace(" ", "-").replace("_", "-")
    metadata = load_metadata()

    entry = {
        "id": f"custom-{model_id}",
        "name": req.name.strip(),
        "parameters_m": round(req.parameters_m, 3),
        "flops_m": round(req.flops_m, 1),
        "base_accuracy": round(req.base_accuracy, 2),
        "is_custom": True,
        "description": req.description,
    }

    metadata[entry["id"]] = entry
    save_metadata(metadata)
    return entry


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model(model_id: str):
    """Delete a custom registered CNN model."""
    metadata = load_metadata()
    if model_id not in metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model '{model_id}' not found or is a built-in CNN.",
        )
    del metadata[model_id]
    save_metadata(metadata)
    return None
