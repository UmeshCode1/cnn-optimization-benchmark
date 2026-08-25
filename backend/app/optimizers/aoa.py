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
        MOA = self.moa_min + iteration * ((self.moa_max - self.moa_min) / self.max_iterations)

        # Math Optimizer Probability (MOP)
        MOP = 1.0 - ((iteration ** (1.0 / self.alpha)) / (self.max_iterations ** (1.0 / self.alpha)))

        best_idx = np.argmin(self.fitness)
        best_pos = self.population[best_idx].copy()

        new_population = np.zeros_like(self.population)

        for i in range(self.population_size):
            new_pos = np.zeros(self.dimension)
            for j in range(self.dimension):
                r1 = self.rng.random()
                r2 = self.rng.random()
                r3 = self.rng.random()

                if r1 > MOA:
                    # High dispersion (Exploration): Division and Multiplication
                    if r2 > 0.5:
                        # Division operator
                        new_pos[j] = best_pos[j] / (MOP + 1e-12) * ((self.ub[j] - self.lb[j]) * self.mu + self.lb[j])
                    else:
                        # Multiplication operator
                        new_pos[j] = best_pos[j] * MOP * ((self.ub[j] - self.lb[j]) * self.mu + self.lb[j])
                else:
                    # Low dispersion (Exploitation): Subtraction and Addition
                    if r3 > 0.5:
                        # Subtraction operator
                        new_pos[j] = best_pos[j] - MOP * ((self.ub[j] - self.lb[j]) * self.mu + self.lb[j])
                    else:
                        # Addition operator
                        new_pos[j] = best_pos[j] + MOP * ((self.ub[j] - self.lb[j]) * self.mu + self.lb[j])

            new_pos = self.clip_bounds(new_pos)
            fit = self.evaluate_individual(new_pos, objective_fn)
            new_population[i] = new_pos
            self.fitness[i] = fit

        self.population = new_population

        best_idx = np.argmin(self.fitness)
        if self.fitness[best_idx] < self.best_fitness:
            self.best_fitness = self.fitness[best_idx]
            self.best_solution = self.population[best_idx].copy()
