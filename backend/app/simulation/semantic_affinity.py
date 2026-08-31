"""
Semantic Affinity Priors for Synthetic Confusion Matrix Simulation.

Provides calibrated inter-class confusion tendencies based on empirical computer vision literature:
- CIFAR-10: Visually similar pairs (cat/dog, automobile/truck, deer/horse, bird/airplane)
- Fashion-MNIST: Apparel confusions (shirt/t-shirt/coat/pullover, sneaker/ankle boot)
- MNIST: Digit shape similarities (3/5/8, 4/9, 1/7)
- Generic: Cosine/distance-based affinity smoothing
"""

from typing import Dict, Tuple
import numpy as np
from ..evaluation.dataset_registry import DatasetDefinition, normalize_dataset_key


# Empirical relative confusion weights between classes (unnormalized affinity)
# Key: (class_idx_a, class_idx_b) -> affinity multiplier > 1.0
CIFAR10_AFFINITY_PAIRS: Dict[Tuple[int, int], float] = {
    # Cat (3) vs Dog (5)
    (3, 5): 8.5,
    (5, 3): 8.0,
    # Automobile (1) vs Truck (9)
    (1, 9): 6.0,
    (9, 1): 5.5,
    # Airplane (0) vs Bird (2)
    (0, 2): 4.0,
    (2, 0): 3.5,
    # Airplane (0) vs Ship (8)
    (0, 8): 3.5,
    (8, 0): 3.0,
    # Deer (4) vs Horse (7)
    (4, 7): 5.0,
    (7, 4): 4.5,
    # Deer (4) vs Bird (2)
    (4, 2): 3.0,
    (2, 4): 3.0,
    # Cat (3) vs Frog (6)
    (3, 6): 2.5,
    (6, 3): 2.0,
    # Dog (5) vs Horse (7)
    (5, 7): 3.0,
    (7, 5): 2.5,
}

FASHION_MNIST_AFFINITY_PAIRS: Dict[Tuple[int, int], float] = {
    # T-shirt/top (0) vs Shirt (6)
    (0, 6): 7.5,
    (6, 0): 7.0,
    # Pullover (2) vs Coat (4)
    (2, 4): 6.5,
    (4, 2): 6.0,
    # Pullover (2) vs Shirt (6)
    (2, 6): 5.0,
    (6, 2): 4.5,
    # Shirt (6) vs Coat (4)
    (6, 4): 5.5,
    (4, 6): 5.0,
    # Sandal (5) vs Sneaker (7)
    (5, 7): 3.5,
    (7, 5): 3.0,
    # Sneaker (7) vs Ankle boot (9)
    (7, 9): 6.0,
    (9, 7): 5.5,
    # Dress (3) vs Coat (4)
    (3, 4): 3.5,
    (4, 3): 3.0,
}

MNIST_AFFINITY_PAIRS: Dict[Tuple[int, int], float] = {
    # 3 vs 5
    (3, 5): 5.5,
    (5, 3): 5.0,
    # 3 vs 8
    (3, 8): 4.5,
    (8, 3): 4.0,
    # 4 vs 9
    (4, 9): 6.0,
    (9, 4): 5.5,
    # 7 vs 1
    (7, 1): 4.0,
    (1, 7): 3.5,
    # 7 vs 2
    (7, 2): 3.0,
    (2, 7): 2.5,
    # 5 vs 6
    (5, 6): 3.5,
    (6, 5): 3.0,
}


def build_affinity_matrix(dataset_def: DatasetDefinition) -> np.ndarray:
    """
    Build a K x K prior affinity matrix where affinity[i, j] represents the relative
    propensity of true class i to be misclassified as predicted class j.
    The diagonal is set to 0 (affinities only apply to off-diagonal misclassifications).
    """
    K = dataset_def.num_classes
    affinity = np.ones((K, K), dtype=np.float64)
    np.fill_diagonal(affinity, 0.0)

    key = normalize_dataset_key(dataset_def.name)

    pair_map = {}
    if key == "CIFAR-10":
        pair_map = CIFAR10_AFFINITY_PAIRS
    elif key == "FASHION-MNIST":
        pair_map = FASHION_MNIST_AFFINITY_PAIRS
    elif key == "MNIST":
        pair_map = MNIST_AFFINITY_PAIRS
    elif dataset_def.semantic_groups:
        # Boost intra-supergroup confusion
        for group_name, members in dataset_def.semantic_groups.items():
            indices = [dataset_def.get_class_index(m) for m in members if dataset_def.get_class_index(m) is not None]
            for i in indices:
                for j in indices:
                    if i != j and i < K and j < K:
                        affinity[i, j] = 4.0

    # Apply specific pair overrides
    for (i, j), weight in pair_map.items():
        if i < K and j < K:
            affinity[i, j] = weight

    # Normalize each row to form a valid conditional off-diagonal probability distribution
    row_sums = affinity.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1.0
    normalized_affinity = affinity / row_sums

    return normalized_affinity
