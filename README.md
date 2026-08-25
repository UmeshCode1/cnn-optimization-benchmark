# CNN Optimization Benchmark Platform

> **A Scientific Research Laboratory Platform for Comparing Metaheuristic Optimization Algorithms on CNN Compression**

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%20v4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Core Research Question

> **“Which optimization algorithm provides the best trade-off between CNN accuracy, inference latency, model size, and energy consumption under identical experimental conditions?”**

The **CNN Optimization Benchmark** platform provides a scientifically rigorous environment to compare 10 metaheuristic optimization algorithms on the **same CNN model** and **same dataset** under **identical hardware and compression constraints**.

---

## 🔬 Supported Optimization Algorithms

All 10 algorithms adhere to the standardized `BaseOptimizer` mathematical contract:

1. **GWO** — Grey Wolf Optimizer *(Mirjalili et al., 2014)*
2. **WOA** — Whale Optimization Algorithm *(Mirjalili & Lewis, 2016)*
3. **ALO** — Ant Lion Optimizer *(Mirjalili, 2015)*
4. **MFO** — Moth-Flame Optimization *(Mirjalili, 2015)*
5. **GOA** — Grasshopper Optimization Algorithm *(Saremi et al., 2017)*
6. **MVO** — Multi-Verse Optimizer *(Mirjalili et al., 2016)*
7. **SCA** — Sine Cosine Algorithm *(Mirjalili, 2016)*
8. **AOA** — Arithmetic Optimization Algorithm *(Abualigah et al., 2021)*
9. **MGO** — Mountain Gazelle Optimizer *(Abdollahzadeh et al., 2022)*
10. **GMO** — Geometric Mean Optimizer *(Mirrashid & Naderpour, 2023)*

---

## 📊 Key Features & Scientific Standards

- **Primary Metrics (with Mandatory Physical Units)**:
  - **Accuracy (%)**: Top-1 classification accuracy evaluated on standardized test splits.
  - **Latency (ms)**: Synchronized time per batch inference with warm-up cycles.
  - **Model Size (MB)**: Serialized weight state artifact memory footprint.
  - **Energy Consumption (J)**: Direct NVML GPU / CPU power telemetry with clear provenance.
- **Three Scientific Decision Modes**:
  - **Mode 1**: Best Individual Metric Champions (Highest Accuracy, Lowest Latency, Smallest Size, Lowest Energy).
  - **Mode 2**: Weighted Multi-Objective Score (WSM with customizable 100% normalized weights).
  - **Mode 3**: Pareto Optimality (Empirical non-dominated trade-off frontier).
- **Multi-Run Stochastic Analysis**: Boxplot distributions with Mean, Median, Std Dev, Min, Max, and 95% Confidence Intervals.
- **Ablation Study**: 5-stage sequential decomposition:
  $$\text{Baseline} \rightarrow \text{+Quantization} \rightarrow \text{+Pruning} \rightarrow \text{+Quant+Pruning} \rightarrow \text{+Optimizer}$$
- **Audit Provenance Badges**: Explicit tagging of `● MEASURED`, `◆ CALCULATED`, `▲ ESTIMATED`, and `DEMO DATA`.
- **Publication-Ready Exports**: 1-Click download of CSV results, complete JSON payloads, and formatted Markdown research reports.

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Python 3.10+ (or Python 3.14)
- Node.js v18+ & npm
- Git

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/UmeshCode1/cnn-optimization-benchmark.git
cd cnn-optimization-benchmark

# Install Backend Dependencies
python -m pip install -r requirements.txt

# Seed the initial benchmark dataset
python scripts/seed_benchmark.py

# Run Backend Server
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

In a second terminal:
```bash
# Install and run Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser (or `http://localhost:8000` for the production single-process bundle).

---

## 🐳 Docker Deployment

Run with Docker Compose:
```bash
docker-compose up --build -d
```
Access the application at `http://localhost:8000`.

---

## 🧪 Testing Suite

Execute comprehensive unit, algorithm, and API integration tests:
```bash
# Run pytest
python -m pytest tests -v
```

All 22 unit and integration tests verify optimizer boundary constraints, convergence monotonicity, FLOPs counters, latency synchronization, and fairness validation.

---

## 📁 Repository Structure

```
cnn-optimization-benchmark/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST & WebSocket routers
│   │   ├── database/        # SQLAlchemy SQLite models & session
│   │   ├── evaluation/      # Accuracy, Latency, Size, Energy, FLOPs evaluators
│   │   ├── optimizers/      # 10 Metaheuristic algorithm implementations
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Pareto, Statistics, Scoring, Ablation, Export services
│   │   └── workers/         # Async benchmark execution engine
│   └── main.py              # Application entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/      # Scientific UI design system, Navbar, Sidebar
│   │   ├── charts/          # Pareto scatter, Convergence lines, Boxplots, Bar charts
│   │   ├── views/           # Dashboard, Wizard, Results, Pareto, Ablation, Reports
│   │   └── services/        # REST & WebSocket API client
├── docs/                    # Complete architectural & research documentation
├── scripts/                 # Seeding & benchmark runners
├── tests/                   # Pytest test suite
├── Dockerfile               # Production multi-stage Docker build
├── docker-compose.yml       # Container orchestration
└── README.md
```

---

## 📄 License & Citation

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

If you use this benchmarking platform in your research, please cite:
```bibtex
@software{cnn_optimization_benchmark_2026,
  author = {CNN Optimization Benchmark Team},
  title = {CNN Optimization Benchmark: A Comparative Research Platform for Metaheuristics in Neural Network Compression},
  year = {2026},
  url = {https://github.com/UmeshCode1/cnn-optimization-benchmark}
}
```
