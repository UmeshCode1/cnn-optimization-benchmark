"""
Sine Cosine Algorithm (SCA)
Reference: Mirjalili, S. (2016).
SCA: A Sine Cosine Algorithm for solving optimization problems.
Knowledge-Based Systems, 96, 120-133.
"""

from typing import Callable, Optional
import numpy as np
from .base import BaseOptimizer


class SineCosineOptimizer(BaseOptimizer):
    """
    Sine Cosine Algorithm fluctuates outward or towards the destination
    using mathematical functions based on sine and cosine.
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        a_constant: float = 2.0,
        seed: Optional[int] = 42,
    ):
        super().__init__(
            name="Sine Cosine Algorithm",
            acronym="SCA",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )
        self.a = a_constant

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """
        Execute one iteration of SCA.
        r1 balances exploration and exploitation by decreasing linearly.
        """
        # Linearly decreasing r1 parameter
        r1 = self.a - iteration * (self.a / self.max_iterations)

        best_idx = np.argmin(self.fitness)
        dest_pos = self.population[best_idx].copy()

        for i in range(self.population_size):
            r2 = 2.0 * np.pi * self.rng.random(self.dimension)
            r3 = 2.0 * self.rng.random(self.dimension)
            r4 = self.rng.random(self.dimension)

            # Trigonometric position update
            sine_update = self.population[i] + r1 * np.sin(r2) * np.abs(r3 * dest_pos - self.population[i])
            cosine_update = self.population[i] + r1 * np.cos(r2) * np.abs(r3 * dest_pos - self.population[i])

            new_pos = np.where(r4 < 0.5, sine_update, cosine_update)
            new_pos = self.clip_bounds(new_pos)

            fit = self.evaluate_individual(new_pos, objective_fn)
            self.population[i] = new_pos
            self.fitness[i] = fit

            if fit < self.best_fitness:
                self.best_fitness = fit
                self.best_solution = new_pos.copy()
