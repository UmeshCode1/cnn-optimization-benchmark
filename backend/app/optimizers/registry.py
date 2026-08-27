"""
Optimizer Registry and Dynamic Factory for Built-in and Custom Metaheuristic Algorithms.
"""

import os
import json
import importlib.util
from pathlib import Path
from typing import Dict, List, Type, Any, Optional, Callable
import numpy as np

from .base import BaseOptimizer
from .gwo import GreyWolfOptimizer
from .woa import WhaleOptimizer
from .alo import AntLionOptimizer
from .mfo import MothFlameOptimizer
from .goa import GrasshopperOptimizer
from .mvo import MultiVerseOptimizer
from .sca import SineCosineOptimizer
from .aoa import ArithmeticOptimizer
from .mgo import MountainGazelleOptimizer
from .gmo import GeometricMeanOptimizer

CUSTOM_ALGS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "custom_algorithms"
CUSTOM_ALGS_DIR.mkdir(parents=True, exist_ok=True)
CUSTOM_METADATA_FILE = CUSTOM_ALGS_DIR / "algorithms_metadata.json"


class CustomDynamicOptimizer(BaseOptimizer):
    """
    General metaheuristic optimizer wrapper for custom user-registered algorithms.
    Applies adaptive swarm and differential search perturbation over CNN compression search spaces.
    """

    def __init__(
        self,
        population_size: int = 20,
        max_iterations: int = 50,
        seed: int = 42,
        custom_key: str = "CUSTOM",
        custom_name: str = "Custom Optimizer",
        exploration_rate: float = 0.5,
    ):
        super().__init__(
            name=custom_name,
            acronym=custom_key,
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
        )
        self.custom_key = custom_key
        self.custom_name = custom_name
        self.exploration_rate = exploration_rate

    def step(self, iteration: int, objective_fn: Callable[[np.ndarray], float]) -> None:
        """Execute a single iteration step of the custom adaptive optimizer."""
        # Dynamic decay factor from 2.0 to 0.0
        a = 2.0 * (1.0 - iteration / self.max_iterations)
        best_sol = self.best_solution if self.best_solution is not None else self.population[0]

        for i in range(self.population_size):
            r1 = self.rng.random()
            r2 = self.rng.random()

            # Exploration vs Exploitation balance
            if self.rng.random() < self.exploration_rate:
                # Exploration: random vector guided perturbation
                random_index = self.rng.integers(0, self.population_size)
                random_agent = self.population[random_index]
                D = np.abs(2.0 * r1 * random_agent - self.population[i])
                step_pos = random_agent - a * D * (2.0 * r2 - 1.0)
            else:
                # Exploitation: elite vector attraction
                D_best = np.abs(2.0 * r1 * best_sol - self.population[i])
                step_pos = best_sol - a * D_best * np.cos(2.0 * np.pi * r2)

            self.population[i] = self.clip_bounds(step_pos)
            fit = self.evaluate_individual(self.population[i], objective_fn)
            self.fitness[i] = fit

            if fit < self.best_fitness:
                self.best_fitness = fit
                self.best_solution = self.population[i].copy()


BUILTIN_OPTIMIZER_REGISTRY: Dict[str, Type[BaseOptimizer]] = {
    "GWO": GreyWolfOptimizer,
    "WOA": WhaleOptimizer,
    "ALO": AntLionOptimizer,
    "MFO": MothFlameOptimizer,
    "GOA": GrasshopperOptimizer,
    "MVO": MultiVerseOptimizer,
    "SCA": SineCosineOptimizer,
    "AOA": ArithmeticOptimizer,
    "MGO": MountainGazelleOptimizer,
    "GMO": GeometricMeanOptimizer,
}

BUILTIN_METADATA = [
    {
        "key": "GWO",
        "name": "Grey Wolf Optimizer",
        "acronym": "GWO",
        "year": 2014,
        "authors": "Mirjalili, Mirjalili, & Lewis",
        "category": "Swarm Intelligence",
        "description": "Mimics social hierarchy (Alpha, Beta, Delta, Omega) and hunting mechanism of grey wolves.",
        "strengths": ["Fast initial convergence", "Strong exploitation", "Few hyper-parameters"],
        "status": "VERIFIED",
        "is_custom": False,
    },
    {
        "key": "WOA",
        "name": "Whale Optimization Algorithm",
        "acronym": "WOA",
        "year": 2016,
        "authors": "Mirjalili & Lewis",
        "category": "Swarm Intelligence",
        "description": "Models humpback whale bubble-net hunting maneuvers with spiral updates.",
        "strengths": ["Balanced exploration/exploitation", "Avoids local optima", "High dimensional scalability"],
        "status": "VERIFIED",
        "is_custom": False,
    },
    {
        "key": "ALO",
        "name": "Ant Lion Optimizer",
        "acronym": "ALO",
        "year": 2015,
        "authors": "Mirjalili",
        "category": "Swarm Intelligence",
        "description": "Mimics hunting behavior of antlions using random walks in shrinking conical sand traps.",
        "strengths": ["Effective exploration via random walks", "Elite-guided convergence", "Strong diversity preservation"],
        "status": "VERIFIED",
        "is_custom": False,
    },
    {
        "key": "MFO",
        "name": "Moth-Flame Optimization",
        "acronym": "MFO",
        "year": 2015,
        "authors": "Mirjalili",
        "category": "Physics & Biology",
        "description": "Models transverse orientation of moths flying around flame light sources.",
        "strengths": ["Adaptive flame count", "Logarithmic spiral search", "High precision exploitation"],
        "status": "VERIFIED",
        "is_custom": False,
    },
    {
        "key": "GOA",
        "name": "Grasshopper Optimization Algorithm",
        "acronym": "GOA",
        "year": 2017,
        "authors": "Saremi, Mirjalili, & Lewis",
        "category": "Swarm Intelligence",
        "description": "Simulates repulsion and attraction forces within nymph and adult grasshopper swarms.",
        "strengths": ["Social comfort zone dynamics", "Adaptive repulsion", "Smooth convergence transition"],
        "status": "VERIFIED",
        "is_custom": False,
    },
    {
        "key": "MVO",
        "name": "Multi-Verse Optimizer",
        "acronym": "MVO",
        "year": 2016,
        "authors": "Mirjalili, Mirjalili, & Hatamlou",
        "category": "Physics-Based",
        "description": "Cosmological simulation using white holes, black holes, and wormhole travel.",
        "strengths": ["High exploration rate", "Inflation-rate based exchange", "Stochastic wormhole jumps"],
        "status": "VERIFIED",
        "is_custom": False,
    },
    {
        "key": "SCA",
        "name": "Sine Cosine Algorithm",
        "acronym": "SCA",
        "year": 2016,
        "authors": "Mirjalili",
        "category": "Trigonometric & Mathematical",
        "description": "Mathematical framework fluctuating outward/inward based on sine and cosine functions.",
        "strengths": ["Extremely light computational overhead", "Continuous position transitions", "Adaptive radius"],
        "status": "VERIFIED",
        "is_custom": False,
    },
    {
        "key": "AOA",
        "name": "Arithmetic Optimization Algorithm",
        "acronym": "AOA",
        "year": 2021,
        "authors": "Abualigah, Diabat, et al.",
        "category": "Mathematical",
        "description": "Utilizes arithmetic operators (Division, Multiplication, Subtraction, Addition) via MOA/MOP.",
        "strengths": ["Wide dispersion during exploration", "Fine-grained arithmetic local tuning", "Fast execution"],
        "status": "VERIFIED",
        "is_custom": False,
    },
    {
        "key": "MGO",
        "name": "Mountain Gazelle Optimizer",
        "acronym": "MGO",
        "year": 2022,
        "authors": "Abdollahzadeh, Gharehchopogh, & Mirjalili",
        "category": "Swarm Intelligence",
        "description": "Models solitary males, bachelor herds, maternal groups, and grazing migrations with Levy flights.",
        "strengths": ["Levy-flight exploration", "Multi-group social structure", "High robustness on complex landscapes"],
        "status": "VERIFIED",
        "is_custom": False,
    },
    {
        "key": "GMO",
        "name": "Geometric Mean Optimizer",
        "acronym": "GMO",
        "year": 2023,
        "authors": "Mirrashid & Naderpour",
        "category": "Mathematical",
        "description": "Uses multi-guide geometric mean vectors calculated across elite candidate vectors.",
        "strengths": ["Geometric mean multi-guide vectors", "Excellent balance across dimensions", "Fast convergence"],
        "status": "VERIFIED",
        "is_custom": False,
    },
]

OPTIMIZER_REGISTRY = BUILTIN_OPTIMIZER_REGISTRY
ALGORITHM_METADATA = BUILTIN_METADATA


def load_custom_metadata() -> Dict[str, Any]:
    if CUSTOM_METADATA_FILE.exists():
        try:
            with open(CUSTOM_METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_custom_metadata(data: Dict[str, Any]):
    with open(CUSTOM_METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def get_optimizer(
    key: str,
    population_size: int = 20,
    max_iterations: int = 50,
    seed: int = 42,
) -> BaseOptimizer:
    """Factory method to instantiate built-in or custom registered metaheuristics."""
    normalized_key = key.upper().strip()
    
    # 1. Check built-ins
    if normalized_key in BUILTIN_OPTIMIZER_REGISTRY:
        cls = BUILTIN_OPTIMIZER_REGISTRY[normalized_key]
        return cls(population_size=population_size, max_iterations=max_iterations, seed=seed)

    # 2. Check custom registered algorithms
    custom_meta = load_custom_metadata()
    if normalized_key in custom_meta:
        meta = custom_meta[normalized_key]
        # If custom python script exists, try dynamic import
        script_path = CUSTOM_ALGS_DIR / f"{normalized_key.lower()}.py"
        if script_path.exists():
            try:
                spec = importlib.util.spec_from_file_location(f"custom_alg_{normalized_key}", script_path)
                if spec and spec.loader:
                    mod = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(mod)
                    for attr in dir(mod):
                        val = getattr(mod, attr)
                        if isinstance(val, type) and issubclass(val, BaseOptimizer) and val is not BaseOptimizer:
                            return val(population_size=population_size, max_iterations=max_iterations, seed=seed)
            except Exception:
                pass

        # Fallback to CustomDynamicOptimizer
        return CustomDynamicOptimizer(
            population_size=population_size,
            max_iterations=max_iterations,
            seed=seed,
            custom_key=normalized_key,
            custom_name=meta.get("name", normalized_key),
            exploration_rate=meta.get("exploration_rate", 0.5),
        )

    # 3. Dynamic generic fallback for any unknown custom key
    return CustomDynamicOptimizer(
        population_size=population_size,
        max_iterations=max_iterations,
        seed=seed,
        custom_key=normalized_key,
        custom_name=f"Custom ({normalized_key})",
        exploration_rate=0.5,
    )


def list_available_algorithms() -> List[Dict[str, Any]]:
    """Return catalog of all supported algorithms including custom registered algorithms."""
    custom_meta = load_custom_metadata()
    custom_list = list(custom_meta.values())
    return BUILTIN_METADATA + custom_list


def register_custom_algorithm(
    key: str,
    name: str,
    category: str = "Custom Swarm",
    description: str = "User-defined custom metaheuristic optimization algorithm.",
    authors: str = "Custom Author",
    year: int = 2026,
    strengths: Optional[List[str]] = None,
    python_code: Optional[str] = None,
    exploration_rate: float = 0.5,
) -> Dict[str, Any]:
    """Register a new custom metaheuristic optimizer in the platform."""
    norm_key = key.upper().strip()
    if not norm_key:
        raise ValueError("Algorithm key/acronym is required.")

    custom_meta = load_custom_metadata()
    
    # Save python code file if provided
    if python_code and python_code.strip():
        script_file = CUSTOM_ALGS_DIR / f"{norm_key.lower()}.py"
        with open(script_file, "w", encoding="utf-8") as f:
            f.write(python_code.strip())

    entry = {
        "key": norm_key,
        "name": name.strip() or norm_key,
        "acronym": norm_key,
        "year": year,
        "authors": authors,
        "category": category,
        "description": description,
        "strengths": strengths or ["Custom heuristic operators", "Adaptive convergence", "Domain-tailored"],
        "status": "CUSTOM",
        "is_custom": True,
        "exploration_rate": exploration_rate,
    }

    custom_meta[norm_key] = entry
    save_custom_metadata(custom_meta)
    return entry


def delete_custom_algorithm(key: str) -> bool:
    """Delete a custom registered algorithm."""
    norm_key = key.upper().strip()
    custom_meta = load_custom_metadata()
    if norm_key in custom_meta:
        del custom_meta[norm_key]
        save_custom_metadata(custom_meta)

        script_file = CUSTOM_ALGS_DIR / f"{norm_key.lower()}.py"
        if script_file.exists():
            script_file.unlink(missing_ok=True)
        return True
    return False
