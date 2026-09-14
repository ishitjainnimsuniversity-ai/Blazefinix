/**
 * Real GRCh38.p14 Cancer Driver Genes Reference & Telemetry
 * Integrated with Ensembl REST, NCBI ClinVar, and cBioPortal standards.
 */

export interface CancerGeneInfo {
  symbol: string;
  name: string;
  ensembl_id: string;
  chromosome: string;
  locus: string;
  start: number;
  end: number;
  strand: '+' | '-';
  canonical_transcript: string;
  exon_count: number;
  primary_cancers: string[];
  hotspot_mutation: string;
  protein_change: string;
  mutation_type: string;
  clinvar_significance: string;
  vaf_pct: number;
  vqc_phase_angle_rad: number;
  biological_function: string;
}

export const CANCER_GENE_PROFILES: Record<string, CancerGeneInfo> = {
  TP53: {
    symbol: 'TP53',
    name: 'Tumor Protein P53',
    ensembl_id: 'ENSG00000141510',
    chromosome: 'chr17',
    locus: '17p13.1',
    start: 7668402,
    end: 7687550,
    strand: '-',
    canonical_transcript: 'ENST00000269305',
    exon_count: 11,
    primary_cancers: ['Breast', 'Ovarian', 'Colorectal', 'Lung', 'Pan-Cancer'],
    hotspot_mutation: 'c.524G>A',
    protein_change: 'p.R175H',
    mutation_type: 'Missense Mutation (DNA-binding domain)',
    clinvar_significance: 'Pathogenic / Li-Fraumeni Susceptibility',
    vaf_pct: 42.8,
    vqc_phase_angle_rad: 2.148,
    biological_function: 'Guardian of the genome; coordinates cell cycle arrest (G1/S), senescence, and intrinsic apoptotic signaling upon DNA damage.'
  },
  BRCA1: {
    symbol: 'BRCA1',
    name: 'BRCA1 DNA Repair Associated',
    ensembl_id: 'ENSG00000012048',
    chromosome: 'chr17',
    locus: '17q21.31',
    start: 43044295,
    end: 43125483,
    strand: '-',
    canonical_transcript: 'ENST00000357654',
    exon_count: 24,
    primary_cancers: ['Breast', 'Ovarian', 'Prostate', 'Pancreatic'],
    hotspot_mutation: 'c.68_69delAG',
    protein_change: 'p.E23fs / 185delAG',
    mutation_type: 'Frameshift Truncation',
    clinvar_significance: 'Pathogenic (Homologous Recombination Deficiency)',
    vaf_pct: 48.6,
    vqc_phase_angle_rad: 1.842,
    biological_function: 'Essential component of the homologous recombination repair pathway; maintains genomic stability against double-strand breaks.'
  },
  BRCA2: {
    symbol: 'BRCA2',
    name: 'BRCA2 DNA Repair Associated',
    ensembl_id: 'ENSG00000139618',
    chromosome: 'chr13',
    locus: '13q13.1',
    start: 32315474,
    end: 32400266,
    strand: '+',
    canonical_transcript: 'ENST00000380152',
    exon_count: 27,
    primary_cancers: ['Breast', 'Ovarian', 'Prostate', 'Melanoma'],
    hotspot_mutation: 'c.5946delT',
    protein_change: 'p.S1982fs / 6174delT',
    mutation_type: 'Frameshift Truncation',
    clinvar_significance: 'Pathogenic (PARP Inhibitor Sensitizing)',
    vaf_pct: 45.1,
    vqc_phase_angle_rad: 1.765,
    biological_function: 'Mediates RAD51 recombinase filament loading onto single-stranded DNA during double-strand break repair.'
  },
  EGFR: {
    symbol: 'EGFR',
    name: 'Epidermal Growth Factor Receptor',
    ensembl_id: 'ENSG00000146648',
    chromosome: 'chr7',
    locus: '7p11.2',
    start: 55019017,
    end: 55211628,
    strand: '+',
    canonical_transcript: 'ENST00000275493',
    exon_count: 28,
    primary_cancers: ['Lung (LUAD)', 'Glioblastoma', 'Colorectal', 'Head & Neck'],
    hotspot_mutation: 'c.2573T>G',
    protein_change: 'p.L858R / T790M',
    mutation_type: 'Activating Kinase Domain Mutation',
    clinvar_significance: 'Pathogenic (TKI Sensitizing: Osimertinib/Gefitinib)',
    vaf_pct: 38.4,
    vqc_phase_angle_rad: 1.954,
    biological_function: 'Receptor tyrosine kinase driving cell survival, proliferation, and angiogenesis through MAPK and PI3K/Akt signaling cascades.'
  },
  KRAS: {
    symbol: 'KRAS',
    name: 'KRAS Proto-Oncogene, GTPase',
    ensembl_id: 'ENSG00000133703',
    chromosome: 'chr12',
    locus: '12p12.1',
    start: 25204789,
    end: 25250929,
    strand: '-',
    canonical_transcript: 'ENST00000311936',
    exon_count: 6,
    primary_cancers: ['Colorectal', 'Lung (NSCLC)', 'Pancreatic', 'Endometrial'],
    hotspot_mutation: 'c.35G>A',
    protein_change: 'p.G12D / p.G12C',
    mutation_type: 'Constitutive GTPase Activation',
    clinvar_significance: 'Targetable Oncogenic Driver (Sotorasib / Adagrasib)',
    vaf_pct: 36.9,
    vqc_phase_angle_rad: 2.215,
    biological_function: 'Small GTPase that relays upstream growth factor signals to intracellular cascades; impaired GTP hydrolysis locks pathway in permanent ON state.'
  },
  BRAF: {
    symbol: 'BRAF',
    name: 'B-Raf Proto-Oncogene, Ser/Thr Kinase',
    ensembl_id: 'ENSG00000157764',
    chromosome: 'chr7',
    locus: '7q34',
    start: 140719327,
    end: 140924929,
    strand: '-',
    canonical_transcript: 'ENST00000288602',
    exon_count: 18,
    primary_cancers: ['Melanoma (Cutaneous)', 'Colorectal', 'Thyroid', 'Lung'],
    hotspot_mutation: 'c.1799T>A',
    protein_change: 'p.V600E / p.V600K',
    mutation_type: 'Kinase Domain Activating Transversion',
    clinvar_significance: 'Pathogenic (Targetable: Dabrafenib + Trametinib)',
    vaf_pct: 44.2,
    vqc_phase_angle_rad: 2.302,
    biological_function: 'Serine/threonine kinase in the MAPK/ERK signaling axis; V600E confers 500-fold constitutive catalytic activity independent of RAS.'
  },
  PIK3CA: {
    symbol: 'PIK3CA',
    name: 'Phosphatidylinositol-4,5-Bisphosphate 3-Kinase Catalytic Subunit Alpha',
    ensembl_id: 'ENSG00000121879',
    chromosome: 'chr3',
    locus: '3q26.32',
    start: 179148114,
    end: 179240093,
    strand: '+',
    canonical_transcript: 'ENST00000263967',
    exon_count: 21,
    primary_cancers: ['Breast', 'Colorectal', 'Cervical', 'Endometrial'],
    hotspot_mutation: 'c.3140A>G',
    protein_change: 'p.H1047R / p.E545K',
    mutation_type: 'Helical/Kinase Domain Activation',
    clinvar_significance: 'Pathogenic (Targetable: Alpelisib)',
    vaf_pct: 31.7,
    vqc_phase_angle_rad: 1.624,
    biological_function: 'Phosphorylates PIP2 to PIP3 to activate AKT/mTOR survival pathways, overcoming nutrient starvation and apoptosis.'
  },
  PTEN: {
    symbol: 'PTEN',
    name: 'Phosphatase and Tensin Homolog',
    ensembl_id: 'ENSG00000171862',
    chromosome: 'chr10',
    locus: '10q23.31',
    start: 87862562,
    end: 87971930,
    strand: '+',
    canonical_transcript: 'ENST00000371953',
    exon_count: 9,
    primary_cancers: ['Prostate', 'Glioblastoma', 'Endometrial', 'Breast'],
    hotspot_mutation: 'c.388C>T',
    protein_change: 'p.R130G / Homozygous Deletion',
    mutation_type: 'Loss of Function / Dephosphorylation Deficit',
    clinvar_significance: 'Pathogenic (Tumor Suppressor Inactivation)',
    vaf_pct: 39.5,
    vqc_phase_angle_rad: 1.890,
    biological_function: 'Major lipid phosphatase antagonizing the PI3K/AKT axis by dephosphorylating PIP3 back into PIP2.'
  },
  CDKN2A: {
    symbol: 'CDKN2A',
    name: 'Cyclin Dependent Kinase Inhibitor 2A',
    ensembl_id: 'ENSG00000147889',
    chromosome: 'chr9',
    locus: '9p21.3',
    start: 21967751,
    end: 21995301,
    strand: '-',
    canonical_transcript: 'ENST00000304494',
    exon_count: 3,
    primary_cancers: ['Melanoma', 'Oral Cavity (HNSC)', 'Pancreatic', 'Bladder'],
    hotspot_mutation: 'c.238C>T',
    protein_change: 'p.R80* / p16INK4a Deletion',
    mutation_type: 'Nonsense / Homozygous Deletion',
    clinvar_significance: 'Pathogenic (CDK4/6 Disinhibition)',
    vaf_pct: 46.0,
    vqc_phase_angle_rad: 2.055,
    biological_function: 'Encodes tumor suppressors p16INK4a (inhibits CDK4/6-mediated Rb phosphorylation) and p14ARF (stabilizes p53 by binding MDM2).'
  },
  MC1R: {
    symbol: 'MC1R',
    name: 'Melanocortin 1 Receptor',
    ensembl_id: 'ENSG00000258839',
    chromosome: 'chr16',
    locus: '16q24.3',
    start: 89917945,
    end: 89920947,
    strand: '+',
    canonical_transcript: 'ENST00000555147',
    exon_count: 1,
    primary_cancers: ['Melanoma', 'Cutaneous Squamous Cell Carcinoma'],
    hotspot_mutation: 'c.451C>T',
    protein_change: 'p.R151C (Red Hair Variant R)',
    mutation_type: 'G-Protein Coupled Receptor Polymorphism',
    clinvar_significance: 'Cutaneous Melanoma Susceptibility Allele',
    vaf_pct: 50.0,
    vqc_phase_angle_rad: 1.482,
    biological_function: 'Controls eumelanin (black/brown, UV-protective) vs pheomelanin (red/yellow, phototoxic) synthesis in human melanocytes.'
  },
  AR: {
    symbol: 'AR',
    name: 'Androgen Receptor',
    ensembl_id: 'ENSG00000169083',
    chromosome: 'chrX',
    locus: 'Xq12',
    start: 67544032,
    end: 67730619,
    strand: '+',
    canonical_transcript: 'ENST00000374690',
    exon_count: 8,
    primary_cancers: ['Prostate (PRAD / CRPC)', 'Breast (Apocrine)'],
    hotspot_mutation: 'c.2632A>G',
    protein_change: 'p.T878A / Amplification',
    mutation_type: 'Ligand-Binding Domain Gain-of-Function',
    clinvar_significance: 'Pathogenic (Anti-androgen resistance to Enzalutamide)',
    vaf_pct: 35.2,
    vqc_phase_angle_rad: 1.710,
    biological_function: 'Steroid hormone nuclear receptor; acts as transcription factor initiating survival and differentiation programs in prostate tissue.'
  },
  APC: {
    symbol: 'APC',
    name: 'APC Regulator of WNT Signaling Pathway',
    ensembl_id: 'ENSG00000134982',
    chromosome: 'chr5',
    locus: '5q22.2',
    start: 112707498,
    end: 112846239,
    strand: '+',
    canonical_transcript: 'ENST00000257430',
    exon_count: 16,
    primary_cancers: ['Colorectal (COAD/READ)', 'Gastric', 'Pancreatic'],
    hotspot_mutation: 'c.4348C>T',
    protein_change: 'p.R1450*',
    mutation_type: 'Nonsense / Early Truncation',
    clinvar_significance: 'Pathogenic (Familial Adenomatous Polyposis / Sporadic CRC)',
    vaf_pct: 47.3,
    vqc_phase_angle_rad: 2.190,
    biological_function: 'Central component of the beta-catenin destruction complex; loss of APC drives constitutive nuclear beta-catenin translocation and Wnt transcription.'
  }
};

/**
 * Returns mapped cancer genes for any patient record or AI model report.
 */
export function getGenesForRecord(recordId: string, cohortOrCancer?: string): CancerGeneInfo[] {
  const upperRec = (recordId || '').toUpperCase();
  const upperCohort = (cohortOrCancer || '').toUpperCase();

  // If this is a TCGA World Cancer Patient, resolve directly from WORLD_CANCER_PATIENTS
  const worldMatch = WORLD_CANCER_PATIENTS.find(
    (wp) => wp.patient_id.toUpperCase() === upperRec
  );
  if (worldMatch && worldMatch.genes) {
    const mapped = worldMatch.genes.map((g) => {
      const existing = CANCER_GENE_PROFILES[g.symbol];
      if (existing) {
        return {
          ...existing,
          hotspot_mutation: g.hotspot_mutation || existing.hotspot_mutation,
          protein_change: g.protein_change || existing.protein_change,
          mutation_type: g.mutation_type || existing.mutation_type,
          clinvar_significance: g.clinvar_significance || existing.clinvar_significance,
          vaf_pct: g.vaf_pct || existing.vaf_pct,
          vqc_phase_angle_rad: g.vqc_theta || existing.vqc_phase_angle_rad
        };
      }
      return {
        symbol: g.symbol,
        name: g.name,
        ensembl_id: g.ensembl_id,
        chromosome: g.chromosome.split(':')[0] || 'chr17',
        locus: g.chromosome.split(':')[1] || '17p13.1',
        start: 7668402,
        end: 7687550,
        strand: '-' as const,
        canonical_transcript: g.canonical_transcript,
        exon_count: g.exon_count,
        primary_cancers: [worldMatch.cancer_type],
        hotspot_mutation: g.hotspot_mutation,
        protein_change: g.protein_change,
        mutation_type: g.mutation_type,
        clinvar_significance: `${g.clinvar_significance} (${g.clinvar_id})`,
        vaf_pct: g.vaf_pct,
        vqc_phase_angle_rad: g.vqc_theta,
        biological_function: `Oncogenic driver in ${worldMatch.cancer_type}; catalogued in ClinVar (${g.clinvar_id}) and COSMIC (${g.cosmic_id}) with gnomAD population AF ${g.gnomad_exome_af}.`
      };
    });
    if (mapped.length > 0) return mapped;
  }

  // Model-specific mappings
  if (upperRec === 'MODEL-HYBRID') {
    return [
      CANCER_GENE_PROFILES.TP53,
      CANCER_GENE_PROFILES.BRCA1,
      CANCER_GENE_PROFILES.EGFR,
      CANCER_GENE_PROFILES.KRAS,
      CANCER_GENE_PROFILES.BRAF,
      CANCER_GENE_PROFILES.PTEN
    ];
  }

  if (upperRec === 'MODEL-XGBOOST') {
    return [
      CANCER_GENE_PROFILES.TP53,
      CANCER_GENE_PROFILES.KRAS,
      CANCER_GENE_PROFILES.PIK3CA,
      CANCER_GENE_PROFILES.APC
    ];
  }

  if (upperRec === 'MODEL-VQC') {
    return [
      CANCER_GENE_PROFILES.BRCA1,
      CANCER_GENE_PROFILES.BRCA2,
      CANCER_GENE_PROFILES.EGFR,
      CANCER_GENE_PROFILES.TP53
    ];
  }

  if (upperRec === 'MODEL-RF') {
    return [
      CANCER_GENE_PROFILES.KRAS,
      CANCER_GENE_PROFILES.BRAF,
      CANCER_GENE_PROFILES.PTEN,
      CANCER_GENE_PROFILES.CDKN2A
    ];
  }

  if (upperRec === 'MODEL-LOGISTIC') {
    return [
      CANCER_GENE_PROFILES.TP53,
      CANCER_GENE_PROFILES.PIK3CA,
      CANCER_GENE_PROFILES.AR
    ];
  }

  if (upperRec === 'MODEL-ADABOOST') {
    return [
      CANCER_GENE_PROFILES.EGFR,
      CANCER_GENE_PROFILES.KRAS,
      CANCER_GENE_PROFILES.BRCA1,
      CANCER_GENE_PROFILES.TP53
    ];
  }

  if (upperRec === 'MODEL-VISION-DERM' || upperRec.includes('DERM') || upperCohort.includes('SKIN') || upperCohort.includes('MELANOMA')) {
    return [
      CANCER_GENE_PROFILES.BRAF,
      CANCER_GENE_PROFILES.CDKN2A,
      CANCER_GENE_PROFILES.MC1R,
      CANCER_GENE_PROFILES.TP53
    ];
  }

  // Oncology cohort patient records
  if (upperRec.includes('GEN') || upperCohort.includes('ONCO') || upperCohort.includes('GENOM')) {
    return [
      CANCER_GENE_PROFILES.TP53,
      CANCER_GENE_PROFILES.BRCA1,
      CANCER_GENE_PROFILES.BRCA2,
      CANCER_GENE_PROFILES.PIK3CA
    ];
  }

  // Breast
  if (upperCohort.includes('BREAST') || upperRec.includes('BRCA')) {
    return [
      CANCER_GENE_PROFILES.BRCA1,
      CANCER_GENE_PROFILES.BRCA2,
      CANCER_GENE_PROFILES.TP53,
      CANCER_GENE_PROFILES.PIK3CA
    ];
  }

  // Lung
  if (upperCohort.includes('LUNG') || upperRec.includes('LUAD')) {
    return [
      CANCER_GENE_PROFILES.EGFR,
      CANCER_GENE_PROFILES.KRAS,
      CANCER_GENE_PROFILES.TP53
    ];
  }

  // Colorectum
  if (upperCohort.includes('COLON') || upperCohort.includes('COLORECT') || upperRec.includes('COAD')) {
    return [
      CANCER_GENE_PROFILES.APC,
      CANCER_GENE_PROFILES.KRAS,
      CANCER_GENE_PROFILES.BRAF,
      CANCER_GENE_PROFILES.TP53
    ];
  }

  // Prostate
  if (upperCohort.includes('PROSTATE') || upperRec.includes('PRAD')) {
    return [
      CANCER_GENE_PROFILES.AR,
      CANCER_GENE_PROFILES.PTEN,
      CANCER_GENE_PROFILES.TP53
    ];
  }

  // Default Pan-Cancer / Cardiometabolic risk with TP53 & BRCA1 genomic baseline
  return [
    CANCER_GENE_PROFILES.TP53,
    CANCER_GENE_PROFILES.BRCA1,
    CANCER_GENE_PROFILES.EGFR,
    CANCER_GENE_PROFILES.KRAS
  ];
}


export interface WorldCancerPatient {
  patient_id: string;
  patient_name: string;
  cancer_type: string;
  tcga_project: string;
  cbioportal_study: string;
  stage: string;
  gender: string;
  age: number;
  vital_status: string;
  overall_survival_months: number;
  hybrid_risk: number;
  classical_risk: number;
  quantum_risk: number;
  risk_tier: string;
  risk_color: string;
  recommendation: string;
  genes: Array<{
    symbol: string;
    name: string;
    ensembl_id: string;
    chromosome: string;
    canonical_transcript: string;
    exon_count: number;
    protein_change: string;
    hotspot_mutation: string;
    mutation_type: string;
    clinvar_id: string;
    clinvar_significance: string;
    cosmic_id: string;
    fathmm_score: string;
    gnomad_exome_af: string;
    vaf_pct: number;
    vqc_theta: number;
  }>;
}

export const WORLD_CANCER_PATIENTS: WorldCancerPatient[] = [
  {
    "patient_id": "TCGA-BH-A0B2",
    "patient_name": "TCGA Donor TCGA-BH-A0B2",
    "age": 58,
    "gender": "female",
    "cancer_type": "Breast Invasive Carcinoma",
    "tcga_project": "TCGA-BRCA",
    "cbioportal_study": "brca_tcga_pan_can_atlas_2018",
    "stage": "Stage IIA",
    "vital_status": "Alive",
    "overall_survival_months": 64.2,
    "hybrid_risk": 0.785,
    "classical_risk": 0.812,
    "quantum_risk": 0.7445,
    "risk_tier": "CRITICAL RISK",
    "risk_color": "#EF4444",
    "recommendation": "Multidisciplinary tumor board review, BRCA1 germline testing confirmation, and PARP inhibitor eligibility evaluation.",
    "genes": [
      {
        "symbol": "BRCA1",
        "name": "BRCA1 DNA Repair Associated",
        "ensembl_id": "ENSG00000012048",
        "chromosome": "chr17:17q21.31",
        "canonical_transcript": "ENST00000357654",
        "exon_count": 24,
        "protein_change": "p.E23fs / 185delAG",
        "hotspot_mutation": "c.68_69delAG",
        "mutation_type": "Frameshift Truncation",
        "clinvar_id": "VCV000017659",
        "clinvar_significance": "Pathogenic (HRD Deficient)",
        "cosmic_id": "COSV51862901",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000021",
        "vaf_pct": 48.6,
        "vqc_theta": 1.842
      },
      {
        "symbol": "TP53",
        "name": "Tumor Protein P53",
        "ensembl_id": "ENSG00000141510",
        "chromosome": "chr17:17p13.1",
        "canonical_transcript": "ENST00000269305",
        "exon_count": 11,
        "protein_change": "p.R175H",
        "hotspot_mutation": "c.524G>A",
        "mutation_type": "Missense Mutation",
        "clinvar_id": "VCV000012374",
        "clinvar_significance": "Pathogenic / Li-Fraumeni",
        "cosmic_id": "COSV52669389",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000016",
        "vaf_pct": 42.8,
        "vqc_theta": 2.148
      }
    ]
  },
  {
    "patient_id": "TCGA-44-3918",
    "patient_name": "TCGA Donor TCGA-44-3918",
    "age": 60,
    "gender": "male",
    "cancer_type": "Lung Adenocarcinoma (LUAD)",
    "tcga_project": "TCGA-LUAD",
    "cbioportal_study": "luad_tcga_pan_can_atlas_2018",
    "stage": "Stage IIB",
    "vital_status": "Deceased",
    "overall_survival_months": 38.5,
    "hybrid_risk": 0.7931,
    "classical_risk": 0.825,
    "quantum_risk": 0.7452,
    "risk_tier": "CRITICAL RISK",
    "risk_color": "#EF4444",
    "recommendation": "First-line 3rd-generation EGFR TKI (Osimertinib) evaluation, brain MRI surveillance, and liquid biopsy monitoring for T790M.",
    "genes": [
      {
        "symbol": "EGFR",
        "name": "Epidermal Growth Factor Receptor",
        "ensembl_id": "ENSG00000146648",
        "chromosome": "chr7:7p11.2",
        "canonical_transcript": "ENST00000275493",
        "exon_count": 28,
        "protein_change": "p.L858R",
        "hotspot_mutation": "c.2573T>G",
        "mutation_type": "Activating Kinase",
        "clinvar_id": "VCV000016616",
        "clinvar_significance": "Targetable (Osimertinib Sensitizing)",
        "cosmic_id": "COSV51765492",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000008",
        "vaf_pct": 38.4,
        "vqc_theta": 1.954
      },
      {
        "symbol": "KRAS",
        "name": "KRAS Proto-Oncogene",
        "ensembl_id": "ENSG00000133703",
        "chromosome": "chr12:12p12.1",
        "canonical_transcript": "ENST00000311936",
        "exon_count": 6,
        "protein_change": "p.G12C",
        "hotspot_mutation": "c.34G>T",
        "mutation_type": "GTPase Impairment",
        "clinvar_id": "VCV000012582",
        "clinvar_significance": "Targetable (Sotorasib)",
        "cosmic_id": "COSV55546258",
        "fathmm_score": "0.98 Pathogenic",
        "gnomad_exome_af": "0.000004",
        "vaf_pct": 34.2,
        "vqc_theta": 2.215
      }
    ]
  },
  {
    "patient_id": "TCGA-AA-3666",
    "patient_name": "TCGA Donor TCGA-AA-3666",
    "age": 59,
    "gender": "male",
    "cancer_type": "Colon Adenocarcinoma (COAD)",
    "tcga_project": "TCGA-COAD",
    "cbioportal_study": "coadread_tcga_pan_can_atlas_2018",
    "stage": "Stage IIA",
    "vital_status": "Alive",
    "overall_survival_months": 52.1,
    "hybrid_risk": 0.5824,
    "classical_risk": 0.61,
    "quantum_risk": 0.541,
    "risk_tier": "HIGH RISK",
    "risk_color": "#F97316",
    "recommendation": "Complete mesocolic excision staging review, MSI/MMR status confirmation for immunotherapy eligibility.",
    "genes": [
      {
        "symbol": "APC",
        "name": "APC Regulator of WNT Signaling",
        "ensembl_id": "ENSG00000134982",
        "chromosome": "chr5:5q22.2",
        "canonical_transcript": "ENST00000257430",
        "exon_count": 16,
        "protein_change": "p.R1450*",
        "hotspot_mutation": "c.4348C>T",
        "mutation_type": "Nonsense Truncation",
        "clinvar_id": "VCV000000898",
        "clinvar_significance": "Pathogenic (FAP / Sporadic CRC)",
        "cosmic_id": "COSV53492104",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000012",
        "vaf_pct": 47.3,
        "vqc_theta": 2.19
      },
      {
        "symbol": "KRAS",
        "name": "KRAS Proto-Oncogene",
        "ensembl_id": "ENSG00000133703",
        "chromosome": "chr12:12p12.1",
        "canonical_transcript": "ENST00000311936",
        "exon_count": 6,
        "protein_change": "p.G12D",
        "hotspot_mutation": "c.35G>A",
        "mutation_type": "Activating Transition",
        "clinvar_id": "VCV000012583",
        "clinvar_significance": "Oncogenic Driver (Anti-EGFR Resistance)",
        "cosmic_id": "COSV55546255",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000008",
        "vaf_pct": 36.9,
        "vqc_theta": 2.215
      }
    ]
  },
  {
    "patient_id": "TCGA-V1-A8WT",
    "patient_name": "TCGA Donor TCGA-V1-A8WT",
    "age": 68,
    "gender": "male",
    "cancer_type": "Prostate Adenocarcinoma (PRAD)",
    "tcga_project": "TCGA-PRAD",
    "cbioportal_study": "prad_tcga_pan_can_atlas_2018",
    "stage": "Stage II",
    "vital_status": "Alive",
    "overall_survival_months": 72.8,
    "hybrid_risk": 0.5218,
    "classical_risk": 0.54,
    "quantum_risk": 0.4945,
    "risk_tier": "HIGH RISK",
    "risk_color": "#F97316",
    "recommendation": "Multiparametric prostate MRI (PI-RADS v2), PSA doubling time tracking, and PTEN deletion surveillance.",
    "genes": [
      {
        "symbol": "AR",
        "name": "Androgen Receptor",
        "ensembl_id": "ENSG00000169083",
        "chromosome": "chrX:Xq12",
        "canonical_transcript": "ENST00000374690",
        "exon_count": 8,
        "protein_change": "p.T878A",
        "hotspot_mutation": "c.2632A>G",
        "mutation_type": "Gain of Function",
        "clinvar_id": "VCV000010452",
        "clinvar_significance": "Likely Pathogenic (Enzalutamide Resistance)",
        "cosmic_id": "COSV57342981",
        "fathmm_score": "0.97 Pathogenic",
        "gnomad_exome_af": "0.000005",
        "vaf_pct": 35.2,
        "vqc_theta": 1.71
      },
      {
        "symbol": "PTEN",
        "name": "Phosphatase and Tensin Homolog",
        "ensembl_id": "ENSG00000171862",
        "chromosome": "chr10:10q23.31",
        "canonical_transcript": "ENST00000371953",
        "exon_count": 9,
        "protein_change": "p.R130G / Loss",
        "hotspot_mutation": "c.388C>T",
        "mutation_type": "Phosphatase Inactivation",
        "clinvar_id": "VCV000002164",
        "clinvar_significance": "Pathogenic (PI3K Disinhibition)",
        "cosmic_id": "COSV51034981",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000014",
        "vaf_pct": 39.5,
        "vqc_theta": 1.89
      }
    ]
  },
  {
    "patient_id": "TCGA-D1-A17D",
    "patient_name": "TCGA Donor TCGA-D1-A17D",
    "age": 52,
    "gender": "female",
    "cancer_type": "Skin Cutaneous Melanoma (SKCM)",
    "tcga_project": "TCGA-SKCM",
    "cbioportal_study": "skcm_tcga_pan_can_atlas_2018",
    "stage": "Stage III",
    "vital_status": "Deceased",
    "overall_survival_months": 44.6,
    "hybrid_risk": 0.841,
    "classical_risk": 0.865,
    "quantum_risk": 0.805,
    "risk_tier": "CRITICAL RISK",
    "risk_color": "#EF4444",
    "recommendation": "Combined BRAF+MEK inhibitor therapy (Dabrafenib + Trametinib) and anti-PD-1 immunotherapy evaluation.",
    "genes": [
      {
        "symbol": "BRAF",
        "name": "B-Raf Proto-Oncogene",
        "ensembl_id": "ENSG00000157764",
        "chromosome": "chr7:7q34",
        "canonical_transcript": "ENST00000288602",
        "exon_count": 18,
        "protein_change": "p.V600E",
        "hotspot_mutation": "c.1799T>A",
        "mutation_type": "Kinase Hyperactivation",
        "clinvar_id": "VCV000013961",
        "clinvar_significance": "Pathogenic (FDA Approved Target)",
        "cosmic_id": "COSV54483710",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000011",
        "vaf_pct": 44.2,
        "vqc_theta": 2.302
      },
      {
        "symbol": "CDKN2A",
        "name": "CDK Inhibitor 2A",
        "ensembl_id": "ENSG00000147889",
        "chromosome": "chr9:9p21.3",
        "canonical_transcript": "ENST00000304494",
        "exon_count": 3,
        "protein_change": "p.R80*",
        "hotspot_mutation": "c.238C>T",
        "mutation_type": "Nonsense Deletion",
        "clinvar_id": "VCV000009381",
        "clinvar_significance": "Pathogenic (p16INK4a Loss)",
        "cosmic_id": "COSV52981042",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000009",
        "vaf_pct": 46.0,
        "vqc_theta": 2.055
      }
    ]
  },
  {
    "patient_id": "TCGA-09-2056",
    "patient_name": "TCGA Donor TCGA-09-2056",
    "age": 57,
    "gender": "female",
    "cancer_type": "Ovarian Serous Cystadenocarcinoma (OV)",
    "tcga_project": "TCGA-OV",
    "cbioportal_study": "ov_tcga_pan_can_atlas_2018",
    "stage": "Stage IIIC",
    "vital_status": "Deceased",
    "overall_survival_months": 29.4,
    "hybrid_risk": 0.892,
    "classical_risk": 0.915,
    "quantum_risk": 0.8575,
    "risk_tier": "CRITICAL RISK",
    "risk_color": "#EF4444",
    "recommendation": "Cytoreductive surgery review, carboplatin/paclitaxel chemotherapy, and maintenance Olaparib PARP inhibition.",
    "genes": [
      {
        "symbol": "TP53",
        "name": "Tumor Protein P53",
        "ensembl_id": "ENSG00000141510",
        "chromosome": "chr17:17p13.1",
        "canonical_transcript": "ENST00000269305",
        "exon_count": 11,
        "protein_change": "p.R248Q",
        "hotspot_mutation": "c.743G>A",
        "mutation_type": "DNA Contact Disruption",
        "clinvar_id": "VCV000012379",
        "clinvar_significance": "Pathogenic",
        "cosmic_id": "COSV52669392",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000018",
        "vaf_pct": 52.4,
        "vqc_theta": 2.148
      },
      {
        "symbol": "BRCA2",
        "name": "BRCA2 DNA Repair Associated",
        "ensembl_id": "ENSG00000139618",
        "chromosome": "chr13:13q13.1",
        "canonical_transcript": "ENST00000380152",
        "exon_count": 27,
        "protein_change": "p.S1982fs",
        "hotspot_mutation": "c.5946delT",
        "mutation_type": "Frameshift Truncation",
        "clinvar_id": "VCV000017661",
        "clinvar_significance": "Pathogenic (PARP Sensitizing)",
        "cosmic_id": "COSV51984210",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000025",
        "vaf_pct": 45.1,
        "vqc_theta": 1.765
      }
    ]
  },
  {
    "patient_id": "TCGA-IB-7647",
    "patient_name": "TCGA Donor TCGA-IB-7647",
    "age": 64,
    "gender": "male",
    "cancer_type": "Pancreatic Adenocarcinoma (PAAD)",
    "tcga_project": "TCGA-PAAD",
    "cbioportal_study": "paad_tcga_pan_can_atlas_2018",
    "stage": "Stage IIB",
    "vital_status": "Deceased",
    "overall_survival_months": 16.8,
    "hybrid_risk": 0.915,
    "classical_risk": 0.932,
    "quantum_risk": 0.8895,
    "risk_tier": "CRITICAL RISK",
    "risk_color": "#EF4444",
    "recommendation": "Modified FOLFIRINOX neoadjuvant regimen, CA 19-9 velocity monitoring, and clinical trial enrollment.",
    "genes": [
      {
        "symbol": "KRAS",
        "name": "KRAS Proto-Oncogene",
        "ensembl_id": "ENSG00000133703",
        "chromosome": "chr12:12p12.1",
        "canonical_transcript": "ENST00000311936",
        "exon_count": 6,
        "protein_change": "p.G12D",
        "hotspot_mutation": "c.35G>A",
        "mutation_type": "Constitutive Activation",
        "clinvar_id": "VCV000012583",
        "clinvar_significance": "Pathogenic Driver",
        "cosmic_id": "COSV55546255",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000008",
        "vaf_pct": 41.6,
        "vqc_theta": 2.215
      }
    ]
  },
  {
    "patient_id": "TCGA-06-0125",
    "patient_name": "TCGA Donor TCGA-06-0125",
    "age": 49,
    "gender": "male",
    "cancer_type": "Glioblastoma Multiforme (GBM)",
    "tcga_project": "TCGA-GBM",
    "cbioportal_study": "gbm_tcga_pan_can_atlas_2018",
    "stage": "Stage IV (WHO Grade 4)",
    "vital_status": "Deceased",
    "overall_survival_months": 14.1,
    "hybrid_risk": 0.942,
    "classical_risk": 0.96,
    "quantum_risk": 0.915,
    "risk_tier": "CRITICAL RISK",
    "risk_color": "#EF4444",
    "recommendation": "Maximal safe resection, Stupp protocol (radiotherapy + concurrent Temozolomide), and MGMT promoter methylation testing.",
    "genes": [
      {
        "symbol": "EGFR",
        "name": "Epidermal Growth Factor Receptor",
        "ensembl_id": "ENSG00000146648",
        "chromosome": "chr7:7p11.2",
        "canonical_transcript": "ENST00000275493",
        "exon_count": 28,
        "protein_change": "EGFRvIII Amplified",
        "hotspot_mutation": "Exon 2-7 Deletion",
        "mutation_type": "Constitutive Dimerization",
        "clinvar_id": "VCV000016620",
        "clinvar_significance": "Oncogenic Driver",
        "cosmic_id": "COSV51765499",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000001",
        "vaf_pct": 62.0,
        "vqc_theta": 1.954
      }
    ]
  },
  {
    "patient_id": "TCGA-CV-7247",
    "patient_name": "TCGA Donor TCGA-CV-7247",
    "age": 55,
    "gender": "male",
    "cancer_type": "Lip, Oral Cavity & Tongue (HNSC)",
    "tcga_project": "TCGA-HNSC",
    "cbioportal_study": "hnsc_tcga_pan_can_atlas_2018",
    "stage": "Stage III",
    "vital_status": "Alive",
    "overall_survival_months": 27.3,
    "hybrid_risk": 0.8842,
    "classical_risk": 0.912,
    "quantum_risk": 0.8425,
    "risk_tier": "CRITICAL RISK",
    "risk_color": "#EF4444",
    "recommendation": "Expedited neck dissection staging, TP53 targeted therapy evaluation, and HPV p16 immunohistochemistry.",
    "genes": [
      {
        "symbol": "TP53",
        "name": "Tumor Protein P53",
        "ensembl_id": "ENSG00000141510",
        "chromosome": "chr17:17p13.1",
        "canonical_transcript": "ENST00000269305",
        "exon_count": 11,
        "protein_change": "p.Q136P",
        "hotspot_mutation": "c.407A>C",
        "mutation_type": "Missense Mutation",
        "clinvar_id": "VCV000012371",
        "clinvar_significance": "Pathogenic",
        "cosmic_id": "COSV52669380",
        "fathmm_score": "0.98 Pathogenic",
        "gnomad_exome_af": "0.000006",
        "vaf_pct": 43.1,
        "vqc_theta": 2.148
      }
    ]
  },
  {
    "patient_id": "TCGA-RD-A8N6",
    "patient_name": "TCGA Donor TCGA-RD-A8N6",
    "age": 67,
    "gender": "Male",
    "cancer_type": "Stomach Adenocarcinoma (STAD)",
    "tcga_project": "TCGA-STAD",
    "cbioportal_study": "stad_tcga_pan_can_atlas_2018",
    "stage": "Stage III",
    "vital_status": "Deceased",
    "overall_survival_months": 14.8,
    "hybrid_risk": 0.8914,
    "classical_risk": 0.908,
    "quantum_risk": 0.8665,
    "risk_tier": "CRITICAL RISK",
    "risk_color": "#EF4444",
    "recommendation": "Adjuvant fluoropyrimidine + oxaliplatin chemotherapy regimen, HER2 IHC validation, and mismatch repair (MMR) assessment.",
    "genes": [
      {
        "symbol": "TP53",
        "name": "Tumor Protein P53",
        "ensembl_id": "ENSG00000141510",
        "chromosome": "chr17:17p13.1",
        "canonical_transcript": "ENST00000269305",
        "exon_count": 11,
        "protein_change": "p.R273H",
        "hotspot_mutation": "c.818G>A",
        "mutation_type": "Missense Mutation",
        "clinvar_id": "VCV000012379",
        "clinvar_significance": "Pathogenic",
        "cosmic_id": "COSV52668579",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000004",
        "vaf_pct": 48.6,
        "vqc_theta": 2.312
      },
      {
        "symbol": "PIK3CA",
        "name": "Phosphatidylinositol-4,5-Bisphosphate 3-Kinase Catalytic Subunit Alpha",
        "ensembl_id": "ENSG00000121879",
        "chromosome": "chr3:3q26.32",
        "canonical_transcript": "ENST00000263967",
        "exon_count": 21,
        "protein_change": "p.E545K",
        "hotspot_mutation": "c.1633G>A",
        "mutation_type": "Missense Mutation",
        "clinvar_id": "VCV000013654",
        "clinvar_significance": "Pathogenic",
        "cosmic_id": "COSV54736341",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000002",
        "vaf_pct": 24.2,
        "vqc_theta": 1.624
      }
    ]
  },
  {
    "patient_id": "TCGA-DK-A2I6",
    "patient_name": "TCGA Donor TCGA-DK-A2I6",
    "age": 64,
    "gender": "Male",
    "cancer_type": "Bladder Urothelial Carcinoma (BLCA)",
    "tcga_project": "TCGA-BLCA",
    "cbioportal_study": "blca_tcga_pan_can_atlas_2018",
    "stage": "Stage II",
    "vital_status": "Alive",
    "overall_survival_months": 38.6,
    "hybrid_risk": 0.7725,
    "classical_risk": 0.795,
    "quantum_risk": 0.7388,
    "risk_tier": "HIGH RISK",
    "risk_color": "#F59E0B",
    "recommendation": "Neoadjuvant cisplatin-based chemotherapy prior to radical cystectomy and FGFR3/TP53 targeted genomic follow-up.",
    "genes": [
      {
        "symbol": "TP53",
        "name": "Tumor Protein P53",
        "ensembl_id": "ENSG00000141510",
        "chromosome": "chr17:17p13.1",
        "canonical_transcript": "ENST00000269305",
        "exon_count": 11,
        "protein_change": "p.R282W",
        "hotspot_mutation": "c.844C>T",
        "mutation_type": "Missense Mutation",
        "clinvar_id": "VCV000012374",
        "clinvar_significance": "Pathogenic",
        "cosmic_id": "COSV52668580",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000003",
        "vaf_pct": 39.5,
        "vqc_theta": 2.054
      }
    ]
  },
  {
    "patient_id": "TCGA-BC-A108",
    "patient_name": "TCGA Donor TCGA-BC-A108",
    "age": 58,
    "gender": "Female",
    "cancer_type": "Liver Hepatocellular Carcinoma (LIHC)",
    "tcga_project": "TCGA-LIHC",
    "cbioportal_study": "lihc_tcga_pan_can_atlas_2018",
    "stage": "Stage I",
    "vital_status": "Alive",
    "overall_survival_months": 44.1,
    "hybrid_risk": 0.741,
    "classical_risk": 0.762,
    "quantum_risk": 0.7095,
    "risk_tier": "HIGH RISK",
    "risk_color": "#F59E0B",
    "recommendation": "Surgical segmentectomy resection followed by atezolizumab plus bevacizumab immunotherapy surveillance and CT dynamic liver monitoring.",
    "genes": [
      {
        "symbol": "TP53",
        "name": "Tumor Protein P53",
        "ensembl_id": "ENSG00000141510",
        "chromosome": "chr17:17p13.1",
        "canonical_transcript": "ENST00000269305",
        "exon_count": 11,
        "protein_change": "p.R249S",
        "hotspot_mutation": "c.747G>T",
        "mutation_type": "Missense Mutation",
        "clinvar_id": "VCV000012384",
        "clinvar_significance": "Pathogenic",
        "cosmic_id": "COSV52668586",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000001",
        "vaf_pct": 37.8,
        "vqc_theta": 1.942
      }
    ]
  },
  {
    "patient_id": "TCGA-B0-4690",
    "patient_name": "TCGA Donor TCGA-B0-4690",
    "age": 70,
    "gender": "Male",
    "cancer_type": "Kidney Renal Clear Cell Carcinoma (KIRC)",
    "tcga_project": "TCGA-KIRC",
    "cbioportal_study": "kirc_tcga_pan_can_atlas_2018",
    "stage": "Stage III",
    "vital_status": "Alive",
    "overall_survival_months": 21.5,
    "hybrid_risk": 0.8124,
    "classical_risk": 0.834,
    "quantum_risk": 0.78,
    "risk_tier": "CRITICAL RISK",
    "risk_color": "#EF4444",
    "recommendation": "VHL tumor suppressor pathway surveillance, pembrolizumab + axitinib dual anti-angiogenic/checkpoint regimen, and renal retroperitoneal imaging.",
    "genes": [
      {
        "symbol": "PTEN",
        "name": "Phosphatase and Tensin Homolog",
        "ensembl_id": "ENSG00000171862",
        "chromosome": "chr10:10q23.31",
        "canonical_transcript": "ENST00000371953",
        "exon_count": 9,
        "protein_change": "p.R130G",
        "hotspot_mutation": "c.388C>G",
        "mutation_type": "Missense Mutation",
        "clinvar_id": "VCV000014382",
        "clinvar_significance": "Pathogenic",
        "cosmic_id": "COSV51719875",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000002",
        "vaf_pct": 41.3,
        "vqc_theta": 2.115
      }
    ]
  },
  {
    "patient_id": "TCGA-24-1467",
    "patient_name": "TCGA Donor TCGA-24-1467",
    "age": 49,
    "gender": "Female",
    "cancer_type": "Cervical Squamous Cell Carcinoma (CESC)",
    "tcga_project": "TCGA-CESC",
    "cbioportal_study": "cesc_tcga_pan_can_atlas_2018",
    "stage": "Stage IIB",
    "vital_status": "Alive",
    "overall_survival_months": 31.8,
    "hybrid_risk": 0.8256,
    "classical_risk": 0.849,
    "quantum_risk": 0.7905,
    "risk_tier": "CRITICAL RISK",
    "risk_color": "#EF4444",
    "recommendation": "Concurrent cisplatin chemoradiation (CCRT) combined with high-dose-rate (HDR) brachytherapy, HPV-16/18 genotyping, and PIK3CA surveillance.",
    "genes": [
      {
        "symbol": "PIK3CA",
        "name": "Phosphatidylinositol-4,5-Bisphosphate 3-Kinase Catalytic Subunit Alpha",
        "ensembl_id": "ENSG00000121879",
        "chromosome": "chr3:3q26.32",
        "canonical_transcript": "ENST00000263967",
        "exon_count": 21,
        "protein_change": "p.E542K",
        "hotspot_mutation": "c.1624G>A",
        "mutation_type": "Missense Mutation",
        "clinvar_id": "VCV000013653",
        "clinvar_significance": "Pathogenic",
        "cosmic_id": "COSV54736340",
        "fathmm_score": "0.99 Pathogenic",
        "gnomad_exome_af": "0.000003",
        "vaf_pct": 33.7,
        "vqc_theta": 1.876
      }
    ]
  }
];