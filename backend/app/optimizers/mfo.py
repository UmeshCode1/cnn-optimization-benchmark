"""
Moth-Flame Optimization (MFO)
Reference: Mirjalili, S. (2015).
Moth-Flame Optimization Algorithm: A novel nature-inspired heuristic paradigm.
Knowledge-Based Systems, 89, 228-249.
"""

from typing import Callable, Optional
import numpy as np
from .base import BaseOptimizer


class MothFlameOptimizer(BaseOptimizer):
    """
    Moth-Flame Optimization mimics the transverse orientation navigation mechanism
    of moths in nature using logarithmic spiral updates around dynamic flames.
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        b_constant: float = 1.0,
        seed: Optional[int] = 42,
    ):
        super().__init__(
            name="Moth-Flame Optimization",
            acronym="MFO",
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )
        self.b = b_constant  # Constant defining shape of logarithmic spiral

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """
        Execute one iteration of MFO.
        Flames are sorted best positions.
        Number of flames adaptively decreases to transition from exploration to exploitation.
        """
        # Adaptive flame reduction: decreases linearly from N to 1
        flame_no = int(np.round(self.population_size - iteration * ((self.population_size - 1) / self.max_iterations)))
        flame_no = max(1, min(self.population_size, flame_no))

        # Sort population to identify best flames
        sorted_indices = np.argsort(self.fitness)
        flames = self.population[sorted_indices].copy()
        flames_fitness = self.fitness[sorted_indices].copy()

        # Convergence constant a decreases from -1 to -2
        a = -1.0 + iteration * ((-1.0) / self.max_iterations)

        for i in range(self.population_size):
            # Select target flame (individual flame for first flame_no, best flame afterwards)
            if i < flame_no:
                target_flame = flames[i]
            else:
                target_flame = flames[flame_no - 1]

            # Distance to flame
            distance_to_flame = np.abs(target_flame - self.population[i])
            
            # Random parameter t in [a, 1]
            t = (a - 1.0) * self.rng.random(self.dimension) + 1.0

            # Logarithmic spiral equation: D * exp(b * t) * cos(2 * pi * t) + Flame
            new_pos = distance_to_flame * np.exp(self.b * t) * np.cos(2.0 * np.pi * t) + target_flame
            new_pos = self.clip_bounds(new_pos)

            fit = self.evaluate_individual(new_pos, objective_fn)
            self.population[i] = new_pos
            self.fitness[i] = fit

        # Re-sort and update global best
        best_idx = np.argmin(self.fitness)
        if self.fitness[best_idx] < self.best_fitness:
            self.best_fitness = self.fitness[best_idx]
            self.best_solution = self.population[best_idx].copy()
