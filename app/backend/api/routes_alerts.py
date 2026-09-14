"""
Doctor Alert System API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import json
from datetime import datetime, timezone
from typing import Optional, List
from app.backend.database.connection import get_db
from app.backend.database.models import AlertRecord, AuditLogRecord
from app.backend.schemas.pydantic_models import AlertAcknowledgeRequest

router = APIRouter(prefix="/alerts", tags=["Clinical Alerts"])

@router.get("")
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieves clinical alert queue with priority filtering."""
    query = db.query(AlertRecord)
    if severity and severity != "ALL":
        query = query.filter(AlertRecord.severity == severity.upper())
    if status and status != "ALL":
        query = query.filter(AlertRecord.status == status.upper())

    records = query.order_by(AlertRecord.created_at.desc()).limit(limit).all()
    results = []
    for r in records:
        factors = json.loads(r.contributing_factors) if r.contributing_factors else []
        results.append({
            "alert_id": r.alert_id,
            "record_id": r.record_id,
            "prediction_id": r.prediction_id,
            "risk_score": r.risk_score,
            "severity": r.severity,
            "reason": r.reason,
            "recommendation": r.recommendation,
            "contributing_factors": factors,
            "acknowledged": r.acknowledged,
            "acknowledged_by": r.acknowledged_by,
            "acknowledged_at": r.acknowledged_at.isoformat() if r.acknowledged_at else None,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return results

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, payload: AlertAcknowledgeRequest, db: Session = Depends(get_db)):
    """Clinician acknowledges an alert without dismissing review obligations."""
    alert = db.query(AlertRecord).filter(AlertRecord.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    alert.acknowledged = True
    alert.acknowledged_by = payload.clinician_name
    alert.acknowledged_at = datetime.now(timezone.utc)
    if alert.status == "PENDING":
        alert.status = "REVIEWED"

    # Audit log
    db.add(AuditLogRecord(
        log_id=f"AUD-ACK-{alert_id[:8]}",
        user_role="CLINICIAN",
        action="ALERT_ACKNOWLEDGED",
        record_id=alert.record_id,
        details_json=json.dumps({"alert_id": alert_id, "clinician": payload.clinician_name, "notes": payload.notes})
    ))
    db.commit()

    return {"status": "SUCCESS", "message": f"Alert {alert_id} acknowledged by {payload.clinician_name}."}

@router.post("/{alert_id}/triage")
def triage_alert(alert_id: str, new_status: str = Query(..., pattern="^(PENDING|REVIEWED|ESCALATED|CLOSED)$"), db: Session = Depends(get_db)):
    """Updates clinical alert status (e.g. escalated to cardiology, closed)."""
    alert = db.query(AlertRecord).filter(AlertRecord.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    old_status = alert.status
    alert.status = new_status
    db.add(AuditLogRecord(
        log_id=f"AUD-TRG-{alert_id[:8]}",
        user_role="CLINICIAN",
        action="ALERT_STATUS_UPDATED",
        record_id=alert.record_id,
        details_json=json.dumps({"alert_id": alert_id, "from": old_status, "to": new_status})
    ))
    db.commit()

    return {"status": "SUCCESS", "alert_id": alert_id, "new_status": new_status}
