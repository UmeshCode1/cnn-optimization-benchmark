# GitHub Wiki & Project Documentation Master Guide

This document contains the ready-to-publish pages for the **[GitHub Wiki](https://github.com/UmeshCode1/cnn-optimization-benchmark/wiki)**.

---

## 📑 Wiki Structure & Sitemap

1. **Home (`Home.md`)** — Project overview, mission, core research questions, and key features.
2. **System Architecture (`Architecture.md`)** — Component diagrams, async worker pipeline, SQLite schema.
3. **Algorithms & Formulations (`Algorithms.md`)** — 10 Metaheuristic mathematical equations & BaseOptimizer contracts.
4. **Benchmarking & Evaluation Protocol (`Benchmarking.md`)** — Reproducibility, seed policies, CUDA/CPU synchronization.
5. **REST & WebSocket API Reference (`API.md`)** — Complete endpoint catalog and payload schemas.
6. **Hardware Telemetry & Provenance (`Hardware.md`)** — GPU NVML, CPU RAPL, and data provenance tags.
7. **Troubleshooting & FAQ (`FAQ.md`)** — Common questions and debugging procedures.

---

## Page 1: Home (`Home.md`)

```markdown
# Welcome to the CNN Optimization Benchmark Wiki

The **CNN Optimization Benchmark Platform** is a research-grade scientific software suite designed for empirically benchmarking and comparing metaheuristic optimization algorithms applied to Deep Convolutional Neural Network (CNN) compression.

### 🎯 Primary Objectives
- **Standardized Fair Comparison**: Evaluate 10 state-of-the-art metaheuristics on identical CNN architectures, datasets, and hardware targets.
- **Multi-Objective Trade-offs**: Measure the multi-dimensional frontier across Accuracy (%), Latency (ms), Model Size (MB), and Energy Consumption (Joules).
- **Stochastic Rigor**: Aggregate multi-run repetitions with Mean, Median, Variance, and 95% Confidence Intervals.
- **Interactive Workbench**: Dynamic real-time objective re-weighting with live ranking recalculation.

### 🔗 Quick Links
- [System Architecture](Architecture)
- [Algorithm Mathematical Formulations](Algorithms)
- [Benchmarking Guide](Benchmarking)
- [API Reference](API)
```

---

## Page 2: Benchmarking Guide (`Benchmarking.md`)

```markdown
# Benchmarking & Reproducibility Guide

### 1. Reproducibility Protocol
To guarantee deterministic reproducibility:
- **Base Random Seed**: Default `42`.
- **Seed Policy**: `FIXED_PER_RUN` initializes Run $r$ with seed $\text{Base Seed} + r$.
- **Warm-Up Cycles**: 50 unmeasured forward passes to warm GPU Tensor Cores, JIT compilation, and OS caches.
- **Measured Passes**: 200 high-resolution timed passes with `torch.cuda.synchronize()`.

### 2. Decision Modes
1. **Metric Champions**: Selects the single algorithm with the absolute best individual metric.
2. **Weighted Sum Model (WSM)**: Calculates composite score based on normalized objectives:
   $$\text{Score} = (w_{\text{acc}} \tilde{A} + w_{\text{lat}} \tilde{L} + w_{\text{size}} \tilde{S} + w_{\text{energy}} \tilde{E}) \times 100$$
3. **Pareto Optimality**: Identifies the non-dominated empirical frontier.
```

---

## Page 3: REST & WebSocket API Reference (`API.md`)

```markdown
# REST & WebSocket API Reference

### Experiment Endpoints
- `POST /api/experiments`: Create and trigger a benchmark run.
- `GET /api/experiments`: List all historical benchmark runs.
- `GET /api/experiments/{id}`: Fetch complete experiment results, statistics, Pareto points, and ablations.
- `POST /api/experiments/{id}/recalculate`: Dynamically recompute rankings and scores with updated weights.
- `GET /api/experiments/{id}/export?format={csv|json|md}`: Download formatted benchmark reports.
- `WS /api/experiments/{id}/ws`: Live real-time iteration and telemetry stream.

### Resource Endpoints
- `GET /api/algorithms`: List all standard and custom registered optimizers.
- `POST /api/algorithms`: Register a custom metaheuristic optimizer.
- `DELETE /api/algorithms/{key}`: Remove a custom optimizer.
- `GET /api/datasets`: List available benchmark image datasets.
- `POST /api/datasets/upload`: Upload a custom dataset archive (.zip).
- `GET /api/models`: List available CNN baseline architectures.
- `POST /api/models`: Register a custom PyTorch CNN architecture.
- `GET /api/hardware`: Query host GPU/CPU hardware profile.
```
