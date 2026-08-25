"""
Multi-Run Statistical Analysis Service.
Computes Mean, Median, Standard Deviation, Min, Max, and 95% Confidence Intervals
across stochastic metaheuristic experiment runs.
"""

from typing import List, Dict, Any
import numpy as np


class StatisticsService:
    """Calculates statistical aggregations and boxplot distributions."""

    @staticmethod
    def calculate_metric_summary(values: List[float]) -> Dict[str, float]:
        """Calculate statistical distribution metrics for a list of floats."""
        if not values:
            return {
                "mean": 0.0,
                "std": 0.0,
                "median": 0.0,
                "min_val": 0.0,
                "max_val": 0.0,
                "ci_95_lower": 0.0,
                "ci_95_upper": 0.0,
            }

        arr = np.array(values, dtype=np.float64)
        mean_val = float(np.mean(arr))
        std_val = float(np.std(arr))
        median_val = float(np.median(arr))
        min_v = float(np.min(arr))
        max_v = float(np.max(arr))
        
        # 95% confidence interval using standard error (1.96 * SE)
        se = std_val / max(1.0, np.sqrt(len(arr)))
        ci_lower = mean_val - 1.96 * se
        ci_upper = mean_val + 1.96 * se

        return {
            "mean": round(mean_val, 3),
            "std": round(std_val, 3),
            "median": round(median_val, 3),
            "min_val": round(min_v, 3),
            "max_val": round(max_v, 3),
            "ci_95_lower": round(ci_lower, 3),
            "ci_95_upper": round(ci_upper, 3),
        }

    @classmethod
    def aggregate_algorithm_runs(
        cls,
        runs: List[Dict[str, Any]],
    ) -> Dict[str, Dict[str, Any]]:
        """
        Group individual runs by algorithm acronym and compute multi-run statistics.
        """
        grouped: Dict[str, List[Dict[str, Any]]] = {}
        for r in runs:
            alg = r["algorithm"]
            if alg not in grouped:
                grouped[alg] = []
            grouped[alg].append(r)

        summaries = {}
        for alg, alg_runs in grouped.items():
            acc_list = [r["accuracy"] for r in alg_runs]
            lat_list = [r["latency_ms"] for r in alg_runs]
            size_list = [r["model_size_mb"] for r in alg_runs]
            energy_list = [r["energy_j"] for r in alg_runs]
            score_list = [r["overall_score"] for r in alg_runs]

            summaries[alg] = {
                "algorithm": alg,
                "runs_count": len(alg_runs),
                "accuracy": cls.calculate_metric_summary(acc_list),
                "latency_ms": cls.calculate_metric_summary(lat_list),
                "model_size_mb": cls.calculate_metric_summary(size_list),
                "energy_j": cls.calculate_metric_summary(energy_list),
                "overall_score": cls.calculate_metric_summary(score_list),
                "raw_runs": alg_runs,
            }

        return summaries
