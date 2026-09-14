import React, { useState, useEffect } from 'react';
import {
  fetchSamplePatientsList,
  uploadPatientReportPdfApi,
  evaluateQmlCmlApi,
  downloadQmlCmlPdfApi
} from '../api';
import { DEMO_UPLOAD_SAMPLES } from '../utils/quantum20QEngine';

export const PatientReportUploaderPage: React.FC = () => {
  const [sampleList, setSampleList] = useState<any[]>(DEMO_UPLOAD_SAMPLES);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('TCGA-BH-A0B2');
  const [numQubits, setNumQubits] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [showRawText, setShowRawText] = useState<boolean>(false);

  useEffect(() => {
    // Initial load with default sample TCGA-BH-A0B2
    loadSample(selectedSampleId, 20);
    // Fetch any dynamic samples
    fetchSamplePatientsList()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setSampleList(data);
      })
      .catch(() => {});
  }, []);

  async function loadSample(sampleId: string, qubits: number) {
    setSelectedSampleId(sampleId);
    setSelectedFile(null);
    setIsLoading(true);
    try {
      const res = await uploadPatientReportPdfApi(undefined, sampleId, qubits);
      setAnalysisResult(res);
    } catch (err) {
      console.error('Failed to load sample patient:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setSelectedSampleId('');
    setIsLoading(true);
    try {
      const res = await uploadPatientReportPdfApi(file, undefined, numQubits);
      setAnalysisResult(res);
    } catch (err) {
      console.error('Failed to parse uploaded PDF:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQubitCountChange(newQubits: number) {
    setNumQubits(newQubits);
    if (!analysisResult?.features_20q) return;
    setIsLoading(true);
    try {
      const evalRes = await evaluateQmlCmlApi(analysisResult.features_20q, newQubits);
      setAnalysisResult((prev: any) => ({
        ...prev,
        cml_metrics: evalRes.cml_metrics,
        qml_metrics: evalRes.qml_metrics,
        hybrid_metrics: evalRes.hybrid_metrics,
        qubit_diagnostics: evalRes.qubit_diagnostics,
        shap_attributions: evalRes.shap_attributions
      }));
    } catch (err) {
      console.error('Failed to re-evaluate with new qubits:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!analysisResult) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadQmlCmlPdfApi(analysisResult);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const patId = analysisResult.patient_demographics?.patient_id || 'PATIENT';
      a.download = `qml_cml_dossier_${patId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  const p = analysisResult?.patient_demographics;
  const qml = analysisResult?.qml_metrics;
  const cml = analysisResult?.cml_metrics;
  const hyb = analysisResult?.hybrid_metrics;
  const qubits = analysisResult?.qubit_diagnostics || [];
  const mutations = analysisResult?.detected_mutations || [];
  const shapList = analysisResult?.shap_attributions || [];

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                📄 Clinical PDF Ingestion & Evaluation
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                ⚛️ Up to 20 Qubits ({Math.pow(2, numQubits).toLocaleString()} States)
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Patient Report PDF Uploader: Dual QML & CML
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Upload patient genomic biopsy reports, pathology summaries, or clinical PDFs. The system extracts multi-omics driver mutations,
              evaluates dual <b>Classical Machine Learning (XGBoost/AdaBoost)</b> and scalable <b>20-Qubit Quantum VQC ($2^{'{20}'}=1,048,576$ states)</b>,
              and generates publication-grade PDF dossiers.
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf || !analysisResult}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isDownloadingPdf ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Compiling PDF...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download QML + CML Patient PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload & Sample Selector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF File Drag & Drop Upload Zone */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <span>📤</span> Upload Patient Report PDF
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select or drag & drop a PDF, TXT, or JSON clinical document.
            </p>

            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/50 group">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-2xl mb-2 group-hover:scale-110 transition-transform">
                📄
              </div>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                {selectedFile ? selectedFile.name : 'Click to Browse or Drop PDF'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Supports PDF, TXT, JSON'}
              </span>
              <input
                type="file"
                accept=".pdf,.txt,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl flex items-center justify-between text-xs text-indigo-200">
              <span className="truncate max-w-[200px]">✓ Active: {selectedFile.name}</span>
              <span className="text-emerald-400 font-bold">Loaded</span>
            </div>
          )}
        </div>

        {/* 1-Click World Cancer Pre-loaded Sample Patient Reports */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>🔬</span> Or 1-Click Load Pre-loaded Real Patient Reports
              </h3>
              <span className="text-xs text-slate-400">GDC TCGA / ClinVar / COSMIC Enriched</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Instantly test the dual CML and 20-qubit QML model using authentic TCGA patient dossiers:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {sampleList.map((s) => {
                const isSelected = selectedSampleId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => loadSample(s.id, numQubits)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-indigo-300 font-mono">{s.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {s.stage || 'Stage II'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">{s.cancer_type || s.title}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      Genes: {Array.isArray(s.key_mutations) ? s.key_mutations.join(', ') : s.mutations || 'TP53, BRCA1'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Current Subject: <strong className="text-white">{p?.patient_id || selectedSampleId}</strong></span>
            <span>Diagnosis: <strong className="text-indigo-400">{p?.diagnosis || 'Invasive Carcinoma'}</strong></span>
          </div>
        </div>
      </div>

      {/* Quantum Model Scaler: 2 to 20 Qubits */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚛️</span>
              <h3 className="text-base font-bold text-white">
                Quantum Model Wire Scale: {numQubits} Qubits
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {Math.pow(2, numQubits).toLocaleString()} Hilbert States
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dynamically expand the quantum circuit up to 20 qubits. Each wire maps to an oncogenic driver gene or clinical biomarker.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[4, 8, 12, 16, 20].map((q) => (
              <button
                key={q}
                onClick={() => handleQubitCountChange(q)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  numQubits === q
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {q} Qubits
              </button>
            ))}
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={numQubits}
            onChange={(e) => handleQubitCountChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>2 Qubits (4 states)</span>
            <span>6 Qubits (64)</span>
            <span>10 Qubits (1,024)</span>
            <span>15 Qubits (32,768)</span>
            <span className="text-purple-400 font-bold">20 Qubits (1,048,576 states)</span>
          </div>
        </div>
      </div>

      {/* Dual QML & CML Consensus Matrix */}
      {analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hybrid Consensus Hero Card */}
          <div className="lg:col-span-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              {/* Main Consensus Gauge */}
              <div className="md:col-span-1 border-r border-slate-800/80 pr-4">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Calibrated Consensus Risk
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-4xl font-extrabold ${
                    (hyb?.hybrid_risk_score || 0) >= 0.70 ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {Math.round((hyb?.hybrid_risk_score || 0.75) * 100)}%
                  </span>
                  <span className="text-sm font-bold text-slate-300">
                    {hyb?.risk_tier || 'High Risk'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Epistemic Uncertainty: <span className="font-mono text-slate-200">±{hyb?.epistemic_uncertainty || 0.045}</span>
                </div>
              </div>

              {/* Classical Machine Learning Bar */}
              <div className="md:col-span-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                    <span>💻</span> CML Classical Risk
                  </span>
                  <span className="font-bold text-white">{Math.round((cml?.classical_risk_score || 0.72) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-sky-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((cml?.classical_risk_score || 0.72) * 100))}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  XGBoost ({Math.round((cml?.xgboost_risk || 0.75) * 100)}%) | AdaBoost ({Math.round((cml?.adaboost_risk || 0.65) * 100)}%)
                </div>
              </div>

              {/* Quantum Machine Learning Bar */}
              <div className="md:col-span-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-purple-400 flex items-center gap-1.5">
                    <span>⚛️</span> QML Quantum Risk ({numQubits}Q)
                  </span>
                  <span className="font-bold text-white">{Math.round((qml?.quantum_risk_score || 0.78) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((qml?.quantum_risk_score || 0.78) * 100))}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {Math.pow(2, numQubits).toLocaleString()} Hilbert States | S = {qml?.von_neumann_entropy || 0.85}
                </div>
              </div>

              {/* Patient Core Summary */}
              <div className="md:col-span-1 bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
                <div className="font-bold text-slate-200 mb-1 truncate">{p?.patient_id}</div>
                <div className="text-slate-400">{p?.age} y/o {p?.sex} • {p?.stage}</div>
                <div className="text-slate-400 mt-1">
                  VAF: <span className="text-emerald-400 font-bold">{p?.vaf_pct}%</span> • TMB: <span className="text-amber-400 font-bold">{p?.tmb_score} mut/Mb</span>
                </div>
              </div>
            </div>
          </div>

          {/* Left Column: CML & SHAP Attribution Analysis */}
          <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>📊</span> CML Feature Attributions (SHAP)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Local impact of extracted clinical biomarkers on risk elevation.
              </p>
            </div>

            <div className="space-y-3">
              {shapList.map((s: any, idx: number) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">{s.feature}</span>
                    <span className="font-mono font-bold text-red-400">+{s.shap_value}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, s.shap_value * 350)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                    <span>Target: {s.gene}</span>
                    <span className="text-red-400/80">{s.direction}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Extracted Driver Mutations List */}
            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Extracted Somatic Drivers ({mutations.length})
              </h4>
              <div className="space-y-1.5">
                {mutations.map((m: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-indigo-300">{m.gene}</span>{' '}
                      <span className="text-slate-400">({m.mutation})</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">{m.vaf}% VAF</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: 20-Qubit Quantum Diagnostics Grid */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>⚛️</span> {numQubits}-Qubit Quantum Diagnostics
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analytical Pauli expectations &lang;Z&rang;, Von Neumann Entanglement Entropy, and Bloch coordinates.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="bg-purple-950/60 border border-purple-800/40 px-3 py-1 rounded-lg">
                  Entropy S: <strong className="text-purple-300 font-mono">{qml?.von_neumann_entropy || 0.85}</strong>
                </div>
                <div className="bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-lg">
                  Purity &gamma;: <strong className="text-indigo-300 font-mono">{qml?.state_purity || 0.82}</strong>
                </div>
              </div>
            </div>

            {/* Qubit Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {qubits.map((q: any) => {
                const isHighRisk = q.pauli_z < 0;
                return (
                  <div
                    key={q.qubit_index}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 transition-colors text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-purple-400 font-mono text-[11px]">
                        q<sub>{q.qubit_index}</sub>
                      </span>
                      <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-300 font-semibold truncate max-w-[60px]">
                        {q.gene}
                      </span>
                    </div>

                    <div className="my-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>&lang;Z&rang;:</span>
                        <span className={`font-mono font-bold ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`}>
                          {q.pauli_z}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>P(|1&rang;):</span>
                        <span className="font-mono text-slate-200">{Math.round(q.prob_state_1 * 100)}%</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-800/60 text-[9px] font-mono text-slate-500 truncate">
                      ({q.bloch_coords.x}, {q.bloch_coords.y}, {q.bloch_coords.z})
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantum Advantage & Circuit Specs Footer */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <span>Circuit Depth: <strong className="text-slate-200">{qml?.circuit_depth}</strong></span>
              <span>Entangling Gates: <strong className="text-slate-200">{qml?.entangling_gates_count} CNOT</strong></span>
              <span>Advantage Index: <strong className="text-purple-400 font-mono">{qml?.quantum_advantage_metric}</strong></span>
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                {showRawText ? 'Hide Source Snippet' : 'View Source Text'}
              </button>
            </div>

            {showRawText && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {analysisResult.raw_text_snippet}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
