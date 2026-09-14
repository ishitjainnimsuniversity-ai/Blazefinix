# Blazefinix — Hybrid Classical-Quantum Clinical AI Platform

**Blazefinix** is a clinical-grade research prototype combining Classical Machine Learning (XGBoost, Random Forest, Logistic Regression) and Quantum Machine Learning (Parameterized Variational Quantum Classifier via Qiskit Aer & PennyLane) for early disease-risk stratification, local biomarker explainability (SHAP), clinician alerts, and doctor-in-the-loop review governance.

> **CRITICAL MEDICAL DISCLAIMER**  
> **AI-generated risk assessment — not a final medical diagnosis.**  
> This software is a research prototype intended solely for decision support and clinical evaluation. It does not replace medical judgment. The final clinical decision must always remain with a qualified healthcare professional.

---

## Architecture Principle: "Compact Quantum Processing"

The platform adheres to a strict architectural rule: **Never send the entire raw healthcare dataset into a quantum circuit.**

```
RAW CLINICAL DATA & NCBI GENOMICS
              ↓
    DATA QUALITY AUDIT
              ↓
REPRODUCIBLE PREPROCESSING (Zero Leakage)
              ↓
      CLASSICAL ML BASELINE
              ↓
  XGBOOST FEATURE IMPORTANCE
              ↓
  TOP INFORMATIVE BIOMARKERS (4 Qubits)
              ↓
      QUANTUM STATE ENCODING
              ↓
VARIATIONAL QUANTUM CLASSIFIER (VQC)
              ↓
   HYBRID CALIBRATED ENSEMBLE
              ↓
    PROBABILISTIC RISK SCORE
              ↓
    EXPLAINABLE AI (SHAP)
              ↓
   CLINICAL ALERT ENGINE
              ↓
FLAGSHIP DECISION SUPPORT DASHBOARD
              ↓
    DOCTOR REVIEW & FEEDBACK
              ↓
  RESEARCH AUDIT REPOSITORY (No auto-retrain)
```

**Scientific Philosophy:** *"We don't make the quantum computer process everything; we make it process what matters."*

---

## Core Features

1. **Dual Machine Learning Engine**:
   - **Classical ML**: Scikit-Learn Logistic Regression, Random Forest, and calibrated XGBoost as the primary classical backbone.
   - **Quantum ML**: Parameterized Quantum Circuit with Angle Encoding / $ZZ$-FeatureMap and $R_y$ variational ansatz executed on local Qiskit Aer and PennyLane simulators.
   - **Hybrid Ensemble**: Mathematically documented combination:
     $$P_{\text{hybrid}} = \alpha \cdot P_{\text{classical}} + (1 - \alpha) \cdot P_{\text{quantum}}$$
     with epistemic uncertainty estimation derived from model discordance.

2. **Zero Data Leakage Pipeline**:
   - Patient-level splitting protects against repeated patient observations.
   - Median imputers and standard scalers are fitted strictly on the training partition.

3. **Live NCBI Genomics API Integration**:
   - Connects to official NCBI Datasets REST API (`https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/`).
   - Retrieves real assembly reports (e.g. `GCF_000001405.40` for GRCh38 human reference).
   - Ingests GC content, contig N50, coding gene counts, and BUSCO completeness into risk modeling.
   - Features verified offline cache fallback ensuring the system never crashes when offline.

4. **Scientific Honesty & Benchmark Lab**:
   - Evaluates all models (Logistic Regression, Random Forest, XGBoost, QML VQC, and Hybrid Ensemble) on identical test partitions.
   - Features Stratified 5-Fold Cross-Validation reporting $\text{Mean} \pm \text{Std}$.
   - Never fabricates quantum advantage: If classical XGBoost achieves superior ROC-AUC, the system explicitly labels: *"Classical model currently performs better on this dataset."*

5. **Explainable AI (SHAP)**:
   - Evaluates patient-level TreeSHAP attributions.
   - Categorizes features into positive contributions, neutral baselines, or protective factors.
   - Adheres to clinical safety language: avoids asserting biological causality and describes features as risk score contributors.

6. **Doctor Alert & Triage System**:
   - Multi-tier alert hierarchy: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
   - Dispatches structured alerts when risk exceeds clinical thresholds or when epistemic uncertainty is elevated.
   - Non-alarming, professional medical recommendations.

7. **Doctor Review & Feedback Governance**:
   - Clinicians record concurrence: `Agree`, `Partially Agree`, `Disagree`, `Needs Review`.
   - Stores clinician commentary in a separate research database.
   - **Safety Guarantee**: Doctor feedback never silently retrains production model weights, preventing unsafe feedback drift.

8. **Offline-First Resilience**:
   - Executes 100% locally with local SQLite and quantum simulators.
   - Quantum hardware abstraction layer stages optional IBM Quantum Runtime backends without requiring cloud credentials.

---

## Repository Structure

```
/app
  /backend
    main.py                       # FastAPI entrypoint & middleware
    config.py                     # App settings, paths, thresholds
    /api
      routes_data.py              # Cohorts listing, data quality audit, NCBI fetch
      routes_models.py            # Train pipeline, benchmark lab, quantum circuits
      routes_prediction.py        # Hybrid inference, demo profiles, history
      routes_alerts.py            # Alert triage and clinician acknowledgement
      routes_feedback.py          # Doctor review repository
      routes_analytics.py         # KPIs, ROC/PR curve points, threshold curves
      routes_audit.py             # Immutable audit trail
      routes_reports.py           # Structured JSON and printable HTML reports
    /database
      connection.py               # Database session manager
      models.py                   # SQLAlchemy schema (Patient, Model, Alert, Feedback, Audit)
    /ml
      preprocessor.py             # Data quality engine & leakage-free preprocessor
      classical_models.py         # Logistic Regression, Random Forest, XGBoost
      cross_validation.py         # Stratified 5-fold CV with variance bounds
    /qml
      quantum_circuit.py          # Qiskit circuit generator (gates, depth, ASCII)
      vqc_classifier.py           # Variational Quantum Classifier (PennyLane & Aer)
      backend_manager.py          # Quantum hardware abstraction layer
      hybrid_ensemble.py          # Calibrated probability combination & uncertainty
    /explainability
      shap_explainer.py           # TreeSHAP and local feature attribution
    /alerts
      alert_engine.py             # Multi-tier alert engine & threshold rules
    /ncbi
      ncbi_client.py              # NCBI Datasets API client with offline cache
    /schemas
      pydantic_models.py          # Request and response schemas
    /services
      pipeline_service.py         # Pipeline orchestration singleton
    /utils
      sample_data_generator.py    # Synthetic cardiometabolic & genomic cohort generator
  /frontend
    index.html                    # Root HTML
    vite.config.ts                # Vite config & API reverse proxy
    tailwind.config.js            # Clinical & quantum theme palette
    /src
      App.tsx                     # Main application container
      /components
        Sidebar.tsx               # Navigation across clinical modules
        Header.tsx                # Status indicator, model version, alerts badge
        MedicalDisclaimer.tsx     # Standardized clinical safety notice
        CircuitVisualizer.tsx     # Interactive SVG quantum circuit visualizer
      /pages
        DashboardPage.tsx         # Executive clinical KPI overview
        ClinicalDecisionPage.tsx  # Flagship Decision Support UI (Section 47)
        ModelLabPage.tsx          # Research Benchmark Lab (XGBoost vs RF vs QML vs Hybrid)
        QuantumLabPage.tsx        # Quantum Circuit configurator & simulator runner
        DataQualityPage.tsx       # Data audit & live NCBI genomics ingestion
        AlertsPage.tsx            # Alert queue, triage, and acknowledgement
        DoctorReviewPage.tsx      # Clinician feedback workflow & audit
        NewPredictionPage.tsx     # 1-Click Demo cases & biomarker input
        PatientRecordsPage.tsx    # Records archive
        AuditLogsPage.tsx         # Regulatory audit trail
        ReportsPage.tsx           # Printable medical decision report
        SettingsPage.tsx          # Threshold configuration & quantum backends
  /data
    /sample
      cardiometabolic_cohort.csv  # 600 synthetic patient research records
      oncology_genomic_cohort.csv # 500 synthetic genomic patient records
  /tests
    test_preprocessing.py
    test_classical_models.py
    test_quantum_circuit.py
    test_hybrid_pipeline.py
    test_alerts_and_feedback.py
    test_api_endpoints.py
    test_end_to_end.py
README.md
ARCHITECTURE.md
MODEL_CARD.md
DATA_DICTIONARY.md
API.md
SAFETY.md
```

---

## Installation & Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js v18+ (tested on Node v24)
- npm v9+

### Step 1: Install Python Backend Dependencies
```bash
pip install fastapi uvicorn pydantic pydantic-settings sqlalchemy scikit-learn xgboost shap pennylane qiskit qiskit-aer pandas numpy scipy pytest
```

### Step 2: Install Frontend Dependencies
```bash
cd app/frontend
npm install
cd ../..
```

---

## Running the Platform

### Option A: Launching Backend and Frontend

**Terminal 1 (Backend - FastAPI Server):**
```bash
uvicorn app.backend.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Swagger Documentation is available at `http://localhost:8000/docs`*

**Terminal 2 (Frontend - React / Vite):**
```bash
cd app/frontend
npm run dev
```
*Frontend opens at `http://localhost:3000`*

---

## Automated Test Verification

Execute the complete test suite:
```bash
python -m pytest tests/ -v
```

All 14 unit and integration tests validate:
- Preprocessing and train/test leakage isolation
- Classical XGBoost, Random Forest, and Logistic Regression training
- Top-k feature selection and importance ordering
- Qiskit quantum circuit depth and parameter assignment
- PennyLane Variational Quantum Classifier (VQC) local simulation
- Hybrid probability weighting and discordance uncertainty bounds
- Clinical alert rule evaluations and severity mapping
- Doctor feedback persistence without weight alteration
- REST API endpoint response codes and OpenAPI schema validity
- End-to-end multi-stage pipeline flow

---

## 1-Click Full Demonstration

1. Open `http://localhost:3000`.
2. Click **Run Full Pipeline Demo** in the top header.
3. The platform will automatically:
   - Select a high-risk patient research profile.
   - Run the preprocessor and classical XGBoost prediction.
   - Select the top 4 biomarkers (`systolic_bp`, `fasting_glucose`, `hba1c`, `hs_crp`).
   - Execute the Variational Quantum Classifier on the local Aer simulator.
   - Compute hybrid ensemble risk (e.g. 78%) and uncertainty score.
   - Generate local SHAP biomarker attributions.
   - Trigger a high-priority clinician alert.
   - Navigate directly to the **Clinical AI Decision Support** screen.
4. On the decision screen:
   - Inspect the model risk comparison breakdown.
   - Review the SHAP attribution bars.
   - Click **Acknowledge Alert** or **Add Doctor Feedback**.
   - Click **Generate Clinical PDF/Report** to view the printable medical summary.
