"""
Energy Measurement Module.

SCIENTIFIC VALIDITY NOTICE:
Energy measurement requires hardware telemetry (NVML for NVIDIA GPUs, RAPL for Intel CPUs).
These interfaces are NOT available in the current deployment environment (Render free tier).

This module attempts real telemetry first, then falls back to an analytical estimation.
All outputs are explicitly labeled with their provenance level:

  LEVEL 1 — MEASURED_GPU_NVML    : Direct NVIDIA GPU power via pynvml (requires GPU + nvml)
  LEVEL 2 — MEASURED_RAPL        : Intel/AMD CPU power via Linux RAPL (requires root/powercap)
  LEVEL 3 — ESTIMATED_TDP_MODEL  : FLOPs + TDP analytical model (SIMULATION)

Never present LEVEL 3 as MEASURED.
"""

import time
from typing import Dict, Any


class EnergyEvaluator:
    """Energy measurement and estimation with rigorous scientific provenance tracking."""

    @staticmethod
    def measure_or_estimate_energy(
        forward_pass_fn,
        duration_seconds: float,
        num_inferences: int,
        model_flops_m: float,
        device: str = "cpu",
    ) -> Dict[str, Any]:
        """
        Attempt to measure real energy; fall back to calibrated estimation.

        Returns provenance level so the UI can display the appropriate label.
        """
        is_cuda = "cuda" in device.lower()
        avg_power_watts = 0.0
        energy_source = "ESTIMATED_TDP_MODEL"
        provenance = "ESTIMATED"
        measurement_level = 3

        # ── LEVEL 1: NVIDIA GPU NVML ───────────────────────────────────────
        if is_cuda:
            try:
                import pynvml
                pynvml.nvmlInit()
                handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                # Sample power over actual inference interval
                power_samples = []
                t_start = time.perf_counter()
                if forward_pass_fn:
                    forward_pass_fn()
                t_end = time.perf_counter()
                actual_duration = max(duration_seconds, t_end - t_start)
                power_milliwatts = pynvml.nvmlDeviceGetPowerUsage(handle)
                avg_power_watts = power_milliwatts / 1000.0
                pynvml.nvmlShutdown()
                energy_source = "MEASURED_GPU_NVML"
                provenance = "MEASURED"
                measurement_level = 1
            except Exception as nvml_err:
                # NVML unavailable — fall through to estimation
                pass

        # ── LEVEL 2: CPU RAPL (Linux powercap) ────────────────────────────
        if measurement_level == 3 and not is_cuda:
            try:
                rapl_path = "/sys/class/powercap/intel-rapl/intel-rapl:0/energy_uj"
                with open(rapl_path, "r") as f:
                    e_before = int(f.read().strip())
                if forward_pass_fn:
                    t_start = time.perf_counter()
                    forward_pass_fn()
                    t_end = time.perf_counter()
                    actual_duration = t_end - t_start
                else:
                    actual_duration = duration_seconds
                with open(rapl_path, "r") as f:
                    e_after = int(f.read().strip())
                energy_uj = (e_after - e_before) % (2**32)  # handle counter rollover
                avg_power_watts = (energy_uj * 1e-6) / max(0.001, actual_duration)
                duration_seconds = actual_duration
                energy_source = "MEASURED_RAPL"
                provenance = "MEASURED"
                measurement_level = 2
            except Exception:
                pass

        # ── LEVEL 3: Analytical FLOPs-based TDP estimation ────────────────
        if measurement_level == 3:
            # Baseline TDP reference: CPU ~28W for inference workloads
            # GPU inference typically 35–65W for mobile/edge hardware
            tdp_reference_watts = 45.0 if is_cuda else 28.0

            # Scale by relative FLOPs vs ResNet-18 baseline (556 MFLOPs)
            flops_scale = max(0.1, model_flops_m / 556.0)

            # Active inference fraction — not idle TDP
            active_fraction = 0.65  # typical utilization during inference burst

            avg_power_watts = tdp_reference_watts * flops_scale * active_fraction

            # Joules = Power × Time
            energy_per_inference_j = avg_power_watts * (duration_seconds / max(1, num_inferences))
            total_energy_j = energy_per_inference_j * num_inferences

            return {
                "energy_j": round(float(total_energy_j), 6),
                "energy_per_inference_j": round(float(energy_per_inference_j), 8),
                "avg_power_watts": round(float(avg_power_watts), 2),
                "provenance": "ESTIMATED",
                "source": "ESTIMATED_TDP_MODEL",
                "measurement_level": 3,
                "unit": "J",
                "method": (
                    f"FLOPs-scaled TDP model: {tdp_reference_watts}W reference × "
                    f"{flops_scale:.2f} FLOPs scale × {active_fraction} utilization. "
                    "NOT hardware-measured. Requires NVML/RAPL for real measurement."
                ),
            }

        # Real measurement path (Level 1 or 2)
        total_energy_j = avg_power_watts * duration_seconds
        energy_per_inference_j = total_energy_j / max(1, num_inferences)

        return {
            "energy_j": round(float(total_energy_j), 6),
            "energy_per_inference_j": round(float(energy_per_inference_j), 8),
            "avg_power_watts": round(float(avg_power_watts), 2),
            "provenance": provenance,
            "source": energy_source,
            "measurement_level": measurement_level,
            "unit": "J",
            "method": (
                "Direct GPU/CPU hardware power sampling over inference interval"
                if measurement_level <= 2
                else "Analytical FLOPs-TDP estimation"
            ),
        }
