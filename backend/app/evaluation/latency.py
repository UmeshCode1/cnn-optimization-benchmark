"""
Latency Measurement Module with Warm-up and High-Resolution Synchronization.
Methodology:
- For GPU: Uses torch.cuda.synchronize() or torch.cuda.Event(enable_timing=True)
- For CPU: Uses time.perf_counter_ns()
- Discards warm-up runs to ensure JIT/caching stabilization
- Computes mean, median, P95, min, max, and std deviation
"""

import time
from typing import Dict, Any, List, Optional
import numpy as np


class LatencyEvaluator:
    """High-precision latency measurement suite."""

    @staticmethod
    def measure_latency(
        model_runner_fn,
        warmup_runs: int = 50,
        measured_runs: int = 200,
        device: str = "cpu",
    ) -> Dict[str, Any]:
        """
        Execute rigorous latency benchmarking protocol.
        
        Args:
            model_runner_fn: Zero-arg function executing a single inference forward pass.
            warmup_runs: Number of unmeasured warm-up iterations.
            measured_runs: Number of timed evaluation iterations.
            device: 'cuda' or 'cpu'.
        """
        is_cuda = "cuda" in device.lower()

        # 1. Warm-up phase
        for _ in range(warmup_runs):
            model_runner_fn()
            if is_cuda:
                try:
                    import torch
                    torch.cuda.synchronize()
                except Exception:
                    pass

        # 2. Measured phase
        timings_ms: List[float] = []

        for _ in range(measured_runs):
            t_start = time.perf_counter()
            model_runner_fn()
            if is_cuda:
                try:
                    import torch
                    torch.cuda.synchronize()
                except Exception:
                    pass
            t_end = time.perf_counter()
            timings_ms.append((t_end - t_start) * 1000.0)

        arr = np.array(timings_ms)
        mean_ms = float(np.mean(arr))
        median_ms = float(np.median(arr))
        p95_ms = float(np.percentile(arr, 95))
        min_ms = float(np.min(arr))
        max_ms = float(np.max(arr))
        std_ms = float(np.std(arr))

        return {
            "mean_ms": round(mean_ms, 3),
            "median_ms": round(median_ms, 3),
            "p95_ms": round(p95_ms, 3),
            "min_ms": round(min_ms, 3),
            "max_ms": round(max_ms, 3),
            "std_ms": round(std_ms, 3),
            "warmup_runs": warmup_runs,
            "measured_runs": measured_runs,
            "device": device,
            "provenance": "MEASURED",
            "method": f"{warmup_runs} warm-up + {measured_runs} measured runs (synced)",
        }
