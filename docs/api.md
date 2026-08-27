# REST API & WebSocket Real-Time Telemetry Specification

This document provides the complete API reference for the **CNN Optimization Benchmark Platform**, including REST endpoints, JSON payload schemas, query parameters, status codes, and WebSocket packet event formats.

Base URL: `http://localhost:8000` (or `https://cnn.umeshlabs.in`)  
Interactive Swagger UI: `/docs` | OpenAPI JSON: `/openapi.json`

---

## 1. REST Endpoints Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 REST API ROUTE CATALOG                                 │
├─────────────────────────┬──────────────────────────────────────────────────────────────┤
│ POST /api/experiments   │ Create and start new benchmark experiment                    │
│ GET  /api/experiments   │ List all benchmark experiments                               │
│ GET  /api/experiments/{id} │ Get full experiment metrics, runs, statistics, and ablations│
│ POST /api/experiments/{id}/run │ Trigger / Re-run background benchmark task            │
│ POST /api/experiments/{id}/clone │ Clone experiment configuration to new benchmark   │
│ POST /api/experiments/{id}/recalculate-weights │ Recalculate WSM rankings with new weights │
│ POST /api/experiments/validate-fairness │ Verify benchmark conditions parity          │
│ GET  /api/algorithms    │ Retrieve catalog of 10 standard + custom metaheuristics      │
│ POST /api/algorithms    │ Register custom metaheuristic optimizer                      │
│ DELETE /api/algorithms/{key} │ Delete registered custom optimizer                      │
│ GET  /api/models        │ List supported CNN models and custom registered architectures │
│ POST /api/models        │ Register custom CNN architecture                             │
│ GET  /api/datasets      │ List available benchmark vision datasets                     │
│ POST /api/datasets/upload │ Upload custom dataset zip archive                          │
│ GET  /api/hardware      │ Query host GPU/CPU hardware profile                          │
│ GET  /api/reports/{id}/csv │ Download experiment CSV dataset                           │
│ GET  /api/reports/{id}/markdown │ Download formatted research paper report             │
│ GET  /api/reports/{id}/json │ Download complete structured JSON audit state            │
│ WS   /ws/experiment/{id}│ Real-time WebSocket iteration telemetry stream              │
└─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 2. Experiment Endpoints

### 2.1 Create Benchmark Experiment
* **Route**: `POST /api/experiments`
* **Request Body**:
```json
{
  "title": "ResNet-18 Multi-Objective Edge Benchmark",
  "description": "Evaluating 10 metaheuristics on CIFAR-10 with INT8 quantization",
  "dataset_name": "CIFAR-10",
  "cnn_model_name": "ResNet-18",
  "quantization_type": "INT8",
  "pruning_method": "STRUCTURED_FILTER",
  "pruning_ratio": 0.40,
  "selected_algorithms": ["GWO", "WOA", "ALO", "MFO", "GOA", "MVO", "SCA", "AOA", "MGO", "GMO"],
  "population_size": 20,
  "max_iterations": 30,
  "number_of_runs": 5,
  "random_seed_policy": "FIXED_PER_RUN",
  "base_seed": 42,
  "weight_accuracy": 0.35,
  "weight_latency": 0.35,
  "weight_model_size": 0.15,
  "weight_energy": 0.15,
  "is_demo": false
}
```
* **Response** (`201 Created`):
```json
{
  "id": "EXP-20260827-0001",
  "title": "ResNet-18 Multi-Objective Edge Benchmark",
  "status": "RUNNING",
  "created_at": "2026-08-27T10:30:00Z"
}
```

---

### 2.2 Get Complete Experiment State
* **Route**: `GET /api/experiments/{id}`
* **Response** (`200 OK`):
```json
{
  "id": "EXP-20260827-0001",
  "title": "ResNet-18 Multi-Objective Edge Benchmark",
  "status": "COMPLETED",
  "dataset_name": "CIFAR-10",
  "cnn_model_name": "ResNet-18",
  "quantization_type": "INT8",
  "pruning_ratio": 0.40,
  "best_algorithm": "GWO",
  "best_algorithm_reason": "Highest composite trade-off score across 5 runs.",
  "baseline": {
    "accuracy": 93.40,
    "latency_ms": 14.20,
    "model_size_mb": 44.70,
    "energy_j": 0.3800,
    "parameters_m": 11.17,
    "flops_m": 556.0
  },
  "runs": [
    {
      "algorithm": "GWO",
      "run_index": 1,
      "accuracy": 92.84,
      "latency_ms": 2.99,
      "model_size_mb": 6.70,
      "energy_j": 0.1220,
      "parameters_m": 6.70,
      "flops_m": 333.6,
      "best_fitness": 0.0385,
      "overall_score": 95.20,
      "convergence_curve": [0.105, 0.082, 0.055, 0.0385]
    }
  ],
  "aggregated_stats": {
    "GWO": {
      "accuracy": { "mean": 92.84, "std": 0.06, "min": 92.76, "max": 92.92, "ci95": [92.76, 92.92] },
      "latency_ms": { "mean": 2.99, "std": 0.04, "min": 2.94, "max": 3.04, "ci95": [2.94, 3.04] },
      "overall_score": { "mean": 95.20, "rank": 1, "is_pareto": true }
    }
  },
  "ablations": [
    { "stage_order": 1, "stage_name": "Baseline FP32 (Uncompressed)", "accuracy": 93.40, "latency_ms": 14.20, "model_size_mb": 44.70 },
    { "stage_order": 2, "stage_name": "INT8 Post-Training Quantization", "accuracy": 93.15, "latency_ms": 6.80, "model_size_mb": 11.20 },
    { "stage_order": 3, "stage_name": "Structured L1 Channel Pruning (40%)", "accuracy": 90.80, "latency_ms": 4.50, "model_size_mb": 6.70 },
    { "stage_order": 4, "stage_name": "Quantization + Pruning Combined", "accuracy": 90.40, "latency_ms": 3.40, "model_size_mb": 6.70 },
    { "stage_order": 5, "stage_name": "Metaheuristic Optimal Tuning (GWO)", "accuracy": 92.84, "latency_ms": 2.99, "model_size_mb": 6.70 }
  ]
}
```

---

### 2.3 Recalculate Objective Weights Dynamically
* **Route**: `POST /api/experiments/{id}/recalculate-weights`
* **Request Body**:
```json
{
  "weight_accuracy": 0.50,
  "weight_latency": 0.20,
  "weight_model_size": 0.15,
  "weight_energy": 0.15,
  "stat_mode": "MEAN"
}
```
* **Response** (`200 OK`): Returns updated rankings, composite WSM scores, and Pareto frontier tags immediately.

---

## 3. WebSocket Real-Time Telemetry Protocol

### Route: `WS /ws/experiment/{id}`

#### Client Python Integration Example:
```python
import asyncio
import websockets
import json

async def stream_benchmark_telemetry(exp_id: str):
    uri = f"ws://localhost:8000/ws/experiment/{exp_id}"
    async with websockets.connect(uri) as ws:
        while True:
            msg = await ws.recv()
            data = json.loads(msg)
            event = data.get("event")
            
            if event == "START":
                print(f"[START] Total algorithms: {data['total_algorithms']}")
            elif event == "ITERATION_UPDATE":
                print(f"[{data['algorithm']}] Iteration {data['iteration']}/{data['max_iterations']} - Fitness: {data['current_best_fitness']:.4f}")
            elif event == "RUN_COMPLETED":
                print(f"[RUN COMPLETED] {data['algorithm']} Run {data['run_index']} - Score: {data['run_data']['overall_score']}")
            elif event == "BENCHMARK_COMPLETE":
                print(f"[COMPLETE] Benchmark Winner: {data['best_algorithm']}")
                break

asyncio.run(stream_benchmark_telemetry("EXP-20260827-0001"))
```
