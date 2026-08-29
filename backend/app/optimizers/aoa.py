"""
Arithmetic Optimization Algorithm (AOA)
Reference: Abualigah, L., Diabat, A., Mirjalili, S., Abd Elaziz, M., & Gandomi, A. H. (2021).
The Arithmetic Optimization Algorithm. Computer Methods in Applied Mechanics and Engineering, 376, 113609.
"""

from typing import Callable, Optional
import numpy as np
from .base import BaseOptimizer


class ArithmeticOptimizer(BaseOptimizer):
    """
    Arithmetic Optimization Algorithm utilizes the distributional behavior
    of the main arithmetic operators: Division (D), Multiplication (M),
    Subtraction (S), and Addition (A).
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        moa_min: float = 0.2,
        moa_max: float = 0.9,
        alpha: float = 5.0,
        mu: float = 0.499,
        seed: Optional[int] = 42,
    ):
        super().__init__(
            name="Arithmetic Optimization Algorithm",
            acronym="AOA",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )
        self.moa_min = moa_min
        self.moa_max = moa_max
        self.alpha = alpha
        self.mu = mu

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """
        Execute one iteration of AOA.
        Math Optimizer Accelerated (MOA) and Math Optimizer Probability (MOP)
        dynamically guide exploration vs exploitation arithmetic branches.
        """
        # Math Optimizer Accelerated (MOA)
        MOA = self.moa_min + iteration * ((self.moa_max - self.moa_min) / max(1, self.max_iterations))

        # Math Optimizer Probability (MOP)
        MOP = 1.0 - ((iteration ** (1.0 / self.alpha)) / (max(1, self.max_iterations) ** (1.0 / self.alpha)))

        best_idx = np.argmin(self.fitness)
        best_pos = self.population[best_idx].copy()

        new_population = np.zeros_like(self.population)
        dim_scale = (self.ub - self.lb) * self.mu + self.lb

        for i in range(self.population_size):
            r1 = self.rng.random(self.dimension)
            r2 = self.rng.random(self.dimension)
            r3 = self.rng.random(self.dimension)

            # High dispersion (Exploration): Division and Multiplication
            div_mask = (r1 > MOA) & (r2 > 0.5)
            mul_mask = (r1 > MOA) & (r2 <= 0.5)

            # Low dispersion (Exploitation): Subtraction and Addition
            sub_mask = (r1 <= MOA) & (r3 > 0.5)
            add_mask = (r1 <= MOA) & (r3 <= 0.5)

            new_pos = np.zeros(self.dimension)
            new_pos[div_mask] = (best_pos / (MOP + 1e-12) * dim_scale)[div_mask]
            new_pos[mul_mask] = (best_pos * MOP * dim_scale)[mul_mask]
            new_pos[sub_mask] = (best_pos - MOP * dim_scale)[sub_mask]
            new_pos[add_mask] = (best_pos + MOP * dim_scale)[add_mask]

            new_pos = self.clip_bounds(new_pos)
            fit = self.evaluate_individual(new_pos, objective_fn)
            new_population[i] = new_pos
            self.fitness[i] = fit

        self.population = new_population

        best_idx = np.argmin(self.fitness)
        if self.fitness[best_idx] < self.best_fitness:
            self.best_fitness = self.fitness[best_idx]
            self.best_solution = self.population[best_idx].copy()
