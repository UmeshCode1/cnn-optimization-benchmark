"""
Optimizer Registry and Factory for 10 Metaheuristic Algorithms.
"""

from typing import Dict, List, Type, Any
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

OPTIMIZER_REGISTRY: Dict[str, Type[BaseOptimizer]] = {
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

ALGORITHM_METADATA = [
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
    },
]


def get_optimizer(
    key: str,
    population_size: int = 20,
    max_iterations: int = 50,
    seed: int = 42,
) -> BaseOptimizer:
    """Factory method to instantiate any of the 10 metaheuristics."""
    normalized_key = key.upper().strip()
    if normalized_key not in OPTIMIZER_REGISTRY:
        raise ValueError(f"Unknown optimizer: '{key}'. Supported: {list(OPTIMIZER_REGISTRY.keys())}")
    
    cls = OPTIMIZER_REGISTRY[normalized_key]
    return cls(population_size=population_size, max_iterations=max_iterations, seed=seed)


def list_available_algorithms() -> List[Dict[str, Any]]:
    """Return catalog of all supported algorithms with metadata and citations."""
    return ALGORITHM_METADATA
