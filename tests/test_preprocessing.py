"""
Tests for Data Preprocessing and Leakage Prevention
"""

import pytest
import numpy as np
import pandas as pd
from app.backend.utils.sample_data_generator import generate_cardiometabolic_cohort
from app.backend.ml.preprocessor import DataQualityEngine, ClinicalPreprocessor

def test_data_quality_audit():
    df = generate_cardiometabolic_cohort(n_samples=100, random_seed=42)
    audit = DataQualityEngine.audit_dataset(df)
    assert audit["total_records"] == 100
    assert audit["quality_score"] >= 80
    assert "class_distribution" in audit
    assert audit["missing_values_count"] == 0

def test_leakage_protection_in_preprocessor():
    df = generate_cardiometabolic_cohort(n_samples=150, random_seed=42)
    preprocessor = ClinicalPreprocessor()
    
    X_train, X_test, y_train, y_test, feat_names = preprocessor.fit_transform(df, test_size=0.25)
    
    assert len(X_train) + len(X_test) == 150
    assert abs(len(X_test) - int(150 * 0.25)) <= 1
    assert preprocessor.is_fitted
    assert len(feat_names) > 10

    # Verify single patient transform works with fitted statistics
    sample_patient = {feat_names[i]: float(X_train[0, i]) for i in range(len(feat_names))}
    transformed = preprocessor.transform_single(sample_patient)
    assert transformed.shape == (1, len(feat_names))
