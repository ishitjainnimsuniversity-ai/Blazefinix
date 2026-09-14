"""
SQLAlchemy ORM Database Schema for Clinical Research Prototype
Includes Patient Records, Model Versioning, Predictions, Alerts, Clinician Feedback, Audit Logs, and NCBI Genomic Data.
"""

from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.backend.database.connection import Base

def utc_now():
    return datetime.now(timezone.utc)

class PatientRecord(Base):
    __tablename__ = "patient_records"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(64), unique=True, index=True, nullable=False)
    cohort_name = Column(String(128), default="General Research Cohort")
    age = Column(Float, nullable=True)
    sex = Column(String(16), nullable=True)  # Male, Female, Other
    features_json = Column(Text, nullable=False)  # JSON dictionary of clinical biomarkers
    target_label = Column(Integer, nullable=True)  # Ground truth if available (0/1)
    split_type = Column(String(32), default="TEST")  # TRAIN, VAL, TEST
    created_at = Column(DateTime, default=utc_now)

    predictions = relationship("PredictionRecord", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("AlertRecord", back_populates="patient", cascade="all, delete-orphan")

    def get_features(self):
        return json.loads(self.features_json) if self.features_json else {}

class ModelRecord(Base):
    __tablename__ = "model_registry"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    version = Column(String(32), nullable=False)
    disease_type = Column(String(64), default="Cardiometabolic Risk")
    model_architecture = Column(String(64), nullable=False)  # XGBOOST, RANDOM_FOREST, LOGISTIC_REGRESSION, VQC, HYBRID
    features_list = Column(Text, nullable=False)  # JSON array of features
    hyperparameters = Column(Text, nullable=True)  # JSON dictionary
    metrics = Column(Text, nullable=True)  # JSON dictionary of accuracy, recall, roc_auc, etc.
    training_samples = Column(Integer, default=0)
    quantum_config = Column(Text, nullable=True)  # JSON qubit count, depth, simulator
    is_active = Column(Boolean, default=True)
    trained_at = Column(DateTime, default=utc_now)

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(64), unique=True, index=True, nullable=False)
    record_id = Column(String(64), ForeignKey("patient_records.record_id"), nullable=False)
    model_version = Column(String(64), nullable=False)
    
    classical_risk = Column(Float, nullable=False)
    quantum_risk = Column(Float, nullable=True)
    hybrid_risk = Column(Float, nullable=False)
    risk_category = Column(String(32), nullable=False)  # Low, Moderate, High, Very High
    confidence = Column(String(32), default="Moderate")  # High, Moderate, Low
    uncertainty_score = Column(Float, default=0.15)
    
    contributing_factors = Column(Text, nullable=True)  # JSON array of SHAP/feature contributions
    explanation_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    patient = relationship("PatientRecord", back_populates="predictions")
    alerts = relationship("AlertRecord", back_populates="prediction", cascade="all, delete-orphan")

class AlertRecord(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(64), unique=True, index=True, nullable=False)
    record_id = Column(String(64), ForeignKey("patient_records.record_id"), nullable=False)
    prediction_id = Column(String(64), ForeignKey("predictions.prediction_id"), nullable=True)
    
    risk_score = Column(Float, nullable=False)
    severity = Column(String(32), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    reason = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    contributing_factors = Column(Text, nullable=True)
    
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(64), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="PENDING")  # PENDING, REVIEWED, ESCALATED, CLOSED
    created_at = Column(DateTime, default=utc_now)

    patient = relationship("PatientRecord", back_populates="alerts")
    prediction = relationship("PredictionRecord", back_populates="alerts")
    feedbacks = relationship("DoctorFeedbackRecord", back_populates="alert", cascade="all, delete-orphan")

class DoctorFeedbackRecord(Base):
    __tablename__ = "doctor_feedback"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(String(64), unique=True, index=True, nullable=False)
    alert_id = Column(String(64), ForeignKey("alerts.alert_id"), nullable=True)
    record_id = Column(String(64), nullable=False)
    
    agreement = Column(String(32), nullable=False)  # AGREE, PARTIAL, DISAGREE, NEEDS_REVIEW
    clinical_notes = Column(Text, nullable=True)
    recommended_action = Column(String(128), nullable=True)
    reviewer_name = Column(String(64), default="Dr. Clinical Reviewer")
    reviewer_role = Column(String(32), default="CLINICIAN")
    reviewed_at = Column(DateTime, default=utc_now)

    alert = relationship("AlertRecord", back_populates="feedbacks")

class AuditLogRecord(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=utc_now)
    user_role = Column(String(32), nullable=False)  # ADMIN, RESEARCHER, DOCTOR, VIEWER
    action = Column(String(64), nullable=False)  # LOGIN, DATASET_UPLOAD, MODEL_TRAIN, PREDICTION, ALERT_ACK, DOCTOR_FEEDBACK
    record_id = Column(String(64), nullable=True)
    details_json = Column(Text, nullable=True)

class NCBIGenomeRecord(Base):
    __tablename__ = "ncbi_genomic_records"

    id = Column(Integer, primary_key=True, index=True)
    accession = Column(String(64), unique=True, index=True, nullable=False)
    organism_name = Column(String(128), nullable=False)
    tax_id = Column(Integer, nullable=True)
    assembly_level = Column(String(64), nullable=True)
    gc_percent = Column(Float, nullable=True)
    contig_n50 = Column(Integer, nullable=True)
    total_sequence_length = Column(String(64), nullable=True)
    coding_genes = Column(Integer, nullable=True)
    busco_completeness = Column(Float, nullable=True)
    raw_json = Column(Text, nullable=True)
    fetched_at = Column(DateTime, default=utc_now)
