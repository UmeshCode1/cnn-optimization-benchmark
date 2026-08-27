"""
Engine Factory — selects the appropriate execution engine based on mode and capabilities.

Usage:
    engine = get_engine("DEMO")    # Always returns SimulationEngine
    engine = get_engine("REAL")    # Returns RealExperimentEngine if capable, raises otherwise

IMPORTANT:
  - REAL mode is NEVER silently downgraded to DEMO
  - If REAL is requested but capabilities are missing, raise EngineValidationError
  - The caller must explicitly choose the mode
"""

import threading
from typing import Optional

from .base import BaseExperimentEngine, EngineValidationError
from .simulation_engine import SimulationEngine
from .real_engine import RealExperimentEngine
from ..services.capability_service import CapabilityService


def get_engine(
    mode: str,
    cancel_event: Optional[threading.Event] = None,
) -> BaseExperimentEngine:
    """
    Return the appropriate engine for the given execution mode.

    Args:
        mode: "DEMO" or "REAL"
        cancel_event: Optional threading.Event for cancellation support

    Returns:
        BaseExperimentEngine subclass instance

    Raises:
        EngineValidationError: If REAL mode is requested but not available.
        ValueError: If mode is invalid.
    """
    if mode == "DEMO":
        return SimulationEngine(cancel_event=cancel_event)

    if mode == "REAL":
        caps = CapabilityService.detect()
        if not caps.real_mode_feasible:
            raise EngineValidationError(
                f"Real Mode is not available in this environment: {caps.real_mode_reason}",
                errors=[caps.real_mode_reason],
            )
        return RealExperimentEngine(cancel_event=cancel_event)

    raise ValueError(f"Unknown execution mode: '{mode}'. Valid modes: DEMO, REAL")


def get_default_mode() -> str:
    """
    Determine the default execution mode for this deployment.
    
    Returns REAL only if capabilities are confirmed.
    Returns DEMO in all other cases (safe default for Render/cloud deployment).
    """
    # Allow environment variable override
    env_mode = __import__("os").environ.get("EXECUTION_MODE", "").upper()
    if env_mode == "REAL":
        caps = CapabilityService.detect()
        if caps.real_mode_feasible:
            return "REAL"
        # If REAL was requested but not feasible, log warning but don't crash
        print(
            f"WARNING: EXECUTION_MODE=REAL requested but capabilities are unavailable: "
            f"{caps.real_mode_reason}. Falling back to DEMO."
        )
    return "DEMO"
