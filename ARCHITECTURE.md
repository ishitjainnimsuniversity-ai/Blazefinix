# Technical Architecture Specification

## Hybrid Classical-Quantum Healthcare AI Platform for Early Disease-Risk Prediction

---

## 1. System Overview

The platform addresses a critical challenge in biomedical machine learning: **clinical datasets are high-dimensional, noisy, and non-linear**, while current **Noisy Intermediate-Scale Quantum (NISQ)** processors and quantum simulators have limited qubit counts and coherent circuit depth.

Rather than attempting to encode entire multi-omics patient records into a quantum register, this platform introduces a **compact hybrid pipeline**:
1. **Classical Machine Learning (XGBoost)** processes the high-dimensional clinical dataset, imputes missingness, scales continuous biomarkers, and ranks features by predictive gain.
2. **Dimension Reduction Stage** isolates the top $K$ most informative biomarkers ($K \in \{4, 6, 8\}$).
3. **Quantum Machine Learning (VQC)** encodes only these $K$ features into an entangled quantum state, leveraging Hilbert space transformations to model complex interaction terms.
4. **Calibrated Hybrid Ensemble** merges classical and quantum predictions into a bounded risk probability with uncertainty quantification.

```
RAW DATA / NCBI GENOME API
          │
          ▼
┌───────────────────────────────┐
│     DATA QUALITY ENGINE       │
│  - Missingness & Duplicates   │
│  - Outlier Auditing (3*IQR)   │
│  - Class Imbalance Scoring    │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│   LEAKAGE-FREE PREPROCESSOR   │
│  - Patient-Level Stratification│
│  - Train-Fitted Scalers/Impute│
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│   CLASSICAL BASELINE SUITE    │
│  - Logistic Regression (Lin)  │
│  - Random Forest (Bagging)    │
│  - XGBoost (Gradient Boost)   │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│   XGBOOST FEATURE SELECTION   │
│  - Gain/Weight Importance     │
│  - Top-K Feature Selection    │
└──────────────┬────────────────┘
               │ (Only Top-K Biomarkers)
               ▼
┌───────────────────────────────┐
│     QUANTUM STATE ENCODING    │
│  - Angle / ZZ-FeatureMap      │
│  - Superposition (Hadamard)   │
│  - Feature scaling: [-π, π]   │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│   VARIATIONAL CLASSIFIER (VQC)│
│  - RealAmplitudes / SU2 Ansatz│
│  - CNOT Entanglement Layers   │
│  - Pauli-Z Expectation Output │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│    HYBRID RISK ENSEMBLE       │
│  - P_hyb = α*P_xgb + (1-α)*P_q│
│  - Inter-model Discordance    │
│  - Epistemic Uncertainty      │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│     EXPLAINABLE AI (SHAP)     │
│  - TreeSHAP Local Attributions│
│  - Risk Factor Decomposition  │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│     CLINICAL ALERT ENGINE     │
│  - Low / Med / High / Critical│
│  - Threshold Safety Checks    │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│  DOCTOR REVIEW & GOVERNANCE   │
│  - Agree / Disagree Feedback  │
│  - Archived to Separate DB    │
│  - NO DIRECT AUTO-RETRAINING  │
└───────────────────────────────┘
```

---

## 2. Mathematical Formulation of the Hybrid Model

### 2.1 Classical Prediction
The classical backbone computes risk probability using a gradient-boosted ensemble of decision trees:
$$P_{\text{classical}} = \sigma\left(\sum_{m=1}^{M} f_m(X)\right) = \frac{1}{1 + e^{-\sum_{m=1}^{M} f_m(X)}}$$

### 2.2 Quantum Feature Encoding & Variational Ansatz
Given the selected top $k$ features $x = [x_1, x_2, \dots, x_k]^\top \in [-\pi, \pi]^k$:
1. **Initial State:** $|0\rangle^{\otimes k}$
2. **Superposition:** $H^{\otimes k} |0\rangle^{\otimes k}$
3. **Angle Feature Map:** $U_{\Phi}(x) = \bigotimes_{j=1}^k R_z(x_j)$
4. **Variational Ansatz:** $W(\theta) = \prod_{l=1}^L \left( \text{CNOT-Entanglers} \cdot \bigotimes_{j=1}^k R_y(\theta_{l,j}) \right)$
5. **State Preparation:** $|\psi(x, \theta)\rangle = W(\theta) U_{\Phi}(x) H^{\otimes k} |0\rangle^{\otimes k}$
6. **Measurement Expectation:**
   $$\langle Z_0 \rangle = \langle \psi(x, \theta) | Z_0 | \psi(x, \theta) \rangle \in [-1, 1]$$
7. **Probability Mapping:**
   $$P_{\text{quantum}} = \sigma(2 \cdot (\langle Z_0 \rangle + b)) = \frac{1}{1 + e^{-2(\langle Z_0 \rangle + b)}}$$

### 2.3 Calibrated Hybrid Combination
The final disease-risk score is computed via calibrated convex combination:
$$P_{\text{hybrid}} = \alpha \cdot P_{\text{classical}} + (1 - \alpha) \cdot P_{\text{quantum}}$$
Where $\alpha \in [0, 1]$ (default $\alpha = 0.60$).

### 2.4 Epistemic Uncertainty Quantification
Uncertainty $\mathcal{U}$ is modeled as a function of model discordance and boundary entropy:
$$\mathcal{U} = 0.50 \cdot |P_{\text{classical}} - P_{\text{quantum}}| + 0.30 \cdot \left(1.0 - \max(P_{\text{classical}}, 1 - P_{\text{classical}})\right)$$
If $\mathcal{U} \ge 0.35$, the prediction is automatically flagged as **High Uncertainty**, and clinician review is mandated regardless of risk tier.

---

## 3. NCBI Genomics Ingestion Architecture

The platform directly interfaces with the National Center for Biotechnology Information (NCBI) Datasets API:
- **API Endpoint:** `https://api.ncbi.nlm.nih.gov/datasets/v2alpha/genome/accession/{accession}/dataset_report`
- **Extracted Structural Genomics Metrics:**
  - `gc_percent`: Total assembly GC nucleotide percentage.
  - `contig_n50`: Contig N50 length in base pairs (assembly continuity).
  - `coding_genes`: Total verified protein-coding annotations.
  - `busco_completeness`: Benchmarking Universal Single-Copy Orthologs percentage.
- **Offline Reliability:** If external network connectivity is unavailable, the client automatically accesses verified reference records (`GCF_000001405.40` GRCh38.p14) to maintain uninterrupted simulation.

---

## 4. Clinician Safety & Feedback Loop

### Safe Retraining Boundary
A core architectural principle of this platform is: **Doctor feedback must never automatically modify production model weights.**

```
Clinician Review
      │
      ▼
Feedback Repository (Immutable SQLite/Postgres Table)
      │
      ▼
Clinical Governance & Model Audit Committee
      │
      ▼
Approved Gold-Standard Benchmark Dataset
      │
      ▼
Scheduled Offline Retraining & Generalization Verification
```

This ensures protection against adversarial feedback injection, localized clinician bias, and uncontrolled model drift.
