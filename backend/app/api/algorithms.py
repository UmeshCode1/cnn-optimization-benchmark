"""
Algorithms API Endpoints - Catalog, Custom Algorithm Registration and Uploads.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from ..optimizers.registry import (
    list_available_algorithms,
    register_custom_algorithm,
    delete_custom_algorithm,
)

router = APIRouter(prefix="/api/algorithms", tags=["Algorithms"])


class AlgorithmRegisterRequest(BaseModel):
    key: str = Field(..., description="Short acronym (e.g. PSO, ABC, CSA)")
    name: str = Field(..., description="Full descriptive name")
    category: str = Field("Swarm Intelligence", description="Category (Swarm, Evolutionary, Physics, Math)")
    description: str = Field("Custom metaheuristic algorithm for CNN compression", description="Summary")
    authors: str = Field("Custom Researcher", description="Author attribution")
    year: int = Field(2026, description="Year introduced")
    strengths: List[str] = Field(default_factory=lambda: ["Custom heuristic search", "Adaptive balance"])
    exploration_rate: float = Field(0.5, ge=0.0, le=1.0, description="Exploration ratio between 0.0 and 1.0")
    python_code: Optional[str] = Field(None, description="Optional custom Python code")


@router.get("", response_model=List[Dict[str, Any]])
def get_all_algorithms():
    """Retrieve all built-in and custom registered metaheuristic algorithms."""
    return list_available_algorithms()


@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def register_algorithm(req: AlgorithmRegisterRequest):
    """Register a custom metaheuristic algorithm into the benchmark platform."""
    try:
        entry = register_custom_algorithm(
            key=req.key,
            name=req.name,
            category=req.category,
            description=req.description,
            authors=req.authors,
            year=req.year,
            strengths=req.strengths,
            python_code=req.python_code,
            exploration_rate=req.exploration_rate,
        )
        return entry
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/upload", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def upload_algorithm_file(
    file: UploadFile = File(...),
    key: str = Form(...),
    name: str = Form(...),
    category: str = Form("Custom Optimization"),
    description: Optional[str] = Form(None),
    exploration_rate: float = Form(0.5),
):
    """Upload a custom Python algorithm module file (.py)."""
    if not (file.filename or "").endswith(".py"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded algorithm must be a Python source file (.py)",
        )

    content_bytes = await file.read()
    code_str = content_bytes.decode("utf-8", errors="ignore")

    entry = register_custom_algorithm(
        key=key,
        name=name,
        category=category,
        description=description or f"Custom algorithm loaded from {file.filename}",
        python_code=code_str,
        exploration_rate=exploration_rate,
    )
    return entry


@router.delete("/{key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_algorithm(key: str):
    """Delete a custom registered algorithm."""
    success = delete_custom_algorithm(key)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Algorithm '{key}' not found or is a built-in optimizer.",
        )
    return None
