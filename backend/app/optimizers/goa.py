"""
Grasshopper Optimization Algorithm (GOA)
Reference: Saremi, S., Mirjalili, S., & Lewis, A. (2017).
Grasshopper Optimisation Algorithm: Theory and application.
Advances in Engineering Software, 105, 30-47.
"""

from typing import Callable, Optional
import numpy as np
from .base import BaseOptimizer


class GrasshopperOptimizer(BaseOptimizer):
    """
    Grasshopper Optimization Algorithm models the swarming behavior of grasshoppers,
    balancing attraction and repulsion social forces within comfort zones.
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        c_max: float = 1.0,
        c_min: float = 0.00004,
        seed: Optional[int] = 42,
    ):
        super().__init__(
            name="Grasshopper Optimization Algorithm",
            acronym="GOA",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )
        self.c_max = c_max
        self.c_min = c_min

    def _social_force(self, r: np.ndarray, f: float = 0.5, l: float = 1.5) -> np.ndarray:
        """Social interaction force function s(r) = f * exp(-r/l) - exp(-r)."""
        return f * np.exp(-r / l) - np.exp(-r)

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """
        Execute one iteration of GOA.
        c decreases dynamically to reduce comfort zone around the target.
        """
        # Decreasing comfort zone parameter c
        c = self.c_max - iteration * ((self.c_max - self.c_min) / self.max_iterations)
        
        target = self.best_solution.copy() if self.best_solution is not None else self.population[0].copy()

        new_population = np.zeros_like(self.population)

        for i in range(self.population_size):
            s_interaction = np.zeros(self.dimension)
            for j in range(self.population_size):
                if i != j:
                    dist = np.linalg.norm(self.population[j] - self.population[i]) + 1e-12
                    # Normalized vector
                    r_ij_vec = (self.population[j] - self.population[i]) / dist
                    # Social force
                    force = self._social_force(dist)
                    s_interaction += (self.ub - self.lb) / 2.0 * force * r_ij_vec

            # Position update: c * (sum_j c * (ub-lb)/2 * s(dist) * dir) + Target
            new_pos = c * (c * s_interaction) + target
            new_pos = self.clip_bounds(new_pos)
            
            fit = self.evaluate_individual(new_pos, objective_fn)
            new_population[i] = new_pos
            self.fitness[i] = fit

        self.population = new_population

        best_idx = np.argmin(self.fitness)
        if self.fitness[best_idx] < self.best_fitness:
            self.best_fitness = self.fitness[best_idx]
            self.best_solution = self.population[best_idx].copy()
