"""
Tests for Classical Machine Learning Models & XGBoost Feature Selection
"""

import pytest
import numpy as np
from app.backend.utils.sample_data_generator import generate_cardiometabolic_cohort
from app.backend.ml.preprocessor import ClinicalPreprocessor
from app.backend.ml.classical_models import ClassicalMLSuite

def test_classical_ml_suite():
    df = generate_cardiometabolic_cohort(n_samples=200, random_seed=42)
    preprocessor = ClinicalPreprocessor()
    X_train, X_test, y_train, y_test, feat_names = preprocessor.fit_transform(df, test_size=0.2)

    suite = ClassicalMLSuite()
    out = suite.train_all(X_train, y_train, X_test, y_test, feat_names, top_k_features=4)

    assert "model_results" in out
    assert "XGBoost" in out["model_results"]
    assert "Random Forest" in out["model_results"]
    assert "Logistic Regression" in out["model_results"]
    
    xgb_test = out["model_results"]["XGBoost"]["test_metrics"]
    assert xgb_test["roc_auc"] >= 0.70
    assert xgb_test["sensitivity"] >= 0.50
    assert len(out["selected_top_features"]) == 4
