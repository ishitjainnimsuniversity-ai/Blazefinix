"""
Tests for Clinical Decision Support Alerts & Doctor Feedback Loop
"""

import pytest
from app.backend.alerts.alert_engine import ClinicalAlertEngine
from app.backend.database.connection import init_db, SessionLocal
from app.backend.database.models import AlertRecord, DoctorFeedbackRecord

def test_alert_engine_generation():
    # Low risk case should not generate high alert
    low_alert = ClinicalAlertEngine.evaluate_risk(
        record_id="PT-TEST-LOW",
        hybrid_risk=0.20,
        classical_risk=0.22,
        quantum_risk=0.18,
        uncertainty=0.10,
        top_contributing_factors=[{"feature": "systolic_bp"}]
    )
    assert low_alert is None

    # High risk case should generate alert
    high_alert = ClinicalAlertEngine.evaluate_risk(
        record_id="PT-TEST-HIGH",
        hybrid_risk=0.82,
        classical_risk=0.85,
        quantum_risk=0.78,
        uncertainty=0.15,
        top_contributing_factors=[{"feature": "systolic_bp"}, {"feature": "fasting_glucose"}]
    )
    assert high_alert is not None
    assert high_alert["severity"] in ["HIGH", "CRITICAL"]
    assert "systolic_bp" in high_alert["contributing_factors"]
    assert "disclaimer" in high_alert
