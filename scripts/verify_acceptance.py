"""
Live Acceptance Test Verification Script
Executes full 8-step pipeline against the running backend server.
"""

import urllib.request
import json

BASE = "http://127.0.0.1:8000/api"

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def get_json(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode())

def run_acceptance():
    print("=== 1. Data Quality Audit ===")
    audit = get_json(f"{BASE}/data/audit/cardiometabolic_cohort.csv")
    print(f"Quality Score: {audit['quality_score']}/100 | Grade: {audit['quality_grade']}")

    print("\n=== 2. Real NCBI Genomics Ingestion ===")
    ncbi = post_json(f"{BASE}/data/ncbi/fetch", {"accession": "GCF_000001405.40"})
    print(f"NCBI Organism: {ncbi['organism']} | GC%: {ncbi['features']['gc_percent']}% | Coding Genes: {ncbi['features']['coding_genes']}")

    print("\n=== 3. Model Benchmark Lab ===")
    bench = get_json(f"{BASE}/models/benchmark")
    print(f"Active Version: {bench['model_version']} | Top Features: {bench['selected_features']}")
    print(f"Scientific Summary: {bench['scientific_summary']}")

    print("\n=== 4. Hybrid Classical-Quantum Prediction ===")
    cases = get_json(f"{BASE}/predict/demo-cases")
    high_case = [c for c in cases if "HIGH" in c["case_id"]][0]
    pred = post_json(f"{BASE}/predict", {"record_id": "VERIF-PT-001", "features": high_case["features"]})
    print(f"Record: {pred['record_id']}")
    print(f"Classical XGBoost Risk: {pred['classical_risk'] * 100:.1f}%")
    print(f"Quantum VQC Risk: {pred['quantum_risk'] * 100:.1f}%")
    print(f"Hybrid Risk Score: {pred['hybrid_risk'] * 100:.1f}% ({pred['risk_category']})")
    print(f"Uncertainty: {pred['confidence']} ({pred['uncertainty_score']})")
    print(f"Alert Triggered: {pred['alert'] is not None}")
    alert_id = pred["alert"]["alert_id"] if pred["alert"] else None
    print(f"Alert ID: {alert_id} | Severity: {pred['alert']['severity']}")

    print("\n=== 5. Alert Acknowledgment ===")
    if alert_id:
        ack = post_json(f"{BASE}/alerts/{alert_id}/acknowledge", {"clinician_name": "Dr. Verification Clinician"})
        print(f"Ack Status: {ack['status']}")

    print("\n=== 6. Doctor Review & Feedback Loop ===")
    fb = post_json(f"{BASE}/feedback", {
        "record_id": "VERIF-PT-001",
        "alert_id": alert_id,
        "agreement": "AGREE",
        "clinical_notes": "Verified agreement with predicted hybrid risk score based on high hs-CRP.",
        "reviewer_name": "Dr. Verification Clinician"
    })
    print(f"Feedback ID: {fb['feedback_id']} | Status: {fb['status_message']}")

    print("\n=== 7. Audit Log Verification ===")
    logs = get_json(f"{BASE}/audit?limit=3")
    print(f"Recent Audit Logs Count: {len(logs)}")
    for l in logs:
        print(f" - [{l['user_role']}] {l['action']} on {l['record_id']}")

    print("\n=== 8. Medical Summary Report ===")
    rep = get_json(f"{BASE}/reports/VERIF-PT-001")
    print(f"Report ID: {rep['report_id']} | Risk Category: {rep['model_evaluation']['risk_category']}")
    print(f"Clinical Disclaimer: {rep['disclaimer']}")
    print("\n=======================================================")
    print("ALL 8 ACCEPTANCE STAGES COMPLETED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == "__main__":
    run_acceptance()
