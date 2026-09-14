"""
Cancer Genomics API Routes
Exposes live cancer genomic endpoints, real cohort data from NCI GDC, cBioPortal,
Ensembl, and ICGC-ARGO, coupled with hybrid classical-quantum risk stratification.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Response, Query, Body
from pydantic import BaseModel, Field

from app.backend.cancer_genomics.cancer_data_service import cancer_data_service

router = APIRouter(prefix="/cancer", tags=["Cancer Genomics"])

class CancerEvaluationRequest(BaseModel):
    patient_id: Optional[str] = Field("TCGA-BRCA-P01", description="Patient case identifier")
    cancer_key: str = Field("breast", description="Cancer key, e.g. breast, lung, oral_cavity")
    cancer_name: str = Field("Breast Invasive Carcinoma", description="Full cancer name")
    project_id: str = Field("TCGA-BRCA", description="TCGA / GDC project identifier")
    study_id: str = Field("brca_tcga_pan_can_atlas_2018", description="cBioPortal study identifier")
    gender: str = Field("female", description="Biological sex (female / male)")
    age: float = Field(58.0, description="Patient age at diagnosis")
    stage: str = Field("Stage IIA", description="AJCC pathologic tumor stage")
    driver_mutations: List[str] = Field(default=["TP53", "BRCA1"], description="Detected somatic/germline driver gene alterations")

class CancerPdfRequest(BaseModel):
    evaluation: Dict[str, Any]
    report_type: str = Field("doctor", description="'doctor' or 'patient'")

@router.get("/top-cancers")
def get_top_cancers():
    """Returns Top 5 Male, Female, and Combined cancer frequencies from GLOBOCAN 2024."""
    return cancer_data_service.get_top_cancers()

@router.get("/real-patients")
def get_real_patients():
    """Returns curated library of verified real patient cases across both sexes with clinical genomic profiles."""
    return cancer_data_service.get_real_patient_library()

@router.get("/genomic-structure/{gene_symbol}")
def get_genomic_structure(gene_symbol: str):
    """Fetches real genomic structure, chromosome locus, canonical transcript, and exons via Ensembl REST API."""
    return cancer_data_service.get_ensembl_structure(gene_symbol)

@router.get("/cohort-cases/{project_id}")
def get_cohort_cases(project_id: str, limit: int = Query(8, ge=1, le=50)):
    """Fetches real patient cases from NCI GDC API for a specific TCGA project."""
    return cancer_data_service.get_gdc_cases(project_id=project_id, limit=limit)

@router.get("/study-mutations/{study_id}/{gene_symbol}")
def get_study_mutations(study_id: str, gene_symbol: str, limit: int = Query(10, ge=1, le=50)):
    """Fetches real somatic mutations and driver alterations from cBioPortal Web API."""
    return cancer_data_service.get_cbioportal_mutations(study_id=study_id, gene_symbol=gene_symbol, limit=limit)

@router.get("/icgc-argo")
def get_icgc_argo_metadata():
    """Provides ICGC-ARGO cancer genomic data harmonization standards and clinical schemas."""
    return cancer_data_service.get_icgc_argo_reference()

@router.post("/evaluate-risk")
def evaluate_risk(payload: CancerEvaluationRequest):
    """Evaluates multi-cancer patient risk through the Hybrid AI/QML pipeline (XGBoost + AdaBoost + 4-Qubit VQC)."""
    return cancer_data_service.evaluate_cancer_risk(payload.dict())

@router.post("/download-report")
def download_cancer_report(req: CancerPdfRequest):
    """Generates and downloads publication-grade Doctor Clinical Dossier or Patient-Friendly Summary PDF."""
    pdf_bytes = cancer_data_service.generate_cancer_pdf(req.evaluation, report_type=req.report_type)
    patient_id = req.evaluation.get("patient_id", "Patient")
    report_label = "Doctor_Clinical_Dossier" if req.report_type.lower() == "doctor" else "Patient_Friendly_Summary"
    filename = f"{report_label}_{patient_id}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
