# Model Card: Hybrid Classical-Quantum Early Disease-Risk Stratification Model

---

## 1. Model Details

- **Model Identifier:** `Hybrid-VQC-v1.0` (and dynamically versioned variants)
- **Model Architecture:** Hybrid Classical Ensemble (XGBoost) + Variational Quantum Classifier (Qiskit Aer / PennyLane)
- **Primary Modality:** Tabular clinical biomarkers, laboratory measurements, and NCBI reference assembly statistics
- **Frameworks:** Python 3.12, scikit-learn 1.8+, XGBoost 3.2+, Qiskit 2.3+, PennyLane 0.40+, SHAP 0.52+
- **License:** Open Research Prototype

---

## 2. Intended Use

- **Intended Purpose:** Research-stage clinical decision support prototype for early multi-variable disease-risk stratification and clinician alert triage.
- **Intended Users:** Clinical researchers, healthcare data scientists, and computational medicine investigators.
- **Decision Mode:** Decision-support only. The system generates continuous risk probabilities and local SHAP feature attributions to assist clinicians.

---

## 3. Out-of-Scope & Prohibited Use

> **CRITICAL WARNING:**  
> **This prototype is not clinically validated and must not be used as a standalone diagnostic system.**

- **Prohibited:** Autonomous medical diagnosis, direct patient-facing self-triage without physician oversight, automated prescription or clinical intervention ordering.
- **Prohibited Claims:** Do NOT claim 100% accuracy, guaranteed diagnosis, automated cancer cure, or proven quantum advantage on classical hardware.

---

## 4. Training Data & Preprocessing

- **Cardiometabolic Research Cohort:** 600 synthetic patient records modeled on realistic clinical distributions (Framingham/ASCVD biomarkers: systolic/diastolic BP, fasting glucose, HbA1c, lipid panel, hs-CRP, eGFR, BMI).
- **Oncology & Genomic Cohort:** 500 synthetic patient records integrating tumor mutational burden, BRCA/TP53 mutation indicators, and NCBI assembly metrics (GC%, Contig N50, coding gene counts, BUSCO completeness).
- **Leakage Prevention:** All continuous scalers and median imputers are fitted strictly on the training partition ($80\%$) and applied to the test partition ($20\%$).
- **Patient Identifier Isolation:** Stratified splitting is performed at the unique patient level.

---

## 5. Evaluation Methodology & Metrics

The platform evaluates models across multiple dimensions rather than relying solely on accuracy:
- **Sensitivity / Recall:** $\frac{\text{TP}}{\text{TP} + \text{FN}}$ (critical for early disease screening to minimize false negatives)
- **Specificity:** $\frac{\text{TN}}{\text{TN} + \text{FP}}$ (minimizes false positive alarms)
- **ROC-AUC & PR-AUC:** Area under Receiver Operating Characteristic and Precision-Recall curves.
- **F1 Score:** Harmonic mean of precision and sensitivity.
- **Cross-Validation:** Stratified 5-Fold Cross-Validation reporting $\text{Mean} \pm \text{Std}$.
- **Generalization Gap:** Difference between Training ROC-AUC and Validation ROC-AUC (flags potential overfitting if $> 0.15$).

---

## 6. Known Limitations & Potential Biases

1. **NISQ Simulation Constraints:** Quantum simulations run on local classical CPUs using statevector and shot-based simulators. Real quantum hardware introduces physical noise and decoherence.
2. **Subpopulation Representation:** Synthetic datasets may not capture ethnic or demographic variations present in global real-world clinical populations.
3. **Threshold Sensitivity:** Altering risk boundaries shifts the trade-off between false positives and false negatives.

---

## 7. Safety, Uncertainty, & False Positives/Negatives

- **False Negatives:** In a clinical screening environment, false negatives (failing to identify an early high-risk patient) are higher consequence. Therefore, the alert engine can be tuned with a lower threshold (e.g. $30\%$) to prioritize sensitivity.
- **False Positives:** May cause clinical anxiety or unnecessary confirmatory tests.
- **Epistemic Uncertainty Flag:** If model discordance $|P_{\text{classical}} - P_{\text{quantum}}|$ exceeds $0.35$, the prediction is automatically flagged for manual clinician review.
