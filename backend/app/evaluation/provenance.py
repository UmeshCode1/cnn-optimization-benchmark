"""
Standardized Metric Provenance Schema.

This module defines the canonical provenance types used across the entire platform.
Every metric returned by any engine must attach a ProvenanceRecord.

Allowed provenance categories:
  MEASURED   — Direct hardware/model measurement (inference, NVML, RAPL)
  CALCULATED — Mathematically derived from measured values (speedup, compression)
  ESTIMATED  — Analytical model (FLOPs-scaled TDP, reference benchmarks)
  SIMULATED  — Analytically modelled simulation (no real model/hardware)
  UNAVAILABLE — Cannot be obtained in the current deployment environment

Source strings (stored separately from provenance for filtering):
  MODEL_INFERENCE   — Actual forward pass on test dataset
  NVIDIA_NVML       — NVIDIA Management Library power sampling
  CPU_RAPL          — Intel/AMD RAPL energy counter
  ANALYTICAL_FLOPS  — FLOPs-based analytical estimate
  TDP_MODEL         — TDP-scaled power model
  REFERENCE_PAPER   — Published literature value
  SIMULATION_MODEL  — Analytical degradation model
  CALCULATED        — Derived from other measured values
"""

from typing import Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum


class Provenance(str, Enum):
    MEASURED = "MEASURED"
    CALCULATED = "CALCULATED"
    ESTIMATED = "ESTIMATED"
    SIMULATED = "SIMULATED"
    UNAVAILABLE = "UNAVAILABLE"


class Source(str, Enum):
    MODEL_INFERENCE = "MODEL_INFERENCE"
    NVIDIA_NVML = "NVIDIA_NVML"
    CPU_RAPL = "CPU_RAPL"
    ANALYTICAL_FLOPS = "ANALYTICAL_FLOPS"
    TDP_MODEL = "TDP_MODEL"
    REFERENCE_PAPER = "REFERENCE_PAPER"
    SIMULATION_MODEL = "SIMULATION_MODEL"
    CALCULATED = "CALCULATED"
    UNKNOWN = "UNKNOWN"


@dataclass
class ProvenanceRecord:
    """
    Canonical provenance metadata attached to every benchmark metric.
    Both engines must attach a ProvenanceRecord to every metric value.
    """
    provenance: str       # One of Provenance enum values
    source: str           # One of Source enum values
    method: str           # Human-readable description of how value was obtained
    sample_count: Optional[int] = None  # Number of samples (e.g. inference count)
    hardware: Optional[str] = None      # Device where measurement occurred
    confidence_interval: Optional[str] = None  # e.g. "±0.3% (95% CI, n=5)"
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    notes: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "provenance": self.provenance,
            "source": self.source,
            "method": self.method,
            "sample_count": self.sample_count,
            "hardware": self.hardware,
            "confidence_interval": self.confidence_interval,
            "timestamp": self.timestamp,
            "notes": self.notes,
        }


@dataclass
class MetricValue:
    """
    A fully-documented metric value with standardized provenance.
    Frontend can use provenance to display appropriate badges.
    """
    name: str
    value: Any
    unit: str
    provenance_record: ProvenanceRecord

    @property
    def provenance(self) -> str:
        return self.provenance_record.provenance

    @property
    def source(self) -> str:
        return self.provenance_record.source

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "value": self.value,
            "unit": self.unit,
            **self.provenance_record.to_dict(),
        }


# ── Provenance factories for common cases ──────────────────────────────────

def make_measured_inference(sample_count: int, dataset: str, split: str, hardware: str) -> ProvenanceRecord:
    return ProvenanceRecord(
        provenance=Provenance.MEASURED,
        source=Source.MODEL_INFERENCE,
        method=f"Top-1 accuracy via forward pass over {sample_count} samples from {dataset} {split} split",
        sample_count=sample_count,
        hardware=hardware,
    )


def make_measured_nvml(sample_count: int, hardware: str) -> ProvenanceRecord:
    return ProvenanceRecord(
        provenance=Provenance.MEASURED,
        source=Source.NVIDIA_NVML,
        method=f"Power sampled via NVML over {sample_count} inference iterations",
        sample_count=sample_count,
        hardware=hardware,
    )


def make_measured_rapl(hardware: str) -> ProvenanceRecord:
    return ProvenanceRecord(
        provenance=Provenance.MEASURED,
        source=Source.CPU_RAPL,
        method="Energy measured via Linux powercap RAPL interface",
        hardware=hardware,
    )


def make_estimated_tdp(hardware: str, method_desc: str) -> ProvenanceRecord:
    return ProvenanceRecord(
        provenance=Provenance.ESTIMATED,
        source=Source.TDP_MODEL,
        method=method_desc,
        hardware=hardware,
        notes="This is an analytical estimate, NOT a hardware measurement.",
    )


def make_simulated(method_desc: str) -> ProvenanceRecord:
    return ProvenanceRecord(
        provenance=Provenance.SIMULATED,
        source=Source.SIMULATION_MODEL,
        method=method_desc,
        notes="DEMO DATA — NOT EXPERIMENTAL RESULTS. No real model inference was performed.",
    )


def make_calculated(method_desc: str, from_provenance: str) -> ProvenanceRecord:
    return ProvenanceRecord(
        provenance=Provenance.CALCULATED,
        source=Source.CALCULATED,
        method=method_desc,
        notes=f"Derived from {from_provenance} inputs.",
    )


def make_unavailable(reason: str) -> ProvenanceRecord:
    return ProvenanceRecord(
        provenance=Provenance.UNAVAILABLE,
        source=Source.UNKNOWN,
        method="Measurement not available in current deployment environment",
        notes=reason,
    )
