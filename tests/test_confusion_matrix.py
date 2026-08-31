"""
Comprehensive Unit Tests for Confusion Matrix & Per-Class Degradation Suite.
Verifies mathematical accuracy, row normalization, top confused pairs,
differential delta analysis, and scientific provenance guarantees.
"""

import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.app.evaluation.dataset_registry import (
    get_dataset_definition,
    DatasetDefinition,
)
from backend.app.evaluation.confusion_matrix import ConfusionMatrixEvaluator
from backend.main import app


client = TestClient(app)


def test_dataset_registry_definitions():
    cifar10 = get_dataset_definition("CIFAR-10")
    assert cifar10.num_classes == 10
    assert "cat" in cifar10.class_names
    assert "Vehicles" in cifar10.semantic_groups
    assert cifar10.get_semantic_group("cat") == "Animals"
    assert cifar10.get_semantic_group("truck") == "Vehicles"

    f_mnist = get_dataset_definition("Fashion-MNIST")
    assert f_mnist.num_classes == 10
    assert f_mnist.get_semantic_group("Sneaker") == "Footwear"

    custom = get_dataset_definition("Custom-Medical", num_classes=5)
    assert custom.num_classes == 5
    assert len(custom.class_names) == 5


def test_confusion_matrix_real_predictions_math_correctness():
    # 5-class custom dataset
    dataset_def = DatasetDefinition(
        name="Test-5Class",
        num_classes=5,
        class_names=["A", "B", "C", "D", "E"],
    )

    y_true = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4]
    y_pred = [0, 0, 1, 1, 2, 2, 2, 3, 4, 4]
    baseline_y_pred = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4]  # perfect baseline

    result = ConfusionMatrixEvaluator.calculate_from_predictions(
        y_true=y_true,
        y_pred=y_pred,
        dataset_def=dataset_def,
        baseline_y_pred=baseline_y_pred,
        algorithm_name="TEST_ALG",
    )

    raw_mat = np.array(result["raw_matrix"])
    norm_mat = np.array(result["normalized_matrix"])

    # 1. Total samples check
    assert raw_mat.sum() == len(y_true)
    assert result["global_metrics"]["total_samples"] == 10

    # 2. Diagonal trace check (7 correct out of 10)
    assert np.trace(raw_mat) == 7
    assert result["global_metrics"]["accuracy"] == 70.0

    # 3. Row normalization check (sum of row equals 100% for support > 0)
    for i, row in enumerate(norm_mat):
        support = raw_mat[i].sum()
        if support > 0:
            assert np.isclose(row.sum(), 100.0, atol=0.01)

    # 4. Provenance check
    assert result["provenance"]["mode"] == "REAL"
    assert result["provenance"]["provenance"] == "ACTUAL_PREDICTIONS"
    assert result["provenance"]["synthetic"] is False

    # 5. Top confused pairs should NOT contain diagonal elements
    for pair in result["top_confused_pairs"]:
        assert pair["true_class_index"] != pair["pred_class_index"]

    # 6. Degradation checks
    degraded = result["degraded_classes"]
    assert len(degraded) > 0
    # Class 0 lost 1 sample out of 3: recall 66.67% vs baseline 100.0% -> drop 33.33 pp
    class_0_metric = [m for m in result["per_class_metrics"] if m["class_name"] == "A"][0]
    assert class_0_metric["recall_drop_pp"] > 0


def test_confusion_matrix_simulation_mode_determinism_and_provenance():
    cifar10 = get_dataset_definition("CIFAR-10")

    res1 = ConfusionMatrixEvaluator.calculate_from_simulation(
        dataset_def=cifar10,
        accuracy_pct=92.5,
        baseline_accuracy_pct=94.0,
        total_samples=10000,
        seed=123,
        pruning_ratio=0.4,
        quantization_type="INT8",
        algorithm_name="GWO",
    )

    res2 = ConfusionMatrixEvaluator.calculate_from_simulation(
        dataset_def=cifar10,
        accuracy_pct=92.5,
        baseline_accuracy_pct=94.0,
        total_samples=10000,
        seed=123,
        pruning_ratio=0.4,
        quantization_type="INT8",
        algorithm_name="GWO",
    )

    # Determinism
    assert res1["raw_matrix"] == res2["raw_matrix"]

    # Provenance guarantee
    assert res1["provenance"]["mode"] == "SIMULATION"
    assert res1["provenance"]["provenance"] == "SIMULATED_MODEL"
    assert res1["provenance"]["synthetic"] is True

    # Accuracy accuracy match
    assert abs(res1["global_metrics"]["accuracy"] - 92.5) < 0.2

    # Differential matrix existence
    assert res1["delta_normalized_matrix"] is not None
    assert len(res1["delta_normalized_matrix"]) == 10


def test_algorithm_differential_comparison():
    cifar10 = get_dataset_definition("CIFAR-10")

    eval_a = ConfusionMatrixEvaluator.calculate_from_simulation(
        dataset_def=cifar10,
        accuracy_pct=93.0,
        baseline_accuracy_pct=94.0,
        algorithm_name="GWO",
    )
    eval_b = ConfusionMatrixEvaluator.calculate_from_simulation(
        dataset_def=cifar10,
        accuracy_pct=89.0,
        baseline_accuracy_pct=94.0,
        algorithm_name="PSO",
    )

    diff = ConfusionMatrixEvaluator.calculate_algorithm_differential(eval_a, eval_b)
    assert diff["comparison_type"] == "ALGORITHM_A_VS_ALGORITHM_B"
    assert diff["accuracy_diff"] == 4.0
    assert len(diff["delta_normalized_matrix"]) == 10


def test_zero_support_and_edge_cases():
    dataset_def = DatasetDefinition(
        name="Empty-Class-Test",
        num_classes=3,
        class_names=["X", "Y", "Z"],
    )
    # Class Z has 0 samples
    y_true = [0, 0, 1, 1]
    y_pred = [0, 1, 1, 1]

    result = ConfusionMatrixEvaluator.calculate_from_predictions(
        y_true=y_true,
        y_pred=y_pred,
        dataset_def=dataset_def,
    )
    assert result["per_class_metrics"][2]["support"] == 0
    assert result["per_class_metrics"][2]["recall"] == 0.0
    assert result["per_class_metrics"][2]["precision"] == 0.0


def test_confusion_matrix_api_endpoint():
    # 1. Create a quick benchmark experiment
    payload = {
        "title": "Confusion Matrix Test Benchmark",
        "description": "Integration test for confusion matrix endpoint",
        "preset": "QUICK_TEST",
        "dataset_name": "CIFAR-10",
        "dataset_split": "train:50000,test:10000",
        "input_resolution": "32x32x3",
        "batch_size": 128,
        "cnn_model_name": "ResNet-18",
        "checkpoint_name": "torchvision_pretrained",
        "quantization_type": "INT8",
        "pruning_method": "STRUCTURED_CHANNEL",
        "pruning_ratio": 0.40,
        "selected_algorithms": ["GWO", "WOA"],
        "population_size": 4,
        "max_iterations": 2,
        "number_of_runs": 1,
        "weight_accuracy": 0.40,
        "weight_latency": 0.25,
        "weight_model_size": 0.20,
        "weight_energy": 0.15,
    }

    create_res = client.post("/api/experiments?auto_run=false", json=payload)
    assert create_res.status_code == 200
    exp_id = create_res.json()["id"]

    # Trigger synchronous worker or simulation run
    from backend.app.database.session import SessionLocal
    from backend.app.database.models import Experiment, ExperimentRun
    db = SessionLocal()
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    exp.baseline_accuracy = 93.4
    run_rec = ExperimentRun(
        experiment_id=exp_id,
        algorithm_acronym="GWO",
        run_index=1,
        seed=42,
        status="COMPLETED",
        accuracy=91.8,
        latency_ms=8.2,
        model_size_mb=12.4,
        energy_j=0.18,
        parameters_m=6.5,
        flops_m=320.0,
        best_fitness=0.12,
        accuracy_provenance="SIMULATED",
        execution_mode="DEMO",
    )
    db.add(run_rec)
    db.commit()
    db.close()

    # Query confusion matrix endpoint
    resp = client.get(f"/api/experiments/{exp_id}/confusion-matrix?algorithm=GWO")
    assert resp.status_code == 200
    data = resp.json()

    assert data["experiment_id"] == exp_id
    assert data["selected_algorithm"] == "GWO"
    assert "evaluation" in data
    assert len(data["evaluation"]["classes"]) == 10
    assert len(data["evaluation"]["raw_matrix"]) == 10
    assert data["evaluation"]["provenance"]["mode"] in ["SIMULATION", "REAL"]
    assert "top_confused_pairs" in data["evaluation"]
    assert "per_class_metrics" in data["evaluation"]


def test_perfect_and_zero_accuracy_classifiers():
    dataset_def = DatasetDefinition(
        name="Binary-Test",
        num_classes=2,
        class_names=["Neg", "Pos"],
    )

    # 1. Perfect Classifier (100%)
    perf_res = ConfusionMatrixEvaluator.calculate_from_predictions(
        y_true=[0, 0, 1, 1],
        y_pred=[0, 0, 1, 1],
        dataset_def=dataset_def,
    )
    assert perf_res["global_metrics"]["accuracy"] == 100.0
    assert perf_res["global_metrics"]["macro_f1"] == 100.0
    assert len(perf_res["top_confused_pairs"]) == 0

    # 2. Completely Incorrect Classifier (0%)
    zero_res = ConfusionMatrixEvaluator.calculate_from_predictions(
        y_true=[0, 0, 1, 1],
        y_pred=[1, 1, 0, 0],
        dataset_def=dataset_def,
    )
    assert zero_res["global_metrics"]["accuracy"] == 0.0
    assert zero_res["global_metrics"]["macro_f1"] == 0.0
    assert len(zero_res["top_confused_pairs"]) == 2


def test_small_two_class_dataset_edge_case():
    two_class_def = DatasetDefinition(
        name="Small-Binary-Class",
        num_classes=2,
        class_names=["ClassA", "ClassB"],
    )
    res = ConfusionMatrixEvaluator.calculate_from_simulation(
        dataset_def=two_class_def,
        accuracy_pct=95.0,
        total_samples=100,
    )
    assert abs(res["global_metrics"]["accuracy"] - 95.0) < 1.0
    assert len(res["raw_matrix"]) == 2
    assert int(np.sum(res["raw_matrix"])) == 100


def test_algorithm_differential_incompatible_datasets():
    cifar10 = get_dataset_definition("CIFAR-10")
    mnist = get_dataset_definition("MNIST")

    eval_cifar = ConfusionMatrixEvaluator.calculate_from_simulation(
        dataset_def=cifar10,
        accuracy_pct=90.0,
    )
    eval_mnist = ConfusionMatrixEvaluator.calculate_from_simulation(
        dataset_def=mnist,
        accuracy_pct=90.0,
    )

    with pytest.raises(ValueError, match="Cannot compute differential across different datasets"):
        ConfusionMatrixEvaluator.calculate_algorithm_differential(eval_cifar, eval_mnist)


def test_missing_baseline_handling():
    cifar10 = get_dataset_definition("CIFAR-10")
    res = ConfusionMatrixEvaluator.calculate_from_simulation(
        dataset_def=cifar10,
        accuracy_pct=88.5,
        baseline_accuracy_pct=None,
    )
    assert res["baseline_raw_matrix"] is None
    assert res["delta_normalized_matrix"] is None
    for m in res["per_class_metrics"]:
        assert m["baseline_recall"] is None
        assert m["recall_drop_pp"] is None

