"""
Clinical Decision Support Alert Engine & Safety Gatekeeper
Evaluates multi-variable risk scores, uncertainty bounds, and model discordance.
Dispatches categorized alerts (LOW, MEDIUM, HIGH, CRITICAL) for clinician triage.
"""

from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime, timezone
from app.backend.config import settings

def utc_now():
    return datetime.now(timezone.utc)

class ClinicalAlertEngine:
    """Evaluates prediction outputs against clinical thresholds and patient safety rules."""

    @staticmethod
    def evaluate_risk(
        record_id: str,
        hybrid_risk: float,
        classical_risk: float,
        quantum_risk: Optional[float],
        uncertainty: float,
        top_contributing_factors: List[Dict[str, Any]],
        threshold_low: float = settings.THRESHOLD_LOW,
        threshold_mod: float = settings.THRESHOLD_MODERATE,
        threshold_high: float = settings.THRESHOLD_HIGH
    ) -> Optional[Dict[str, Any]]:
        """
        Determines risk category and creates structured alert if review criteria are met.
        """
        # 1. Determine Risk Tier
        if hybrid_risk >= threshold_high:
            severity = "CRITICAL" if hybrid_risk >= 0.85 else "HIGH"
            category = "High Risk" if hybrid_risk < 0.85 else "Very High Risk"
            reason = f"Combined hybrid disease-risk estimate ({int(hybrid_risk * 100)}%) exceeds high-risk clinical threshold ({int(threshold_high * 100)}%)."
            action = "Comprehensive clinical evaluation and diagnostic workup recommended by attending physician."
        elif hybrid_risk >= threshold_mod:
            severity = "MEDIUM"
            category = "Moderate Risk"
            reason = f"Predicted risk score ({int(hybrid_risk * 100)}%) falls into the intermediate monitoring window ({int(threshold_mod * 100)}% - {int(threshold_high * 100)}%)."
            action = "Secondary lifestyle assessment and scheduled follow-up testing advised within 60 days."
        else:
            severity = "LOW"
            category = "Low Risk"
            reason = f"Biomarker profile indicates baseline low risk ({int(hybrid_risk * 100)}%)."
            action = "Continue standard routine preventive screenings."

        # 2. Check for elevated uncertainty or quantum-classical discordance
        uncertainty_flag = False
        if uncertainty >= settings.UNCERTAINTY_THRESHOLD:
            uncertainty_flag = True
            severity = "HIGH" if severity in ["LOW", "MEDIUM"] else severity
            reason += " | Note: Elevated model epistemic uncertainty or inter-model discordance detected."
            action += " Clinician review advised due to borderline feature ambiguity."

        # Alerts are dispatched for MEDIUM, HIGH, and CRITICAL cases, or any uncertain prediction
        needs_alert = (hybrid_risk >= threshold_mod) or uncertainty_flag

        if not needs_alert:
            return None

        # Extract top 3 biomarker contributors for the alert summary
        summary_factors = [f["feature"] for f in top_contributing_factors[:3]]

        alert_data = {
            "alert_id": f"ALT-{uuid.uuid4().hex[:8].upper()}",
            "record_id": record_id,
            "risk_score": round(hybrid_risk, 4),
            "severity": severity,
            "risk_category": category,
            "reason": reason,
            "recommendation": action,
            "contributing_factors": summary_factors,
            "uncertainty_flag": uncertainty_flag,
            "status": "PENDING",
            "acknowledged": False,
            "created_at": utc_now().isoformat(),
            "disclaimer": "AI-generated risk assessment — not a final medical diagnosis. Final clinical decision remains with a qualified healthcare professional."
        }

        return alert_data
