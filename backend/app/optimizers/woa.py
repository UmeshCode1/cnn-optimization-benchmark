"""
Whale Optimization Algorithm (WOA)
Reference: Mirjalili, S., & Lewis, A. (2016).
The Whale Optimization Algorithm. Advances in Engineering Software, 95, 51-67.
"""

from typing import Callable, Optional
import numpy as np
from .base import BaseOptimizer


class WhaleOptimizer(BaseOptimizer):
    """
    Whale Optimization Algorithm mimics the social behavior of humpback whales
    including shrinking encircling mechanism, spiral bubble-net feeding, and exploration.
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        b_constant: float = 1.0,
        seed: Optional[int] = 42,
    ):
        super().__init__(
            name="Whale Optimization Algorithm",
            acronym="WOA",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )
        self.b = b_constant  # Logarithmic spiral constant

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """
        Execute one iteration of WOA.
        a decreases linearly from 2 to 0.
        Probability p determines spiral vs encircling/exploration.
        """
        a = 2.0 - 2.0 * (iteration / self.max_iterations)
        a2 = -1.0 + iteration * ((-1.0) / self.max_iterations)

        best_idx = np.argmin(self.fitness)
        leader_pos = self.population[best_idx].copy()

        for i in range(self.population_size):
            r1 = self.rng.random()
            r2 = self.rng.random()
            A = 2.0 * a * r1 - a
            C = 2.0 * r2
            
            l = (a2 - 1.0) * self.rng.random() + 1.0
            p = self.rng.random()

            if p < 0.5:
                if np.abs(A) < 1.0:
                    # Exploitation: Encircling prey
                    D = np.abs(C * leader_pos - self.population[i])
                    new_pos = leader_pos - A * D
                else:
                    # Exploration: Search for prey using random whale
                    rand_idx = self.rng.integers(0, self.population_size)
                    rand_whale = self.population[rand_idx]
                    D = np.abs(C * rand_whale - self.population[i])
                    new_pos = rand_whale - A * D
            else:
                # Exploitation: Bubble-net spiral update
                dist_to_leader = np.abs(leader_pos - self.population[i])
                new_pos = dist_to_leader * np.exp(self.b * l) * np.cos(2.0 * np.pi * l) + leader_pos

            new_pos = self.clip_bounds(new_pos)
            fit = self.evaluate_individual(new_pos, objective_fn)
            self.population[i] = new_pos
            self.fitness[i] = fit
            
            if fit < self.best_fitness:
                self.best_fitness = fit
                self.best_solution = new_pos.copy()
