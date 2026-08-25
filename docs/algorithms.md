# Metaheuristic Algorithms Reference & Mathematical Specifications

All 10 metaheuristics implement the `BaseOptimizer` interface with standardized search bounds, population initialization, and convergence tracking.

| Acronym | Algorithm Name | Literature Citation | Category |
| :--- | :--- | :--- | :--- |
| **GWO** | Grey Wolf Optimizer | Mirjalili et al. (2014) *Adv. Eng. Softw.* | Swarm Intelligence |
| **WOA** | Whale Optimization Algorithm | Mirjalili & Lewis (2016) *Adv. Eng. Softw.* | Swarm Intelligence |
| **ALO** | Ant Lion Optimizer | Mirjalili (2015) *Adv. Eng. Softw.* | Swarm Intelligence |
| **MFO** | Moth-Flame Optimization | Mirjalili (2015) *Knowl.-Based Syst.* | Physics / Biology |
| **GOA** | Grasshopper Optimization Algorithm | Saremi et al. (2017) *Adv. Eng. Softw.* | Swarm Intelligence |
| **MVO** | Multi-Verse Optimizer | Mirjalili et al. (2016) *Neural Comput. Appl.* | Physics-Based |
| **SCA** | Sine Cosine Algorithm | Mirjalili (2016) *Knowl.-Based Syst.* | Trigonometric |
| **AOA** | Arithmetic Optimization Algorithm | Abualigah et al. (2021) *Comput. Methods Appl. Mech. Eng.* | Mathematical |
| **MGO** | Mountain Gazelle Optimizer | Abdollahzadeh et al. (2022) *Arch. Comput. Methods Eng.* | Swarm Intelligence |
| **GMO** | Geometric Mean Optimizer | Mirrashid & Naderpour (2023) *Soft Comput.* | Mathematical |

### Standard Interface Contract
```python
class BaseOptimizer(ABC):
    def initialize_population(self, dimension, lower_bounds, upper_bounds) -> np.ndarray
    def clip_bounds(self, positions) -> np.ndarray
    def evaluate_individual(self, individual, objective_fn) -> float
    def step(self, iteration, objective_fn) -> None
    def optimize(self, objective_fn, dimension, lower_bounds, upper_bounds) -> OptimizationResult
```
