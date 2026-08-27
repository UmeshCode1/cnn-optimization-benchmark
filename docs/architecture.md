# System Architecture & Technical Specifications

The **CNN Optimization Benchmark Platform** is an enterprise-grade scientific research workstation designed for multi-objective metaheuristic benchmarking, hardware telemetry profiling, and deep neural network compression.

---

## 1. High-Level 3-Tier System Architecture

```mermaid
graph TB
    subgraph Tier1 [Tier 1: Client Workstation - React 19 / TypeScript / Vite]
        UI[Scientific Workbench & Dashboard]
        Viz[Interactive Visualizers: Pareto 2D/3D, Convergence, Ablation]
        DocHub[Documentation Hub & Live Report Previewer]
        ExpEngine[Multi-Format Exporter: PDF, Word DOCS, TXT, Markdown, CSV, JSON]
        WSClient[WebSocket Real-Time Telemetry Client]
    end

    subgraph Tier2 [Tier 2: Asynchronous Execution Engine - FastAPI / Python 3.10+]
        Router[REST API Router / Swagger Docs]
        WSServer[WebSocket Event Broadcaster]
        RunnerWorker[Async Background Runner & Worker Pool]
        
        subgraph Services [Analytical Services]
            WSMService[Weighted Sum Model Scoring Engine]
            ParetoService[Pareto Non-Dominated Frontier Extractor]
            StatsService[Multi-Run Statistical Aggregation Engine]
            FairnessService[Benchmark Fairness Validation Engine]
        end
        
        subgraph CompressionZoo [Compression & Metaheuristics Suite]
            PTQEngine[Post-Training Quantization: FP16 / INT8 MinMax & Histogram]
            PruneEngine[Structured L1-Norm Channel & Filter Pruning Engine]
            MetaRegistry[10 Standardized Metaheuristic Optimizers + Custom Plugin API]
        end
        
        subgraph TelemetrySuite [Hardware Telemetry & Profiling]
            NVMLCapture[NVIDIA NVML High-Frequency GPU Power Sampler]
            CUDATiming[CUDA Event Timer with torch.cuda.synchronize]
            RAPLCapture[Intel/AMD CPU RAPL Energy Profiler]
            MemoryProfiler[VRAM Peak & Disk Footprint Serializer]
        end
    end

    subgraph Tier3 [Tier 3: Persistence & Audit Tier - SQLite / SQLAlchemy]
        SQLiteDB[(SQLite Database: benchmark.db)]
        ORMModels[SQLAlchemy ORM Data Models & Provenance Signatures]
    end

    %% Client to Backend
    UI --> Router
    Viz --> Router
    DocHub --> Router
    WSClient <--> WSServer

    %% Backend Routing
    Router --> RunnerWorker
    Router --> Services
    Router --> ORMModels

    %% Worker Pipeline Execution
    RunnerWorker --> PTQEngine
    RunnerWorker --> PruneEngine
    RunnerWorker --> MetaRegistry
    RunnerWorker --> TelemetrySuite
    
    %% Telemetry to Analytics
    TelemetrySuite --> StatsService
    StatsService --> WSMService
    StatsService --> ParetoService
    
    %% Analytics to Persistence
    WSMService --> ORMModels
    ParetoService --> ORMModels
    StatsService --> ORMModels
    ORMModels --> SQLiteDB
    
    %% Real-Time Telemetry Feed
    RunnerWorker --> WSServer
```

---

## 2. End-to-End Benchmark Data Flow

The platform coordinates asynchronous background execution with non-blocking real-time UI telemetry streaming.

```mermaid
sequenceDiagram
    autonumber
    actor Researcher as Researcher / Workstation UI
    participant API as FastAPI REST Router
    participant Worker as Async Runner Worker
    participant Comp as Compression Engine (PTQ / Pruning)
    participant Optimizer as Metaheuristic Optimizer
    participant Hardware as GPU/CPU Hardware Telemetry
    participant Stats as Analytics & Pareto Engine
    participant WS as WebSocket Broadcaster
    participant DB as SQLite Database

    Researcher->>API: POST /api/experiments (Benchmark Configuration)
    API->>DB: Persist Experiment (Status = QUEUED)
    API->>Worker: Dispatch Background Runner Task
    API-->>Researcher: Return Experiment ID (201 Created)
    
    Researcher->>WS: Connect WebSocket (/ws/experiment/{id})
    
    Worker->>DB: Update Status = RUNNING
    Worker->>WS: Broadcast START Event (Total steps, Selected algorithms)
    
    %% Baseline Stage
    Worker->>Comp: Calibrate Uncompressed FP32 Baseline
    Comp->>Hardware: Measure Baseline Top-1 Acc, Latency (ms), Footprint (MB), Energy (J)
    Hardware-->>Worker: Baseline Metrics Vector
    
    %% Multi-Run Optimizer Execution Loop
    loop For Each Stochastic Run (r = 1 .. Number_of_Runs)
        loop For Each Selected Optimizer (alg in Selected_Algorithms)
            Worker->>Optimizer: Initialize Population X(0) in [0, 1]^D with Deterministic Seed
            
            loop For Each Search Iteration (t = 1 .. Max_Iterations)
                Optimizer->>Comp: Apply Candidate Compression Solution Vector X_i
                Comp->>Hardware: Rapid Proxy Fitness Evaluation
                Hardware-->>Optimizer: Fitness Value f(X_i)
                Optimizer->>Optimizer: Update Search Vectors (Exploration / Exploitation)
                Worker->>WS: Broadcast ITERATION_UPDATE (alg, run_index, iteration, best_fitness)
            end
            
            %% Final Evaluation Stage
            Worker->>Comp: Apply Global Best Solution Vector X*
            Comp->>Hardware: 50 Warmup + 200 CUDA Synchronized Inferences + NVML Power Sampling
            Hardware-->>Worker: Final Primary Metrics (Accuracy %, Latency ms, Size MB, Energy J)
            Worker->>DB: Persist ExperimentRun Record & Provenance MetricRecords
            Worker->>WS: Broadcast RUN_COMPLETED (alg, run_index, run_data)
        end
    end

    %% Aggregation & Pareto Stage
    Worker->>Stats: Aggregate Multi-Run Statistics (Mean, Median, StdDev, 95% CI)
    Worker->>Stats: Compute WSM Multi-Objective Scores & Composite Rankings
    Worker->>Stats: Extract Pareto Non-Dominated 2D/3D Frontier
    Worker->>Stats: Generate 5-Stage Stepwise Ablation Trajectory
    
    Worker->>DB: Persist Aggregated Analytics & Update Status = COMPLETED
    Worker->>WS: Broadcast BENCHMARK_COMPLETE (Experiment Summary)
    Researcher->>API: GET /api/experiments/{id} (Fetch Full Audit State)
```

---

## 3. 7-Stage Deterministic Benchmark Pipeline

To prevent hardware cache contamination, asynchronous thread latency bias, and stochastic noise, every benchmark strictly executes the following 7-stage deterministic state machine:

```
[ Stage 1: Baseline Calibration ]
   │  Dense FP32 evaluation on uncompressed CNN checkpoint.
   ▼
[ Stage 2: Quantization Stage ]
   │  Post-Training Quantization (FP16 or INT8 MinMax/Histogram calibration).
   ▼
[ Stage 3: Structured Pruning ]
   │  Layer-wise L1-norm filter importance scoring and channel removal.
   ▼
[ Stage 4: Metaheuristic Search ]
   │  Population-based exploration/exploitation over continuous space [0, 1]^D.
   ▼
[ Stage 5: Hardware Telemetry ]
   │  50 warmup passes + 200 CUDA event synchronized passes with NVML power draw.
   ▼
[ Stage 6: Statistical Aggregation ]
   │  Stochastic aggregation (Mean, Median, Std, 95% CI) across N runs.
   ▼
[ Stage 7: Multi-Objective Decision & Pareto ]
      WSM composite scoring (0-100), non-dominated frontier extraction, ablation sequence.
```

---

## 4. Hardware Telemetry Profiling Sub-System

### 4.1 Synchronized Latency Measurement Protocol
GPU kernel launches in PyTorch are asynchronous by default. To capture true hardware execution times without host CPU thread scheduling jitter, the platform uses explicit CUDA stream event synchronization:

```python
# Hardware Synchronized Latency Protocol
import torch
import numpy as np

def measure_synchronized_latency(model, input_tensor, warmup_runs=50, measured_runs=200):
    device = next(model.parameters()).device
    input_tensor = input_tensor.to(device)
    model.eval()

    # 1. Warm-up Phase: Prime GPU Tensor Cores, JIT caches, and memory controllers
    with torch.no_grad():
        for _ in range(warmup_runs):
            _ = model(input_tensor)
    
    if device.type == "cuda":
        torch.cuda.synchronize()
        start_events = [torch.cuda.Event(enable_timing=True) for _ in range(measured_runs)]
        end_events = [torch.cuda.Event(enable_timing=True) for _ in range(measured_runs)]
        
        with torch.no_grad():
            for i in range(measured_runs):
                start_events[i].record()
                _ = model(input_tensor)
                end_events[i].record()
        
        torch.cuda.synchronize()
        latencies_ms = [s.elapsed_time(e) for s, e in zip(start_events, end_events)]
    else:
        # High-resolution monotonic CPU clock
        import time
        latencies_ms = []
        with torch.no_grad():
            for _ in range(measured_runs):
                t0 = time.perf_counter()
                _ = model(input_tensor)
                t1 = time.perf_counter()
                latencies_ms.append((t1 - t0) * 1000.0)

    return {
        "mean_latency_ms": float(np.mean(latencies_ms)),
        "std_latency_ms": float(np.std(latencies_ms)),
        "p95_latency_ms": float(np.percentile(latencies_ms, 95)),
        "min_latency_ms": float(np.min(latencies_ms)),
        "max_latency_ms": float(np.max(latencies_ms))
    }
```

### 4.2 NVIDIA NVML Energy Capture Subsystem
Energy consumption (in Joules) is measured by polling the GPU power draw at high frequency using the NVIDIA Management Library (`pynvml`):

$$E_{\text{Joules}} = \int_{0}^{T} P(t) \, dt \approx \sum_{k=1}^{M} P(t_k) \cdot \Delta t_k$$

Where $P(t_k)$ is instantaneous board power in Watts and $\Delta t_k$ is the sampling interval ($\le 10\,\text{ms}$).

---

## 5. Database Schema (Entity-Relationship Diagram)

The SQLite database (`benchmark.db`) is structured with strict foreign keys, cascade rules, and cryptographic audit signatures:

```mermaid
erDiagram
    HARDWARE_PROFILES ||--o{ EXPERIMENTS : "executes_on"
    EXPERIMENTS ||--|{ EXPERIMENT_RUNS : "contains"
    EXPERIMENTS ||--|{ METRIC_RECORDS : "records"
    EXPERIMENTS ||--o{ ABLATION_RECORDS : "decomposes"
    CUSTOM_MODELS ||--o{ EXPERIMENTS : "evaluated_in"

    HARDWARE_PROFILES {
        string id PK
        string device_name
        string device_type
        string cpu_model
        int cpu_cores
        string gpu_model
        float gpu_memory_mb
        float ram_gb
        string os_info
        string cuda_version
        string torch_version
    }

    EXPERIMENTS {
        string id PK "e.g. EXP-20260827-0001"
        string title
        string description
        string status "QUEUED, RUNNING, COMPLETED, FAILED"
        boolean is_demo
        string dataset_name
        string cnn_model_name
        string quantization_type "NONE, FP16, INT8"
        string pruning_method "STRUCTURED_FILTER, UNSTRUCTURED"
        float pruning_ratio
        string selected_algorithms_json
        int population_size
        int max_iterations
        int number_of_runs
        string random_seed_policy "FIXED_PER_RUN, STRICT_IDENTICAL"
        int base_seed
        int warmup_runs
        int measured_runs
        float weight_accuracy
        float weight_latency
        float weight_model_size
        float weight_energy
        string hardware_id FK
        float baseline_accuracy
        float baseline_latency_ms
        float baseline_size_mb
        float baseline_energy_j
        float baseline_flops_m
        float baseline_params_m
        string best_algorithm
        text best_algorithm_reason
        datetime created_at
        datetime completed_at
    }

    EXPERIMENT_RUNS {
        int id PK
        string experiment_id FK
        string algorithm_acronym
        int run_index
        int seed
        string status
        float accuracy
        float accuracy_drop
        float latency_ms
        float latency_p95_ms
        float model_size_mb
        float energy_j
        string energy_source
        float parameters_m
        float flops_m
        float compression_ratio
        float speedup
        float size_reduction_pct
        float energy_reduction_pct
        float best_fitness
        float overall_score
        float optimization_time_seconds
        int candidate_evaluations
        text convergence_curve_json
        text best_candidate_config_json
        datetime created_at
    }

    METRIC_RECORDS {
        int id PK
        string experiment_id FK
        string algorithm_acronym
        string metric_name
        float metric_value
        string unit
        string provenance
        text measurement_method
        string source
        datetime timestamp
    }

    ABLATION_RECORDS {
        int id PK
        string experiment_id FK
        string stage_name
        int stage_order
        float accuracy
        float latency_ms
        float model_size_mb
        float energy_j
        float parameters_m
        float flops_m
        text description
    }

    CUSTOM_MODELS {
        string id PK
        string name
        string architecture_type
        int input_channels
        string input_resolution
        int num_classes
        float base_parameters_m
        float base_flops_m
        float base_size_mb
        datetime created_at
    }
```

---

## 6. WebSocket Telemetry Protocol Specification

The WebSocket endpoint (`/ws/experiment/{id}`) broadcasts strongly-typed JSON packets during benchmark execution:

### 6.1 `START` Event
Sent immediately when background execution starts:
```json
{
  "event": "START",
  "experiment_id": "EXP-20260827-0001",
  "total_algorithms": 10,
  "number_of_runs": 5,
  "max_iterations": 30,
  "total_steps": 1500
}
```

### 6.2 `ITERATION_UPDATE` Event
Sent at each optimizer search iteration $t \in [1, T]$:
```json
{
  "event": "ITERATION_UPDATE",
  "experiment_id": "EXP-20260827-0001",
  "algorithm": "GWO",
  "run_index": 1,
  "iteration": 14,
  "max_iterations": 30,
  "current_best_fitness": 0.0412,
  "step": 14,
  "total_steps": 1500,
  "progress_pct": 0.93
}
```

### 6.3 `RUN_COMPLETED` Event
Sent when a single stochastic run completes:
```json
{
  "event": "RUN_COMPLETED",
  "experiment_id": "EXP-20260827-0001",
  "algorithm": "GWO",
  "run_index": 1,
  "progress_pct": 6.67,
  "run_data": {
    "algorithm": "GWO",
    "run_index": 1,
    "accuracy": 92.84,
    "latency_ms": 2.99,
    "model_size_mb": 6.70,
    "energy_j": 0.1220,
    "best_fitness": 0.0385,
    "overall_score": 95.20
  }
}
```

### 6.4 `BENCHMARK_COMPLETE` Event
Sent when all runs, statistics, Pareto extractions, and ablations have finished:
```json
{
  "event": "BENCHMARK_COMPLETE",
  "experiment_id": "EXP-20260827-0001",
  "best_algorithm": "GWO",
  "total_runs_completed": 50,
  "execution_time_seconds": 142.8
}
```

---

## 7. Scalability & Fault Tolerance Guarantees

1. **Non-Blocking Asynchronous Concurrency**: FastAPI async coroutines decouple client HTTP requests from heavy PyTorch execution workers running in thread pools.
2. **Deterministic Process Isolation**: Heavy model evaluations are protected by exception barriers ensuring single-run failures gracefully log without corrupting the experiment batch.
3. **Zero Cache Leakage**: `torch.cuda.empty_cache()` and garbage collection are invoked between algorithm switches to eliminate cross-algorithm VRAM fragmentation.
4. **Audit Immutability**: Historical experiments are immutable once transitioned to `COMPLETED` status, ensuring scientific citations remain permanent.
