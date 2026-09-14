import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  ChevronRight,
  Download
} from 'lucide-react';
import { AlertData } from '../types';
import {
  fetchAlerts,
  acknowledgeAlert,
  triageAlert,
  getReportPdfUrl,
  getDoctorReportPdfUrl,
  getPatientReportPdfUrl
} from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface AlertsPageProps {
  onNavigateToDecision: (recordId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigateToDecision }) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusFilter]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const data = await fetchAlerts(severityFilter, statusFilter);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge(alertId: string) {
    try {
      await acknowledgeAlert(alertId, 'Dr. Clinical Attending');
      setActionSuccess(`Alert ${alertId} acknowledged.`);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTriage(alertId: string, status: string) {
    try {
      await triageAlert(alertId, status);
      setActionSuccess(`Alert ${alertId} updated to ${status}.`);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Header */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              ALERT ENGINE
            </span>
            <span className="text-xs text-slate-400">Decision-Support Review Triage</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Clinical Risk Alerts Center</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Prioritized clinical alerts triggered by elevated hybrid risk scores, high epistemic uncertainty, or critical biomarker threshold violations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium / Moderate</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ESCALATED">Escalated</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Alert Cards List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-500">
            No clinical alerts match the selected priority filters.
          </div>
        ) : (
          alerts.map((alt) => (
            <div
              key={alt.alert_id}
              className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl mt-0.5 ${
                    alt.severity === 'CRITICAL'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : alt.severity === 'HIGH'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-bold text-white font-mono">{alt.record_id}</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : alt.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Risk: {Math.round(alt.risk_score * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ID: {alt.alert_id}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5">{alt.reason}</p>

                  <div className="text-xs text-slate-400 mt-1">
                    <strong className="text-slate-300">Action: </strong>
                    <span>{alt.recommendation}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span>
                      Contributing:{' '}
                      {Array.isArray(alt.contributing_factors) && alt.contributing_factors.length > 0
                        ? alt.contributing_factors
                            .slice(0, 3)
                            .map((f: any) =>
                              typeof f === 'string'
                                ? f
                                : `${f.feature || ''}${f.patient_value ? ` (${f.patient_value})` : ''}`
                            )
                            .join(', ')
                        : 'General profile'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 sm:self-center self-end">
                <button
                  onClick={() => onNavigateToDecision(alt.record_id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Open Case</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <a
                  href={getReportPdfUrl(alt.record_id)}
                  download={`clinical_decision_report_${alt.record_id}.pdf`}
                  className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
                  title="Download Clinical Decision Support PDF"
                >
                  <Download className="w-3 h-3" />
                  <span>Clinical</span>
                </a>

                <a
                  href={getDoctorReportPdfUrl(alt.record_id)}
                  download={`doctor_clinical_report_${alt.record_id}.pdf`}
                  className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-700 hover:bg-indigo-600 text-white transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
                  title="Download Physician / Doctor Detailed PDF"
                >
                  <Download className="w-3 h-3" />
                  <span>Doctor</span>
                </a>

                <a
                  href={getPatientReportPdfUrl(alt.record_id)}
                  download={`patient_health_summary_${alt.record_id}.pdf`}
                  className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
                  title="Download Patient-Friendly Summary PDF"
                >
                  <Download className="w-3 h-3" />
                  <span>Patient</span>
                </a>

                {!alt.acknowledged ? (
                  <button
                    onClick={() => handleAcknowledge(alt.alert_id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all whitespace-nowrap"
                  >
                    Acknowledge
                  </button>
                ) : (
                  <span className="text-[11px] px-2 py-1.5 rounded bg-slate-900 text-emerald-400 border border-slate-800 flex items-center gap-1 whitespace-nowrap">
                    <Check className="w-3 h-3" />
                    <span>Acknowledged</span>
                  </span>
                )}

                <select
                  value={alt.status}
                  onChange={(e) => handleTriage(alt.alert_id, e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="REVIEWED">REVIEWED</option>
                  <option value="ESCALATED">ESCALATED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
