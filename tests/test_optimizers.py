import sys
from pathlib import Path
import pytest
import numpy as np

backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from app.optimizers.registry import OPTIMIZER_REGISTRY, get_optimizer, list_available_algorithms
    from app.optimizers.base import BaseOptimizer, OptimizationResult
except ImportError:
    from backend.app.optimizers.registry import OPTIMIZER_REGISTRY, get_optimizer, list_available_algorithms
    from backend.app.optimizers.base import BaseOptimizer, OptimizationResult


@pytest.mark.parametrize("alg_name", list(OPTIMIZER_REGISTRY.keys()))
def test_optimizer_contract_and_optimization(alg_name: str):
    """Verify that all 10 optimizers correctly minimize the Sphere test function."""
    optimizer = get_optimizer(
        key=alg_name,
        population_size=10,
        max_iterations=15,
        seed=123,
    )
    assert isinstance(optimizer, BaseOptimizer)
    assert optimizer.acronym == alg_name

    # Sphere benchmark function: f(x) = sum(x^2), optimal at x=0, f(x)=0
    def sphere_obj(x: np.ndarray) -> float:
        return float(np.sum(x ** 2))

    dim = 3
    lb = np.full(dim, -5.0)
    ub = np.full(dim, 5.0)

    result = optimizer.optimize(
        objective_fn=sphere_obj,
        dimension=dim,
        lower_bounds=lb,
        upper_bounds=ub,
    )

    assert isinstance(result, OptimizationResult)
    assert len(result.convergence_curve) == 16  # initial + 15 iterations
    assert result.best_fitness <= result.convergence_curve[0]  # Non-increasing best fitness
    assert result.all_candidate_evaluations > 0
    assert result.optimization_time_seconds >= 0.0

    # Bounds constraint enforcement check
    best_sol = np.array(result.best_solution)
    assert np.all(best_sol >= lb)
    assert np.all(best_sol <= ub)


def test_optimizer_metadata_catalog():
    """Verify that all 10 algorithms are documented with required metadata fields."""
    algs = list_available_algorithms()
    assert len(algs) == 10
    keys = {a["key"] for a in algs}
    expected_keys = {"GWO", "WOA", "ALO", "MFO", "GOA", "MVO", "SCA", "AOA", "MGO", "GMO"}
    assert keys == expected_keys
    for a in algs:
        assert a["status"] == "VERIFIED"
        assert "authors" in a
        assert "description" in a
