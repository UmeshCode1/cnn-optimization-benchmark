"""
Pruning Module.
Supports:
1. Structured Channel Pruning (L1-norm across convolution channels - translates directly to latency & FLOPs reduction)
2. Structured Filter Pruning
3. Unstructured Magnitude Pruning (sparse weights without direct dense kernel speedup)
"""

from typing import Dict, Any, List
import numpy as np


class PruningManager:
    """Manages Structured and Unstructured pruning specifications."""

    SUPPORTED_METHODS = {
        "NONE": {
            "is_structured": False,
            "latency_benefit": False,
            "description": "No parameter pruning applied.",
        },
        "STRUCTURED_CHANNEL": {
            "is_structured": True,
            "latency_benefit": True,
            "description": "L1-norm channel pruning eliminating entire feature map channels for direct GPU/CPU speedup.",
        },
        "STRUCTURED_FILTER": {
            "is_structured": True,
            "latency_benefit": True,
            "description": "Prunes entire 2D convolution filters to reduce output tensor dimensions.",
        },
        "UNSTRUCTURED": {
            "is_structured": False,
            "latency_benefit": False,
            "description": "Sets individual low-magnitude weights to zero (sparsity without structured tensor dimension reduction).",
        },
    }

    @classmethod
    def evaluate_pruning_impact(
        cls,
        pruning_method: str,
        pruning_ratio: float,
        base_params_m: float,
        base_flops_m: float,
    ) -> Dict[str, Any]:
        """Compute structured vs unstructured speedup and compression impacts."""
        method_key = pruning_method.upper().strip()
        spec = cls.SUPPORTED_METHODS.get(method_key, cls.SUPPORTED_METHODS["STRUCTURED_CHANNEL"])
        
        pruning_ratio = max(0.0, min(0.90, pruning_ratio))
        remaining_ratio = 1.0 - pruning_ratio

        if spec["is_structured"]:
            effective_params_m = base_params_m * remaining_ratio
            effective_flops_m = base_flops_m * (remaining_ratio ** 1.5)
            # Real hardware latency speedup scaling with structured channel reduction
            latency_factor = max(0.20, (remaining_ratio ** 0.85))
        else:
            # Unstructured pruning keeps original tensor shapes on standard GEMM engines
            effective_params_m = base_params_m * remaining_ratio
            effective_flops_m = base_flops_m * remaining_ratio
            latency_factor = 0.96  # Marginal unstructured caching benefit without sparse tensor core acceleration

        return {
            "pruning_method": pruning_method,
            "pruning_ratio": pruning_ratio,
            "is_structured": spec["is_structured"],
            "effective_params_m": round(effective_params_m, 3),
            "effective_flops_m": round(effective_flops_m, 1),
            "latency_factor": round(latency_factor, 3),
            "param_reduction_pct": round(pruning_ratio * 100.0, 1),
        }
