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
        prob = shifted / (np.sum(shifted) + 1e-12)
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
        WEP = self.wep_min + iteration * ((self.wep_max - self.wep_min) / max(1, self.max_iterations))

        # Travelling Distance Rate (TDR) decreases non-linearly
        TDR = 1.0 - ((iteration ** (1.0 / self.p_constant)) / (max(1, self.max_iterations) ** (1.0 / self.p_constant)))

        # Sort universes by inflation rate (best fitness)
        sorted_indices = np.argsort(self.fitness)
        sorted_universes = self.population[sorted_indices].copy()
        sorted_fitness = self.fitness[sorted_indices].copy()

        best_universe = sorted_universes[0].copy()

        new_population = np.zeros_like(self.population)

        for i in range(self.population_size):
            new_pos = self.population[i].copy()
            
            # Vectorized white/black hole exchange via roulette wheel
            r1 = self.rng.random(self.dimension)
            white_hole_mask = r1 < 0.5
            if np.any(white_hole_mask):
                for j in np.where(white_hole_mask)[0]:
                    white_idx = self._roulette_wheel_selection(sorted_fitness)
                    new_pos[j] = sorted_universes[white_idx, j]

            # Wormhole tunnel updates
            r2 = self.rng.random(self.dimension)
            wormhole_mask = r2 < WEP
            if np.any(wormhole_mask):
                r3 = self.rng.random(self.dimension)
                r4 = self.rng.random(self.dimension)
                
                delta = TDR * ((self.ub - self.lb) * r4 + self.lb)
                direction = np.where(r3 < 0.5, 1.0, -1.0)
                
                new_pos[wormhole_mask] = best_universe[wormhole_mask] + (direction * delta)[wormhole_mask]

            new_pos = self.clip_bounds(new_pos)
            fit = self.evaluate_individual(new_pos, objective_fn)
            new_population[i] = new_pos
            self.fitness[i] = fit

        self.population = new_population

        best_idx = np.argmin(self.fitness)
        if self.fitness[best_idx] < self.best_fitness:
            self.best_fitness = self.fitness[best_idx]
            self.best_solution = self.population[best_idx].copy()
