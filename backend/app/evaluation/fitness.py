"""
Multi-Objective Fitness Formulator for Metaheuristic Optimizers.
Maps Accuracy (maximize), Latency (minimize), Model Size (minimize), and Energy (minimize)
into a normalized scalar cost function for minimization.
"""

from typing import Dict, Any
import numpy as np


class MultiObjectiveFitness:
    """Computes normalized multi-objective scalar fitness for optimizers."""

    def __init__(
        self,
        weight_accuracy: float = 0.40,
        weight_latency: float = 0.25,
        weight_model_size: float = 0.20,
        weight_energy: float = 0.15,
        baseline_acc: float = 93.4,
        baseline_lat_ms: float = 12.5,
        baseline_size_mb: float = 44.7,
        baseline_energy_j: float = 0.35,
    ):
        self.w_acc = weight_accuracy
        self.w_lat = weight_latency
        self.w_size = weight_model_size
        self.w_energy = weight_energy
        
        self.b_acc = baseline_acc
        self.b_lat = baseline_lat_ms
        self.b_size = baseline_size_mb
        self.b_energy = baseline_energy_j

    def compute_overall_score_100(
        self,
        accuracy: float,
        latency_ms: float,
        model_size_mb: float,
        energy_j: float,
    ) -> float:
        """
        Calculate weighted overall benchmark score from 0.0 to 100.0 (Higher is Better).
        Normalized against baseline benchmarks.
        """
        # Normalized accuracy score (1.0 = baseline accuracy)
        norm_acc = min(1.2, accuracy / max(1.0, self.b_acc))
        
        # Normalized speedup score (higher is better when latency drops)
        norm_lat = min(4.0, self.b_lat / max(0.1, latency_ms))
        
        # Normalized compression score (higher is better when size drops)
        norm_size = min(10.0, self.b_size / max(0.1, model_size_mb))
        
        # Normalized energy reduction score (higher is better when energy drops)
        norm_energy = min(4.0, self.b_energy / max(0.001, energy_j))

        # Overall composite index scaled to 100
        composite = (
            self.w_acc * norm_acc * 100.0 +
            self.w_lat * (norm_lat / 2.0) * 100.0 +
            self.w_size * (norm_size / 3.0) * 100.0 +
            self.w_energy * (norm_energy / 2.0) * 100.0
        )
        return round(float(composite), 2)

    def calculate_cost_to_minimize(
        self,
        accuracy: float,
        latency_ms: float,
        model_size_mb: float,
        energy_j: float,
    ) -> float:
        """
        Convert multi-objective goal into a scalar cost to minimize for metaheuristics:
        Cost = w_acc * (1.0 - Acc/100) + w_lat * (Lat/BaseLat) + w_size * (Size/BaseSize) + w_energy * (Energy/BaseEnergy)
        """
        acc_loss = (100.0 - accuracy) / 100.0
        lat_ratio = latency_ms / max(0.1, self.b_lat)
        size_ratio = model_size_mb / max(0.1, self.b_size)
        energy_ratio = energy_j / max(0.001, self.b_energy)

        cost = (
            self.w_acc * acc_loss +
            self.w_lat * lat_ratio * 0.5 +
            self.w_size * size_ratio * 0.3 +
            self.w_energy * energy_ratio * 0.4
        )
        return float(cost)
