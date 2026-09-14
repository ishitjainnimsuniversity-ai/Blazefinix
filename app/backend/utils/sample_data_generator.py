"""
Synthetic Research Dataset Generator
Creates realistic clinical and genomic cohorts for early disease-risk experimentation.
NEVER uses private patient records.
"""

import numpy as np
import pandas as pd
from pathlib import Path

def generate_cardiometabolic_cohort(n_samples: int = 600, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates realistic cardiometabolic research cohort with clinical biomarkers.
    Features:
      - patient_id
      - age (years)
      - sex (0=female, 1=male)
      - systolic_bp (mmHg)
      - diastolic_bp (mmHg)
      - fasting_glucose (mg/dL)
      - hba1c (%)
      - total_cholesterol (mg/dL)
      - hdl_cholesterol (mg/dL)
      - ldl_cholesterol (mg/dL)
      - triglycerides (mg/dL)
      - bmi (kg/m^2)
      - resting_heart_rate (bpm)
      - smoking_status (0=never, 1=former, 2=current)
      - physical_activity_hours (hrs/wk)
      - family_history_cad (0 or 1)
      - hs_crp (mg/L - systemic inflammatory marker)
      - egfr (mL/min/1.73m2 - renal filtration rate)
      - disease_risk_label (0=low/normal, 1=elevated early disease risk)
    """
    np.random.seed(random_seed)

    patient_ids = [f"R-CAD-{1000 + i}" for i in range(n_samples)]
    age = np.random.normal(56, 12, n_samples).clip(28, 84).round(1)
    sex = np.random.binomial(1, 0.52, n_samples)
    
    # Blood pressure
    systolic_bp = (105 + 0.35 * age + np.random.normal(0, 14, n_samples)).clip(90, 200).round(1)
    diastolic_bp = (65 + 0.15 * age + 0.25 * (systolic_bp - 110) + np.random.normal(0, 8, n_samples)).clip(55, 120).round(1)
    
    # Glucose & HbA1c
    fasting_glucose = np.random.lognormal(mean=4.65, sigma=0.22, size=n_samples).clip(70, 260).round(1)
    hba1c = (fasting_glucose * 0.032 + 2.1 + np.random.normal(0, 0.35, n_samples)).clip(4.5, 12.0).round(2)
    
    # Lipid panel
    total_cholesterol = np.random.normal(205, 38, n_samples).clip(120, 340).round(1)
    hdl_cholesterol = np.random.normal(50 - 4 * sex, 12, n_samples).clip(22, 95).round(1)
    ldl_cholesterol = (total_cholesterol - hdl_cholesterol - 30 + np.random.normal(0, 15, n_samples)).clip(50, 240).round(1)
    triglycerides = np.random.lognormal(4.9, 0.38, n_samples).clip(65, 450).round(1)
    
    # BMI and lifestyle
    bmi = np.random.normal(27.8, 4.9, n_samples).clip(18.5, 44.0).round(1)
    resting_heart_rate = np.random.normal(72, 10, n_samples).clip(50, 115).round(0)
    smoking_status = np.random.choice([0, 1, 2], size=n_samples, p=[0.55, 0.25, 0.20])
    physical_activity_hours = np.random.exponential(2.8, n_samples).clip(0, 14).round(1)
    family_history_cad = np.random.binomial(1, 0.32, n_samples)
    
    # Advanced clinical markers
    hs_crp = np.random.lognormal(0.4, 0.75, n_samples).clip(0.1, 14.0).round(2)
    egfr = (120 - 0.7 * age - 0.1 * systolic_bp + np.random.normal(0, 10, n_samples)).clip(25, 135).round(1)

    # Risk latent score with clinical interaction terms
    latent_risk = (
        0.04 * (age - 50) +
        0.03 * (systolic_bp - 125) +
        0.02 * (ldl_cholesterol - 110) -
        0.03 * (hdl_cholesterol - 50) +
        0.035 * (fasting_glucose - 100) +
        0.08 * (bmi - 25) +
        0.45 * (smoking_status == 2) +
        0.35 * family_history_cad +
        0.22 * (hs_crp - 1.5) -
        0.02 * (egfr - 90) +
        np.random.normal(0, 0.75, n_samples)
    )
    
    # Convert latent score to probability via sigmoid
    prob = 1.0 / (1.0 + np.exp(-latent_risk))
    disease_risk_label = (prob >= 0.50).astype(int)

    df = pd.DataFrame({
        "patient_id": patient_ids,
        "age": age,
        "sex": sex,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "fasting_glucose": fasting_glucose,
        "hba1c": hba1c,
        "total_cholesterol": total_cholesterol,
        "hdl_cholesterol": hdl_cholesterol,
        "ldl_cholesterol": ldl_cholesterol,
        "triglycerides": triglycerides,
        "bmi": bmi,
        "resting_heart_rate": resting_heart_rate,
        "smoking_status": smoking_status,
        "physical_activity_hours": physical_activity_hours,
        "family_history_cad": family_history_cad,
        "hs_crp": hs_crp,
        "egfr": egfr,
        "disease_risk_label": disease_risk_label
    })

    return df

def generate_oncology_genomic_cohort(n_samples: int = 500, random_seed: int = 101) -> pd.DataFrame:
    """
    Generates synthetic oncology and genomic sequencing research cohort,
    incorporating assembly statistics aligned with NCBI Datasets schema.
    """
    np.random.seed(random_seed)

    patient_ids = [f"R-GEN-{2000 + i}" for i in range(n_samples)]
    age = np.random.normal(58, 11, n_samples).clip(30, 85).round(1)
    sex = np.random.binomial(1, 0.48, n_samples)
    
    family_history_cancer = np.random.binomial(1, 0.35, n_samples)
    brca_variant_presence = np.random.binomial(1, 0.18, n_samples)
    tp53_mutation_score = np.random.beta(2, 5, n_samples).round(3)
    
    # Genomic Assembly statistics (conforms to NCBI Datasets Assembly stats)
    genome_gc_content = np.random.normal(41.2, 0.8, n_samples).clip(39.0, 44.5).round(2)
    contig_n50_kbp = np.random.normal(28500, 4200, n_samples).clip(12000, 52000).round(0)
    busco_completeness_pct = np.random.normal(98.4, 0.7, n_samples).clip(94.0, 99.9).round(2)
    total_coding_genes = np.random.normal(19850, 180, n_samples).clip(19200, 20400).round(0)
    
    aneuploidy_score = np.random.poisson(3.8, n_samples).clip(0, 16)
    tumor_mutational_burden = np.random.lognormal(1.2, 0.65, n_samples).clip(0.5, 35.0).round(2)
    inflammatory_biomarker_score = np.random.normal(3.2, 1.4, n_samples).clip(0.2, 9.8).round(2)

    # Latent oncogenic risk
    latent = (
        0.03 * (age - 50) +
        1.10 * brca_variant_presence +
        1.45 * (tp53_mutation_score > 0.45) +
        0.08 * aneuploidy_score +
        0.09 * (tumor_mutational_burden - 5.0) +
        0.45 * family_history_cancer +
        0.15 * (inflammatory_biomarker_score - 2.5) +
        np.random.normal(0, 0.65, n_samples)
    )
    prob = 1.0 / (1.0 + np.exp(-latent))
    disease_risk_label = (prob >= 0.48).astype(int)

    df = pd.DataFrame({
        "patient_id": patient_ids,
        "age": age,
        "sex": sex,
        "family_history_cancer": family_history_cancer,
        "brca_variant_presence": brca_variant_presence,
        "tp53_mutation_score": tp53_mutation_score,
        "genome_gc_content": genome_gc_content,
        "contig_n50_kbp": contig_n50_kbp,
        "busco_completeness_pct": busco_completeness_pct,
        "total_coding_genes": total_coding_genes,
        "aneuploidy_score": aneuploidy_score,
        "tumor_mutational_burden": tumor_mutational_burden,
        "inflammatory_biomarker_score": inflammatory_biomarker_score,
        "disease_risk_label": disease_risk_label
    })

    return df

def save_sample_cohorts(target_dir: Path):
    target_dir.mkdir(parents=True, exist_ok=True)
    cardio_path = target_dir / "cardiometabolic_cohort.csv"
    onco_path = target_dir / "oncology_genomic_cohort.csv"
    
    df_cardio = generate_cardiometabolic_cohort()
    df_cardio.to_csv(cardio_path, index=False)
    
    df_onco = generate_oncology_genomic_cohort()
    df_onco.to_csv(onco_path, index=False)
    
    print(f"Generated {cardio_path} with {len(df_cardio)} rows.")
    print(f"Generated {onco_path} with {len(df_onco)} rows.")

if __name__ == "__main__":
    from app.backend.config import SAMPLE_DATA_DIR
    save_sample_cohorts(SAMPLE_DATA_DIR)
