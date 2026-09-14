# Clinical Decision-Support Safety & Risk Governance Manual

---

## 1. Core Safety Principles

This platform operates strictly as an **Artificial Intelligence Decision-Support System (AI-DSS)**.

### Mandatory Statements & Disclaimers
1. **No Definitive Diagnosis:**  
   The platform produces a continuous **disease-risk probability score** (e.g. $78\%$) and a risk category (`Low`, `Moderate`, `High`, `Very High`). It does **not** state: `"Patient has Disease X"`.
2. **Physician Authority:**  
   Every UI view, report, alert, and API payload carries the mandatory notice:  
   > *"AI-generated risk assessment — not a final medical diagnosis. Final clinical decision remains with a qualified healthcare professional."*
3. **Never Replace Healthcare Professionals:**  
   The AI model assists clinicians by identifying complex multi-variable biomarker interactions and highlighting elevated risk profiles; it never issues unilateral treatment directives.

---

## 2. Threshold Governance & Clinical Trade-Offs

### Configurable Threshold Hierarchy
- **$0\% – 30\%$:** Low Risk (Routine clinical preventive monitoring)
- **$31\% – 60\%$:** Moderate Risk (Intermediate lifestyle assessment & repeat testing)
- **$61\% – 80\%$:** High Risk (Urgent clinician review recommended)
- **$81\% – 100\%$:** Very High Risk (Critical priority alert & diagnostic workup)

### Sensitivity vs. Specificity Trade-Off
- **Lowering Review Thresholds (e.g. to $30\%$):** Increases clinical sensitivity, catching more early-stage disease risks and minimizing false negatives. However, this increases clinician review volume due to higher false-positive rates.
- **Raising Review Thresholds (e.g. to $70\%$):** Increases specificity, reducing false alarms, but risks missing early borderline patients who could benefit from preventive lifestyle or medical intervention.

---

## 3. Epistemic Uncertainty & Discordance Safety Checks

When classical XGBoost and the Variational Quantum Classifier yield discordant predictions:
$$\mathcal{U} = 0.50 \cdot |P_{\text{classical}} - P_{\text{quantum}}| + 0.30 \cdot \left(1.0 - \max(P_{\text{classical}}, 1 - P_{\text{classical}})\right)$$

If $\mathcal{U} \ge 0.35$, the system triggers an **Uncertainty Warning**:
> *"Elevated model epistemic uncertainty or inter-model discordance detected. Clinician review advised due to borderline biomarker ambiguity."*

---

## 4. Doctor-in-the-Loop Governance: Safe Feedback Boundary

### Why Doctor Feedback Does NOT Silently Retrain Production Models
In traditional software, continuous online learning can lead to catastrophic consequences in clinical AI:
1. **Susceptibility to Individual Bias:** An individual clinician's disagreement could introduce localized bias into the global model.
2. **Concept Drift & Feedback Loops:** If a model retrains on its own feedback, errors can compound exponentially.
3. **Regulatory Non-Compliance:** Regulated medical software requires versioned, frozen, and re-validated model checkpoints.

### Controlled Governance Architecture
```
Doctor Review & Feedback
           ↓
Immutable Feedback Database (Audited)
           ↓
Research & Clinical Review Committee
           ↓
Curated, Peer-Reviewed Dataset Partition
           ↓
Formal Offline Re-Training & Cross-Validation
           ↓
New Validated Model Version (e.g. v1.1.0)
```

---

## 5. Model Failure Graceful Fallback

If the quantum simulation layer encounters memory constraints, shot noise anomalies, or simulator errors:
1. The platform catches the exception internally.
2. It automatically falls back to the **validated classical XGBoost baseline**.
3. It displays:
   > *"Quantum component unavailable. Classical baseline prediction remains active."*
4. It logs the event to the immutable audit trail.
5. The application **never returns a blank prediction or crashes**.
