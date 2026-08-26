"""
Integration tests for FastAPI endpoints.
"""

import io
import zipfile
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


def test_list_and_upload_datasets():
    # 1. List datasets
    response = client.get("/api/datasets")
    assert response.status_code == 200
    datasets = response.json()
    assert len(datasets) >= 5
    assert any(d["id"] == "cifar-10" for d in datasets)

    # 2. Create in-memory zip dataset archive
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        zf.writestr("class_dogs/dog_001.jpg", b"fake_dog_image_bytes")
        zf.writestr("class_dogs/dog_002.jpg", b"fake_dog_image_bytes")
        zf.writestr("class_cats/cat_001.jpg", b"fake_cat_image_bytes")
        zf.writestr("class_cats/cat_002.jpg", b"fake_cat_image_bytes")
    zip_buffer.seek(0)

    # 3. Upload dataset archive
    upload_res = client.post(
        "/api/datasets/upload",
        files={"file": ("custom_pets.zip", zip_buffer, "application/zip")},
        data={"dataset_name": "Custom Pets Test", "description": "Unit test dataset", "resolution": "64x64x3"},
    )
    assert upload_res.status_code == 201
    uploaded_data = upload_res.json()
    assert uploaded_data["name"] == "Custom Pets Test"
    assert uploaded_data["is_custom"] is True
    assert uploaded_data["classes_count"] >= 2
    custom_id = uploaded_data["id"]

    # 4. Delete custom dataset
    del_res = client.delete(f"/api/datasets/{custom_id}")
    assert del_res.status_code == 204
