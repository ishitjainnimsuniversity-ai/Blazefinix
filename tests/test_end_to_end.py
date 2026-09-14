"""
End-to-End Pipeline Verification Test
Dataset -> Preprocessing -> XGBoost -> Feature Selection -> QML VQC -> Hybrid -> SHAP -> Alert -> Doctor Feedback -> Audit Trail
"""

import pytest
from app.backend.database.connection import init_db
from app.backend.services.pipeline_service import pipeline_service
from app.backend.api.routes_prediction import DEMO_PATIENT_CASES

def test_full_end_to_end_pipeline():
    init_db()

    # 1. Train pipeline
    res = pipeline_service.train_full_pipeline(
        dataset_name="cardiometabolic_cohort.csv",
        top_k=4,
        run_cv=False
    )
    assert pipeline_service.is_trained
    assert len(pipeline_service.top_features) == 4
    assert res["hybrid"]["roc_auc"] >= 0.70

    # 2. Run prediction on a High Risk Demo Case
    high_case = DEMO_PATIENT_CASES[2]  # DEMO-HIGH-03
    pred = pipeline_service.predict_patient(high_case["features"], record_id="E2E-TEST-001")

    assert pred["hybrid_risk"] > 0.50
    assert pred["risk_category"] in ["High Risk", "Very High Risk"]
    assert len(pred["contributing_factors"]) > 0
    assert pred["alert"] is not None
    assert "disclaimer" in pred
    assert "AI-generated risk assessment" in pred["disclaimer"]
