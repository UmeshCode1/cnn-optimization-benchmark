# Metaheuristic Optimization Algorithms — Mathematical Formulations & Search Mechanics

This document provides complete mathematical derivations, exploration-vs-exploitation mechanics, search equations, algorithmic pseudocode, and primary citations for all 10 metaheuristic algorithms benchmarked in the **CNN Optimization Benchmark Platform**.

---

## 1. Summary of Standard Metaheuristic Registry

| Key | Full Name | Taxonomy / Category | Year | Primary Citation | Complexity per Iteration | Search Space Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GWO** | Grey Wolf Optimizer | Swarm Intelligence | 2014 | *Mirjalili et al., Adv. Eng. Softw.* | $\mathcal{O}(N \times D)$ | Hierarchical leadership ($\alpha, \beta, \delta$) |
| **WOA** | Whale Optimization Algorithm | Swarm Intelligence | 2016 | *Mirjalili & Lewis, Adv. Eng. Softw.* | $\mathcal{O}(N \times D)$ | Bubble-net spiral & encircling |
| **ALO** | Ant Lion Optimizer | Swarm Intelligence | 2015 | *Mirjalili, Adv. Eng. Softw.* | $\mathcal{O}(N \times D)$ | Random walks & cone-pit traps |
| **MFO** | Moth-Flame Optimization | Physics / Biological | 2015 | *Mirjalili, Knowl.-Based Syst.* | $\mathcal{O}(N \times D)$ | Logarithmic transverse orientation |
| **GOA** | Grasshopper Optimization Algorithm | Swarm Intelligence | 2017 | *Saremi et al., Adv. Eng. Softw.* | $\mathcal{O}(N^2 \times D)$ | Swarm attraction/repulsion forces |
| **MVO** | Multi-Verse Optimizer | Cosmology / Physics | 2016 | *Mirjalili et al., Neural Comput. & Appl.* | $\mathcal{O}(N \times D)$ | White/black holes & wormhole tunneling |
| **SCA** | Sine Cosine Algorithm | Mathematical Trigonometric | 2016 | *Mirjalili, Knowl.-Based Syst.* | $\mathcal{O}(N \times D)$ | Cyclic trigonometric oscillation |
| **AOA** | Arithmetic Optimization Algorithm | Mathematical Algebraic | 2021 | *Abualigah et al., CMAME* | $\mathcal{O}(N \times D)$ | High/low dispersion arithmetic math |
| **MGO** | Mountain Gazelle Optimizer | Swarm Intelligence | 2022 | *Abdollahzadeh et al., Adv. Eng. Softw.* | $\mathcal{O}(N \times D)$ | Territorial dominance & bachelor herds |
| **GMO** | Geometric Mean Optimizer | Mathematical Geometric | 2023 | *Mirrashid & Naderpour, Soft Comput.* | $\mathcal{O}(N \times D)$ | Multi-dimensional geometric mean vectors |

---

## 2. Multi-Objective CNN Compression Formulation

In the **CNN Optimization Benchmark Platform**, candidate compression configurations are mapped to a continuous $D$-dimensional vector:

$$\vec{X} = [x_1, x_2, \dots, x_D] \in [0.0, 1.0]^D$$

Where $D$ corresponds to the number of parameterized layers in the target CNN architecture (e.g. $D = 18$ for ResNet-18). Each dimension $x_l \in [0, 1]$ represents the relative channel pruning ratio and quantization boundary for layer $l$.

### Multi-Objective Fitness Evaluation Function
The objective is to minimize a multi-dimensional penalty score $f(\vec{X})$ that simultaneously balances classification accuracy degradation, inference latency, memory footprint, and energy consumption:

$$\min_{\vec{X} \in [0, 1]^D} f(\vec{X}) = w_{\text{acc}} \cdot \Delta \text{Acc}(\vec{X}) + w_{\text{lat}} \cdot \widetilde{\text{Lat}}(\vec{X}) + w_{\text{size}} \cdot \widetilde{\text{Size}}(\vec{X}) + w_{\text{energy}} \cdot \widetilde{\text{Energy}}(\vec{X})$$

Subject to user-specified objective weights:

$$\sum w_k = w_{\text{acc}} + w_{\text{lat}} + w_{\text{size}} + w_{\text{energy}} = 1.0, \quad w_k \ge 0$$

Where:
- $\Delta \text{Acc}(\vec{X}) = \frac{\text{Acc}_{\text{base}} - \text{Acc}(\vec{X})}{\text{Acc}_{\text{base}}}$ (normalized accuracy loss)
- $\widetilde{\text{Lat}}(\vec{X}) = \frac{\text{Lat}(\vec{X})}{\text{Lat}_{\text{base}}}$ (normalized latency ratio)
- $\widetilde{\text{Size}}(\vec{X}) = \frac{\text{Size}(\vec{X})}{\text{Size}_{\text{base}}}$ (normalized model footprint ratio)
- $\widetilde{\text{Energy}}(\vec{X}) = \frac{\text{Energy}(\vec{X})}{\text{Energy}_{\text{base}}}$ (normalized energy consumption ratio)

---

## 3. Mathematical Formulations of the 10 Metaheuristics

---

### 1. Grey Wolf Optimizer (GWO)
* **Citation**: Mirjalili, S., Mirjalili, S. M., & Lewis, A. (2014). *Grey Wolf Optimizer*. Advances in Engineering Software, 69, 46–61.
* **Hierarchy**: The population is structured into $\alpha$ (leader), $\beta$ (subordinate advisor), $\delta$ (scout/sentinel), and $\omega$ (general pack).

#### Encircling Prey Formulation:
$$\vec{D} = \left| \vec{C} \odot \vec{X}_p(t) - \vec{X}(t) \right|$$
$$\vec{X}(t+1) = \vec{X}_p(t) - \vec{A} \odot \vec{D}$$

Where the coefficient vectors $\vec{A}$ and $\vec{C}$ are computed as:
$$\vec{A} = 2\vec{a} \odot \vec{r}_1 - \vec{a}, \quad \vec{C} = 2\vec{r}_2$$
$$\vec{a}(t) = 2 - 2 \cdot \left(\frac{t}{T}\right)$$
$\vec{r}_1, \vec{r}_2 \sim \mathcal{U}(0, 1)^D$, and $t$ is the current iteration out of maximum $T$.

#### Hunting Position Update:
$$\vec{X}_1 = \vec{X}_\alpha - \vec{A}_1 \odot \left| \vec{C}_1 \odot \vec{X}_\alpha - \vec{X} \right|$$
$$\vec{X}_2 = \vec{X}_\beta - \vec{A}_2 \odot \left| \vec{C}_2 \odot \vec{X}_\beta - \vec{X} \right|$$
$$\vec{X}_3 = \vec{X}_\delta - \vec{A}_3 \odot \left| \vec{C}_3 \odot \vec{X}_\delta - \vec{X} \right|$$
$$\vec{X}(t+1) = \frac{\vec{X}_1 + \vec{X}_2 + \vec{X}_3}{3}$$

---

### 2. Whale Optimization Algorithm (WOA)
* **Citation**: Mirjalili, S., & Lewis, A. (2016). *The Whale Optimization Algorithm*. Advances in Engineering Software, 95, 51–67.
* **Mechanics**: Combines shrinking encircling with a logarithmic spiral trajectory simulating bubble-net feeding.

#### Position Update Equations:
$$\vec{X}(t+1) = \begin{cases} 
\vec{X}^{*}(t) - \vec{A} \odot \left| \vec{C} \odot \vec{X}^{*}(t) - \vec{X}(t) \right| & \text{if } p < 0.5 \text{ and } |\vec{A}| < 1 \\
\vec{X}_{\text{rand}} - \vec{A} \odot \left| \vec{C} \odot \vec{X}_{\text{rand}} - \vec{X}(t) \right| & \text{if } p < 0.5 \text{ and } |\vec{A}| \ge 1 \\
\vec{D}' \odot e^{b l} \cdot \cos(2\pi l) + \vec{X}^{*}(t) & \text{if } p \ge 0.5
\end{cases}$$

Where $\vec{D}' = |\vec{X}^{*}(t) - \vec{X}(t)|$, $b$ is a constant defining the logarithmic spiral shape, $l \sim \mathcal{U}(-1, 1)$, and $p \sim \mathcal{U}(0, 1)$.

---

### 3. Ant Lion Optimizer (ALO)
* **Citation**: Mirjalili, S. (2015). *The Ant Lion Optimizer*. Advances in Engineering Software, 83, 80–98.
* **Mechanics**: Models the interaction between antlion cone-pit traps and chaotic random walks of prey ants.

#### Normalized Random Walk Equation:
$$X(t) = \left[ 0, \, \text{cumsum}(2r(t_1)-1), \, \dots, \, \text{cumsum}(2r(t_T)-1) \right]$$
$$R_i^t = \frac{(X_i^t - a_i) \cdot (d_i^t - c_i^t)}{b_i - a_i} + c_i^t$$

Where $a_i$ and $b_i$ are the minimum and maximum of the random walk for dimension $i$, and $c_i^t, d_i^t$ define the shrinking boundary radius at iteration $t$.

#### Catching Prey & Elite Pull:
$$\text{Ant}_i^t = \frac{R_A^t + R_E^t}{2}$$

Where $R_A^t$ is the random walk around an antlion selected via roulette wheel, and $R_E^t$ is the random walk around the global elite antlion.

---

### 4. Moth-Flame Optimization (MFO)
* **Citation**: Mirjalili, S. (2015). *Moth-flame optimization algorithm: A novel nature-inspired heuristic paradigm*. Knowledge-Based Systems, 89, 228–249.
* **Mechanics**: Simulates transverse orientation navigation of moths in nature maintaining a fixed angle relative to celestial flames.

#### Logarithmic Spiral Update:
$$S(M_i, F_j) = D_i \cdot e^{b t} \cdot \cos(2\pi t) + F_j$$
$$D_i = |F_j - M_i|$$

Where $M_i$ is the $i$-th moth, $F_j$ is the $j$-th flame, $b$ is the spiral constant, and $t \sim \mathcal{U}(-1, 1)$ defines step distance. The number of active flames decreases adaptively over iterations:

$$\text{Flames}(t) = \text{round}\left( N - t \cdot \frac{N - 1}{T} \right)$$

---

### 5. Grasshopper Optimization Algorithm (GOA)
* **Citation**: Saremi, S., Mirjalili, S., & Lewis, A. (2017). *Grasshopper Optimization Algorithm: Theory and application*. Advances in Engineering Software, 105, 30–47.
* **Mechanics**: Balances social interaction forces (attraction, comfort, repulsion) and wind direction.

#### Swarm Interaction Equation:
$$X_i^d = c \cdot \left( \sum_{j=1, j \ne i}^{N} c \cdot \frac{ub_d - lb_d}{2} \cdot s\left(\left|x_j^d - x_i^d\right|\right) \frac{x_j - x_i}{d_{ij}} \right) + \hat{T}_d$$

Where $\hat{T}_d$ is the target value in the $d$-th dimension, and the social attraction/repulsion function $s(r)$ is:
$$s(r) = f \cdot e^{-r/l} - e^{-r}$$
The comfort-zone coefficient $c$ decreases linearly to transition from global exploration to local exploitation:
$$c = c_{\text{max}} - t \cdot \frac{c_{\text{max}} - c_{\text{min}}}{T}$$

---

### 6. Multi-Verse Optimizer (MVO)
* **Citation**: Mirjalili, S., Mirjalili, S. M., & Hatamlou, A. (2016). *Multi-Verse Optimizer: a nature-inspired algorithm for global optimization*. Neural Computing and Applications, 27(2), 495–513.
* **Mechanics**: Cosmological model utilizing white hole inflation rates, black hole matter attraction, and wormhole space tunnels.

#### Wormhole Tunneling Equation:
$$x_i^j(t+1) = \begin{cases} 
X_j^* + \text{TDR} \cdot ((ub_j - lb_j) \cdot r_4 + lb_j) & \text{if } r_2 < \text{WEP} \text{ and } r_3 < 0.5 \\
X_j^* - \text{TDR} \cdot ((ub_j - lb_j) \cdot r_4 + lb_j) & \text{if } r_2 < \text{WEP} \text{ and } r_3 \ge 0.5 \\
x_i^j(t) & \text{if } r_2 \ge \text{WEP}
\end{cases}$$

Where the Wormhole Existence Probability ($\text{WEP}$) and Traveling Distance Rate ($\text{TDR}$) are defined as:
$$\text{WEP} = \text{WEP}_{\text{min}} + t \cdot \left(\frac{\text{WEP}_{\text{max}} - \text{WEP}_{\text{min}}}{T}\right)$$
$$\text{TDR} = 1 - \left(\frac{t}{T}\right)^{1/p}$$

---

### 7. Sine Cosine Algorithm (SCA)
* **Citation**: Mirjalili, S. (2016). *SCA: A Sine Cosine Algorithm for solving optimization problems*. Knowledge-Based Systems, 96, 120–133.
* **Mechanics**: Trigonometric wave oscillation spanning inward and outward search vectors.

#### Position Update:
$$X_i^{t+1} = \begin{cases} 
X_i^t + r_1 \cdot \sin(r_2) \cdot \left| r_3 P_i^t - X_i^t \right| & \text{if } r_4 < 0.5 \\
X_i^t + r_1 \cdot \cos(r_2) \cdot \left| r_3 P_i^t - X_i^t \right| & \text{if } r_4 \ge 0.5 
\end{cases}$$

Where $P_i^t$ is the destination position (best candidate solution), $r_1 = a - t \frac{a}{T}$ linearly contracts search amplitude from $a$ to $0$, $r_2 \sim \mathcal{U}(0, 2\pi)$, $r_3 \sim \mathcal{U}(0, 2)$, and $r_4 \sim \mathcal{U}(0, 1)$.

---

### 8. Arithmetic Optimization Algorithm (AOA)
* **Citation**: Abualigah, L., Diabat, A., Mirjalili, S., Abd Elaziz, M., & Gandomi, A. H. (2021). *The Arithmetic Optimization Algorithm*. Computer Methods in Applied Mechanics and Engineering, 376, 113609.
* **Mechanics**: Employs distribution behaviors of standard arithmetic operators ($\div, \times$ for global exploration; $-, +$ for local exploitation).

#### Math Optimizer Accelerated ($\text{MOA}$) Function:
$$\text{MOA}(t) = \text{Min} + t \cdot \left(\frac{\text{Max} - \text{Min}}{T}\right)$$

#### Position Update Equations:
$$x_{i,j}(t+1) = \begin{cases} 
x_{\text{best},j} \div (\text{MOP} + \epsilon) \cdot ((ub_j - lb_j) \cdot \mu + lb_j) & \text{if } r_1 > \text{MOA}(t) \text{ and } r_2 < 0.5 \\
x_{\text{best},j} \times \text{MOP} \cdot ((ub_j - lb_j) \cdot \mu + lb_j) & \text{if } r_1 > \text{MOA}(t) \text{ and } r_2 \ge 0.5 \\
x_{\text{best},j} - \text{MOP} \cdot ((ub_j - lb_j) \cdot \mu + lb_j) & \text{if } r_1 \le \text{MOA}(t) \text{ and } r_3 < 0.5 \\
x_{\text{best},j} + \text{MOP} \cdot ((ub_j - lb_j) \cdot \mu + lb_j) & \text{if } r_1 \le \text{MOA}(t) \text{ and } r_3 \ge 0.5
\end{cases}$$

Where the Math Optimizer Probability is $\text{MOP}(t) = 1 - \left(\frac{t}{T}\right)^{1/\alpha}$.

---

### 9. Mountain Gazelle Optimizer (MGO)
* **Citation**: Abdollahzadeh, B., Gharehchopogh, F. S., Khodadadi, N., & Mirjalili, S. (2022). *Mountain Gazelle Optimizer: a new nature-inspired metaheuristic algorithm*. Advances in Engineering Software, 174, 103282.
* **Mechanics**: Models the social hierarchy of mountain gazelles including bachelor male herds, maternal herds, and solitary territorial males.

#### Dynamic Behavioral Update:
$$X_{\text{new}} = \begin{cases} 
X_{\text{best}} + \text{Cof}_1 \cdot (X_{\text{rand}} - X_i) & \text{if } r < 0.25 \quad (\text{Territorial defense}) \\
X_i + \text{Cof}_2 \cdot (X_{\text{best}} - X_{\text{rand}}) & \text{if } 0.25 \le r < 0.50 \quad (\text{Maternal nursing herd}) \\
X_{\text{rand}} + \text{Cof}_3 \cdot (ub - lb) \cdot r' & \text{if } r \ge 0.50 \quad (\text{Bachelor herd migration}) 
\end{cases}$$

---

### 10. Geometric Mean Optimizer (GMO)
* **Citation**: Mirrashid, M., & Naderpour, H. (2023). *Geometric mean optimizer: a new human-inspired metaheuristic algorithm*. Soft Computing, 27(19), 14193–14223.
* **Mechanics**: Leverages the multi-dimensional geometric mean operator across evaluated candidate fitness populations.

#### Geometric Mean Formulation:
$$\vec{G} = \left( \prod_{i=1}^{K} \vec{X}_i \right)^{1/K} = \exp\left( \frac{1}{K} \sum_{i=1}^{K} \ln(\vec{X}_i + \epsilon) \right)$$
$$\vec{X}_i(t+1) = \vec{X}_i(t) + \omega \cdot (\vec{G} - \vec{X}_i(t)) + \beta \cdot (\vec{X}^* - \vec{X}_i(t))$$

Where $\omega$ and $\beta$ are guidance weights balancing swarm centroid attraction with individual best solutions.

---

## 4. Custom Optimizer Integration Guide

Researchers can register new metaheuristics by inheriting from `BaseOptimizer`:

```python
from backend.app.optimizers.base import BaseOptimizer
import numpy as np

class CustomSwarmOptimizer(BaseOptimizer):
    def __init__(self, population_size: int = 20, max_iterations: int = 50, seed: int = 42):
        super().__init__(
            name="Custom Swarm Optimizer",
            acronym="CSO",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )

    def step(self, iteration: int, objective_fn):
        # 1. Update population positions using custom operators
        new_pop = np.zeros_like(self.population)
        for i in range(self.population_size):
            step = self.rng.normal(0, 0.1, size=self.dimension)
            new_pos = self.clip_bounds(self.population[i] + step)
            fit = self.evaluate_individual(new_pos, objective_fn)
            new_pop[i] = new_pos
            self.fitness[i] = fit

        self.population = new_pop
        best_idx = np.argmin(self.fitness)
        if self.fitness[best_idx] < self.best_fitness:
            self.best_fitness = self.fitness[best_idx]
            self.best_solution = self.population[best_idx].copy()
```
