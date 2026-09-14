"""
Audit Trail API Routes
Maintains compliant audit records of all user logins, model training, predictions, alerts, and doctor feedbacks.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import json
from typing import Optional
from app.backend.database.connection import get_db
from app.backend.database.models import AuditLogRecord

router = APIRouter(prefix="/audit", tags=["Audit & Governance"])

@router.get("")
def get_audit_logs(
    role: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieves immutable audit logs."""
    query = db.query(AuditLogRecord)
    if role and role != "ALL":
        query = query.filter(AuditLogRecord.user_role == role.upper())
    if action and action != "ALL":
        query = query.filter(AuditLogRecord.action == action.upper())

    records = query.order_by(AuditLogRecord.timestamp.desc()).limit(limit).all()
    results = []
    for r in records:
        details = json.loads(r.details_json) if r.details_json else {}
        results.append({
            "log_id": r.log_id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "user_role": r.user_role,
            "action": r.action,
            "record_id": r.record_id,
            "details": details
        })
    return results
