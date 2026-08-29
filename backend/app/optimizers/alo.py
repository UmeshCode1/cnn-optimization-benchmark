"""
Ant Lion Optimizer (ALO)
Reference: Mirjalili, S. (2015).
The Ant Lion Optimizer. Advances in Engineering Software, 83, 80-98.
"""

from typing import Callable, Optional
import numpy as np
from .base import BaseOptimizer


class AntLionOptimizer(BaseOptimizer):
    """
    Ant Lion Optimizer mimics the hunting mechanism of antlions in nature
    including random walk of ants, building traps, entrapment of ants in traps,
    catching prey, and rebuilding traps.
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        seed: Optional[int] = 42,
    ):
        super().__init__(
            name="Ant Lion Optimizer",
            acronym="ALO",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )
        self.antlion_pos: np.ndarray = np.array([])
        self.antlion_fitness: np.ndarray = np.array([])
        self.elite_pos: Optional[np.ndarray] = None
        self.elite_fitness: float = float("inf")

    def _random_walk_around_antlion(
        self,
        antlion: np.ndarray,
        iteration: int,
    ) -> np.ndarray:
        """
        Simulate independent random walks of an ant around a chosen antlion across each dimension with shrinking bounds.
        """
        # Ratio of shrinking bounds parameter I
        if iteration > 0.95 * self.max_iterations:
            w = 6
        elif iteration > 0.9 * self.max_iterations:
            w = 5
        elif iteration > 0.75 * self.max_iterations:
            w = 4
        elif iteration > 0.5 * self.max_iterations:
            w = 3
        elif iteration > 0.1 * self.max_iterations:
            w = 2
        else:
            w = 1
        
        I = 1.0 + (10.0 ** w) * (iteration / max(1, self.max_iterations))
        
        c = self.lb / I
        d = self.ub / I

        # Move bounds centered on selected antlion per dimension
        coin_c = (self.rng.random(self.dimension) < 0.5).astype(float)
        c = (2 * coin_c - 1) * c + antlion

        coin_d = (self.rng.random(self.dimension) < 0.5).astype(float)
        d = (2 * coin_d - 1) * d + antlion

        # Multi-dimensional independent cumulative random walk (-1 or +1)
        steps = 2 * (self.rng.random((self.max_iterations, self.dimension)) > 0.5).astype(float) - 1.0
        X = np.cumsum(steps, axis=0)
        
        # Min-max normalization mapped to [c, d] per dimension
        a = np.min(X, axis=0)
        b = np.max(X, axis=0)
        norm_val = ((X[-1] - a) / (b - a + 1e-12)) * (d - c) + c
        return norm_val

    def _roulette_wheel_selection(self, weights: np.ndarray) -> int:
        """Select an antlion using roulette wheel selection."""
        # Convert minimization fitness to selection probabilities
        shifted = np.max(weights) - weights + 1e-6
        prob = shifted / (np.sum(shifted) + 1e-12)
        cumulative_prob = np.cumsum(prob)
        r = self.rng.random()
        for i, cp in enumerate(cumulative_prob):
            if r <= cp:
                return i
        return len(weights) - 1

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """Execute one iteration of Ant Lion Optimizer."""
        if len(self.antlion_pos) == 0:
            self.antlion_pos = self.population.copy()
            self.antlion_fitness = self.fitness.copy()
            best_idx = np.argmin(self.antlion_fitness)
            self.elite_pos = self.antlion_pos[best_idx].copy()
            self.elite_fitness = self.antlion_fitness[best_idx]

        ant_pos = np.zeros_like(self.population)

        for i in range(self.population_size):
            # Select an antlion using roulette wheel
            selected_idx = self._roulette_wheel_selection(self.antlion_fitness)
            selected_antlion = self.antlion_pos[selected_idx]

            # Random walks around selected antlion and elite antlion
            RA = self._random_walk_around_antlion(selected_antlion, iteration)
            RE = self._random_walk_around_antlion(self.elite_pos, iteration)

            # Ant position is the average of walks
            ant_pos[i] = (RA + RE) / 2.0
            ant_pos[i] = self.clip_bounds(ant_pos[i])
            fit = self.evaluate_individual(ant_pos[i], objective_fn)
            self.fitness[i] = fit

        # Combine ants and antlions, sort, and retain best as next generation antlions
        combined_pos = np.vstack([self.antlion_pos, ant_pos])
        combined_fit = np.concatenate([self.antlion_fitness, self.fitness])
        
        sorted_indices = np.argsort(combined_fit)
        self.antlion_pos = combined_pos[sorted_indices[:self.population_size]].copy()
        self.antlion_fitness = combined_fit[sorted_indices[:self.population_size]].copy()
        self.population = self.antlion_pos.copy()
        self.fitness = self.antlion_fitness.copy()

        # Update Elite
        if self.antlion_fitness[0] < self.elite_fitness:
            self.elite_fitness = self.antlion_fitness[0]
            self.elite_pos = self.antlion_pos[0].copy()

        self.best_fitness = self.elite_fitness
        self.best_solution = self.elite_pos.copy()
