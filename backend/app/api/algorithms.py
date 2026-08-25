"""
Algorithms API Endpoints.
"""

from fastapi import APIRouter
from typing import List, Dict, Any
from ..optimizers.registry import list_available_algorithms

router = APIRouter(prefix="/api/algorithms", tags=["Algorithms"])


@router.get("", response_model=List[Dict[str, Any]])
def get_all_algorithms():
    """Retrieve all 10 metaheuristic algorithms with mathematical definitions and literature citations."""
    return list_available_algorithms()
