# Contributing to CNN Optimization Benchmark

Thank you for your interest in contributing to the **CNN Optimization Benchmark Platform**! We welcome contributions from researchers, machine learning practitioners, and open-source developers.

---

## 🌟 Ways to Contribute

1. **Adding New Metaheuristic Algorithms**:
   - Create a new optimizer file in `backend/app/optimizers/`.
   - Inherit from `BaseOptimizer` (`backend/app/optimizers/base.py`).
   - Implement the `.optimize(fitness_fn, dim, lb, ub)` contract.
   - Register the optimizer in `backend/app/optimizers/registry.py`.
   - Add unit test in `tests/test_optimizers.py`.

2. **Adding Vision Datasets & CNN Baselines**:
   - Register new architectures in `backend/app/api/models.py`.
   - Add dataset split loaders in `backend/app/api/datasets.py`.

3. **Frontend UI/UX Enhancements**:
   - Build or improve React 19 components in `frontend/src/components/`.
   - Use `IBM Plex Sans` and `IBM Plex Mono` typography with semantic color tokens.

4. **Reporting Bugs & Suggesting Features**:
   - Open an issue using our [Bug Report](https://github.com/UmeshCode1/cnn-optimization-benchmark/issues/new?template=bug_report.md) or [Feature Request](https://github.com/UmeshCode1/cnn-optimization-benchmark/issues/new?template=feature_request.md) templates.

---

## 🛠️ Development Workflow

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cnn-optimization-benchmark.git
   cd cnn-optimization-benchmark
   ```

2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/my-new-optimizer
   ```

3. **Install Dependencies**:
   ```bash
   # Backend
   python -m pip install -r requirements.txt

   # Frontend
   cd frontend && npm install && cd ..
   ```

4. **Run Tests**:
   ```bash
   python -m pytest tests -v
   cd frontend && npm run build && cd ..
   ```

5. **Commit & Submit a Pull Request**:
   - Write clear, concise commit messages.
   - Open a PR against `master` describing your changes.

---

## 📜 Code of Conduct

Please review and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) in all community interactions.
