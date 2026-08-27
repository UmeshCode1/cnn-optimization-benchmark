"""
Hardware and Runtime Capability Detection Service.

Detects what is actually available in the current execution environment
and returns a CapabilityMatrix used to determine execution mode.

This service is called at startup and before every Real Mode experiment.
It NEVER assumes capabilities — it verifies them.
"""

import platform
import sys
from typing import Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class CapabilityMatrix:
    """
    Describes what this execution environment can actually do.
    Used to determine whether REAL or DEMO mode is available.
    """
    # Python / Framework
    python_version: str = "unknown"
    pytorch_available: bool = False
    pytorch_version: Optional[str] = None

    # Hardware
    cpu_model: str = "unknown"
    cpu_cores: int = 0
    ram_gb: float = 0.0
    os_info: str = "unknown"

    # GPU
    cuda_available: bool = False
    cuda_version: Optional[str] = None
    gpu_model: Optional[str] = None
    gpu_vram_mb: float = 0.0
    gpu_count: int = 0

    # Telemetry
    nvml_available: bool = False
    rapl_available: bool = False

    # Inference backends
    cpu_inference_available: bool = True  # always true if PyTorch installed
    gpu_inference_available: bool = False

    # Quantization backends
    int8_dynamic_available: bool = False
    int8_static_available: bool = False
    fp16_available: bool = False

    # Dataset access
    datasets_directory: Optional[str] = None
    datasets_available: list = field(default_factory=list)

    # Derived: overall real mode feasibility
    real_mode_feasible: bool = False
    real_mode_reason: str = "PyTorch not available"

    # Detection errors (for diagnostics)
    detection_warnings: list = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "python_version": self.python_version,
            "pytorch_available": self.pytorch_available,
            "pytorch_version": self.pytorch_version,
            "cpu_model": self.cpu_model,
            "cpu_cores": self.cpu_cores,
            "ram_gb": self.ram_gb,
            "os_info": self.os_info,
            "cuda_available": self.cuda_available,
            "cuda_version": self.cuda_version,
            "gpu_model": self.gpu_model,
            "gpu_vram_mb": self.gpu_vram_mb,
            "gpu_count": self.gpu_count,
            "nvml_available": self.nvml_available,
            "rapl_available": self.rapl_available,
            "cpu_inference_available": self.cpu_inference_available,
            "gpu_inference_available": self.gpu_inference_available,
            "int8_dynamic_available": self.int8_dynamic_available,
            "int8_static_available": self.int8_static_available,
            "fp16_available": self.fp16_available,
            "datasets_available": self.datasets_available,
            "real_mode_feasible": self.real_mode_feasible,
            "real_mode_reason": self.real_mode_reason,
            "detection_warnings": self.detection_warnings,
        }


class CapabilityService:
    """Detects runtime capabilities. Call detect() once at startup."""

    _cached: Optional[CapabilityMatrix] = None

    @classmethod
    def detect(cls, force_refresh: bool = False) -> CapabilityMatrix:
        """Run capability detection. Results are cached after first call."""
        if cls._cached is not None and not force_refresh:
            return cls._cached

        caps = CapabilityMatrix()
        warnings = []

        # ── Python version ─────────────────────────────────────────────────
        caps.python_version = sys.version.split()[0]
        caps.os_info = f"{platform.system()} {platform.release()}"

        # ── CPU / RAM ──────────────────────────────────────────────────────
        caps.cpu_model = platform.processor() or "Unknown CPU"
        try:
            import psutil
            caps.ram_gb = round(psutil.virtual_memory().total / (1024 ** 3), 1)
            caps.cpu_cores = psutil.cpu_count(logical=True) or 1
        except ImportError:
            warnings.append("psutil not installed — RAM/core count unavailable")
            caps.ram_gb = 0.0
            caps.cpu_cores = 1

        # ── PyTorch ────────────────────────────────────────────────────────
        try:
            import torch
            caps.pytorch_available = True
            caps.pytorch_version = torch.__version__
            caps.cpu_inference_available = True

            # ── CUDA ───────────────────────────────────────────────────────
            if torch.cuda.is_available():
                caps.cuda_available = True
                caps.gpu_count = torch.cuda.device_count()
                caps.gpu_model = torch.cuda.get_device_name(0)
                caps.gpu_vram_mb = round(
                    torch.cuda.get_device_properties(0).total_memory / (1024 ** 2), 0
                )
                caps.gpu_inference_available = True
                caps.fp16_available = True
                try:
                    caps.cuda_version = torch.version.cuda or "unknown"
                except Exception:
                    caps.cuda_version = "unknown"
            else:
                warnings.append("CUDA not available — GPU inference unavailable")

            # ── INT8 quantization ──────────────────────────────────────────
            try:
                import torch.quantization  # noqa
                caps.int8_dynamic_available = True
            except Exception:
                warnings.append("torch.quantization not available — INT8 dynamic unsupported")

            # ── INT8 static ────────────────────────────────────────────────
            try:
                from torch.quantization import quantize_static  # noqa
                caps.int8_static_available = True
            except ImportError:
                pass  # Optional

            # ── FP16 on CPU ────────────────────────────────────────────────
            if caps.cuda_available:
                caps.fp16_available = True

        except ImportError:
            caps.pytorch_available = False
            caps.cpu_inference_available = False
            warnings.append(
                "PyTorch not installed — Real Mode is UNAVAILABLE. "
                "Install torch to enable real experiment execution."
            )

        # ── NVML (NVIDIA GPU power telemetry) ──────────────────────────────
        if caps.cuda_available:
            try:
                import pynvml
                pynvml.nvmlInit()
                pynvml.nvmlShutdown()
                caps.nvml_available = True
            except Exception as e:
                warnings.append(f"NVML unavailable: {e} — energy will be ESTIMATED")

        # ── RAPL (CPU energy counter, Linux only) ──────────────────────────
        if platform.system() == "Linux":
            try:
                rapl_path = "/sys/class/powercap/intel-rapl/intel-rapl:0/energy_uj"
                with open(rapl_path, "r") as f:
                    f.read()
                caps.rapl_available = True
            except Exception:
                warnings.append("RAPL not accessible — CPU energy will be ESTIMATED")
        else:
            warnings.append(f"RAPL not available on {platform.system()} — CPU energy will be ESTIMATED")

        # ── Real Mode feasibility ──────────────────────────────────────────
        if caps.pytorch_available and caps.cpu_inference_available:
            caps.real_mode_feasible = True
            caps.real_mode_reason = (
                "PyTorch available. CPU inference supported. "
                f"GPU: {'YES' if caps.cuda_available else 'NO'}. "
                f"NVML: {'YES' if caps.nvml_available else 'NO'}."
            )
        else:
            caps.real_mode_feasible = False
            caps.real_mode_reason = (
                "PyTorch is required for Real Mode but is not installed in "
                "this environment. This deployment supports Demo Mode only."
            )

        caps.detection_warnings = warnings
        cls._cached = caps
        return caps

    @classmethod
    def validate_for_real_experiment(
        cls,
        model_name: str,
        dataset_name: str,
        quantization_type: str,
        pruning_method: str,
    ) -> Dict[str, Any]:
        """
        Pre-flight check before launching a Real Mode experiment.
        Returns {'ok': True} or {'ok': False, 'errors': [...]}
        
        REQUIREMENT: Never silently downgrade — if a capability check fails,
        return a clear error explaining what is missing.
        """
        caps = cls.detect()
        errors = []

        # Check PyTorch
        if not caps.pytorch_available:
            errors.append(
                "PyTorch is not installed. Real Mode requires PyTorch. "
                "Current deployment supports Demo Mode only."
            )
            return {"ok": False, "errors": errors}

        # Check model support
        SUPPORTED_REAL_MODELS = [
            "ResNet-18", "ResNet-50", "MobileNetV2", "VGG-16",
            "EfficientNet-B0", "ShuffleNetV2",
        ]
        if model_name not in SUPPORTED_REAL_MODELS:
            errors.append(
                f"Model '{model_name}' is not in the Real Mode model registry. "
                f"Supported models: {', '.join(SUPPORTED_REAL_MODELS)}. "
                f"Unknown models CANNOT silently fallback to another architecture."
            )

        # Check dataset (datasets must be locally available)
        DEMO_DATASETS = ["CIFAR-10", "CIFAR-100", "MNIST", "Fashion-MNIST", "ImageNet-1K"]
        # In real mode, datasets must actually be downloadable or present
        # We check for torchvision availability
        try:
            import torchvision  # noqa
            dataset_ok = True
        except ImportError:
            dataset_ok = False
            errors.append(
                f"torchvision not installed — dataset '{dataset_name}' cannot be loaded. "
                "Install torchvision for real dataset access."
            )

        # Check quantization backend
        if quantization_type in ["INT8", "INT8_DYNAMIC"] and not caps.int8_dynamic_available:
            errors.append(
                f"Quantization type '{quantization_type}' is not supported in this environment. "
                "torch.quantization is required."
            )

        if quantization_type == "FP16" and not caps.fp16_available:
            errors.append(
                "FP16 quantization requires CUDA, which is not available in this environment."
            )

        # Check pruning
        SUPPORTED_PRUNING = ["NONE", "UNSTRUCTURED", "STRUCTURED_CHANNEL", "STRUCTURED_FILTER"]
        if pruning_method not in SUPPORTED_PRUNING:
            errors.append(f"Pruning method '{pruning_method}' is not supported.")

        # Check CUDA if GPU requested
        # (We allow CPU real mode — it's slower but valid)

        if errors:
            return {"ok": False, "errors": errors}

        return {
            "ok": True,
            "capabilities": caps.to_dict(),
            "mode": "REAL",
            "device": "GPU" if caps.cuda_available else "CPU",
            "energy_measurement": (
                "MEASURED_NVML" if caps.nvml_available
                else "MEASURED_RAPL" if caps.rapl_available
                else "ESTIMATED_TDP"
            ),
        }
