# System Architecture: CNN Optimization Benchmark

## Overview
The **CNN Optimization Benchmark Platform** is designed to address the foundational research question:
> *“Which optimization algorithm provides the best trade-off between CNN accuracy, inference latency, model size, and energy consumption under identical experimental conditions?”*

## High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                            RESEARCH LAB SPA (React 19 + Vite)                |
|  - Scientific Lab Dark / Light Design System                                 |
|  - 9-Step Experiment Wizard & Fairness Configuration Validator               |
|  - Interactive Pareto Front Explorer (2D/3D non-dominated sorting)           |
|  - Multi-Run Statistical Boxplots & Confidence Intervals                     |
|  - Real-Time Progress WebSocket Subscriber & Ablation Decomposition           |
+-------------------------------------------------------------------------------+
                                        | REST JSON + WebSocket (/ws)
+-------------------------------------------------------------------------------+
|                            FASTAPI BENCHMARK ENGINE                           |
|  +-------------------------------------------------------------------------+  |
|  | Routers: /experiments, /algorithms, /hardware, /pareto, /ablation, etc.  |  |
|  +-------------------------------------------------------------------------+  |
|  | Asynchronous Experiment Dispatcher & Multi-Run Worker                   |  |
|  +-------------------------------------------------------------------------+  |
|  | 10 Metaheuristic Optimizers (BaseOptimizer Contract):                   |  |
|  |   1. GWO (Grey Wolf Optimizer)             6. MVO (Multi-Verse)         |  |
|  |   2. WOA (Whale Optimization Algorithm)    7. SCA (Sine Cosine)         |  |
|  |   3. ALO (Ant Lion Optimizer)              8. AOA (Arithmetic Optimizer)|  |
|  |   4. MFO (Moth-Flame Optimization)         9. MGO (Mountain Gazelle)    |  |
|  |   5. GOA (Grasshopper Optimization)       10. GMO (Geometric Mean)      |  |
|  +-------------------------------------------------------------------------+  |
|  | PyTorch Compression & Evaluation Pipeline:                               |  |
|  |   - Quantization: FP32, FP16, INT8 Dynamic & Static PTQ                 |  |
|  |   - Pruning: Structured (Channel/Filter L1-norm) & Unstructured          |  |
|  |   - Measurement: Accuracy, Latency (warm-up + sync), Size, Energy, FLOPs |  |
|  +-------------------------------------------------------------------------+  |
|  | SQLite / PostgreSQL Database (SQLAlchemy ORM)                           |  |
+-------------------------------------------------------------------------------+
```

## Key Modules
1. **`backend/app/optimizers/`**: Contains the 10 metaheuristics implementing the exact mathematical update equations from peer-reviewed literature.
2. **`backend/app/evaluation/`**: Latency measurement suite with warm-up cycles, model state serialization, hardware energy telemetry, and analytical FLOPs/MACs accounting.
3. **`backend/app/services/`**: Pareto non-dominated sorting, multi-run distribution statistics, weighted multi-criteria ranking, and ablation analysis.
4. **`frontend/src/`**: Modern React SPA featuring interactive scientific charts, sorting tables, and exportable research reports.
