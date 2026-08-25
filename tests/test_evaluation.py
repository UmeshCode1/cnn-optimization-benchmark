"""
Unit tests for Accuracy, Latency, Model Size, Energy, FLOPs, Pruning, and Quantization modules.
"""

import pytest
import numpy as np
from backend.app.evaluation.accuracy import AccuracyEvaluator
from backend.app.evaluation.latency import LatencyEvaluator
from backend.app.evaluation.model_size import ModelSizeEvaluator
from backend.app.evaluation.energy import EnergyEvaluator
from backend.app.evaluation.flops import FlopsEvaluator
from backend.app.evaluation.quantization import QuantizationManager
from backend.app.evaluation.pruning import PruningManager
from backend.app.evaluation.fitness import MultiObjectiveFitness


def test_flops_and_parameter_accounting():
    spec = FlopsEvaluator.count_parameters_and_flops(
        model_name="ResNet-18",
        pruning_ratio=0.40,
        quantization_type="INT8",
    )
    assert spec["parameters_m"] < spec["base_parameters_m"]
    assert spec["flops_m"] < spec["base_flops_m"]
    assert spec["model_size_mb"] < 44.0
    assert spec["provenance"] == "CALCULATED"


def test_accuracy_evaluation():
    acc_info = AccuracyEvaluator.evaluate_synthetic_or_real(
        baseline_acc=93.4,
        pruning_ratio=0.40,
        quantization_type="INT8",
        optimizer_solution=np.array([0.8, 0.7, 0.9, 0.85]),
    )
    assert 85.0 <= acc_info["accuracy"] <= 95.0
    assert acc_info["unit"] == "%"
    assert acc_info["provenance"] == "MEASURED"


def test_latency_measurement():
    def dummy_forward():
        sum([i*i for i in range(500)])

    res = LatencyEvaluator.measure_latency(dummy_forward, warmup_runs=5, measured_runs=10, device="cpu")
    assert res["mean_ms"] > 0.0
    assert res["min_ms"] <= res["mean_ms"] <= res["max_ms"]
    assert res["provenance"] == "MEASURED"


def test_energy_evaluation():
    res = EnergyEvaluator.measure_or_estimate_energy(
        forward_pass_fn=lambda: None,
        duration_seconds=0.5,
        num_inferences=100,
        model_flops_m=556.0,
        device="cpu",
    )
    assert res["energy_j"] > 0.0
    assert res["unit"] == "J"
    assert "provenance" in res


def test_quantization_manager():
    int8_spec = QuantizationManager.get_quantization_spec("INT8")
    assert int8_spec["bits"] == 8
    assert int8_spec["compression_factor"] == 4.0

    fp16_spec = QuantizationManager.get_quantization_spec("FP16")
    assert fp16_spec["bits"] == 16
    assert fp16_spec["compression_factor"] == 2.0


def test_pruning_manager():
    prune_res = PruningManager.evaluate_pruning_impact(
        pruning_method="STRUCTURED_CHANNEL",
        pruning_ratio=0.50,
        base_params_m=11.17,
        base_flops_m=556.0,
    )
    assert prune_res["is_structured"] is True
    assert prune_res["effective_params_m"] < 11.17
    assert prune_res["latency_factor"] < 1.0


def test_fitness_and_overall_score():
    fitness = MultiObjectiveFitness(
        weight_accuracy=0.40,
        weight_latency=0.25,
        weight_model_size=0.20,
        weight_energy=0.15,
    )
    score = fitness.compute_overall_score_100(
        accuracy=92.5,
        latency_ms=6.2,
        model_size_mb=11.2,
        energy_j=0.12,
    )
    assert 0.0 <= score <= 150.0
