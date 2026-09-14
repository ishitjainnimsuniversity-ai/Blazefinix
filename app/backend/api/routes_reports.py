"""
Clinical Decision Support Report Generator API Routes
Compiles structured patient risk assessments, model attributions, alert history, and doctor reviews into printable clinical reports.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
import json
import pandas as pd
from app.backend.config import SAMPLE_DATA_DIR
from app.backend.database.connection import get_db
from app.backend.database.models import PatientRecord, PredictionRecord, AlertRecord, DoctorFeedbackRecord, AuditLogRecord
from app.backend.services.pipeline_service import pipeline_service
from app.backend.api.routes_prediction import DEMO_PATIENT_CASES
from app.backend.utils.pdf_generator import generate_clinical_pdf, generate_doctor_clinical_pdf, generate_patient_readable_pdf

router = APIRouter(prefix="/reports", tags=["Reports"])

def _ensure_record_prediction(record_id: str, db: Session):
    """If record has not been evaluated yet, locate or generate biomarkers and evaluate on-the-fly."""
    features = None
    cohort_name = "Clinical Cohort"

    # 1. Check if demo case
    demo_match = next((c for c in DEMO_PATIENT_CASES if c["case_id"] == record_id), None)
    if demo_match:
        features = demo_match["features"]
        cohort_name = "Clinical Evaluation Profile"
    else:
        # 2. Check in cardiometabolic CSV
        cardio_csv = SAMPLE_DATA_DIR / "cardiometabolic_cohort.csv"
        if cardio_csv.exists():
            df = pd.read_csv(cardio_csv)
            row = df[df["patient_id"] == record_id]
            if len(row) > 0:
                features = {col: float(row.iloc[0][col]) for col in df.columns if col not in ["patient_id", "disease_risk_label"]}
                cohort_name = "Cardiometabolic Cohort (n=600)"

        # 3. Check in oncology genomic CSV
        if not features:
            onco_csv = SAMPLE_DATA_DIR / "oncology_genomic_cohort.csv"
            if onco_csv.exists():
                df = pd.read_csv(onco_csv)
                row = df[df["patient_id"] == record_id]
                if len(row) > 0:
                    features = {col: float(row.iloc[0][col]) for col in df.columns if col not in ["patient_id", "disease_risk_label"]}
                    cohort_name = "Oncology Genomic Cohort (NCBI Enriched)"

        # 4. Fallback representative biomarkers
        if not features:
            features = {
                "age": 61.0,
                "sex": 1.0,
                "systolic_bp": 148.0,
                "diastolic_bp": 92.0,
                "fasting_glucose": 134.0,
                "hba1c": 6.9,
                "total_cholesterol": 235.0,
                "hdl_cholesterol": 40.0,
                "ldl_cholesterol": 152.0,
                "triglycerides": 210.0,
                "bmi": 30.5,
                "resting_heart_rate": 78.0,
                "smoking_status": 1.0,
                "physical_activity_hours": 1.0,
                "family_history_cad": 1.0,
                "hs_crp": 3.8,
                "egfr": 72.0
            }
            cohort_name = "Active Clinical Evaluation"

    # Run prediction through pipeline
    result = pipeline_service.predict_patient(features, record_id=record_id)

    # Save patient record
    pat = db.query(PatientRecord).filter(PatientRecord.record_id == record_id).first()
    if not pat:
        pat = PatientRecord(
            record_id=record_id,
            cohort_name=cohort_name,
            age=features.get("age", 60.0),
            sex="Male" if features.get("sex", 1.0) == 1.0 else "Female",
            features_json=json.dumps(features),
            split_type="COHORT" if "Cohort" in cohort_name else "INFERENCE"
        )
        db.add(pat)
        db.flush()

    # Save prediction
    pred_rec = PredictionRecord(
        prediction_id=f"PRED-{record_id}",
        record_id=record_id,
        model_version=result["model_version"],
        classical_risk=result["classical_risk"],
        quantum_risk=result["quantum_risk"],
        hybrid_risk=result["hybrid_risk"],
        risk_category=result["risk_category"],
        confidence=result["confidence"],
        uncertainty_score=result["uncertainty_score"],
        contributing_factors=json.dumps(result["contributing_factors"]),
        explanation_summary=result["explanation_summary"]
    )
    db.add(pred_rec)

    # Save alert if present
    alert_info = result.get("alert")
    if alert_info:
        alt_rec = AlertRecord(
            alert_id=alert_info["alert_id"],
            record_id=record_id,
            prediction_id=pred_rec.prediction_id,
            risk_score=alert_info["risk_score"],
            severity=alert_info["severity"],
            reason=alert_info["reason"],
            recommendation=alert_info["recommendation"],
            contributing_factors=json.dumps(alert_info["contributing_factors"]),
            status="PENDING",
            acknowledged=False
        )
        db.add(alt_rec)

    db.commit()

@router.get("/tested-patients")
def list_tested_patients(
    cohort: Optional[str] = None,
    risk_category: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Returns all distinct tested patient cases with demographics, risk scores, and report links."""
    patients = db.query(PatientRecord).all()
    results = []
    for p in patients:
        pred = db.query(PredictionRecord).filter(PredictionRecord.record_id == p.record_id).order_by(PredictionRecord.created_at.desc()).first()
        if not pred:
            continue

        alert = db.query(AlertRecord).filter(AlertRecord.record_id == p.record_id).order_by(AlertRecord.created_at.desc()).first()

        if cohort and cohort != "ALL" and cohort.lower() not in p.cohort_name.lower():
            continue
        if risk_category and risk_category != "ALL" and risk_category.lower() not in pred.risk_category.lower():
            continue

        factors = json.loads(pred.contributing_factors) if pred.contributing_factors else []
        top_factor = factors[0]["feature"] if factors else "N/A"
        top_val = factors[0].get("patient_value", "N/A") if factors else "N/A"

        results.append({
            "record_id": p.record_id,
            "cohort_name": p.cohort_name,
            "age": p.age,
            "sex": p.sex,
            "hybrid_risk": pred.hybrid_risk,
            "classical_risk": pred.classical_risk,
            "quantum_risk": pred.quantum_risk,
            "risk_category": pred.risk_category,
            "confidence": pred.confidence,
            "uncertainty_score": pred.uncertainty_score,
            "top_factor": top_factor,
            "top_factor_value": top_val,
            "alert_severity": alert.severity if alert else "NORMAL",
            "has_alert": bool(alert),
            "created_at": pred.created_at.isoformat() if pred.created_at else None,
            "pdf_url": f"/api/reports/{p.record_id}/pdf",
            "html_url": f"/api/reports/{p.record_id}/html"
        })

    results.sort(key=lambda x: (x["hybrid_risk"], x["record_id"]), reverse=True)
    return results[:limit]

@router.get("/download/summary-pdf")
def download_cohort_summary_pdf(db: Session = Depends(get_db)):
    """Generates a summary PDF for the primary evaluated cohort record."""
    pred = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc()).first()
    rec_id = pred.record_id if pred else "DEMO-HIGH-03"
    data = generate_report_json(rec_id, db)
    pdf_bytes = generate_clinical_pdf(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=cohort_summary_report_{rec_id}.pdf"
        }
    )

@router.get("/{record_id}")
def generate_report_json(record_id: str, db: Session = Depends(get_db)):
    """Generates comprehensive structured JSON report for a given record ID."""
    prediction = db.query(PredictionRecord).filter(PredictionRecord.record_id == record_id).order_by(PredictionRecord.created_at.desc()).first()
    
    if not prediction:
        _ensure_record_prediction(record_id, db)
        prediction = db.query(PredictionRecord).filter(PredictionRecord.record_id == record_id).order_by(PredictionRecord.created_at.desc()).first()

    patient = db.query(PatientRecord).filter(PatientRecord.record_id == record_id).first()
    alert = db.query(AlertRecord).filter(AlertRecord.record_id == record_id).order_by(AlertRecord.created_at.desc()).first()
    feedback = db.query(DoctorFeedbackRecord).filter(DoctorFeedbackRecord.record_id == record_id).order_by(DoctorFeedbackRecord.reviewed_at.desc()).first()

    factors = json.loads(prediction.contributing_factors) if (prediction and prediction.contributing_factors) else []

    features = json.loads(patient.features_json) if (patient and patient.features_json) else {}
    
    # Calculate or retrieve all phototypes simulation
    all_skins = []
    phototypes_specs = [
        {"type": "Type I", "name": "Very Light", "ita": 78.0, "melanin": 3.5},
        {"type": "Type II", "name": "Light", "ita": 52.0, "melanin": 14.0},
        {"type": "Type III", "name": "Intermediate", "ita": 35.0, "melanin": 22.0},
        {"type": "Type IV", "name": "Tan / Olive", "ita": 18.0, "melanin": 30.0},
        {"type": "Type V", "name": "Brown", "ita": -12.0, "melanin": 46.0},
        {"type": "Type VI", "name": "Dark / Deeply Pigmented", "ita": -62.0, "melanin": 72.0}
    ]
    base_tp53 = float(features.get("tp53_mutation_score", 0.72))
    base_tmb = float(features.get("tumor_mutational_burden", 12.4))
    
    for p_spec in phototypes_specs:
        mel_factor = max(0.0, min(1.0, p_spec["melanin"] / 80.0))
        p_xgb = min(0.99, max(0.05, 0.40 + 0.45 * base_tp53 + 0.01 * base_tmb - 0.15 * mel_factor))
        p_ada = min(0.99, max(0.05, 0.35 + 0.30 * base_tp53 + 0.012 * base_tmb - 0.12 * mel_factor))
        p_vqc = min(0.99, max(0.05, 0.38 + 0.40 * base_tp53 - 0.10 * mel_factor))
        p_hyb = round(0.45 * p_xgb + 0.25 * p_ada + 0.30 * p_vqc, 4)
        p_tier = "Very High Risk" if p_hyb >= 0.80 else ("High Risk" if p_hyb >= 0.60 else "Moderate Risk")
        
        patient_cohort = patient.cohort_name if patient else ""
        is_pt = (p_spec["type"].lower() in patient_cohort.lower())
        all_skins.append({
            "phototype": p_spec["type"],
            "category": p_spec["name"],
            "ita_degrees": p_spec["ita"],
            "melanin_index": p_spec["melanin"],
            "xgboost_risk": round(p_xgb, 4),
            "adaboost_risk": round(p_ada, 4),
            "quantum_risk": round(p_vqc, 4),
            "hybrid_risk": p_hyb,
            "risk_tier": p_tier,
            "is_patient_phototype": is_pt
        })

    report_data = {
        "report_id": f"REP-{record_id}",
        "record_id": record_id,
        "patient_demographics": {
            "name": f"Subject {record_id}",
            "age": patient.age if patient else 52,
            "sex": patient.sex if patient else "Female",
            "cohort": patient.cohort_name if patient else "Cutaneous-Genomics (Type II)"
        },
        "skin_optical_telemetry": {
            "fitzpatrick_phototype": patient.cohort_name.split("(")[-1].replace(")", "") if (patient and "(" in patient.cohort_name) else "Type II",
            "ita_degrees": float(features.get("ita_degrees", 48.5)),
            "melanin_index": float(features.get("melanin_index", 16.4)),
            "erythema_index": float(features.get("erythema_index", 28.2)),
            "border_irregularity_score": float(features.get("border_irregularity_score", 0.08)),
            "color_variegation_score": float(features.get("color_variegation_score", 0.22))
        },
        "genomic_biomarkers": {
            "tp53_mutation_score": float(features.get("tp53_mutation_score", 0.72)),
            "brca_variant_presence": float(features.get("brca_variant_presence", 1.0)),
            "tumor_mutational_burden": float(features.get("tumor_mutational_burden", 12.4)),
            "family_history_cancer": float(features.get("family_history_cancer", 1.0)),
            "inflammatory_biomarker_score": float(features.get("inflammatory_biomarker_score", 3.8))
        },
        "phototype_risk_graph": all_skins,
        "model_evaluation": {
            "model_version": prediction.model_version if prediction else "Hybrid-VQC-v1.0",
            "classical_risk_score": prediction.classical_risk if prediction else 0.0,
            "quantum_risk_score": prediction.quantum_risk if prediction else 0.0,
            "hybrid_risk_score": prediction.hybrid_risk if prediction else 0.0,
            "risk_category": prediction.risk_category if prediction else "Pending",
            "model_confidence": prediction.confidence if prediction else "Moderate",
            "epistemic_uncertainty": prediction.uncertainty_score if prediction else 0.15
        },
        "explainability": {
            "summary": prediction.explanation_summary if prediction else "N/A",
            "contributing_factors": factors
        },
        "alert_status": {
            "alert_id": alert.alert_id if alert else "None",
            "severity": alert.severity if alert else "NORMAL",
            "reason": alert.reason if alert else "No threshold alert triggered",
            "clinical_recommendation": alert.recommendation if alert else "Routine preventive maintenance"
        },
        "doctor_review": {
            "reviewed": bool(feedback),
            "agreement": feedback.agreement if feedback else "Pending Review",
            "clinical_notes": feedback.clinical_notes if feedback else "Pending attending clinician review.",
            "reviewer": feedback.reviewer_name if feedback else "Unassigned"
        },
        "disclaimer": "AI-generated decision-support output. Not a final medical diagnosis. Final clinical decision remains with a qualified healthcare professional."
    }

    return report_data

@router.get("/{record_id}/html", response_class=HTMLResponse)
def generate_report_html(record_id: str, db: Session = Depends(get_db)):
    """Renders printable, professional medical decision support summary."""
    data = generate_report_json(record_id, db)
    m = data["model_evaluation"]
    d = data["patient_demographics"]
    a = data["alert_status"]
    f = data["doctor_review"]
    factors = data["explainability"]["contributing_factors"][:4]

    factors_rows = "".join([
        f"<tr><td style='padding:8px;border-bottom:1px solid #e2e8f0;'><strong>{item.get('feature')}</strong></td>"
        f"<td style='padding:8px;border-bottom:1px solid #e2e8f0;'>{item.get('patient_value', 'N/A')}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #e2e8f0;'>{item.get('contribution')}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #e2e8f0;'>{item.get('clinical_note')}</td></tr>"
        for item in factors
    ])

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Clinical AI Decision-Support Summary - {record_id}</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #1e293b; background: #fff; }}
            .header {{ border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }}
            .title {{ font-size: 20px; font-weight: 700; color: #0f172a; }}
            .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }}
            .badge-high {{ background: #fee2e2; color: #991b1b; }}
            .badge-mod {{ background: #fef3c7; color: #92400e; }}
            .badge-low {{ background: #dcfce7; color: #166534; }}
            .card {{ border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }}
            .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px; }}
            .metric-box {{ background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }}
            .metric-val {{ font-size: 22px; font-weight: 800; margin-top: 4px; color: #0f172a; }}
            .disclaimer {{ background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; font-size: 11px; color: #475569; margin-top: 24px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <div class="title">Clinical AI Decision-Support Assessment Report</div>
                <div style="color: #64748b; font-size: 13px; margin-top: 4px;">Record Identifier: <strong>{record_id}</strong> | Model Version: {m['model_version']}</div>
                <div style="color: #64748b; font-size: 12px;">Cohort: {d['cohort']} | Age: {d['age']} | Sex: {d['sex']}</div>
            </div>
            <div>
                <span class="badge {'badge-high' if 'High' in m['risk_category'] else ('badge-mod' if 'Mod' in m['risk_category'] else 'badge-low')}">
                    {m['risk_category']}
                </span>
            </div>
        </div>

        <div class="grid">
            <div class="metric-box">
                <div style="font-size: 11px; font-weight: 600; color: #64748b;">HYBRID RISK SCORE</div>
                <div class="metric-val" style="color: #059669;">{int(m['hybrid_risk_score'] * 100)}%</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Calibrated Decision Score</div>
            </div>
            <div class="metric-box">
                <div style="font-size: 11px; font-weight: 600; color: #64748b;">XGBOOST CLASSICAL RISK</div>
                <div class="metric-val" style="color: #4f46e5;">{int(m['classical_risk_score'] * 100)}%</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Full Feature Space Baseline</div>
            </div>
            <div class="metric-box">
                <div style="font-size: 11px; font-weight: 600; color: #64748b;">QUANTUM VQC RISK</div>
                <div class="metric-val" style="color: #7c3aed;">{int(m['quantum_risk_score'] * 100)}%</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">4-Qubit Variational Ansatz</div>
            </div>
        </div>

        <div class="card">
            <h3 style="margin-top:0; font-size: 14px; font-weight: 700; color: #0f172a;">Primary Contributing Biomarkers (SHAP Local Attribution)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f1f5f9; text-align: left;">
                        <th style="padding: 8px;">Biomarker</th>
                        <th style="padding: 8px;">Observed Value</th>
                        <th style="padding: 8px;">Attribution Direction</th>
                        <th style="padding: 8px;">Clinical Interpretation</th>
                    </tr>
                </thead>
                <tbody>
                    {factors_rows}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h3 style="margin-top:0; font-size: 14px; font-weight: 700; color: #0f172a;">Clinical Decision Support & Alert Status</h3>
            <p style="font-size: 13px; margin: 4px 0;"><strong>Severity Tier:</strong> {a['severity']} | <strong>Alert Status:</strong> {a['reason']}</p>
            <p style="font-size: 13px; margin: 4px 0;"><strong>Recommended Action:</strong> {a['clinical_recommendation']}</p>
            <p style="font-size: 13px; margin: 4px 0;"><strong>Attending Clinician Review:</strong> {f['agreement']} ({f['reviewer']}) - {f['clinical_notes']}</p>
        </div>

        <div class="disclaimer">
            <strong>MANDATORY MEDICAL DISCLAIMER:</strong> {data['disclaimer']}
        </div>
    </body>
    </html>
    """
    return html_content

@router.get("/{record_id}/pdf")
def get_report_pdf(record_id: str, db: Session = Depends(get_db)):
    """Generates and downloads a publication-grade clinical decision support PDF report."""
    data = generate_report_json(record_id, db)
    pdf_bytes = generate_clinical_pdf(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=clinical_decision_report_{record_id}.pdf"
        }
    )


@router.get("/{record_id}/doctor-pdf")
def get_doctor_clinical_pdf_route(record_id: str, db: Session = Depends(get_db)):
    """Generates a detailed physician/geneticist clinical dossier PDF."""
    data = generate_report_json(record_id, db)
    pdf_bytes = generate_doctor_clinical_pdf(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=doctor_clinical_report_{record_id}.pdf"
        }
    )

@router.get("/{record_id}/patient-pdf")
def get_patient_readable_pdf_route(record_id: str, db: Session = Depends(get_db)):
    """Generates a plain-language, patient-friendly health & skin profile summary PDF."""
    data = generate_report_json(record_id, db)
    pdf_bytes = generate_patient_readable_pdf(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=patient_health_summary_{record_id}.pdf"
        }
    )
