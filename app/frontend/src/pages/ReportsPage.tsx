import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  Search,
  Filter,
  Users,
  ChevronRight,
  AlertCircle,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  Dna
} from 'lucide-react';
import {
  fetchReport,
  fetchTestedPatients,
  fetchModelReports,
  getReportHtmlUrl,
  getReportPdfUrl,
  getDoctorReportPdfUrl,
  getPatientReportPdfUrl
} from '../api';
import { TestedPatientItem } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { generateClinicalReportHtml } from '../utils/reportHtmlGenerator';
import { getGenesForRecord, CancerGeneInfo } from '../utils/cancerGenomicsData';

export const ReportsPage: React.FC = () => {
  const [recordId, setRecordId] = useState('DEMO-HIGH-03');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PATIENTS' | 'MODELS'>('ALL');
  const [activeGeneSymbol, setActiveGeneSymbol] = useState<string>('TP53');
  const [testedPatients, setTestedPatients] = useState<TestedPatientItem[]>([]);
  const [modelReports, setModelReports] = useState<any[]>([]);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [cohortFilter, setCohortFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'DOCUMENT' | 'INTERACTIVE'>('DOCUMENT');

  const quickRecords = [
    { id: 'TCGA-BH-A0B2', label: 'Breast (BRCA) Patient', category: 'TCGA BRCA', desc: 'Real TCGA Stage IIA donor with BRCA1 & TP53 alterations' },
    { id: 'TCGA-44-3918', label: 'Lung (LUAD) Patient', category: 'TCGA LUAD', desc: 'Real TCGA Stage IB lung cancer donor with EGFR mutation' },
    { id: 'TCGA-AA-3666', label: 'Colon (COAD) Patient', category: 'TCGA COAD', desc: 'Real TCGA Stage I colorectal donor with APC mutation' },
    { id: 'TCGA-D1-A17D', label: 'Melanoma (SKCM) Patient', category: 'TCGA SKCM', desc: 'Real TCGA Stage IIB melanoma donor with BRAF V600E' },
    { id: 'MODEL-HYBRID', label: 'Hybrid QML Model Report', category: 'Ensemble', desc: '60% XGBoost + 40% 4-Qubit VQC Ensemble validation report' },
    { id: 'MODEL-VQC', label: '4-Qubit VQC Quantum Report', category: 'Quantum', desc: 'Parameterized Quantum Circuit with 100% recall sensitivity' },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReportData(recordId);
  }, [recordId]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [patients, models] = await Promise.all([
        fetchTestedPatients(),
        fetchModelReports()
      ]);
      setTestedPatients(patients || []);
      setModelReports(models || []);
    } catch (err) {
      console.error('Failed to load initial report lists:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadReportData(id: string) {
    setReportLoading(true);
    try {
      const data = await fetchReport(id);
      setCurrentReport(data);
    } catch (err) {
      console.error(`Failed to load report for ${id}:`, err);
    } finally {
      setReportLoading(false);
    }
  }

  function handleSelectRecord(id: string) {
    setRecordId(id);
    loadReportData(id);
    setTimeout(() => {
      document.getElementById('dossier-preview')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function handleLoadReport(e: React.FormEvent) {
    e.preventDefault();
    if (recordId.trim()) {
      loadReportData(recordId.trim());
    }
  }

  // Generate self-contained HTML for instant zero-404 srcDoc rendering
  const reportHtml = generateClinicalReportHtml(currentReport);

  function handlePrintOrPdf() {
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(reportHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 400);
    }
  }

  function handleDownloadHtml() {
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical_decision_report_${recordId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const filteredPatients = testedPatients.filter((p) => {
    // In PATIENTS tab, exclude model rows; in ALL tab, include everything
    if (activeTab === 'PATIENTS' && p.record_id.startsWith('MODEL-')) return false;

    const matchCohort =
      cohortFilter === 'ALL' ||
      (cohortFilter === 'CARDIO' && p.cohort_name.toLowerCase().includes('cardio')) ||
      (cohortFilter === 'ONCO' && p.cohort_name.toLowerCase().includes('onco')) ||
      (cohortFilter === 'DEMO' && (p.cohort_name.toLowerCase().includes('demo') || p.cohort_name.toLowerCase().includes('clinical evaluation')));

    const matchRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'HIGH' && (p.risk_category.includes('High') || p.risk_category.includes('Critical'))) ||
      (riskFilter === 'MOD' && p.risk_category.includes('Moderate')) ||
      (riskFilter === 'LOW' && p.risk_category.includes('Low'));

    const matchSearch =
      !searchTerm ||
      p.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cohort_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.top_factor && p.top_factor.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchCohort && matchRisk && matchSearch;
  });

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Header Banner */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" />
              CLINICAL DOCUMENTATION & REPOSITORY
            </span>
            <span className="text-xs text-slate-400">Tested Patients & All Model Validation Reports</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Clinical AI Assessment & Model Reports</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Complete imported clinical repository containing real tested patient dossiers across Cardiometabolic (n=600), Oncology Genomic (n=500), and all verified AI Model performance validation reports (XGBoost, 4-Qubit VQC, Hybrid Ensemble, Random Forest, Logistic Regression, AdaBoost, Optical Biopsy).
          </p>
        </div>

        <form onSubmit={handleLoadReport} className="flex items-center gap-2 text-xs w-full lg:w-auto">
          <input
            type="text"
            placeholder="Enter Patient or Model ID..."
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 flex-1 lg:w-56"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load</span>
          </button>
        </form>
      </div>

      {/* Quick Select Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {quickRecords.map((rec) => {
          const isSelected = recordId === rec.id;
          return (
            <button
              key={rec.id}
              onClick={() => handleSelectRecord(rec.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono font-semibold text-slate-300 truncate">{rec.id}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    rec.category.includes('Critical')
                      ? 'bg-rose-500/20 text-rose-300'
                      : rec.category.includes('High')
                      ? 'bg-amber-500/20 text-amber-300'
                      : rec.category.includes('Ensemble')
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : rec.category.includes('Quantum')
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {rec.category}
                </span>
              </div>
              <div className="text-xs font-semibold text-white truncate">{rec.label}</div>
              <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{rec.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Primary Section Switcher: Patients vs Models */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PATIENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'PATIENTS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tested Patients Repository ({filteredPatients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MODELS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'MODELS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Model Clinical Reports ({modelReports.length} Models)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Active Record: <strong className="text-white font-mono">{recordId}</strong>
        </div>
      </div>

      {/* TAB 1: Tested Patients Table */}
      {(activeTab === 'ALL' || activeTab === 'PATIENTS') && (
        <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Tested Patient Cohort Directory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated clinical profiles with individual Classical, Quantum, and Ensemble risk classifications
              </p>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ID, cohort, biomarker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={cohortFilter}
                onChange={(e) => setCohortFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Cohorts</option>
                <option value="CARDIO">Cardiometabolic</option>
                <option value="ONCO">Oncology Genomics</option>
                <option value="DEMO">Demo Profiles</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Risk Tiers</option>
                <option value="HIGH">High / Critical</option>
                <option value="MOD">Moderate</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Patients Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <th className="p-3 font-semibold">Patient Record ID</th>
                  <th className="p-3 font-semibold">Cohort / Clinical Profile</th>
                  <th className="p-3 font-semibold">Demographics</th>
                  <th className="p-3 font-semibold">Hybrid Risk Score</th>
                  <th className="p-3 font-semibold">Classical (XGB)</th>
                  <th className="p-3 font-semibold">Quantum (VQC)</th>
                  <th className="p-3 font-semibold">Risk Classification</th>
                  <th className="p-3 font-semibold">Top Discriminator</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      {loading ? 'Loading clinical records...' : 'No matching patient records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p) => {
                    const isSelected = p.record_id === recordId;
                    const isCrit = p.risk_category.includes('Critical') || p.risk_category.includes('Very High');
                    const isHigh = p.risk_category.includes('High') && !isCrit;
                    const isMod = p.risk_category.includes('Moderate');

                    return (
                      <tr
                        key={p.record_id}
                        onClick={() => handleSelectRecord(p.record_id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-950/40 text-white font-medium'
                            : 'hover:bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <td className="p-3 font-mono font-semibold text-indigo-400 flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                          {p.record_id}
                        </td>
                        <td className="p-3 text-slate-300">{p.cohort_name}</td>
                        <td className="p-3 text-slate-400">
                          {p.age > 0 ? `${p.age}y / ${p.sex}` : 'Standard Profile'}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {Math.round(p.hybrid_risk * 100)}%
                        </td>
                        <td className="p-3 font-mono text-indigo-300">
                          {Math.round(p.classical_risk * 100)}%
                        </td>
                        <td className="p-3 font-mono text-purple-300">
                          {Math.round(p.quantum_risk * 100)}%
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isCrit
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : isHigh
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : isMod
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {p.risk_category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px] truncate max-w-[150px]">
                          {p.top_factor || 'N/A'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectRecord(p.record_id);
                              }}
                              className="px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-[11px] transition-colors whitespace-nowrap"
                            >
                              View Dossier
                            </button>
                            <a
                              href={getReportPdfUrl(p.record_id)}
                              download={`clinical_decision_report_${p.record_id}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                              title="Download Clinical Decision Support PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>Clinical</span>
                            </a>
                            <a
                              href={getDoctorReportPdfUrl(p.record_id)}
                              download={`doctor_clinical_report_${p.record_id}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                              title="Download Physician / Doctor Detailed PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>Doctor</span>
                            </a>
                            <a
                              href={getPatientReportPdfUrl(p.record_id)}
                              download={`patient_health_summary_${p.record_id}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                              title="Download Patient-Friendly Summary PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>Patient</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AI Models Clinical Validation Reports */}
      {activeTab === 'MODELS' && (
        <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Verified AI Models Clinical Performance & Validation Reports
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any verified model to view its standardized publication-grade clinical validation dossier with sensitivity, specificity, ROC-AUC, and feature weights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelReports.map((model) => {
              const isSelected = recordId === model.model_id;
              const met = model.metrics || {};
              const isWinner = model.status.toLowerCase().includes('winner');

              return (
                <div
                  key={model.model_id}
                  onClick={() => handleSelectRecord(model.model_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] text-slate-400">{model.model_id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          isWinner
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {model.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{model.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{model.clinical_rationale}</p>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Accuracy</div>
                        <div className="font-mono font-bold text-xs text-emerald-400">
                          {(met.accuracy * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Sensitivity</div>
                        <div className="font-mono font-bold text-xs text-indigo-400">
                          {(met.sensitivity * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">ROC-AUC</div>
                        <div className="font-mono font-bold text-xs text-purple-400">
                          {met.roc_auc.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60 mt-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Latency: <strong className="text-slate-200">{met.inference_time_ms} ms</strong></span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRecord(model.model_id);
                        }}
                        className="px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>View Dossier</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <a
                        href={getReportPdfUrl(model.model_id)}
                        download={`clinical_validation_${model.model_id}.pdf`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-center py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                        title="Download Clinical Decision Support PDF"
                      >
                        <Download className="w-3 h-3" />
                        <span>Clinical</span>
                      </a>
                      <a
                        href={getDoctorReportPdfUrl(model.model_id)}
                        download={`doctor_validation_${model.model_id}.pdf`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-center py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                        title="Download Physician/Doctor Clinical Dossier PDF"
                      >
                        <Download className="w-3 h-3" />
                        <span>Doctor</span>
                      </a>
                      <a
                        href={getPatientReportPdfUrl(model.model_id)}
                        download={`patient_validation_${model.model_id}.pdf`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-center py-1 rounded bg-teal-600/80 hover:bg-teal-600 text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                        title="Download Plain-Language Summary PDF"
                      >
                        <Download className="w-3 h-3" />
                        <span>Patient</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Cancer Driver Genes & Genomic Architecture Panel */}
      {(() => {
        const activeGenes = getGenesForRecord(
          recordId,
          currentReport?.patient_demographics?.cohort || currentReport?.patient_demographics?.primary_diagnosis
        );
        const currentGene = activeGenes.find((g) => g.symbol === activeGeneSymbol) || activeGenes[0];

        return (
          <div className="glass-panel-elevated rounded-2xl p-6 border border-indigo-500/30 bg-slate-900/60 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Dna className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    Live Cancer Driver Genes & Genomic Telemetry
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    GRCh38.p14 / Ensembl / cBioPortal
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Active oncogenic driver alterations, chromosome loci, canonical transcripts, and quantum angle state projections for <strong>{recordId}</strong>
                </p>
              </div>

              {/* Gene Selector Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 mr-1 font-medium">Mapped Genes:</span>
                {activeGenes.map((g) => (
                  <button
                    key={g.symbol}
                    onClick={() => setActiveGeneSymbol(g.symbol)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                      currentGene?.symbol === g.symbol
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {g.symbol}
                  </button>
                ))}
              </div>
            </div>

            {currentGene && (
              <div className="space-y-4">
                {/* 6 Telemetry Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Gene & Chromosome</div>
                    <div className="text-sm font-bold text-indigo-300 font-mono mt-0.5">
                      {currentGene.symbol} <span className="text-xs text-slate-400 font-normal">({currentGene.chromosome}:{currentGene.locus})</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Genomic Span (GRCh38)</div>
                    <div className="text-xs font-bold text-slate-200 font-mono mt-1 truncate" title={`${currentGene.start.toLocaleString()} - ${currentGene.end.toLocaleString()}`}>
                      {(currentGene.end - currentGene.start + 1).toLocaleString()} bp [{currentGene.strand}]
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Canonical Transcript</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono mt-1 truncate" title={currentGene.canonical_transcript}>
                      {currentGene.canonical_transcript} ({currentGene.exon_count} exons)
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-400">Hotspot Alteration</div>
                    <div className="text-xs font-bold text-rose-400 font-mono mt-1 truncate" title={`${currentGene.protein_change} (${currentGene.hotspot_mutation})`}>
                      {currentGene.protein_change}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] uppercase font-mono text-slate-400">ClinVar Significance</div>
                    <div className="text-xs font-bold text-amber-300 mt-1 truncate" title={currentGene.clinvar_significance}>
                      {currentGene.clinvar_significance.split('/')[0]}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30">
                    <div className="text-[10px] uppercase font-mono text-purple-300">Quantum Phase Angle (θ)</div>
                    <div className="text-xs font-bold text-purple-400 font-mono mt-1">
                      θ = {currentGene.vqc_phase_angle_rad} rad
                    </div>
                  </div>
                </div>

                {/* Biological Function & Live Links */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="text-slate-300 leading-relaxed">
                    <strong className="text-white">{currentGene.name}:</strong> {currentGene.biological_function}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://rest.ensembl.org/lookup/symbol/homo_sapiens/${currentGene.symbol}?expand=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 text-[11px] font-mono flex items-center gap-1 transition-colors"
                      title="View live Ensembl JSON structure"
                    >
                      <span>Ensembl</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://www.cbioportal.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-pink-300 border border-slate-700 text-[11px] font-mono flex items-center gap-1 transition-colors"
                      title="View Pan-Cancer Atlas cBioPortal mutations"
                    >
                      <span>cBioPortal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Embedded Live Clinical Document Preview (ZERO 404s!) */}
      <div id="dossier-preview" className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Live Clinical Report Preview Document</h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                {recordId}
              </span>
              {reportLoading && (
                <span className="text-xs text-indigo-400 animate-pulse flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Self-contained, publication-ready dossier for <strong>{recordId}</strong> with full biomarker attributions and model validation metrics.
            </p>
          </div>

          {/* Action Buttons: Real Pre-generated PDFs + Print + Download HTML */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={getReportPdfUrl(recordId)}
              download={`clinical_decision_report_${recordId}.pdf`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
              title="Download publication-grade Clinical Decision PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Clinical PDF</span>
            </a>

            <a
              href={getDoctorReportPdfUrl(recordId)}
              download={`doctor_clinical_report_${recordId}.pdf`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
              title="Download Detailed Physician/Doctor Clinical Dossier PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Doctor PDF</span>
            </a>

            <a
              href={getPatientReportPdfUrl(recordId)}
              download={`patient_health_summary_${recordId}.pdf`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-md shadow-teal-600/30"
              title="Download Patient-Friendly Plain Language Skin & Health Summary PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Patient PDF</span>
            </a>

            <button
              onClick={handlePrintOrPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              title="Print document or save directly via browser print engine"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
              title="Download standalone HTML dossier"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>HTML</span>
            </button>
          </div>
        </div>

        {/* Embedded IFrame with srcDoc - ZERO 404 GUARANTEE */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-white min-h-[650px] shadow-inner">
          <iframe
            srcDoc={reportHtml}
            title={`Clinical Report - ${recordId}`}
            className="w-full h-[700px] border-none"
          />
        </div>
      </div>
    </div>
  );
};
