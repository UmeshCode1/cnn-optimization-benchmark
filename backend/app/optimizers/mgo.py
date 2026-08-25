"""
Mountain Gazelle Optimizer (MGO)
Reference: Abdollahzadeh, B., Gharehchopogh, F. S., & Mirjalili, S. (2022).
Mountain Gazelle Optimizer: A new nature-inspired metaheuristic algorithm.
Archives of Computational Methods in Engineering, 29(7), 5573-5612.
"""

from typing import Callable, Optional
import numpy as np
from scipy.special import gamma
from .base import BaseOptimizer


class MountainGazelleOptimizer(BaseOptimizer):
    """
    Mountain Gazelle Optimizer models the social and survival behaviors of mountain
    gazelles, including bachelor herds, maternal herds, solitary males, and migration.
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        seed: Optional[int] = 42,
    ):
        super().__init__(
            name="Mountain Gazelle Optimizer",
            acronym="MGO",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )

    def _levy_flight(self, dim: int, beta: float = 1.5) -> np.ndarray:
        """Generate Levy flight random walk vector."""
        sigma_num = gamma(1.0 + beta) * np.sin(np.pi * beta / 2.0)
        sigma_den = gamma((1.0 + beta) / 2.0) * beta * (2.0 ** ((beta - 1.0) / 2.0))
        sigma = (sigma_num / sigma_den) ** (1.0 / beta)
        
        u = self.rng.normal(0.0, sigma, size=dim)
        v = self.rng.normal(0.0, 1.0, size=dim)
        step = u / (np.abs(v) ** (1.0 / beta) + 1e-12)
        return step

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """
        Execute one iteration of MGO across 4 gazelle social mechanisms.
        """
        best_idx = np.argmin(self.fitness)
        best_gazelle = self.population[best_idx].copy()

        new_population = np.zeros_like(self.population)

        # Coefficients
        a = -1.0 + iteration * (-1.0 / self.max_iterations)
        
        for i in range(self.population_size):
            r = self.rng.random()
            rand_idx = self.rng.integers(0, self.population_size)
            rand_gazelle = self.population[rand_idx].copy()
            levy = self._levy_flight(self.dimension)

            if r < 0.25:
                # 1. Solitary males (territory defense with Levy flight)
                cof1 = self.rng.random(self.dimension) * 2.0 - 1.0
                new_pos = (best_gazelle - self.population[i]) * self.rng.random(self.dimension) + cof1 * levy * rand_gazelle
            elif r < 0.50:
                # 2. Bachelor male herds (social roaming around leader)
                cof2 = self.rng.uniform(0.1, 2.0)
                new_pos = best_gazelle - cof2 * np.abs(2.0 * self.rng.random(self.dimension) * best_gazelle - self.population[i])
            elif r < 0.75:
                # 3. Maternal groups (nanny and fawn protection)
                mean_pos = np.mean(self.population, axis=0)
                cof3 = self.rng.random() * a
                new_pos = mean_pos + cof3 * (self.population[i] - rand_gazelle)
            else:
                # 4. Adult males & grazing migration
                cof4 = self.rng.random()
                new_pos = self.population[i] + cof4 * (self.rng.random(self.dimension) * (self.ub - self.lb) + self.lb)

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
