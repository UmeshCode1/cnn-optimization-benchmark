"""
Grey Wolf Optimizer (GWO)
Reference: Mirjalili, S., Mirjalili, S. M., & Lewis, A. (2014).
Grey Wolf Optimizer. Advances in Engineering Software, 69, 46-61.
"""

from typing import Callable, Optional
import numpy as np
from .base import BaseOptimizer


class GreyWolfOptimizer(BaseOptimizer):
    """
    Grey Wolf Optimizer mimics the social hierarchy (Alpha, Beta, Delta, Omega)
    and hunting mechanism of grey wolves in nature.
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        seed: Optional[int] = 42,
    ):
        super().__init__(
            name="Grey Wolf Optimizer",
            acronym="GWO",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )
        self.alpha_pos: Optional[np.ndarray] = None
        self.alpha_score: float = float("inf")
        self.beta_pos: Optional[np.ndarray] = None
        self.beta_score: float = float("inf")
        self.delta_pos: Optional[np.ndarray] = None
        self.delta_score: float = float("inf")

    def _update_hierarchy(self) -> None:
        """Sort population to identify Alpha, Beta, and Delta wolves."""
        sorted_indices = np.argsort(self.fitness)
        
        self.alpha_pos = self.population[sorted_indices[0]].copy()
        self.alpha_score = self.fitness[sorted_indices[0]]
        
        self.beta_pos = self.population[sorted_indices[1]].copy()
        self.beta_score = self.fitness[sorted_indices[1]]
        
        self.delta_pos = self.population[sorted_indices[2]].copy()
        self.delta_score = self.fitness[sorted_indices[2]]
        
        if self.alpha_score < self.best_fitness:
            self.best_fitness = self.alpha_score
            self.best_solution = self.alpha_pos.copy()

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """
        Execute one iteration of GWO:
        a decreases linearly from 2 to 0.
        Position update encircles alpha, beta, and delta positions.
        """
        self._update_hierarchy()
        
        # Linearly decreasing parameter a from 2 to 0
        a = 2.0 - 2.0 * (iteration / self.max_iterations)

        for i in range(self.population_size):
            # Encircling Alpha
            r1 = self.rng.random(self.dimension)
            r2 = self.rng.random(self.dimension)
            A1 = 2.0 * a * r1 - a
            C1 = 2.0 * r2
            D_alpha = np.abs(C1 * self.alpha_pos - self.population[i])
            X1 = self.alpha_pos - A1 * D_alpha

            # Encircling Beta
            r1 = self.rng.random(self.dimension)
            r2 = self.rng.random(self.dimension)
            A2 = 2.0 * a * r1 - a
            C2 = 2.0 * r2
            D_beta = np.abs(C2 * self.beta_pos - self.population[i])
            X2 = self.beta_pos - A2 * D_beta

            # Encircling Delta
            r1 = self.rng.random(self.dimension)
            r2 = self.rng.random(self.dimension)
            A3 = 2.0 * a * r1 - a
            C3 = 2.0 * r2
            D_delta = np.abs(C3 * self.delta_pos - self.population[i])
            X3 = self.delta_pos - A3 * D_delta

            # Position update (average of three guides)
            new_pos = (X1 + X2 + X3) / 3.0
            new_pos = self.clip_bounds(new_pos)
            
            fit = self.evaluate_individual(new_pos, objective_fn)
            self.population[i] = new_pos
            self.fitness[i] = fit

        self._update_hierarchy()
