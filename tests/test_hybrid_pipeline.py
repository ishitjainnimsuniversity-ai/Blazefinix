"""
Tests for Hybrid Quantum-Classical Ensemble and Uncertainty Calibration
"""

import pytest
import numpy as np
from app.backend.qml.hybrid_ensemble import HybridQuantumClassicalClassifier

def test_hybrid_combination_and_uncertainty():
    hybrid = HybridQuantumClassicalClassifier(classical_weight=0.60)
    risk, uncertainty = hybrid.combine_risks(classical_prob=0.80, quantum_prob=0.70)
    
    # 0.6*0.8 + 0.4*0.7 = 0.48 + 0.28 = 0.76
    assert abs(risk - 0.76) < 1e-3
    assert 0.0 <= uncertainty <= 1.0

def test_hybrid_evaluation():
    hybrid = HybridQuantumClassicalClassifier(classical_weight=0.60)
    y_test = np.array([0, 0, 1, 1, 1])
    classical_probs = np.array([0.2, 0.3, 0.8, 0.9, 0.7])
    quantum_probs = np.array([0.1, 0.4, 0.7, 0.85, 0.65])
    
    metrics = hybrid.evaluate_hybrid(y_test, classical_probs, quantum_probs)
    assert metrics["accuracy"] >= 0.80
    assert metrics["roc_auc"] >= 0.80
    assert "confusion_matrix" in metrics
