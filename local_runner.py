#!/usr/bin/env python3
"""
CNN Optimization Benchmark — Local Standalone & Real Mode Runner.

This script allows you to run genuine CNN optimization benchmarks locally on your
machine (CPU or NVIDIA CUDA GPU) with accurate, measured results.

Usage:
  1. Interactive Web Server in Real Mode:
     python local_runner.py --server

  2. Command-Line Experiment Execution:
     python local_runner.py --model ResNet-18 --dataset CIFAR-10 --runs 3 --iterations 20

  3. Hardware Diagnostic / Capability Matrix:
     python local_runner.py --check
"""

import sys
import os
import argparse
from pathlib import Path

# Add backend directory to Python path
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ["EXECUTION_MODE"] = "REAL"


def check_capabilities():
    """Display current system hardware and execution capabilities."""
    from app.services.capability_service import CapabilityService
    caps = CapabilityService.detect(force_refresh=True)

    print("\n" + "=" * 60)
    print("  CNN BENCHMARK — HARDWARE & CAPABILITY AUDIT")
    print("=" * 60)
    print(f"  OS:              {caps.os_info}")
    print(f"  Python:          {caps.python_version}")
    print(f"  CPU:             {caps.cpu_model} ({caps.cpu_cores} cores, {caps.ram_gb} GB RAM)")
    print(f"  PyTorch:         {'AVAILABLE (' + caps.pytorch_version + ')' if caps.pytorch_available else 'NOT INSTALLED'}")
    print(f"  CUDA GPU:        {'AVAILABLE (' + caps.gpu_model + ', ' + str(caps.gpu_vram_mb) + ' MB VRAM)' if caps.cuda_available else 'NOT AVAILABLE (CPU Only)'}")
    print(f"  NVML Power:      {'AVAILABLE (Hardware Power Telemetry)' if caps.nvml_available else 'UNAVAILABLE (TDP Model Fallback)'}")
    print(f"  Intel RAPL:      {'AVAILABLE' if caps.rapl_available else 'UNAVAILABLE'}")
    print(f"  INT8 Dynamic:    {'SUPPORTED' if caps.int8_dynamic_available else 'UNSUPPORTED'}")
    print(f"  FP16 CUDA:       {'SUPPORTED' if caps.fp16_available else 'UNSUPPORTED'}")
    print("-" * 60)
    print(f"  REAL MODE:       {'READY [OK]' if caps.real_mode_feasible else 'UNAVAILABLE [DEMO ONLY]'}")
    print(f"  Status Details:  {caps.real_mode_reason}")
    print("=" * 60 + "\n")
    return caps.real_mode_feasible


def run_cli_experiment(args):
    """Execute a real-mode experiment via CLI."""
    from app.services.capability_service import CapabilityService
    from app.engines.real_engine import RealExperimentEngine
    from app.engines.simulation_engine import SimulationEngine
    from app.engines.base import EngineValidationError

    caps = CapabilityService.detect()
    if not caps.real_mode_feasible and not args.force_demo:
        print("\n[ERROR] Real mode dependencies missing. Install PyTorch + torchvision:")
        print("  pip install torch torchvision pynvml psutil\n")
        print("To run in simulation/demo mode anyway, add --force-demo")
        sys.exit(1)

    engine = RealExperimentEngine() if (caps.real_mode_feasible and not args.force_demo) else SimulationEngine()
    mode = "REAL" if isinstance(engine, RealExperimentEngine) else "DEMO"

    algs = [a.strip() for a in args.algorithms.split(",") if a.strip()]
    config = {
        "id": f"EXP-LOCAL-{args.model}-{args.dataset}",
        "cnn_model_name": args.model,
        "dataset_name": args.dataset,
        "pruning_method": args.pruning_method,
        "pruning_ratio": args.pruning_ratio,
        "quantization_type": args.quantization,
        "selected_algorithms": algs,
        "population_size": args.population,
        "max_iterations": args.iterations,
        "number_of_runs": args.runs,
        "base_seed": args.seed,
        "warmup_runs": 10,
        "measured_runs": 50,
        "weight_accuracy": 0.40,
        "weight_latency": 0.25,
        "weight_model_size": 0.20,
        "weight_energy": 0.15,
        "batch_size": args.batch_size,
    }

    print(f"\n🚀 Starting {mode} Experiment: {args.model} on {args.dataset}")
    print(f"   Algorithms: {algs} | Runs: {args.runs} | Pruning: {args.pruning_ratio * 100}%\n")

    def progress(p):
        event = p.get("event", "")
        if event == "BASELINE_COMPLETED":
            b = p["baseline"]
            print(f"  [Baseline] Accuracy: {b['accuracy']}% ({b.get('accuracy_provenance', 'ESTIMATED')}) | "
                  f"Latency: {b['latency_ms']}ms | Size: {b['model_size_mb']}MB")
        elif event == "RUN_COMPLETED":
            m = p["metrics"]
            print(f"  [{p['algorithm']} Run #{p['run_index']}] Top-1 Acc: {m['accuracy']}% | "
                  f"Latency: {m['latency_ms']}ms | Score: {m['overall_score']}")

    res = engine.run_experiment(config, progress_callback=progress)
    print("\n" + "=" * 60)
    print(f"  EXPERIMENT COMPLETED ({res.execution_mode} MODE)")
    print("=" * 60)
    print(f"  Total Runs Persisted: {len(res.runs)}")
    for r in res.runs:
        print(f"  - {r.algorithm:10} | Acc: {r.accuracy:5.2f}% ({r.accuracy_provenance}) | "
              f"Lat: {r.latency_mean_ms:6.2f}ms ({r.latency_provenance}) | Score: {r.overall_score:5.2f}")
    print("=" * 60 + "\n")


def start_server(port=8000, host="0.0.0.0"):
    """Start FastAPI server with full Real Mode support."""
    import uvicorn
    print(f"\n🚀 Starting CNN Benchmark Server in REAL/LOCAL mode on http://localhost:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True, app_dir=str(BACKEND_DIR))


def main():
    parser = argparse.ArgumentParser(description="CNN Optimization Benchmark — Local Real-Mode Runner")
    parser.add_argument("--server", action="store_true", help="Start the interactive web server")
    parser.add_argument("--check", action="store_true", help="Check hardware capabilities for Real Mode")
    parser.add_argument("--model", type=str, default="ResNet-18", help="CNN model (ResNet-18, MobileNetV2, VGG-16)")
    parser.add_argument("--dataset", type=str, default="CIFAR-10", help="Dataset (CIFAR-10, CIFAR-100, MNIST)")
    parser.add_argument("--algorithms", type=str, default="PSO,GWO,GA,DE", help="Comma-separated algorithms")
    parser.add_argument("--runs", type=int, default=3, help="Number of independent runs per algorithm")
    parser.add_argument("--iterations", type=int, default=15, help="Max optimizer iterations")
    parser.add_argument("--population", type=int, default=15, help="Optimizer population size")
    parser.add_argument("--pruning-ratio", type=float, default=0.4, help="Pruning ratio (0.0 to 0.9)")
    parser.add_argument("--pruning-method", type=str, default="STRUCTURED_CHANNEL", help="Pruning method")
    parser.add_argument("--quantization", type=str, default="INT8", help="Quantization type (FP32, FP16, INT8)")
    parser.add_argument("--batch-size", type=int, default=64, help="Inference batch size")
    parser.add_argument("--seed", type=int, default=42, help="Base random seed")
    parser.add_argument("--port", type=int, default=8000, help="Web server port")
    parser.add_argument("--force-demo", action="store_true", help="Force demo/simulation engine even if real is available")

    args = parser.parse_args()

    if args.check:
        check_capabilities()
    elif args.server:
        check_capabilities()
        start_server(port=args.port)
    else:
        run_cli_experiment(args)


if __name__ == "__main__":
    main()
