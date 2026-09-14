"""
Tests for Quantum Circuit Construction & Variational Quantum Classifier (VQC)
"""

import pytest
import numpy as np
from app.backend.qml.quantum_circuit import QuantumCircuitBuilder
from app.backend.qml.vqc_classifier import VariationalQuantumClassifier

def test_quantum_circuit_builder():
    builder = QuantumCircuitBuilder(n_qubits=4, depth=2)
    circuit = builder.build_qiskit_circuit()
    assert circuit["num_qubits"] == 4
    assert circuit["circuit_depth"] > 0
    assert "ascii_diagram" in circuit
    assert "gate_counts" in circuit

def test_vqc_classifier_simulation():
    # 40 synthetic samples with 4 features
    np.random.seed(42)
    X = np.random.randn(40, 4)
    y = (X[:, 0] + X[:, 1] > 0).astype(int)

    vqc = VariationalQuantumClassifier(n_qubits=4, depth=2, shots=256)
    meta = vqc.fit(X, y, steps=10, batch_size=16)
    
    assert vqc.is_fitted
    assert meta["qubits_used"] == 4
    
    eval_res = vqc.evaluate(X[:10], y[:10])
    assert "accuracy" in eval_res
    assert "roc_auc" in eval_res
    assert eval_res["circuit_qubits"] == 4
