"""
Doctor Review & Feedback Loop API Routes
Stores clinician assessments into research feedback database.
STRICT SAFETY PRINCIPLE: Feedback is queued for research auditing and NEVER automatically retrains production model weights.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import json
from datetime import datetime, timezone
from app.backend.database.connection import get_db
from app.backend.database.models import DoctorFeedbackRecord, AlertRecord, AuditLogRecord
from app.backend.schemas.pydantic_models import DoctorFeedbackCreate, DoctorFeedbackResponse

router = APIRouter(prefix="/feedback", tags=["Doctor Review & Feedback"])

@router.post("", response_model=DoctorFeedbackResponse)
def submit_doctor_feedback(payload: DoctorFeedbackCreate, db: Session = Depends(get_db)):
    """
    Submits structured doctor feedback regarding AI disease-risk prediction.
    Stores assessment safely in review repository for post-market monitoring.
    """
    fb_id = f"FB-{uuid.uuid4().hex[:8].upper()}"

    feedback_rec = DoctorFeedbackRecord(
        feedback_id=fb_id,
        alert_id=payload.alert_id,
        record_id=payload.record_id,
        agreement=payload.agreement.upper(),
        clinical_notes=payload.clinical_notes,
        recommended_action=payload.recommended_action,
        reviewer_name=payload.reviewer_name,
        reviewer_role=payload.reviewer_role
    )
    db.add(feedback_rec)

    # If linked to an alert, transition status to REVIEWED
    if payload.alert_id:
        alert = db.query(AlertRecord).filter(AlertRecord.alert_id == payload.alert_id).first()
        if alert:
            alert.status = "REVIEWED"
            alert.acknowledged = True
            alert.acknowledged_by = payload.reviewer_name
            alert.acknowledged_at = datetime.now(timezone.utc)

    # Immutable Audit Log
    db.add(AuditLogRecord(
        log_id=f"AUD-FB-{fb_id[:8]}",
        user_role="CLINICIAN",
        action="DOCTOR_FEEDBACK_SUBMITTED",
        record_id=payload.record_id,
        details_json=json.dumps({
            "feedback_id": fb_id,
            "agreement": payload.agreement,
            "reviewer": payload.reviewer_name
        })
    ))

    db.commit()

    return DoctorFeedbackResponse(
        feedback_id=fb_id,
        alert_id=payload.alert_id,
        record_id=payload.record_id,
        agreement=payload.agreement,
        clinical_notes=payload.clinical_notes,
        recommended_action=payload.recommended_action,
        reviewer_name=payload.reviewer_name,
        reviewed_at=feedback_rec.reviewed_at,
        status_message="Feedback stored securely in research repository. Not deployed directly to production weights."
    )

@router.get("/list")
def list_doctor_feedback(limit: int = 50, db: Session = Depends(get_db)):
    """Lists feedback entries for model performance governance."""
    records = db.query(DoctorFeedbackRecord).order_by(DoctorFeedbackRecord.reviewed_at.desc()).limit(limit).all()
    return [
        {
            "feedback_id": r.feedback_id,
            "alert_id": r.alert_id,
            "record_id": r.record_id,
            "agreement": r.agreement,
            "clinical_notes": r.clinical_notes,
            "recommended_action": r.recommended_action,
            "reviewer_name": r.reviewer_name,
            "reviewer_role": r.reviewer_role,
            "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None
        }
        for r in records
    ]

@router.get("/summary")
def get_feedback_summary(db: Session = Depends(get_db)):
    """Computes clinician agreement and disagreement rates for research dashboard."""
    records = db.query(DoctorFeedbackRecord).all()
    total = len(records)
    if total == 0:
        return {
            "total_reviews": 0,
            "agreement_rate": 0.0,
            "partial_agreement_rate": 0.0,
            "disagreement_rate": 0.0,
            "needs_review_rate": 0.0,
            "counts": {"AGREE": 0, "PARTIAL": 0, "DISAGREE": 0, "NEEDS_REVIEW": 0}
        }

    counts = {"AGREE": 0, "PARTIAL": 0, "DISAGREE": 0, "NEEDS_REVIEW": 0}
    for r in records:
        agr = r.agreement.upper()
        if agr in counts:
            counts[agr] += 1

    return {
        "total_reviews": total,
        "agreement_rate": round((counts["AGREE"] / total) * 100, 1),
        "partial_agreement_rate": round((counts["PARTIAL"] / total) * 100, 1),
        "disagreement_rate": round((counts["DISAGREE"] / total) * 100, 1),
        "needs_review_rate": round((counts["NEEDS_REVIEW"] / total) * 100, 1),
        "counts": counts
    }
