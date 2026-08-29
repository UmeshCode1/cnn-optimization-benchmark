# 🔬 CNN Optimization Benchmark — Master Wiki & Research Manual

<div align="center">

[![Live Production](https://img.shields.io/badge/Production-cnn.umeshlabs.in-00D2FF?style=for-the-badge&logo=googlechrome&logoColor=white)](https://cnn.umeshlabs.in/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Pytest](https://img.shields.io/badge/Tests-35%20Passing-19A974?style=for-the-badge&logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**A Scientific Research Workstation & Laboratory Platform for Empirically Benchmarking Metaheuristic Optimization Algorithms on Deep CNN Compression**

🌐 **[Visit Live Deployment: cnn.umeshlabs.in](https://cnn.umeshlabs.in/)**

</div>

---

## 📑 Wiki Directory & Core Modules

* 🏛️ **[System Architecture & Pipeline](https://github.com/UmeshCode1/cnn-optimization-benchmark/blob/master/docs/architecture.md)**: 3-tier workstation architecture, 7-stage deterministic execution engine, and SQLite persistence.
* 🧮 **[10 Metaheuristic Algorithms & Mathematics](https://github.com/UmeshCode1/cnn-optimization-benchmark/blob/master/docs/algorithms.md)**: Complete mathematical derivations, search space vectors, and exploration vs. exploitation dynamics.
* ⚡ **[Hardware Telemetry & Power Profiling](https://github.com/UmeshCode1/cnn-optimization-benchmark/blob/master/docs/energy.md)**: Synchronized CUDA microsecond timers and continuous 100Hz NVIDIA NVML power sampling.
* 📉 **[Multi-Objective Scoring & Pareto Frontier](https://github.com/UmeshCode1/cnn-optimization-benchmark/blob/master/docs/metrics.md)**: Weighted Sum Model (WSM 0-100) and 6-axis non-dominated empirical frontier extraction.
* 🔬 **[Reproducibility & Statistical Protocol](https://github.com/UmeshCode1/cnn-optimization-benchmark/blob/master/docs/reproducibility.md)**: Deterministic seed schedules, 50-pass warmup invariants, and Student's $t$ 95% Confidence Intervals.
* 🔌 **[REST & WebSocket API Reference](https://github.com/UmeshCode1/cnn-optimization-benchmark/blob/master/docs/api.md)**: Full endpoint specifications and real-time WebSocket packet structures.

---

## 🎯 Primary Research Mission & Scope

> **“Which metaheuristic optimization algorithm achieves the superior multi-objective Pareto trade-off between Top-1 Accuracy, Inference Latency, Model Footprint, and Energy Consumption under identical hardware and compression constraints?”**

The **CNN Optimization Benchmark Platform** provides an empirical, reproducible, and standardized research workstation to compare **10 state-of-the-art metaheuristics** (plus user-registered custom algorithms) across deep Convolutional Neural Networks (ResNet-18, MobileNetV2, ShuffleNetV2, VGG-16, EfficientNet-B0) on standardized vision benchmarks (CIFAR-10, CIFAR-100, MNIST, Fashion-MNIST, ImageNet-1k Subset) and custom dataset uploads.

---

## 🔬 Supported Metaheuristic Optimizers

All algorithms operate on standardized continuous hyperparameter decision spaces $\vec{X} \in [0.0, 1.0]^D$:

| Key | Algorithm Name | Category | Primary Citation | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **GWO** | Grey Wolf Optimizer | Swarm Intelligence | Mirjalili et al. (2014) | $\mathcal{O}(N \times D)$ |
| **WOA** | Whale Optimization Algorithm | Swarm Intelligence | Mirjalili & Lewis (2016) | $\mathcal{O}(N \times D)$ |
| **ALO** | Ant Lion Optimizer | Swarm Intelligence | Mirjalili (2015) | $\mathcal{O}(N \times D)$ |
| **MFO** | Moth-Flame Optimization | Physics / Biology | Mirjalili (2015) | $\mathcal{O}(N \times D)$ |
| **GOA** | Grasshopper Optimization Algorithm | Swarm Intelligence | Saremi et al. (2017) | $\mathcal{O}(N^2 \times D)$ |
| **MVO** | Multi-Verse Optimizer | Cosmology / Physics | Mirjalili et al. (2016) | $\mathcal{O}(N \times D)$ |
| **SCA** | Sine Cosine Algorithm | Mathematical Trigonometric | Mirjalili (2016) | $\mathcal{O}(N \times D)$ |
| **AOA** | Arithmetic Optimization Algorithm | Mathematical Algebraic | Abualigah et al. (2021) | $\mathcal{O}(N \times D)$ |
| **MGO** | Mountain Gazelle Optimizer | Swarm Intelligence | Abdollahzadeh et al. (2022) | $\mathcal{O}(N \times D)$ |
| **GMO** | Geometric Mean Optimizer | Mathematical Geometric | Mirrashid & Naderpour (2023) | $\mathcal{O}(N \times D)$ |

---

## 📐 Mathematical Formulation

### 1. Multi-Objective Fitness Minimization

$$\min_{\vec{X} \in [0, 1]^D} f(\vec{X}) = w_{\text{acc}} \cdot \Delta \text{Acc}(\vec{X}) + w_{\text{lat}} \cdot \widetilde{\text{Lat}}(\vec{X}) + w_{\text{size}} \cdot \widetilde{\text{Size}}(\vec{X}) + w_{\text{energy}} \cdot \widetilde{\text{Energy}}(\vec{X})$$

### 2. Weighted Sum Model (WSM) Scoring (0 - 100)

$$\text{Composite Score}_i = \left( w_{\text{acc}} \cdot \tilde{A}_i + w_{\text{lat}} \cdot \tilde{L}_i + w_{\text{size}} \cdot \tilde{S}_i + w_{\text{energy}} \cdot \tilde{E}_i \right) \times 100$$

### 3. Continuous Power & Compute Throughput

$$\text{Power (Watts)} = \frac{\text{Energy (Joules)}}{\text{Latency (ms)} \times 10^{-3}}$$

$$\text{TOPs} = \frac{\text{FLOPs (M)} \times 10^6}{\text{Latency (ms)} \times 10^{-3} \times 10^{12}} = \frac{\text{FLOPs (M)}}{\text{Latency (ms)} \times 10^6}$$

---

## ⚙️ Scientific Reproducibility Protocol

* **Deterministic Seed Policy**: `seed = base_seed + run_index` for every stochastic run.
* **Warmup Cycles**: 50 unmeasured forward passes to eliminate GPU thermal throttling and driver jitter.
* **CUDA Synchronization**: `torch.cuda.synchronize()` surrounding 200 measured passes.
* **NVML Power Integral**: Continuous high-frequency GPU sampling for exact Joule measurements.
* **Statistical Rigor**: Mean, Median, Standard Deviation, and 95% Student's $t$ Confidence Intervals.

---

## 🔌 API & Client Integration Quickstart

```python
import requests

# 1. Trigger benchmark
response = requests.post("https://cnn.umeshlabs.in/api/experiments", json={
    "title": "CIFAR-10 ResNet-18 Benchmark",
    "dataset_name": "CIFAR-10",
    "cnn_model_name": "ResNet-18",
    "quantization_type": "INT8",
    "pruning_ratio": 0.40,
    "selected_algorithms": ["GWO", "WOA", "ALO", "MGO"],
    "max_iterations": 30,
    "number_of_runs": 5
})

exp_id = response.json()["id"]
print(f"Benchmark triggered: {exp_id}")

# 2. Fetch full results and Pareto winners
results = requests.get(f"https://cnn.umeshlabs.in/api/experiments/{exp_id}").json()
print(f"Top Algorithm: {results['best_algorithm']} — {results['best_algorithm_reason']}")
```

---

## 👨‍💻 Author & Maintainer

### **Umesh Patel**
*AI & Deep Learning Systems Researcher / Software Engineer*

- **Platform**: [https://cnn.umeshlabs.in/](https://cnn.umeshlabs.in/)
- **GitHub**: [@UmeshCode1](https://github.com/UmeshCode1)
- **Repository**: [https://github.com/UmeshCode1/cnn-optimization-benchmark](https://github.com/UmeshCode1/cnn-optimization-benchmark)
