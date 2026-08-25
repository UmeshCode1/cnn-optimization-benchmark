"""
Geometric Mean Optimizer (GMO)
Reference: Mirrashid, M., & Naderpour, H. (2023).
Geometric Mean Optimizer: A new metaheuristic algorithm.
Soft Computing, 27(13), 8565-8594.
"""

from typing import Callable, Optional
import numpy as np
from .base import BaseOptimizer


class GeometricMeanOptimizer(BaseOptimizer):
    """
    Geometric Mean Optimizer uses the geometric mean of elite candidate vectors
    to determine balanced, multi-faceted exploration and exploitation guide paths.
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        m_elites: int = 4,
        seed: Optional[int] = 42,
    ):
        super().__init__(
            name="Geometric Mean Optimizer",
            acronym="GMO",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )
        self.m_elites = max(2, min(m_elites, population_size // 2))

    def _compute_geometric_mean(self, elite_matrix: np.ndarray) -> np.ndarray:
        """
        Compute signed geometric mean vector across M elite candidate vectors:
        GM_j = prod(|X_{k,j}|)^(1/M) * sign(prod(X_{k,j}))
        """
        abs_matrix = np.abs(elite_matrix) + 1e-12
        log_mean = np.mean(np.log(abs_matrix), axis=0)
        gm_magnitude = np.exp(log_mean)
        
        # Preserve sign orientation from majority elite signs
        signs = np.sign(elite_matrix)
        signs[signs == 0] = 1.0
        avg_sign = np.sign(np.sum(signs, axis=0))
        avg_sign[avg_sign == 0] = 1.0

        return gm_magnitude * avg_sign

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """
        Execute one iteration of GMO.
        Calculates geometric mean of top-M elite solutions and updates positions.
        """
        # Sort population to identify top M elites
        sorted_indices = np.argsort(self.fitness)
        elites = self.population[sorted_indices[:self.m_elites]].copy()
        best_solution = elites[0].copy()

        # Compute Geometric Mean guide
        gm_guide = self._compute_geometric_mean(elites)

        # Dynamic scaling factor decreasing over iterations
        scale = 1.0 - (iteration / self.max_iterations) ** 2.0
        beta = 0.5 * (1.0 + np.cos(np.pi * iteration / self.max_iterations))

        new_population = np.zeros_like(self.population)

        for i in range(self.population_size):
            r1 = self.rng.random(self.dimension)
            r2 = self.rng.random(self.dimension)

            # Update toward Geometric Mean guide and best solution
            new_pos = self.population[i] + scale * r1 * (gm_guide - self.population[i]) + beta * r2 * (best_solution - self.population[i])
            new_pos = self.clip_bounds(new_pos)

            fit = self.evaluate_individual(new_pos, objective_fn)

            # Greedy selection
            if fit < self.fitness[i]:
                new_population[i] = new_pos
                self.fitness[i] = fit
            else:
                new_population[i] = self.population[i].copy()

        self.population = new_population

        best_idx = np.argmin(self.fitness)
        if self.fitness[best_idx] < self.best_fitness:
            self.best_fitness = self.fitness[best_idx]
            self.best_solution = self.population[best_idx].copy()
