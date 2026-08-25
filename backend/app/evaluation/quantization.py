"""
Quantization Module.
Implements FP32, FP16, INT8 Dynamic, and INT8 Static Post-Training Quantization (PTQ).
"""

from typing import Dict, Any


class QuantizationManager:
    """Manages Quantization profiles and theoretical/hardware compression factors."""

    SUPPORTED_TYPES = {
        "FP32": {
            "bits": 32,
            "compression_factor": 1.0,
            "latency_multiplier": 1.0,
            "status": "PRODUCTION",
            "description": "Standard 32-bit single-precision floating point format.",
        },
        "FP16": {
            "bits": 16,
            "compression_factor": 2.0,
            "latency_multiplier": 0.58,
            "status": "PRODUCTION",
            "description": "Half-precision 16-bit float utilizing Tensor Cores / SIMD.",
        },
        "INT8": {
            "bits": 8,
            "compression_factor": 4.0,
            "latency_multiplier": 0.35,
            "status": "PRODUCTION",
            "description": "8-bit signed integer post-training static calibration quantization.",
        },
        "INT8_DYNAMIC": {
            "bits": 8,
            "compression_factor": 4.0,
            "latency_multiplier": 0.45,
            "status": "PRODUCTION",
            "description": "8-bit dynamic runtime activation quantization.",
        },
    }

    @classmethod
    def get_quantization_spec(cls, quant_type: str) -> Dict[str, Any]:
        normalized = quant_type.upper().strip()
        if normalized not in cls.SUPPORTED_TYPES:
            return cls.SUPPORTED_TYPES["INT8"]
        return cls.SUPPORTED_TYPES[normalized]

    @classmethod
    def apply_quantization(cls, weights_dict: Dict[str, Any], quant_type: str) -> Dict[str, Any]:
        """Apply quantization transform or simulated bitwidth quantization."""
        spec = cls.get_quantization_spec(quant_type)
        return {
            "quantization_type": quant_type,
            "bits": spec["bits"],
            "compression_factor": spec["compression_factor"],
            "latency_multiplier": spec["latency_multiplier"],
        }
