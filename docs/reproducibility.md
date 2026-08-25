# Experiment Reproducibility & Audit Trail

To ensure complete experimental reproducibility in peer review, every benchmark stores:
- **Experiment Identifier**: Unique alphanumeric hash (e.g. `EXP-20260825-0001`).
- **Deterministic Seed Policy**: Base seed (e.g. `42`) with fixed iteration offsets so any researcher can re-execute the exact search trajectory.
- **Hardware Profile**: CPU model, GPU model, RAM GB, CUDA toolkit version, PyTorch version, and OS.
- **Compression Parameters**: Quantization type, pruning ratio, and layer boundary constraints.
- **Clone & Re-run**: Built-in API endpoints (`POST /api/experiments/{id}/clone` and `POST /api/experiments/{id}/run`) to re-execute or branch benchmarks with 1-click.
