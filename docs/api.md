# REST API & WebSocket Specification

## Endpoints

### 1. Experiments
- `POST /api/experiments`: Create and run a new benchmark experiment.
- `GET /api/experiments`: List all historical experiments.
- `GET /api/experiments/{id}`: Retrieve detailed metrics, statistical summaries, and runs.
- `POST /api/experiments/{id}/run`: Start or re-run a benchmark.
- `POST /api/experiments/{id}/clone`: Clone an experiment configuration.
- `POST /api/experiments/{id}/recalculate-weights`: Dynamically recalculate rankings with new objective weights.
- `POST /api/experiments/{id}/compare-selected`: Filter and compare a selected subset of algorithms.
- `POST /api/experiments/validate-fairness`: Verify identical experimental conditions.

### 2. Algorithms & Hardware
- `GET /api/algorithms`: Retrieve catalog of all 10 metaheuristics with equations and citations.
- `GET /api/hardware`: Retrieve host system hardware profile.

### 3. Pareto & Ablation
- `GET /api/pareto/{id}`: Non-dominated Pareto frontier coordinates.
- `GET /api/ablation/{id}`: 5-stage ablation study records.

### 4. Reports & Exports
- `GET /api/reports/{id}/csv`: Download comparison results as CSV.
- `GET /api/reports/{id}/markdown`: Download formatted research paper markdown report.
- `GET /api/reports/{id}/json`: Download full structured JSON state.

### 5. WebSocket Real-Time Stream
- `WS /ws/experiment/{id}`: Real-time progress updates for running benchmarks.
