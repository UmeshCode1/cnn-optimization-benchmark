"""
Multi-Verse Optimizer (MVO)
Reference: Mirjalili, S., Mirjalili, S. M., & Hatamlou, A. (2016).
Multi-Verse Optimizer: A nature-inspired algorithm for global optimization.
Neural Computing and Applications, 27(2), 495-513.
"""

from typing import Callable, Optional
import numpy as np
from .base import BaseOptimizer


class MultiVerseOptimizer(BaseOptimizer):
    """
    Multi-Verse Optimizer is inspired by cosmological concepts:
    white holes, black holes, and wormholes with inflation rate selection.
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        wep_min: float = 0.2,
        wep_max: float = 1.0,
        p_constant: float = 6.0,
        seed: Optional[int] = 42,
    ):
        super().__init__(
            name="Multi-Verse Optimizer",
            acronym="MVO",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )
        self.wep_min = wep_min
        self.wep_max = wep_max
        self.p_constant = p_constant

    def _roulette_wheel_selection(self, sorted_fitness: np.ndarray) -> int:
        """Roulette wheel based on normalized inflation rates."""
        # Convert fitness to higher-is-better normalized inflation rate
        shifted = np.max(sorted_fitness) - sorted_fitness + 1e-6
        prob = shifted / np.sum(shifted)
        cumulative_prob = np.cumsum(prob)
        r = self.rng.random()
        for i, cp in enumerate(cumulative_prob):
            if r <= cp:
                return i
        return len(sorted_fitness) - 1

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """
        Execute one iteration of MVO.
        Wormhole Existence Probability (WEP) and Travelling Distance Rate (TDR)
        govern space exploration and exploitation.
        """
        # Wormhole Existence Probability (WEP) increases linearly
        WEP = self.wep_min + iteration * ((self.wep_max - self.wep_min) / self.max_iterations)

        # Travelling Distance Rate (TDR) decreases non-linearly
        TDR = 1.0 - ((iteration ** (1.0 / self.p_constant)) / (self.max_iterations ** (1.0 / self.p_constant)))

        # Sort universes by inflation rate (best fitness)
        sorted_indices = np.argsort(self.fitness)
        sorted_universes = self.population[sorted_indices].copy()
        sorted_fitness = self.fitness[sorted_indices].copy()

        best_universe = sorted_universes[0].copy()

        new_population = np.zeros_like(self.population)

        for i in range(self.population_size):
            new_pos = self.population[i].copy()
            for j in range(self.dimension):
                r1 = self.rng.random()
                if r1 < 0.5:
                    # White/black hole exchange via roulette wheel
                    white_hole_idx = self._roulette_wheel_selection(sorted_fitness)
                    new_pos[j] = sorted_universes[white_hole_idx, j]

                r2 = self.rng.random()
                if r2 < WEP:
                    r3 = self.rng.random()
                    r4 = self.rng.random()
                    if r3 < 0.5:
                        new_pos[j] = best_universe[j] + TDR * ((self.ub[j] - self.lb[j]) * r4 + self.lb[j])
                    else:
                        new_pos[j] = best_universe[j] - TDR * ((self.ub[j] - self.lb[j]) * r4 + self.lb[j])

            new_pos = self.clip_bounds(new_pos)
            fit = self.evaluate_individual(new_pos, objective_fn)
            new_population[i] = new_pos
            self.fitness[i] = fit

        self.population = new_population

        best_idx = np.argmin(self.fitness)
        if self.fitness[best_idx] < self.best_fitness:
            self.best_fitness = self.fitness[best_idx]
            self.best_solution = self.population[best_idx].copy()
