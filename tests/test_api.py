"""
Integration tests for FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["algorithms_count"] == 10


def test_get_algorithms():
    response = client.get("/api/algorithms")
    assert response.status_code == 200
    algs = response.json()
    assert len(algs) == 10


def test_get_hardware():
    response = client.get("/api/hardware")
    assert response.status_code == 200
    hw = response.json()
    assert "cpu_model" in hw
    assert "ram_gb" in hw


def test_validate_fairness():
    payload = {
        "title": "Fairness Validation Test",
        "dataset_name": "CIFAR-10",
        "dataset_split": "train:50000,test:10000",
        "input_resolution": "32x32x3",
        "batch_size": 128,
        "cnn_model_name": "ResNet-18",
        "checkpoint_name": "torchvision_pretrained",
        "quantization_type": "INT8",
        "pruning_method": "STRUCTURED_CHANNEL",
        "pruning_ratio": 0.40,
        "selected_algorithms": ["GWO", "WOA", "ALO", "MFO", "GOA", "MVO", "SCA", "AOA", "MGO", "GMO"],
        "population_size": 10,
        "max_iterations": 5,
        "number_of_runs": 3,
        "random_seed_policy": "FIXED_PER_RUN",
        "base_seed": 42,
        "warmup_runs": 10,
        "measured_runs": 50,
        "weight_accuracy": 0.40,
        "weight_latency": 0.25,
        "weight_model_size": 0.20,
        "weight_energy": 0.15,
    }
    response = client.post("/api/experiments/validate-fairness", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["is_valid"] is True
    assert len(res["guarantees"]) >= 6
