"""
Integration Tests for FastAPI HTTP Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.backend.main import app

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "OPERATIONAL"
    assert "AI-generated risk assessment" in data["disclaimer"]

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"

def test_list_datasets():
    res = client.get("/api/data/datasets")
    assert res.status_code == 200
    data = res.json()
    assert "datasets" in data
    assert len(data["datasets"]) >= 2

def test_demo_cases():
    res = client.get("/api/predict/demo-cases")
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) == 4
    assert cases[0]["case_id"] == "DEMO-LOW-01"

def test_quantum_circuit_endpoint():
    res = client.get("/api/models/quantum-circuit?qubits=4&depth=2")
    assert res.status_code == 200
    data = res.json()
    assert "circuit_info" in data
    assert data["circuit_info"]["num_qubits"] == 4
    assert "gate_layers" in data
