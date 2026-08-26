# Metaheuristic Optimization Algorithms — Mathematical Formulations

This document provides rigorous mathematical formulations, exploration/exploitation mechanics, search equations, and primary citations for the 10 metaheuristics benchmarked in the **CNN Optimization Benchmark Platform**.

---

## 1. Summary of Standard Metaheuristic Registry

| Key | Full Name | Acronym | Category | Year | Primary Citation | Complexity per Iteration |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GWO** | Grey Wolf Optimizer | GWO | Swarm Intelligence | 2014 | *Mirjalili et al., Adv. Eng. Softw.* | $\mathcal{O}(N \times D)$ |
| **WOA** | Whale Optimization Algorithm | WOA | Swarm Intelligence | 2016 | *Mirjalili & Lewis, Adv. Eng. Softw.* | $\mathcal{O}(N \times D)$ |
| **ALO** | Ant Lion Optimizer | ALO | Swarm Intelligence | 2015 | *Mirjalili, Adv. Eng. Softw.* | $\mathcal{O}(N \times D)$ |
| **MFO** | Moth-Flame Optimization | MFO | Physics / Biology | 2015 | *Mirjalili, Knowl.-Based Syst.* | $\mathcal{O}(N \times D)$ |
| **GOA** | Grasshopper Optimization Algorithm | GOA | Swarm Intelligence | 2017 | *Saremi et al., Adv. Eng. Softw.* | $\mathcal{O}(N^2 \times D)$ |
| **MVO** | Multi-Verse Optimizer | MVO | Physics / Cosmology | 2016 | *Mirjalili et al., Neural Comput. & Appl.* | $\mathcal{O}(N \times D)$ |
| **SCA** | Sine Cosine Algorithm | SCA | Mathematical Trigonometric | 2016 | *Mirjalili, Knowl.-Based Syst.* | $\mathcal{O}(N \times D)$ |
| **AOA** | Arithmetic Optimization Algorithm | AOA | Mathematical Algebraic | 2021 | *Abualigah et al., Comput. Methods Appl. Mech.* | $\mathcal{O}(N \times D)$ |
| **MGO** | Mountain Gazelle Optimizer | MGO | Swarm Intelligence | 2022 | *Abdollahzadeh et al., Adv. Eng. Softw.* | $\mathcal{O}(N \times D)$ |
| **GMO** | Geometric Mean Optimizer | GMO | Mathematical Geometric | 2023 | *Mirrashid & Naderpour, Soft Comput.* | $\mathcal{O}(N \times D)$ |

---

## 2. Mathematical Formulations

### 1. Grey Wolf Optimizer (GWO)
* **Principle**: Mimics the social hierarchy ($\alpha > \beta > \delta > \omega$) and hunting mechanism of grey wolves.
* **Encircling Prey**:
  $$\vec{D} = |\vec{C} \cdot \vec{X}_p(t) - \vec{X}(t)|, \quad \vec{X}(t+1) = \vec{X}_p(t) - \vec{A} \cdot \vec{D}$$
  where $\vec{A} = 2\vec{a} \cdot \vec{r}_1 - \vec{a}$, $\vec{C} = 2\vec{r}_2$, and $\vec{a}$ decreases linearly from $2$ to $0$.
* **Hunting Update**:
  $$\vec{X}_1 = \vec{X}_\alpha - \vec{A}_1 \cdot |\vec{C}_1 \vec{X}_\alpha - \vec{X}|, \quad \vec{X}_2 = \vec{X}_\beta - \vec{A}_2 \cdot |\vec{C}_2 \vec{X}_\beta - \vec{X}|, \quad \vec{X}_3 = \vec{X}_\delta - \vec{A}_3 \cdot |\vec{C}_3 \vec{X}_\delta - \vec{X}|$$
  $$\vec{X}(t+1) = \frac{\vec{X}_1 + \vec{X}_2 + \vec{X}_3}{3}$$

---

### 2. Whale Optimization Algorithm (WOA)
* **Principle**: Models bubble-net feeding behavior of humpback whales using shrinking encircling and spiral position updates.
* **Search Mechanics**:
  $$\vec{X}(t+1) = \begin{cases}
  \vec{X}^*(t) - \vec{A} \cdot |\vec{C} \vec{X}^*(t) - \vec{X}(t)| & \text{if } p < 0.5 \land |\vec{A}| < 1 \\
  \vec{X}_{\text{rand}} - \vec{A} \cdot |\vec{C} \vec{X}_{\text{rand}} - \vec{X}(t)| & \text{if } p < 0.5 \land |\vec{A}| \ge 1 \\
  \vec{D}' \cdot e^{b l} \cdot \cos(2\pi l) + \vec{X}^*(t) & \text{if } p \ge 0.5
  \end{cases}$$
  where $\vec{D}' = |\vec{X}^*(t) - \vec{X}(t)|$, $b$ is a logarithmic spiral constant, and $l \in [-1, 1]$.

---

### 3. Ant Lion Optimizer (ALO)
* **Principle**: Simulates interactions between antlions and trapped ants in sand pits.
* **Random Walk Formulation**:
  $$X(t) = \left[ 0, \text{cumsum}(2r(t_1)-1), \dots, \text{cumsum}(2r(t_T)-1) \right]$$
  $$R_i^t = \frac{(X_i^t - a_i) \cdot (d_i - c_i^t)}{b_i - a_i} + c_i$$
* **Catching Prey Update**:
  $$\text{Ant}_i^t = \frac{R_A^t + R_E^t}{2}$$
  where $R_A^t$ is random walk around selected antlion and $R_E^t$ is random walk around the elite.

---

### 4. Moth-Flame Optimization (MFO)
* **Principle**: Transverse orientation navigation mechanism of moths around flames.
* **Logarithmic Spiral Update**:
  $$M_i = S(M_i, F_j) = D_i \cdot e^{b t} \cdot \cos(2\pi t) + F_j$$
  $$D_i = |F_j - M_i|$$
  where $b$ defines the spiral shape and $t \in [-1, 1]$ is a convergence step parameter.

---

### 5. Grasshopper Optimization Algorithm (GOA)
* **Principle**: Models social interaction forces (attraction, repulsion, comfort zone) and wind advection in grasshopper swarms.
* **Position Update**:
  $$X_i^d = c \left( \sum_{j=1, j \ne i}^{N} c \frac{ub_d - lb_d}{2} s(|x_j^d - x_i^d|) \frac{x_j - x_i}{d_{ij}} \right) + \hat{T}_d$$
  where $s(r) = f e^{-r/l} - e^{-r}$ is the social force function and $c$ decreases comfort zone radius over iterations.

---

### 6. Multi-Verse Optimizer (MVO)
* **Principle**: Based on cosmological multi-verse concepts: white holes (inflation), black holes (matter absorption), and wormholes (space tunneling).
* **Wormhole Tunneling**:
  $$x_i^j = \begin{cases}
  \begin{cases}
  X_j + \text{TDR} \times ((ub_j - lb_j) \times r_4 + lb_j) & r_3 < 0.5 \\
  X_j - \text{TDR} \times ((ub_j - lb_j) \times r_4 + lb_j) & r_3 \ge 0.5
  \end{cases} & r_2 < \text{WEP} \\
  x_i^j & r_2 \ge \text{WEP}
  \end{cases}$$
  where $\text{WEP} = \text{min} + t \times \left(\frac{\text{max} - \text{min}}{T}\right)$ and $\text{TDR} = 1 - \frac{t^{1/p}}{T^{1/p}}$.

---

### 7. Sine Cosine Algorithm (SCA)
* **Principle**: Leverages trigonometric sine and cosine functions to oscillate outward (exploration) or inward toward the destination (exploitation).
* **Position Update**:
  $$X_i^{t+1} = \begin{cases}
  X_i^t + r_1 \cdot \sin(r_2) \cdot |r_3 P_i^t - X_i^t| & r_4 < 0.5 \\
  X_i^t + r_1 \cdot \cos(r_2) \cdot |r_3 P_i^t - X_i^t| & r_4 \ge 0.5
  \end{cases}$$
  where $r_1 = a - t \frac{a}{T}$, $r_2 \in [0, 2\pi]$, $r_3 \in [0, 2]$, and $r_4 \in [0, 1]$.

---

### 8. Arithmetic Optimization Algorithm (AOA)
* **Principle**: Employs mathematical operators: Multiplication ($\times$) and Division ($\div$) for high-dispersion exploration; Addition ($+$) and Subtraction ($-$) for localized exploitation.
* **Math Optimizer Accelerated (MOA) Condition**:
  $$\text{MOA}(t) = \text{Min} + t \times \left( \frac{\text{Max} - \text{Min}}{T} \right)$$
  $$\text{MOP}(t) = 1 - \left(\frac{t^{1/\alpha}}{T^{1/\alpha}}\right)$$
  $$x_{i,j}(t+1) = \begin{cases}
  \text{best}(x_j) \div (\text{MOP} + \epsilon) \cdot ((ub_j - lb_j) \cdot \mu + lb_j) & r_1 > \text{MOA} \land r_2 < 0.5 \\
  \text{best}(x_j) \times \text{MOP} \cdot ((ub_j - lb_j) \cdot \mu + lb_j) & r_1 > \text{MOA} \land r_2 \ge 0.5 \\
  \text{best}(x_j) - \text{MOP} \cdot ((ub_j - lb_j) \cdot \mu + lb_j) & r_1 \le \text{MOA} \land r_3 < 0.5 \\
  \text{best}(x_j) + \text{MOP} \cdot ((ub_j - lb_j) \cdot \mu + lb_j) & r_1 \le \text{MOA} \land r_3 \ge 0.5
  \end{cases}$$

---

### 9. Mountain Gazelle Optimizer (MGO)
* **Principle**: Simulates bachelor male herd movements, territorial defense, maternal vigilance, and predator escape mechanisms.
* **Exploration / Defense Phase**:
  $$X_{\text{new}} = \text{Elite} - |\vec{M}| \cdot \vec{r}_1 + \text{Step} \cdot \vec{r}_2$$

---

### 10. Geometric Mean Optimizer (GMO)
* **Principle**: Uses the geometric mean operator $\left(\prod_{i=1}^n x_i\right)^{1/n}$ to balance multidirectional search trajectories without getting trapped in single-dimension bias.
* **Mean Update Vector**:
  $$\vec{X}_{i}(t+1) = \vec{X}_i(t) + \vec{r} \odot \left( \sqrt[k]{\vec{X}_{\text{best}} \odot \vec{X}_{\text{random}}} - \vec{X}_i(t) \right)$$

---

## 3. Extending the Registry: Custom Plugin Contract

To register a custom optimizer, implement the `BaseOptimizer` Python abstract class:

```python
from app.optimizers.base import BaseOptimizer
import numpy as np

class CustomSwarmOptimizer(BaseOptimizer):
    def __init__(self, population_size: int = 20, max_iterations: int = 30, seed: int = 42):
        super().__init__(
            name="Custom Swarm Optimizer",
            acronym="CSO",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )

    def optimize(self, fitness_fn, dim: int = 10, lb: float = 0.0, ub: float = 1.0) -> dict:
        rng = np.random.RandomState(self.seed)
        pop = rng.uniform(lb, ub, (self.population_size, dim))
        fitness = np.array([fitness_fn(ind) for ind in pop])
        
        best_idx = np.argmin(fitness)
        best_solution = pop[best_idx].copy()
        best_fitness = fitness[best_idx]
        history = [float(best_fitness)]

        for t in range(self.max_iterations):
            # Custom search equations here...
            for i in range(self.population_size):
                pop[i] = np.clip(pop[i] + rng.normal(0, 0.05, dim), lb, ub)
                fit = fitness_fn(pop[i])
                if fit < fitness[i]:
                    fitness[i] = fit
                    if fit < best_fitness:
                        best_fitness = fit
                        best_solution = pop[i].copy()
            history.append(float(best_fitness))

        return {
            "best_solution": best_solution.tolist(),
            "best_fitness": float(best_fitness),
            "convergence_curve": history,
        }
```
