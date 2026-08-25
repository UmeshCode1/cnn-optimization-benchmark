"""
Base Optimizer Contract for CNN Optimization Benchmark.

All metaheuristic algorithms inherit from BaseOptimizer and adhere strictly to
the same optimization interface, parameter bounds, fitness contract, and
convergence tracking.
"""

from abc import ABC, abstractmethod
from typing import Callable, Dict, List, Optional, Tuple, Any
import numpy as np
import time


class OptimizationResult:
    """Standardized result object returned by all optimizers."""
    def __init__(
        self,
        algorithm_name: str,
        best_solution: np.ndarray,
        best_fitness: float,
        convergence_curve: List[float],
        all_candidate_evaluations: int,
        optimization_time_seconds: float,
        iterations_completed: int,
        population_history: Optional[List[List[float]]] = None,
        raw_metadata: Optional[Dict[str, Any]] = None,
    ):
        self.algorithm_name = algorithm_name
        self.best_solution = best_solution.tolist() if isinstance(best_solution, np.ndarray) else best_solution
        self.best_fitness = float(best_fitness)
        self.convergence_curve = [float(f) for f in convergence_curve]
        self.all_candidate_evaluations = int(all_candidate_evaluations)
        self.optimization_time_seconds = float(optimization_time_seconds)
        self.iterations_completed = int(iterations_completed)
        self.population_history = population_history or []
        self.raw_metadata = raw_metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "algorithm_name": self.algorithm_name,
            "best_solution": self.best_solution,
            "best_fitness": self.best_fitness,
            "convergence_curve": self.convergence_curve,
            "all_candidate_evaluations": self.all_candidate_evaluations,
            "optimization_time_seconds": self.optimization_time_seconds,
            "iterations_completed": self.iterations_completed,
            "raw_metadata": self.raw_metadata,
        }


class BaseOptimizer(ABC):
    """
    Abstract Base Class for all 10 Metaheuristic Optimizers.
    
    Standardized mathematical contract:
    - Objective direction: Minimization (fitness values should be minimized by default;
      higher accuracy / multi-objective scores are mapped to minimization via -fitness or cost formulation).
    - Search Bounds: Lower bounds (lb) and Upper bounds (ub) of shape (dim,).
    - Random state reproducibility: seed parameter controls exact deterministic trajectory.
    """

    def __init__(
        self,
        name: str,
        acronym: str,
        population_size: int = 20,
        max_iterations: int = 50,
        seed: Optional[int] = 42,
    ):
        self.name = name
        self.acronym = acronym
        self.population_size = max(4, population_size)
        self.max_iterations = max(1, max_iterations)
        self.seed = seed
        self.rng = np.random.default_rng(seed)
        
        # State variables
        self.dimension: int = 0
        self.lb: np.ndarray = np.array([])
        self.ub: np.ndarray = np.array([])
        self.population: np.ndarray = np.array([])
        self.fitness: np.ndarray = np.array([])
        self.best_solution: Optional[np.ndarray] = None
        self.best_fitness: float = float("inf")
        self.convergence_curve: List[float] = []
        self.evaluation_count: int = 0

    def set_seed(self, seed: Optional[int]) -> None:
        """Reset internal random generator state for reproducible runs."""
        self.seed = seed
        self.rng = np.random.default_rng(seed)

    def initialize_population(
        self,
        dimension: int,
        lower_bounds: np.ndarray,
        upper_bounds: np.ndarray,
    ) -> np.ndarray:
        """
        Uniformly sample initial population within [lower_bounds, upper_bounds].
        """
        self.dimension = dimension
        self.lb = np.array(lower_bounds, dtype=np.float64)
        self.ub = np.array(upper_bounds, dtype=np.float64)
        
        # Uniform sampling: lb + rand * (ub - lb)
        self.population = self.lb + self.rng.random((self.population_size, self.dimension)) * (self.ub - self.lb)
        self.fitness = np.full(self.population_size, float("inf"))
        self.evaluation_count = 0
        self.convergence_curve = []
        return self.population

    def clip_bounds(self, positions: np.ndarray) -> np.ndarray:
        """Ensure all positions strictly adhere to [lb, ub] search boundaries."""
        return np.clip(positions, self.lb, self.ub)

    def evaluate_individual(self, individual: np.ndarray, objective_fn: Callable[[np.ndarray], float]) -> float:
        """Evaluate a single candidate solution with safety boundary enforcement."""
        bounded = self.clip_bounds(individual)
        val = objective_fn(bounded)
        self.evaluation_count += 1
        return float(val)

    def evaluate_population(self, objective_fn: Callable[[np.ndarray], float]) -> None:
        """Evaluate all individuals in current population."""
        for i in range(self.population_size):
            fit = self.evaluate_individual(self.population[i], objective_fn)
            self.fitness[i] = fit
            if fit < self.best_fitness:
                self.best_fitness = fit
                self.best_solution = self.population[i].copy()

    @abstractmethod
    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """
        Execute a single iteration step of the metaheuristic algorithm.
        Must update self.population, self.fitness, self.best_solution, and self.best_fitness.
        """
        pass

    def optimize(
        self,
        objective_fn: Callable[[np.ndarray], float],
        dimension: int,
        lower_bounds: np.ndarray,
        upper_bounds: np.ndarray,
        callback: Optional[Callable[[int, float, np.ndarray], None]] = None,
    ) -> OptimizationResult:
        """
        Run the complete optimization pipeline over max_iterations.
        
        Args:
            objective_fn: Objective function returning scalar cost to minimize.
            dimension: Search space dimensionality.
            lower_bounds: Minimum bound for each variable.
            upper_bounds: Maximum bound for each variable.
            callback: Optional callback(iteration, current_best_fitness, current_best_solution).
        """
        start_time = time.perf_counter()
        
        # 1. Initialize
        self.initialize_population(dimension, lower_bounds, upper_bounds)
        self.evaluate_population(objective_fn)
        self.convergence_curve.append(self.best_fitness)
        
        if callback:
            callback(0, self.best_fitness, self.best_solution)

        # 2. Iterate
        for t in range(1, self.max_iterations + 1):
            self.step(t, objective_fn)
            self.convergence_curve.append(self.best_fitness)
            
            if callback:
                callback(t, self.best_fitness, self.best_solution)

        elapsed = time.perf_counter() - start_time
        
        return OptimizationResult(
            algorithm_name=self.name,
            best_solution=self.best_solution if self.best_solution is not None else self.population[0],
            best_fitness=self.best_fitness,
            convergence_curve=self.convergence_curve,
            all_candidate_evaluations=self.evaluation_count,
            optimization_time_seconds=elapsed,
            iterations_completed=self.max_iterations,
            raw_metadata={
                "acronym": self.acronym,
                "population_size": self.population_size,
                "dimension": self.dimension,
                "seed": self.seed,
            }
        )
