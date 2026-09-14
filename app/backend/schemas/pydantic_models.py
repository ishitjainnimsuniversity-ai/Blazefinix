"""
Pydantic Schemas for Request and Response Validation
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class DataQualityMetric(BaseModel):
    total_records: int
    total_features: int
    missing_values_count: int
    missing_values_pct: float
    duplicate_records_count: int
    duplicate_records_pct: float
    class_distribution: Dict[str, int]
    quality_score: int  # 0 to 100
    quality_grade: str  # Excellent, Good, Acceptable, Poor
    outliers_detected: int
    recommendation: str

class PatientRecordCreate(BaseModel):
    record_id: Optional[str] = None
    cohort_name: Optional[str] = "General Clinical Cohort"
    age: float
    sex: str
    features: Dict[str, float]
    target_label: Optional[int] = None

class PatientRecordResponse(BaseModel):
    record_id: str
    cohort_name: str
    age: Optional[float]
    sex: Optional[str]
    features: Dict[str, Any]
    target_label: Optional[int]
    split_type: str
    created_at: datetime

class ContributingFactor(BaseModel):
    feature: str
    importance_value: float
    contribution: str  # High positive, Moderate positive, Neutral, Protective
    clinical_note: str

class QuantumConfig(BaseModel):
    qubits: int = Field(default=4, ge=2, le=12)
    circuit_depth: int = Field(default=2, ge=1, le=8)
    shots: int = Field(default=512, ge=100, le=4096)
    feature_map_type: str = "ZZFeatureMap"  # ZZFeatureMap, AngleEncoding, PauliFeatureMap
    ansatz_type: str = "RealAmplitudes"      # RealAmplitudes, EfficientSU2
    backend_name: str = "AerSimulator"       # AerSimulator, StatevectorSimulator, PennyLaneDefault
    optimizer: str = "COBYLA"                # COBYLA, SPSA, ADAM
    max_iterations: int = 40

class ModelTrainRequest(BaseModel):
    dataset_name: str = "cardiometabolic_cohort.csv"
    target_column: str = "disease_risk_label"
    selected_features_count: int = Field(default=4, ge=2, le=10)
    test_size: float = Field(default=0.2, ge=0.1, le=0.4)
    run_cross_validation: bool = True
    cv_folds: int = Field(default=5, ge=3, le=10)
    quantum_config: Optional[QuantumConfig] = None

class ModelMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    sensitivity: float
    specificity: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    training_time_seconds: float
    inference_time_ms: float
    cv_roc_auc_mean: Optional[float] = None
    cv_roc_auc_std: Optional[float] = None

class ModelComparisonResult(BaseModel):
    model_name: str
    architecture: str
    metrics: ModelMetrics
    generalization_gap: float  # Train AUC - Val AUC
    overfitting_status: str     # Healthy, Moderate Gap, Potential Overfitting
    notes: str

class TrainingSummaryResponse(BaseModel):
    task_id: str
    dataset_name: str
    total_samples: int
    train_samples: int
    test_samples: int
    top_features: List[Dict[str, Any]]
    classical_baseline_metrics: ModelMetrics
    quantum_vqc_metrics: ModelMetrics
    hybrid_metrics: ModelMetrics
    model_comparisons: List[ModelComparisonResult]
    best_classical_model: str
    best_qml_model: str
    best_hybrid_model: str
    scientific_summary: str

class PredictionRequest(BaseModel):
    record_id: Optional[str] = None
    features: Dict[str, float]
    model_version: Optional[str] = "Hybrid-VQC-v1.0"
    quantum_config: Optional[QuantumConfig] = None

class PredictionResponse(BaseModel):
    prediction_id: str
    record_id: str
    model_version: str
    classical_risk: float
    quantum_risk: Optional[float]
    hybrid_risk: float
    risk_category: str  # Low Risk, Moderate Risk, High Risk, Very High Risk
    confidence: str      # High, Moderate, Low
    uncertainty_score: float
    contributing_factors: List[ContributingFactor]
    explanation_summary: str
    alert_triggered: bool
    alert_id: Optional[str] = None
    alert_severity: Optional[str] = None
    clinical_recommendation: str
    disclaimer: str = "AI-generated risk assessment — not a final medical diagnosis. Final clinical decision remains with a qualified healthcare professional."
    timestamp: datetime

class AlertAcknowledgeRequest(BaseModel):
    clinician_name: str
    notes: Optional[str] = None

class DoctorFeedbackCreate(BaseModel):
    alert_id: Optional[str] = None
    record_id: str
    agreement: str  # AGREE, PARTIAL, DISAGREE, NEEDS_REVIEW
    clinical_notes: str
    recommended_action: Optional[str] = "Scheduled for follow-up testing"
    reviewer_name: str
    reviewer_role: str = "ATTENDING_PHYSICIAN"

class DoctorFeedbackResponse(BaseModel):
    feedback_id: str
    alert_id: Optional[str]
    record_id: str
    agreement: str
    clinical_notes: str
    recommended_action: Optional[str]
    reviewer_name: str
    reviewed_at: datetime
    status_message: str = "Feedback stored securely in research repository. Not directly deployed to production weights."

class AuditLogResponse(BaseModel):
    log_id: str
    timestamp: datetime
    user_role: str
    action: str
    record_id: Optional[str]
    details: Dict[str, Any]

class NCBIGenomeRequest(BaseModel):
    accession: str = "GCF_000001405.40"  # GRCh38 human reference genome assembly
    enrich_risk_features: bool = True
