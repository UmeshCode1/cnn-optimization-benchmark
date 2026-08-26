"""
Integration tests for FastAPI endpoints including custom algorithm and model registration.
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
    assert len(algs) >= 10


def test_register_and_delete_custom_algorithm():
    # Register custom algorithm
    payload = {
        "key": "PSO_TEST",
        "name": "Particle Swarm Optimization Test",
        "category": "Swarm Intelligence",
        "description": "Swarm velocity and position updates test",
        "authors": "Kennedy & Eberhart",
        "year": 1995,
        "exploration_rate": 0.6,
    }
    reg_res = client.post("/api/algorithms/register", json=payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["key"] == "PSO_TEST"
    assert reg_data["is_custom"] is True

    # Verify present in list
    list_res = client.get("/api/algorithms")
    assert list_res.status_code == 200
    assert any(a["key"] == "PSO_TEST" for a in list_res.json())

    # Delete custom algorithm
    del_res = client.delete("/api/algorithms/PSO_TEST")
    assert del_res.status_code == 204


def test_list_and_register_custom_model():
    # List models
    list_res = client.get("/api/models")
    assert list_res.status_code == 200
    models = list_res.json()
    assert len(models) >= 4

    # Register custom model
    payload = {
        "name": "CustomViT-Tiny",
        "parameters_m": 4.5,
        "flops_m": 310.0,
        "base_accuracy": 91.5,
        "description": "Vision transformer tiny baseline",
    }
    reg_res = client.post("/api/models", json=payload)
    assert reg_res.status_code == 201
    model_data = reg_res.json()
    assert model_data["name"] == "CustomViT-Tiny"
    model_id = model_data["id"]

    # Delete custom model
    del_res = client.delete(f"/api/models/{model_id}")
    assert del_res.status_code == 204


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


def test_export_reports_formats():
    # 1. Fetch existing experiment or create test one
    exps_res = client.get("/api/experiments")
    assert exps_res.status_code == 200
    exps = exps_res.json()
    if not exps:
        return  # No experiments to export

    target_id = exps[0]["id"]

    # Test CSV export
    csv_res = client.get(f"/api/reports/{target_id}/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert len(csv_res.text) > 0

    # Test Markdown export
    md_res = client.get(f"/api/reports/{target_id}/markdown")
    assert md_res.status_code == 200
    assert "text/markdown" in md_res.headers["content-type"]
    assert "Scientific Benchmark Report" in md_res.text

    # Test TXT export
    txt_res = client.get(f"/api/reports/{target_id}/txt")
    assert txt_res.status_code == 200
    assert "text/plain" in txt_res.headers["content-type"]
    assert "CNN OPTIMIZATION BENCHMARK" in txt_res.text

    # Test DOC export
    doc_res = client.get(f"/api/reports/{target_id}/doc")
    assert doc_res.status_code == 200
    assert "application/msword" in doc_res.headers["content-type"]
    assert "<html" in doc_res.text

    # Test JSON export
    json_res = client.get(f"/api/reports/{target_id}/json")
    assert json_res.status_code == 200
    data = json_res.json()
    assert "experiment" in data
    assert "ranked_algorithms" in data

