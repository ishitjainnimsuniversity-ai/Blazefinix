import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Cpu,
  HelpCircle,
  FileText,
  Send,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Download
} from 'lucide-react';
import { PredictionResult, DemoCase } from '../types';
import {
  fetchDemoCases,
  predictPatientRisk,
  acknowledgeAlert,
  submitDoctorFeedback,
  getReportHtmlUrl,
  getReportPdfUrl
} from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface ClinicalDecisionPageProps {
  initialRecordId?: string;
}

export const ClinicalDecisionPage: React.FC<ClinicalDecisionPageProps> = ({
  initialRecordId
}) => {
  const [demoCases, setDemoCases] = useState<DemoCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Doctor feedback inline modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [agreement, setAgreement] = useState<'AGREE' | 'PARTIAL' | 'DISAGREE' | 'NEEDS_REVIEW'>('AGREE');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [clinicianName, setClinicianName] = useState('Dr. Clinical Attending');

  // Load demo cases on mount
  useEffect(() => {
    async function init() {
      try {
        const cases = await fetchDemoCases();
        setDemoCases(cases);
        if (cases.length > 0) {
          // Default to High Risk case to demonstrate the alert workflow
          const defaultCase = cases.find((c) => c.case_id.includes('HIGH')) || cases[0];
          setSelectedCaseId(defaultCase.case_id);
          runPredictionForCase(defaultCase);
        }
      } catch (err) {
        console.error('Failed to load demo cases:', err);
      }
    }
    init();
  }, [initialRecordId]);

  async function runPredictionForCase(demoCase: DemoCase) {
    setLoading(true);
    setActionSuccess(null);
    try {
      const res = await predictPatientRisk(demoCase.features, demoCase.case_id);
      setPrediction(res);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCaseChange(caseId: string) {
    setSelectedCaseId(caseId);
    const targetCase = demoCases.find((c) => c.case_id === caseId);
    if (targetCase) {
      runPredictionForCase(targetCase);
    }
  }

  async function handleAcknowledge() {
    if (!prediction?.alert) return;
    try {
      await acknowledgeAlert(prediction.alert.alert_id, clinicianName, 'Acknowledged during clinical evaluation session.');
      setActionSuccess('Alert acknowledged successfully by attending clinician.');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!prediction) return;
    try {
      await submitDoctorFeedback({
        alert_id: prediction.alert?.alert_id,
        record_id: prediction.record_id,
        agreement,
        clinical_notes: clinicalNotes || 'Prediction reviewed against standard clinical baseline indicators.',
        reviewer_name: clinicianName
      });
      setFeedbackOpen(false);
      setActionSuccess('Doctor feedback logged to audit repository (Model weights safely preserved).');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Clinical Disclaimer */}
      <MedicalDisclaimer />

      {/* Case Selector Toolbar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Patient Case:
          </span>
          <div className="flex flex-wrap gap-2">
            {demoCases.map((c) => (
              <button
                key={c.case_id}
                onClick={() => handleCaseChange(c.case_id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedCaseId === c.case_id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {c.label.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        {prediction && (
          <div className="flex items-center gap-2">
            <a
              href={getReportPdfUrl(prediction.record_id)}
              download={`clinical_report_${prediction.record_id}.pdf`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Report</span>
            </a>
            <a
              href={getReportHtmlUrl(prediction.record_id)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Web Summary</span>
            </a>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Flagship Clinical Card (Section 47 Specification) */}
      {prediction ? (
        <div className="space-y-6">
          {/* Main Assessment Header Card */}
          <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  PATIENT / RECORD
                </div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  ID: {prediction.record_id}
                </div>
              </div>

              {/* Risk Assessment Badges */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">AI RISK ASSESSMENT</div>
                  <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
                    {Math.round(prediction.hybrid_risk * 100)}%
                  </div>
                </div>

                <div
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase border flex items-center gap-2 ${
                    prediction.risk_category.includes('High')
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : prediction.risk_category.includes('Moderate')
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{prediction.risk_category}</span>
                </div>

                {prediction.hybrid_risk >= 0.60 && (
                  <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>REVIEW RECOMMENDED</span>
                  </div>
                )}
              </div>
            </div>

            {/* Model Comparison Breakdown */}
            <div className="py-6 border-b border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                MODEL RISK COMPARISON
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* XGBoost Classical */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">XGBoost Baseline</span>
                    <span className="font-mono">{Math.round(prediction.classical_risk * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, prediction.classical_risk * 100)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    High-capacity gradient boosted decision trees
                  </div>
                </div>

                {/* Quantum VQC */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-purple-300 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      <span>QML (VQC)</span>
                    </span>
                    <span className="font-mono">{Math.round(prediction.quantum_risk * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, prediction.quantum_risk * 100)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    Parameterized ansatz on top 4 selected features
                  </div>
                </div>

                {/* Hybrid Combined */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 bg-indigo-950/20">
                  <div className="flex items-center justify-between text-xs text-indigo-300">
                    <span className="font-bold">Hybrid Decision Score</span>
                    <span className="font-mono font-bold">{Math.round(prediction.hybrid_risk * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, prediction.hybrid_risk * 100)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-emerald-400/80 mt-2">
                    Ensemble probability calibrated with uncertainty bounds
                  </div>
                </div>
              </div>
            </div>

            {/* Explainable AI: Why this prediction? (SHAP attribution bars) */}
            <div className="py-6 border-b border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    WHY THIS PREDICTION? (SHAP BIOMARKER ATTRIBUTIONS)
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Factors driving predicted risk score (not biological causation)
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {prediction.contributing_factors.slice(0, 5).map((f) => {
                  const isPositive = f.importance_value >= 0;
                  const barWidth = Math.min(100, Math.max(12, Math.abs(f.importance_value) * 110));
                  return (
                    <div key={f.feature} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-200">{f.feature}</span>
                          <span className="text-[11px] text-slate-400">
                            (Observed: <strong className="text-slate-200">{f.patient_value ?? 'Standard'}</strong>)
                          </span>
                        </div>
                        <span
                          className={`font-mono text-[11px] font-semibold ${
                            isPositive ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isPositive ? `+${f.importance_value}` : f.importance_value}
                        </span>
                      </div>

                      {/* Attribution Bar */}
                      <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      <div className="mt-1 text-[11px] text-slate-400">
                        {f.clinical_note}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Model & Uncertainty Status */}
            <div className="py-6 border-b border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                MODEL & RUNTIME STATUS
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-500 text-[11px]">Classical Model</div>
                  <div className="font-bold text-emerald-400 mt-0.5">READY (XGBoost)</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-500 text-[11px]">Quantum Simulator</div>
                  <div className="font-bold text-emerald-400 mt-0.5">READY (AerSimulator)</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-500 text-[11px]">Hybrid Model</div>
                  <div className="font-bold text-emerald-400 mt-0.5">READY ({prediction.model_version})</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-500 text-[11px]">Epistemic Uncertainty</div>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {prediction.confidence} ({prediction.uncertainty_score})
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Actions */}
            <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Recommended Action: </span>
                <span>{prediction.recommendation}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                >
                  Add Doctor Feedback
                </button>

                {prediction.alert && !prediction.alert.acknowledged && (
                  <button
                    onClick={handleAcknowledge}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
                  >
                    Acknowledge Alert
                  </button>
                )}

                <button
                  onClick={() => {
                    setActionSuccess('Case escalated to senior clinical multidisciplinary team.');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
                >
                  Escalate Case
                </button>
              </div>
            </div>
          </div>

          {/* Inline Doctor Feedback Dialog Modal */}
          {feedbackOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="glass-panel-elevated rounded-2xl max-w-lg w-full p-6 border border-slate-700 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Clinician Risk Assessment Review</span>
                  </h3>
                  <button
                    onClick={() => setFeedbackOpen(false)}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitFeedback} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Concurrence with AI Risk Score:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'AGREE', label: 'Agree with Assessment' },
                        { id: 'PARTIAL', label: 'Partially Agree' },
                        { id: 'DISAGREE', label: 'Disagree' },
                        { id: 'NEEDS_REVIEW', label: 'Needs Further Review' },
                      ].map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setAgreement(opt.id as any)}
                          className={`p-2 rounded-lg text-center font-medium border transition-all ${
                            agreement === opt.id
                              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Clinical Notes & Recommendations:
                    </label>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="e.g. Risk score aligns with elevated hs-CRP and diastolic pressure. Scheduled for cardiovascular stress test."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Clinician Name:</label>
                    <input
                      type="text"
                      value={clinicianName}
                      onChange={(e) => setClinicianName(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                    <strong>Safety Notice:</strong> Feedback is archived in the research repository for review. It does not automatically retrain the production model.
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackOpen(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                    >
                      Save Clinical Feedback
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-500">
          Loading clinical patient risk assessment...
        </div>
      )}
    </div>
  );
};
