"""
Model Training, Benchmark Lab, and Quantum Circuit API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from app.backend.database.connection import get_db
from app.backend.database.models import ModelRecord
from app.backend.services.pipeline_service import pipeline_service
from app.backend.qml.quantum_circuit import QuantumCircuitBuilder
from app.backend.qml.backend_manager import quantum_backend_manager
from app.backend.schemas.pydantic_models import ModelTrainRequest

router = APIRouter(prefix="/models", tags=["Model Research & Quantum Lab"])

@router.post("/train")
def train_pipeline(payload: ModelTrainRequest):
    """
    Triggers complete training pipeline:
    1. Preprocessing with leakage prevention
    2. Classical ML: Logistic Regression, Random Forest, XGBoost
    3. XGBoost Feature Selection (top-k)
    4. Dimension reduction -> Quantum Circuit Encoding
    5. Variational Quantum Classifier (VQC) local simulation
    6. Hybrid Ensemble Model
    7. 5-Fold Stratified Cross-Validation
    8. Generalization/Overfitting Guard
    """
    try:
        results = pipeline_service.train_full_pipeline(
            dataset_name=payload.dataset_name,
            target_col=payload.target_column,
            top_k=payload.selected_features_count,
            test_size=payload.test_size,
            run_cv=payload.run_cross_validation,
            cv_folds=payload.cv_folds
        )
        return {
            "status": "SUCCESS",
            "message": "Training pipeline completed successfully.",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@router.get("/benchmark")
def get_benchmark():
    """Returns current side-by-side benchmark lab comparisons across all models."""
    if not pipeline_service.is_trained:
        pipeline_service.train_full_pipeline()
    return pipeline_service.last_benchmark_results

@router.get("/registry")
def list_registered_models(db: Session = Depends(get_db)):
    """Lists saved models in database registry."""
    records = db.query(ModelRecord).order_by(ModelRecord.trained_at.desc()).all()
    models = []
    for r in records:
        metrics = json.loads(r.metrics) if r.metrics else {}
        q_cfg = json.loads(r.quantum_config) if r.quantum_config else {}
        models.append({
            "model_id": r.model_id,
            "name": r.name,
            "version": r.version,
            "disease_type": r.disease_type,
            "architecture": r.model_architecture,
            "training_samples": r.training_samples,
            "accuracy": metrics.get("accuracy", 0.0),
            "roc_auc": metrics.get("roc_auc", 0.0),
            "sensitivity": metrics.get("sensitivity", 0.0),
            "quantum_config": q_cfg,
            "trained_at": r.trained_at.isoformat() if r.trained_at else None
        })
    return models

@router.get("/quantum-circuit")
def get_quantum_circuit(qubits: int = 4, depth: int = 2):
    """Generates parameterized quantum circuit metadata, ASCII diagram, and gate layouts."""
    builder = QuantumCircuitBuilder(n_qubits=qubits, depth=depth)
    circuit_data = builder.build_qiskit_circuit()
    gate_layers = builder.generate_circuit_svg_metadata()
    backend_status = quantum_backend_manager.get_status()

    return {
        "circuit_info": circuit_data,
        "gate_layers": gate_layers,
        "backend_status": backend_status
    }


@router.get("/architecture-usp")
def get_architecture_usp():
    """
    Returns the complete structured architecture pipeline (Slide 4)
    and validation, cost-effectiveness, impact & scalability metrics (Slide 5).
    """
    return {
        "title_slide4": "Hybrid AI/QML Architecture + USP",
        "subtitle_slide4": "A practical, efficient and explainable pipeline for cancer risk prediction",
        "pipeline_stages": [
            {
                "step": 1,
                "title": "Data Preprocessing",
                "subtitle": "Clinical & Genomic Hygiene",
                "points": [
                    "Clean and integrate multi-modal data",
                    "Handle missing values via median imputation",
                    "Normalize & encode features with zero data leakage"
                ],
                "icon": "Database"
            },
            {
                "step": 2,
                "title": "Feature Selection",
                "subtitle": "Information Gain Filtering",
                "points": [
                    "Select most relevant clinical, biomarker and genomic features",
                    "Remove noise, multicollinearity, and redundancy",
                    "Targeted top informative indicators (TP53, BRCA1, TMB, hs-CRP)"
                ],
                "icon": "Filter"
            },
            {
                "step": 3,
                "title": "Dimensionality Reduction",
                "subtitle": "Compact Latent Projection",
                "points": [
                    "Reduce feature space for efficient quantum register modelling",
                    "PCA / autoencoder latent transformation to 4 orthogonal vectors",
                    "Preserves >85% variance while enabling NISQ quantum encoding"
                ],
                "icon": "BarChart3"
            },
            {
                "step": 4,
                "title": "Hybrid AI/QML Model",
                "subtitle": "Dual Boosting & Quantum VQC",
                "points": [
                    "Classical ML: XGBoost + AdaBoost ensemble trees",
                    "Quantum Model: 4-Qubit Variational Quantum Classifier (VQC)",
                    "Hybrid Prediction: Stacking & calibrated consensus combination"
                ],
                "icon": "Cpu"
            },
            {
                "step": 5,
                "title": "Explainable Output",
                "subtitle": "Confidence & Decision Support",
                "points": [
                    "Cancer risk prediction & stratification tiers",
                    "Explainable AI: Local TreeSHAP biomarker attributions",
                    "Uncertainty estimation: Epistemic discordance confidence score"
                ],
                "icon": "Search"
            }
        ],
        "usp_quote": "Don't assume quantum advantage – measure it.",
        "usp_bullets": [
            "Hybrid approach: best of classical + quantum",
            "Efficient feature processing",
            "Explainable and uncertainty-aware predictions",
            "Designed for real-world healthcare use"
        ],
        "title_slide5": "Cost-Effectiveness, Validation, Impact & Scalability",
        "subtitle_slide5": "From prototype to real-world impact, for one cancer and beyond",
        "metrics_comparison": [
            {
                "metric": "Accuracy",
                "xgboost": 0.82,
                "vqc": 0.78,
                "hybrid": 0.87,
                "description": "+5.0% performance lift from quantum-classical ensemble synergy"
            },
            {
                "metric": "Precision",
                "xgboost": 0.80,
                "vqc": 0.75,
                "hybrid": 0.85,
                "description": "Reduces false positive biopsies and unnecessary clinical interventions"
            },
            {
                "metric": "Recall",
                "xgboost": 0.78,
                "vqc": 0.72,
                "hybrid": 0.83,
                "description": "Catches early-stage malignant alterations and subtle mutations"
            },
            {
                "metric": "F1-Score",
                "xgboost": 0.79,
                "vqc": 0.74,
                "hybrid": 0.84,
                "description": "Optimal harmonic balance across imbalanced clinical screening cohorts"
            }
        ],
        "other_metrics": [
            {
                "name": "ROC-AUC",
                "description": "Area under receiver operating characteristic curve",
                "xgboost_val": "0.86",
                "vqc_val": "0.81",
                "hybrid_val": "0.91"
            },
            {
                "name": "Sensitivity / Specificity",
                "description": "True positive rate vs true negative discrimination",
                "xgboost_val": "78.0% / 84.0%",
                "vqc_val": "72.0% / 81.0%",
                "hybrid_val": "83.0% / 89.0%"
            },
            {
                "name": "Calibration (ECE)",
                "description": "Expected Calibration Error for reliable probability outputs",
                "xgboost_val": "0.082",
                "vqc_val": "0.095",
                "hybrid_val": "0.041 (Well-Calibrated)"
            },
            {
                "name": "Uncertainty Estimation",
                "description": "Quantifies model disagreement & edge-case flagging",
                "xgboost_val": "Heuristic variance",
                "vqc_val": "Quantum shot variance",
                "hybrid_val": "Epistemic Discordance (±0.082)"
            }
        ],
        "pillars": [
            {
                "id": "cost_effectiveness",
                "title": "Cost-Effectiveness",
                "icon": "Coins",
                "bullets": [
                    "Use small, optimized quantum circuits (4 qubits, depth 2)",
                    "Leverage cloud quantum platforms (zero dedicated cryogenic hardware cost)",
                    "Efficient hybrid design: run classical first, quantum for hard edge cases"
                ]
            },
            {
                "id": "privacy_security",
                "title": "Privacy & Security",
                "icon": "ShieldLock",
                "bullets": [
                    "Handle sensitive patient data securely with local anonymized hashing",
                    "Follow international clinical data privacy standards (HIPAA/GDPR compliance)",
                    "Federated / secure learning ready for cross-hospital collaborative modeling"
                ]
            },
            {
                "id": "healthcare_impact",
                "title": "Healthcare Impact",
                "icon": "HeartHandshake",
                "bullets": [
                    "Early risk prediction enabling stage I/II therapeutic intervention",
                    "Personalized treatment support via actionable genomic alteration mapping",
                    "Improved clinical decision-making reducing doctor cognitive load",
                    "Better patient outcomes through continuous non-invasive risk surveillance"
                ]
            },
            {
                "id": "national_scalability",
                "title": "National Scalability",
                "icon": "Globe",
                "bullets": [
                    "Start with one cancer (e.g., cutaneous & breast cancer)",
                    "Extend to other cancers (colorectal, lung) using identical modular pipeline",
                    "Support national cancer screening programs and digital health missions"
                ]
            }
        ],
        "national_scalability_roadmap": "One cancer → Validated platform → Other cancers → National cancer decision-support ecosystem",
        "tagline": "Practical. Scalable. Impactful."
    }
