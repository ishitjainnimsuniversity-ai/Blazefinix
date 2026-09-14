import {
  PredictionResult,
  DemoCase,
  BenchmarkResult,
  DataQualityAudit,
  AnalyticsOverview,
  AlertData,
  DoctorFeedbackItem,
  AuditLog,
  TestedPatientItem,
  SkinReferenceSample,
  VisionAnalysisResult,
  MultiModalPredictResponse,
  ArchitectureUspData
} from './types';

import {
  FALLBACK_TOP_CANCERS,
  FALLBACK_REAL_PATIENTS,
  FALLBACK_ARCHITECTURE_USP,
  FALLBACK_BENCHMARK,
  FALLBACK_TESTED_PATIENTS,
  FALLBACK_MODEL_REPORTS,
  FALLBACK_CLINICAL_REPORTS
} from './fallbackData';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE}/analytics/overview`);
  return res.json();
}

export async function fetchDemoCases(): Promise<DemoCase[]> {
  const res = await fetch(`${API_BASE}/predict/demo-cases`);
  return res.json();
}

export async function predictPatientRisk(
  features: Record<string, number>,
  recordId?: string
): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features, record_id: recordId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Prediction failed');
  }
  return res.json();
}

export async function fetchPredictionHistory(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/predict/history`);
  return res.json();
}

export async function fetchBenchmark(): Promise<BenchmarkResult> {
  try {
    const res = await fetch(`${API_BASE}/models/benchmark`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API unavailable, loading local benchmark fallback');
  }
  return FALLBACK_BENCHMARK as BenchmarkResult;
}

export async function trainPipeline(config: {
  dataset_name: string;
  selected_features_count: number;
  test_size?: number;
  cv_folds?: number;
}) {
  const res = await fetch(`${API_BASE}/models/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataset_name: config.dataset_name,
      target_column: 'disease_risk_label',
      selected_features_count: config.selected_features_count,
      test_size: config.test_size || 0.20,
      run_cross_validation: true,
      cv_folds: config.cv_folds || 5
    })
  });
  return res.json();
}

export async function fetchQuantumCircuit(qubits = 4, depth = 2) {
  const res = await fetch(`${API_BASE}/models/quantum-circuit?qubits=${qubits}&depth=${depth}`);
  return res.json();
}

export async function fetchDatasets() {
  const res = await fetch(`${API_BASE}/data/datasets`);
  return res.json();
}

export async function fetchDatasetAudit(datasetName: string): Promise<DataQualityAudit> {
  const res = await fetch(`${API_BASE}/data/audit/${datasetName}`);
  return res.json();
}

export async function fetchNCBIGenomics(accession: string) {
  const res = await fetch(`${API_BASE}/data/ncbi/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accession, enrich_risk_features: true })
  });
  return res.json();
}

export async function fetchNCBIRecords() {
  const res = await fetch(`${API_BASE}/data/ncbi/records`);
  return res.json();
}

export async function fetchAlerts(severity?: string, status?: string): Promise<AlertData[]> {
  const params = new URLSearchParams();
  if (severity && severity !== 'ALL') params.append('severity', severity);
  if (status && status !== 'ALL') params.append('status', status);
  const res = await fetch(`${API_BASE}/alerts?${params.toString()}`);
  return res.json();
}

export async function acknowledgeAlert(alertId: string, clinicianName: string, notes?: string) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clinician_name: clinicianName, notes })
  });
  return res.json();
}

export async function triageAlert(alertId: string, newStatus: string) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/triage?new_status=${newStatus}`, {
    method: 'POST'
  });
  return res.json();
}

export async function submitDoctorFeedback(payload: {
  alert_id?: string;
  record_id: string;
  agreement: string;
  clinical_notes: string;
  recommended_action?: string;
  reviewer_name: string;
  reviewer_role?: string;
}) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchFeedbackSummary() {
  const res = await fetch(`${API_BASE}/feedback/summary`);
  return res.json();
}

export async function fetchFeedbackList(): Promise<DoctorFeedbackItem[]> {
  const res = await fetch(`${API_BASE}/feedback/list`);
  return res.json();
}

export async function fetchAuditLogs(role?: string, action?: string): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (role && role !== 'ALL') params.append('role', role);
  if (action && action !== 'ALL') params.append('action', action);
  const res = await fetch(`${API_BASE}/audit?${params.toString()}`);
  return res.json();
}

export async function fetchReport(recordId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/reports/${recordId}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`API unavailable for report ${recordId}, using local clinical report fallback`);
  }
  return (
    FALLBACK_CLINICAL_REPORTS[recordId] ||
    FALLBACK_CLINICAL_REPORTS['DEMO-HIGH-03'] ||
    null
  );
}

export async function fetchTestedPatients(cohort?: string, riskCategory?: string): Promise<TestedPatientItem[]> {
  try {
    const params = new URLSearchParams();
    if (cohort && cohort !== 'ALL') params.append('cohort', cohort);
    if (riskCategory && riskCategory !== 'ALL') params.append('risk_category', riskCategory);
    const res = await fetch(`${API_BASE}/reports/tested-patients?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('API unavailable for tested patients, loading local cohort fallback');
  }
  return FALLBACK_TESTED_PATIENTS as unknown as TestedPatientItem[];
}

export async function fetchModelReports(): Promise<any[]> {
  return FALLBACK_MODEL_REPORTS;
}

export async function fetchSkinReferenceSamples(): Promise<SkinReferenceSample[]> {
  const res = await fetch(`${API_BASE}/vision/reference-samples`);
  return res.json();
}

export async function analyzeSkinImage(payload: { image_base64?: string; phototype_index?: number }): Promise<VisionAnalysisResult> {
  const res = await fetch(`${API_BASE}/vision/analyze-skin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function predictMultiModalDiseaseRisk(payload: any): Promise<MultiModalPredictResponse> {
  const res = await fetch(`${API_BASE}/vision/predict-multimodal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export function getReportPdfUrl(recordId: string): string {
  return `./reports/clinical_decision_report_${recordId}.pdf`;
}

export function getDoctorReportPdfUrl(recordId: string): string {
  return `./reports/doctor_clinical_report_${recordId}.pdf`;
}

export function getPatientReportPdfUrl(recordId: string): string {
  return `./reports/patient_health_summary_${recordId}.pdf`;
}

export function getReportHtmlUrl(recordId: string): string {
  return `${API_BASE}/reports/${recordId}/html`;
}

export async function fetchArchitectureUsp(): Promise<ArchitectureUspData> {
  try {
    const res = await fetch(`${API_BASE}/models/architecture-usp`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API unavailable, loading architecture USP fallback');
  }
  return FALLBACK_ARCHITECTURE_USP as ArchitectureUspData;
}

export async function fetchTopCancers(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/cancer/top-cancers`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API unavailable, loading top cancers fallback');
  }
  return FALLBACK_TOP_CANCERS;
}

export async function fetchRealPatients(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/cancer/real-patients`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API unavailable, loading real patient cohort fallback');
  }
  return FALLBACK_REAL_PATIENTS;
}

export async function fetchGenomicStructure(geneSymbol: string): Promise<any> {
  const res = await fetch(`${API_BASE}/cancer/genomic-structure/${encodeURIComponent(geneSymbol)}`);
  return res.json();
}

export async function fetchCohortCases(projectId: string, limit: number = 8): Promise<any[]> {
  const res = await fetch(`${API_BASE}/cancer/cohort-cases/${encodeURIComponent(projectId)}?limit=${limit}`);
  return res.json();
}

export async function fetchStudyMutations(studyId: string, geneSymbol: string, limit: number = 10): Promise<any[]> {
  const res = await fetch(`${API_BASE}/cancer/study-mutations/${encodeURIComponent(studyId)}/${encodeURIComponent(geneSymbol)}?limit=${limit}`);
  return res.json();
}

export async function fetchIcgcArgoMetadata(): Promise<any> {
  const res = await fetch(`${API_BASE}/cancer/icgc-argo`);
  return res.json();
}

export async function evaluateCancerRisk(payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/cancer/evaluate-risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Cancer risk evaluation failed');
  }
  return res.json();
}

export async function downloadCancerPdfReport(evaluation: any, reportType: 'doctor' | 'patient'): Promise<Blob> {
  const res = await fetch(`${API_BASE}/cancer/download-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evaluation, report_type: reportType })
  });
  if (!res.ok) {
    throw new Error('Failed to generate cancer PDF report');
  }
  return res.blob();
}

export async function fetchRealDermalCases(): Promise<any> {
  const res = await fetch(`${API_BASE}/vision/real-dermal-cases`);
  return res.json();
}

export async function fetchDermalCohortCases(limit: number = 8): Promise<any[]> {
  const res = await fetch(`${API_BASE}/vision/dermal-cohort-cases?limit=${limit}`);
  return res.json();
}

export async function fetchDermalMutations(geneSymbol: string = 'BRAF', limit: number = 10): Promise<any[]> {
  const res = await fetch(`${API_BASE}/vision/dermal-mutations/${encodeURIComponent(geneSymbol)}?limit=${limit}`);
  return res.json();
}

export async function fetchDermalGeneStructure(geneSymbol: string = 'MC1R'): Promise<any> {
  const res = await fetch(`${API_BASE}/vision/dermal-genes/${encodeURIComponent(geneSymbol)}`);
  return res.json();
}

