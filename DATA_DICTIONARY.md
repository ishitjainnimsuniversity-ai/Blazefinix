# Data Dictionary: Clinical Biomarkers & Genomic Attributes

---

## 1. Cardiometabolic Research Cohort (`cardiometabolic_cohort.csv`)

| Variable Name | Data Type | Units / Range | Clinical Description |
| :--- | :--- | :--- | :--- |
| `patient_id` | String | `R-CAD-xxxx` | De-identified unique patient identifier |
| `age` | Float | 28.0 – 84.0 years | Patient age at observation time |
| `sex` | Integer | 0 = Female, 1 = Male | Biological sex |
| `systolic_bp` | Float | 90.0 – 200.0 mmHg | Systolic arterial blood pressure |
| `diastolic_bp` | Float | 55.0 – 120.0 mmHg | Diastolic arterial blood pressure |
| `fasting_glucose` | Float | 70.0 – 260.0 mg/dL | Fasting plasma glucose level |
| `hba1c` | Float | 4.5 – 12.0 % | Glycated hemoglobin (long-term glycemic control) |
| `total_cholesterol` | Float | 120.0 – 340.0 mg/dL | Total circulating serum cholesterol |
| `hdl_cholesterol` | Float | 22.0 – 95.0 mg/dL | High-density lipoprotein (protective lipid) |
| `ldl_cholesterol` | Float | 50.0 – 240.0 mg/dL | Low-density lipoprotein (atherogenic marker) |
| `triglycerides` | Float | 65.0 – 450.0 mg/dL | Serum triglycerides concentration |
| `bmi` | Float | 18.5 – 44.0 $\text{kg/m}^2$ | Body Mass Index |
| `resting_heart_rate`| Float | 50 – 115 bpm | Baseline resting pulse rate |
| `smoking_status` | Integer | 0=Never, 1=Former, 2=Current | Cigarette smoking history |
| `physical_activity` | Float | 0.0 – 14.0 hrs/week | Self-reported moderate/vigorous aerobic activity |
| `family_history_cad`| Integer | 0 = No, 1 = Yes | First-degree relative with early coronary disease |
| `hs_crp` | Float | 0.1 – 14.0 mg/L | High-sensitivity C-reactive protein (inflammation) |
| `egfr` | Float | 25.0 – 135.0 $\text{mL/min/1.73m}^2$ | Estimated glomerular filtration rate (kidney function) |
| `disease_risk_label`| Integer | 0 = Baseline/Low, 1 = Elevated Risk | Target outcome label |

---

## 2. Oncology & Genomic Assembly Cohort (`oncology_genomic_cohort.csv`)

| Variable Name | Data Type | Units / Reference | Description & NCBI Mapping |
| :--- | :--- | :--- | :--- |
| `patient_id` | String | `R-GEN-xxxx` | De-identified genomic research identifier |
| `family_history_cancer`| Integer | 0 = No, 1 = Yes | Familial oncology incidence |
| `brca_variant_presence`| Integer | 0 = Absent, 1 = Present | Pathogenic/likely pathogenic BRCA1/2 variant |
| `tp53_mutation_score`| Float | 0.0 – 1.0 (Beta dist) | Functional disruption score in TP53 locus |
| `genome_gc_content` | Float | 39.0 – 44.5 % | Assembly GC nucleotide ratio (conforms to NCBI stats) |
| `contig_n50_kbp` | Float | 12,000 – 52,000 kbp | Assembly continuity contig N50 metric |
| `busco_completeness`| Float | 94.0 – 99.9 % | Single-copy ortholog completeness (NCBI Annotation) |
| `total_coding_genes`| Float | 19,200 – 20,400 | Annotated protein-coding genes count |
| `aneuploidy_score` | Integer | 0 – 16 arm alterations | Chromosomal structural instability metric |
| `tumor_mut_burden` | Float | 0.5 – 35.0 mut/Mb | Tumor mutational burden density |
| `inflammatory_score`| Float | 0.2 – 9.8 | Aggregate circulating inflammatory cytokine score |
| `disease_risk_label`| Integer | 0 = Low Risk, 1 = High Risk | Target risk stratification classification |
