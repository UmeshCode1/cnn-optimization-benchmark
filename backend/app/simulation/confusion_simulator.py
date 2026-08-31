"""
Simulated Confusion Matrix Generator.

SCIENTIFIC VALIDITY GUARANTEE:
- Generates calibrated synthetic confusion matrices when running in DEMO/Simulation mode.
- ALWAYS labeled with provenance="SIMULATED_MODEL", synthetic=True, mode="SIMULATION".
- Generates mathematically sound distributions that match the exact reported accuracy.
"""

from typing import Dict, Any, Optional
import numpy as np

from ..evaluation.dataset_registry import DatasetDefinition
from .semantic_affinity import build_affinity_matrix


class SimulatedConfusionEngine:
    """
    Generates deterministic, mathematically consistent synthetic confusion matrices
    calibrated against dataset semantic affinities and compression degradation.
    """

    @classmethod
    def generate_matrix(
        cls,
        dataset_def: DatasetDefinition,
        accuracy_pct: float,
        baseline_accuracy_pct: Optional[float] = None,
        total_samples: Optional[int] = None,
        seed: int = 42,
        pruning_ratio: float = 0.0,
        quantization_type: str = "INT8",
        algorithm_name: str = "UNKNOWN",
    ) -> Dict[str, Any]:
        """
        Generate a synthetic confusion matrix matching the requested accuracy.
        """
        K = dataset_def.num_classes
        N = total_samples if (total_samples and total_samples > 0) else dataset_def.default_test_samples

        # Deterministic RNG derived from seed and algorithm hash
        rng = np.random.default_rng(seed + abs(hash(algorithm_name)) % 100000)

        # Baseline accuracy fallback
        base_acc = baseline_accuracy_pct if baseline_accuracy_pct is not None else max(accuracy_pct, 90.0)

        # Class distribution (balanced test split by default)
        samples_per_class = N // K
        remainder = N % K
        class_supports = np.full(K, samples_per_class, dtype=np.int64)
        for i in range(remainder):
            class_supports[i] += 1

        # Calculate exact target number of correct predictions across all classes
        target_accuracy_ratio = np.clip(accuracy_pct / 100.0, 0.0, 1.0)
        total_target_correct = int(np.round(target_accuracy_ratio * N))

        # Base per-class accuracy variation:
        # Certain classes naturally have lower baseline accuracy and higher vulnerability to compression
        affinity_matrix = build_affinity_matrix(dataset_def)

        # Class difficulty vector (e.g. index 3 & 5 in CIFAR-10 have higher difficulty)
        off_diag_concentration = affinity_matrix.max(axis=1)
        difficulty_weights = 1.0 + (off_diag_concentration * 1.8)

        # Compression degradation exacerbates high-difficulty classes
        compression_factor = (pruning_ratio * 1.5) + (0.2 if quantization_type in ["INT8", "INT8_DYNAMIC"] else 0.05)
        perturbed_difficulties = difficulty_weights * (1.0 + rng.uniform(-0.15, 0.15, size=K))

        # Per-class target recall ratios
        # Mean should calibrate to target_accuracy_ratio
        relative_recalls = np.clip(1.0 - (perturbed_difficulties * (1.0 - target_accuracy_ratio) * (1.0 + compression_factor * 0.5)), 0.05, 0.999)

        # Adjust relative recalls so total correct matches target_target_correct
        initial_correct = np.round(relative_recalls * class_supports).astype(np.int64)
        diff = total_target_correct - int(np.sum(initial_correct))

        # Distribute difference proportionally
        if diff != 0:
            adjustable_indices = np.argsort(-perturbed_difficulties if diff < 0 else perturbed_difficulties)
            for idx in adjustable_indices:
                if diff == 0:
                    break
                if diff > 0 and initial_correct[idx] < class_supports[idx]:
                    step = min(diff, class_supports[idx] - initial_correct[idx])
                    initial_correct[idx] += step
                    diff -= step
                elif diff < 0 and initial_correct[idx] > 0:
                    step = min(-diff, initial_correct[idx])
                    initial_correct[idx] -= step
                    diff += step

        # Build integer K x K confusion matrix
        matrix = np.zeros((K, K), dtype=np.int64)
        for i in range(K):
            matrix[i, i] = initial_correct[i]
            errors_to_distribute = class_supports[i] - initial_correct[i]

            if errors_to_distribute > 0:
                # Distribute errors across off-diagonal according to affinity probabilities
                probs = affinity_matrix[i].copy()
                probs[i] = 0.0
                if probs.sum() > 0:
                    probs /= probs.sum()
                elif K > 1:
                    probs = np.full(K, 1.0 / (K - 1))
                    probs[i] = 0.0
                else:
                    probs = np.zeros(1)

                # Multinomial sample of errors
                errors_allocated = rng.multinomial(errors_to_distribute, probs)
                for j in range(K):
                    if i != j:
                        matrix[i, j] = errors_allocated[j]

        return {
            "matrix": matrix,
            "supports": class_supports,
            "total_samples": N,
            "total_correct": int(np.trace(matrix)),
            "effective_accuracy": float((np.trace(matrix) / N) * 100.0),
            "provenance": "SIMULATED_MODEL",
            "synthetic": True,
            "mode": "SIMULATION",
            "prediction_source": "Calibrated Degradation + Semantic Affinity Model",
        }
