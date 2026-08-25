"""
Pareto Optimality and Non-Dominated Sorting Service.
Identifies Pareto-optimal solutions across multi-dimensional trade-offs:
- Accuracy: Higher is better (maximize)
- Latency: Lower is better (minimize)
- Model Size: Lower is better (minimize)
- Energy: Lower is better (minimize)
"""

from typing import List, Dict, Any
import numpy as np


class ParetoService:
    """Computes Pareto frontier and non-dominated sorting."""

    @staticmethod
    def is_dominated(
        candidate: Dict[str, float],
        other: Dict[str, float],
    ) -> bool:
        """
        Returns True if 'candidate' is dominated by 'other'.
        'other' dominates 'candidate' if:
        1. 'other' is at least as good as 'candidate' in all 4 objectives.
        2. 'other' is strictly better in at least one objective.
        """
        # Accuracy (higher is better)
        acc_ge = other["accuracy"] >= candidate["accuracy"]
        acc_gt = other["accuracy"] > candidate["accuracy"]

        # Latency (lower is better)
        lat_le = other["latency_ms"] <= candidate["latency_ms"]
        lat_lt = other["latency_ms"] < candidate["latency_ms"]

        # Model Size (lower is better)
        size_le = other["model_size_mb"] <= candidate["model_size_mb"]
        size_lt = other["model_size_mb"] < candidate["model_size_mb"]

        # Energy (lower is better)
        energy_le = other["energy_j"] <= candidate["energy_j"]
        energy_lt = other["energy_j"] < candidate["energy_j"]

        all_at_least_as_good = acc_ge and lat_le and size_le and energy_le
        at_least_one_strictly_better = acc_gt or lat_lt or size_lt or energy_lt

        return all_at_least_as_good and at_least_one_strictly_better

    @classmethod
    def compute_pareto_front(
        cls,
        solutions: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Mark each solution with 'is_pareto: bool' and compute Pareto frontier.
        """
        n = len(solutions)
        if n == 0:
            return []

        results = [dict(s) for s in solutions]

        for i in range(n):
            dominated = False
            for j in range(n):
                if i != j:
                    if cls.is_dominated(results[i], results[j]):
                        dominated = True
                        break
            results[i]["is_pareto"] = not dominated

        return results

    @classmethod
    def get_pareto_explanation(cls, pareto_count: int, total_count: int, pareto_algorithms: List[str]) -> str:
        """Generate scientific explanation of Pareto dominance."""
        return (
            f"{pareto_count} of {total_count} evaluated solutions ({', '.join(pareto_algorithms)}) lie on the "
            f"empirical Pareto frontier. These solutions represent non-dominated trade-offs where no metric "
            f"(Accuracy, Latency, Size, or Energy) can be improved without sacrificing at least one other objective."
        )
