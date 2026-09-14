import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  ShieldCheck,
  FileCheck,
  Send
} from 'lucide-react';
import { DoctorFeedbackItem } from '../types';
import { fetchFeedbackList, fetchFeedbackSummary, submitDoctorFeedback } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const DoctorReviewPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<DoctorFeedbackItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [recordId, setRecordId] = useState('R-CAD-1042');
  const [agreement, setAgreement] = useState<'AGREE' | 'PARTIAL' | 'DISAGREE' | 'NEEDS_REVIEW'>('AGREE');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('Follow-up cardiovascular evaluation in 30 days');
  const [clinicianName, setClinicianName] = useState('Dr. Clinical Attending');
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        fetchFeedbackList(),
        fetchFeedbackSummary()
      ]);
      setFeedbacks(list);
      setSummary(sum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submitDoctorFeedback({
        record_id: recordId,
        agreement,
        clinical_notes: clinicalNotes || 'Assessment consistent with patient profile and risk factors.',
        recommended_action: recommendedAction,
        reviewer_name: clinicianName
      });
      setSubmitSuccess('Feedback securely logged to research database.');
      setClinicalNotes('');
      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Header */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              DOCTOR-IN-THE-LOOP
            </span>
            <span className="text-xs text-slate-400">Post-Market Clinical Surveillance</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Doctor Review & Feedback Governance</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Clinicians review AI-generated risk assessments. Assessments are stored in a designated research repository and NEVER silently modify production weights.
          </p>
        </div>
      </div>

      {/* Feedback Metrics Overview */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400">Total Reviews Completed</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {summary.total_reviews}
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400">Clinician Agreement Rate</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {summary.agreement_rate}%
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400">Partial Agreement</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {summary.partial_agreement_rate}%
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400">Disagreement / Escalations</div>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
              {summary.disagreement_rate}%
            </div>
          </div>
        </div>
      )}

      {/* Feedback Form & Recent Review Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Submit Doctor Review</span>
          </h2>

          {submitSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Patient / Record ID:</label>
              <input
                type="text"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5">Concurrence Status:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'AGREE', label: 'Agree' },
                  { id: 'PARTIAL', label: 'Partially Agree' },
                  { id: 'DISAGREE', label: 'Disagree' },
                  { id: 'NEEDS_REVIEW', label: 'Needs Review' },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setAgreement(opt.id as any)}
                    className={`p-2 rounded-lg text-center font-medium border transition-all ${
                      agreement === opt.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Clinical Evaluation Notes:</label>
              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Doctor commentary on risk validity, discordant biomarkers, or follow-up protocol."
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Action Plan:</label>
              <input
                type="text"
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Attending Clinician:</label>
              <input
                type="text"
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md active:scale-95"
              >
                Submit Clinical Review
              </button>
            </div>
          </form>
        </div>

        {/* Right 2 Columns: Audit Feedback History */}
        <div className="lg:col-span-2 glass-panel-elevated rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">Recent Clinical Feedback Log</h2>
            <span className="text-xs text-slate-400">{feedbacks.length} records archived</span>
          </div>

          <div className="mt-4 space-y-3">
            {feedbacks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No doctor feedback recorded yet. Submit the first clinical review on the left.
              </div>
            ) : (
              feedbacks.map((fb) => (
                <div
                  key={fb.feedback_id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{fb.record_id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          fb.agreement === 'AGREE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : fb.agreement === 'PARTIAL'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {fb.agreement}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px] font-mono">
                      {new Date(fb.reviewed_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-slate-300 italic">"{fb.clinical_notes}"</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Plan: {fb.recommended_action || 'Routine monitoring'}</span>
                    <span className="text-slate-400 font-medium">Reviewer: {fb.reviewer_name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
