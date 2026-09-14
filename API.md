# REST API Reference Manual

The backend exposes a documented OpenAPI 3.0 compliant REST API at `http://localhost:8000`.  
Interactive Swagger documentation is available at `http://localhost:8000/docs`.

---

## 1. System & Health

### `GET /`
Returns system status, active version, quantum simulator mode, and medical disclaimer.

### `GET /api/health`
Returns health telemetry including database connectivity and quantum backend readiness.

---

## 2. Data Management & NCBI Ingestion

### `GET /api/data/datasets`
Lists available research cohorts (e.g. `cardiometabolic_cohort.csv`, `oncology_genomic_cohort.csv`).

### `GET /api/data/audit/{dataset_name}`
Executes deep dataset validation, returning:
- `quality_score` (0–100)
- `missing_values_pct` & `duplicate_records_pct`
- `outliers_detected`
- `class_balance_status`
- `recommendation`

### `POST /api/data/ncbi/fetch`
Queries official NCBI Datasets REST API for reference assembly metrics.
- **Request Body:** `{"accession": "GCF_000001405.40", "enrich_risk_features": true}`
- **Response:** Extracted GC%, Contig N50, coding genes, BUSCO completeness.

---

## 3. Model Research & Benchmarking

### `POST /api/models/train`
Executes end-to-end multi-model pipeline:
- **Parameters:** `dataset_name`, `selected_features_count` (e.g. 4), `test_size`, `cv_folds`.
- **Response:** Comparison metrics for Logistic Regression, Random Forest, XGBoost, VQC, and Hybrid Model with 5-fold CV statistics.

### `GET /api/models/benchmark`
Retrieves latest benchmark comparison table, cross-validation variance, and scientific honesty findings.

### `GET /api/models/quantum-circuit`
Returns Qiskit circuit metadata, parameter counts, gate layouts, and ASCII diagram.

---

## 4. Clinical Prediction & Alerts

### `GET /api/predict/demo-cases`
Returns 4 pre-configured synthetic demo patient profiles across the risk spectrum:
- Low Risk (`DEMO-LOW-01`)
- Moderate Risk (`DEMO-MOD-02`)
- High Risk (`DEMO-HIGH-03`)
- Very High Risk (`DEMO-CRIT-04`)

### `POST /api/predict`
Runs inference on patient biomarkers:
- **Request Body:**
  ```json
  {
    "record_id": "R-104928",
    "features": {
      "age": 62.0,
      "systolic_bp": 154.0,
      "fasting_glucose": 142.0,
      "hba1c": 7.2,
      "hs_crp": 4.5
    }
  }
  ```
- **Response:** Classical risk, Quantum VQC risk, Hybrid risk, SHAP attributions, clinical alert (if triggered), recommendation, and safety disclaimer.

### `GET /api/alerts`
Lists clinical alerts filtered by `severity` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and `status` (`PENDING`, `REVIEWED`, `ESCALATED`, `CLOSED`).

### `POST /api/alerts/{id}/acknowledge`
Clinician acknowledges an alert.

---

## 5. Doctor Review & Feedback

### `POST /api/feedback`
Submits doctor review:
- **Request Body:**
  ```json
  {
    "record_id": "R-104928",
    "agreement": "AGREE",
    "clinical_notes": "Risk score aligns with elevated inflammatory markers.",
    "recommended_action": "Cardiovascular stress test scheduled",
    "reviewer_name": "Dr. Clinical Attending"
  }
  ```
- **Response:** Confirmation of archival into research repository.

### `GET /api/feedback/summary`
Returns agreement rate, disagreement rate, and total reviews.

---

## 6. Reports & Audit

### `GET /api/reports/{record_id}`
Returns complete structured clinical decision report JSON.

### `GET /api/reports/{record_id}/html`
Renders formatted, printable medical decision-support HTML document.

### `GET /api/audit`
Returns immutable regulatory audit logs.
