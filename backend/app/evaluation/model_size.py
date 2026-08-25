"""
Model Size Measurement Module.
Distinguishes:
1. Serialized Artifact Size (MB on disk / state_dict stream)
2. Parameter Count (Millions of FP32/FP16/INT8 parameters)
3. Estimated Runtime Buffer Memory
"""

import io
from typing import Dict, Any


class ModelSizeEvaluator:
    """Evaluator for real serialized model weights and parameter memory."""

    @staticmethod
    def measure_serialized_size(state_dict_or_weights: Any) -> float:
        """Measure bytes needed to serialize model state dict, returned in Megabytes (MB)."""
        buffer = io.BytesIO()
        try:
            import torch
            if isinstance(state_dict_or_weights, torch.nn.Module):
                torch.save(state_dict_or_weights.state_dict(), buffer)
            elif isinstance(state_dict_or_weights, dict):
                torch.save(state_dict_or_weights, buffer)
            else:
                import pickle
                pickle.dump(state_dict_or_weights, buffer)
        except Exception:
            import pickle
            pickle.dump(state_dict_or_weights, buffer)

        size_bytes = buffer.getbuffer().nbytes
        size_mb = size_bytes / (1024.0 * 1024.0)
        return round(size_mb, 3)

    @staticmethod
    def calculate_parameter_memory_mb(num_params: int, precision_bits: int = 32) -> float:
        """Calculate in-memory footprint of parameters given bit precision."""
        bytes_per_param = precision_bits / 8.0
        total_bytes = num_params * bytes_per_param
        return round(total_bytes / (1024.0 * 1024.0), 3)
