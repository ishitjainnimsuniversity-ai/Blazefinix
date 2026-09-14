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
  AlertCircle
} from 'lucide-react';
import { getReportHtmlUrl, getReportPdfUrl, getDoctorReportPdfUrl, getPatientReportPdfUrl, fetchTestedPatients } from '../api';
import { TestedPatientItem } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const ReportsPage: React.FC = () => {
  const [recordId, setRecordId] = useState('DEMO-HIGH-03');
  const [iframeKey, setIframeKey] = useState(1);
  const [testedPatients, setTestedPatients] = useState<TestedPatientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cohortFilter, setCohortFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const quickRecords = [
    { id: 'DEMO-HIGH-03', label: 'High Risk', category: 'High', desc: 'Accelerated cardiometabolic risks (Elevated SBP, HbA1c)' },
    { id: 'DEMO-CRIT-04', label: 'Very High Risk', category: 'Critical', desc: 'Immediate clinical alert state with severe biomarker deviation' },
    { id: 'DEMO-MOD-02', label: 'Moderate Risk', category: 'Moderate', desc: 'Borderline glycemic and lipid parameters' },
    { id: 'DEMO-LOW-01', label: 'Low Risk', category: 'Low', desc: 'Healthy metabolic baseline with minimal deviation' },
    { id: 'R-CAD-1042', label: 'Cohort Case', category: 'Cohort', desc: 'Real research cohort patient from cardiometabolic dataset' },
  ];

  useEffect(() => {
    loadTestedPatients();
  }, []);

  async function loadTestedPatients() {
    setLoading(true);
    try {
      const data = await fetchTestedPatients();
      setTestedPatients(data);
    } catch (err) {
      console.error('Failed to load tested patients:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectRecord(id: string) {
    setRecordId(id);
    setIframeKey((prev) => prev + 1);
  }

  function handleLoadReport(e: React.FormEvent) {
    e.preventDefault();
    setIframeKey((prev) => prev + 1);
  }

  const filteredPatients = testedPatients.filter((p) => {
    const matchCohort =
      cohortFilter === 'ALL' ||
      (cohortFilter === 'CARDIO' && p.cohort_name.toLowerCase().includes('cardio')) ||
      (cohortFilter === 'ONCO' && p.cohort_name.toLowerCase().includes('onco')) ||
      (cohortFilter === 'DEMO' && !p.cohort_name.toLowerCase().includes('cohort'));

    const matchRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'HIGH' && (p.risk_category.includes('High') || p.risk_category.includes('Critical'))) ||
      (riskFilter === 'MOD' && p.risk_category.includes('Moderate')) ||
      (riskFilter === 'LOW' && p.risk_category.includes('Low'));

    const matchSearch =
      !searchTerm ||
      p.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cohort_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.top_factor.toLowerCase().includes(searchTerm.toLowerCase());

    return matchCohort && matchRisk && matchSearch;
  });

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Header Banner */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              CLINICAL DOCUMENTATION & REPOSITORY
            </span>
            <span className="text-xs text-slate-400">Tested Patients & Real Cohort PDF Reports</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Clinical AI Assessment & PDF Reports</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Generates and exports standardized, publication-grade downloadable PDF reports for all tested patients across real clinical cohorts (Cardiometabolic n=600 & Oncology Genomic n=500).
          </p>
        </div>

        <form onSubmit={handleLoadReport} className="flex items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Enter Record ID..."
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>
        </form>
      </div>

      {/* Quick Select Cards for Reference Profiles */}
      <div className="glass-panel-elevated rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span>Reference Patient Profiles (Instant 1-Click PDF Download)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized baseline profiles spanning the disease-risk spectrum:
            </p>
          </div>
          <a
            href="http://127.0.0.1:8000/api/reports/download/summary-pdf"
            download="cohort_summary_report.pdf"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cohort Summary PDF</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
          {quickRecords.map((r) => {
            const isSelected = recordId === r.id;
            return (
              <div
                key={r.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-900/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] font-bold text-indigo-300">{r.id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        r.category === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : r.category === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : r.category === 'Moderate'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : r.category === 'Low'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {r.category}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white">{r.label}</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{r.desc}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5">
                  <button
                    onClick={() => handleSelectRecord(r.id)}
                    className="flex-1 py-1 px-2 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    View
                  </button>
                  <a
                    href={getReportPdfUrl(r.id)}
                    download={`clinical_report_${r.id}.pdf`}
                    className="flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1 shadow-sm transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>PDF</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ALL PREVIOUSLY TESTED PATIENTS & REAL COHORT REPOSITORY */}
      <div className="glass-panel-elevated rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>All Evaluated Patient Records & Real Cohort Examples ({testedPatients.length} Patients)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live database of patients tested through the Classical XGBoost + Quantum VQC hybrid pipeline. Select any patient to preview or click &quot;Download PDF&quot; for instant clinical reports.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, cohort, factor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={loadTestedPatients}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              title="Refresh Tested Patients"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Cohort:
            </span>
            {[
              { id: 'ALL', label: 'All Cohorts' },
              { id: 'CARDIO', label: 'Cardiometabolic (n=600)' },
              { id: 'ONCO', label: 'Oncology Genomic (NCBI)' },
              { id: 'DEMO', label: 'Demo Profiles' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCohortFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  cohortFilter === f.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Risk Tier:</span>
            {[
              { id: 'ALL', label: 'All Tiers' },
              { id: 'HIGH', label: 'High / Critical' },
              { id: 'MOD', label: 'Moderate' },
              { id: 'LOW', label: 'Low' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRiskFilter(r.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  riskFilter === r.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Tested Patients Table */}
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50">
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 sticky top-0 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider backdrop-blur">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Record ID</th>
                  <th className="py-2.5 px-3 font-semibold font-sans">Cohort / Dataset</th>
                  <th className="py-2.5 px-3 font-semibold">Demographics</th>
                  <th className="py-2.5 px-3 font-semibold">Hybrid Risk</th>
                  <th className="py-2.5 px-3 font-semibold font-sans">Category</th>
                  <th className="py-2.5 px-3 font-semibold font-sans">Top Biomarker (SHAP)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Alert</th>
                  <th className="py-2.5 px-3 font-semibold text-right font-sans">Reports & PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      No tested patient records matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p) => {
                    const isCurrent = recordId === p.record_id;
                    return (
                      <tr
                        key={p.record_id}
                        className={`transition-colors ${
                          isCurrent
                            ? 'bg-indigo-950/30'
                            : 'hover:bg-slate-900/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-white">
                          <button
                            onClick={() => handleSelectRecord(p.record_id)}
                            className="hover:text-indigo-400 transition-colors text-left"
                            title="Click to preview report"
                          >
                            {p.record_id}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-300">
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {p.cohort_name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {p.age}y / {p.sex}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-emerald-400">
                              {Math.round(p.hybrid_risk * 100)}%
                            </span>
                            <span className="text-[10px] text-slate-500">
                              (XGB: {Math.round(p.classical_risk * 100)}% | QML: {Math.round(p.quantum_risk * 100)}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.risk_category.includes('High') || p.risk_category.includes('Critical')
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : p.risk_category.includes('Moderate')
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {p.risk_category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-300">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-indigo-300">{p.top_factor}</span>
                            {p.top_factor_value !== 'N/A' && (
                              <span className="text-[10px] text-slate-400">({p.top_factor_value})</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {p.has_alert ? (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                p.alert_severity === 'CRITICAL'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {p.alert_severity}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSelectRecord(p.record_id)}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                              }`}
                            >
                              Preview
                            </button>
                            <a
                              href={getDoctorReportPdfUrl(p.record_id)}
                              download={`doctor_report_${p.record_id}.pdf`}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-sm transition-colors"
                              title={`Download Doctor Detailed Genetic PDF for ${p.record_id}`}
                            >
                              <Download className="w-3 h-3" />
                              <span>Doctor</span>
                            </a>
                            <a
                              href={getPatientReportPdfUrl(p.record_id)}
                              download={`patient_summary_${p.record_id}.pdf`}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-sm transition-colors"
                              title={`Download Patient-Friendly Skin Summary PDF for ${p.record_id}`}
                            >
                              <Download className="w-3 h-3" />
                              <span>Patient</span>
                            </a>
                            <a
                              href={getReportHtmlUrl(p.record_id)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                              title="Open Printable Web Summary"
                            >
                              <ExternalLink className="w-3 h-3" />
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
      </div>

      {/* Embedded Live Document Preview */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Live Clinical Report Preview Document</h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                {recordId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing real-time evaluated report for <strong>{recordId}</strong> with Classical + Quantum risk scores and local SHAP attributions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getReportPdfUrl(recordId)}
              download={`clinical_decision_report_${recordId}.pdf`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF ({recordId})</span>
            </a>

            <a
              href={getReportHtmlUrl(recordId)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print Window</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Embedded IFrame for instant interactive preview */}
        <div className="mt-4 rounded-xl overflow-hidden border border-slate-800 bg-white min-h-[500px]">
          <iframe
            key={iframeKey}
            src={getReportHtmlUrl(recordId)}
            title="Clinical Report Preview"
            className="w-full h-[650px] border-none"
          />
        </div>
      </div>
    </div>
  );
};


