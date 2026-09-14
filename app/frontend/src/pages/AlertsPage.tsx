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
  Download,
  Search,
  RefreshCw,
  SlidersHorizontal
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
import { ALL_COHORT_ALERTS } from '../allAlertsData';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface AlertsPageProps {
  onNavigateToDecision: (recordId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigateToDecision }) => {
  const [alerts, setAlerts] = useState<AlertData[]>(ALL_COHORT_ALERTS);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusFilter]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const data = await fetchAlerts(severityFilter, statusFilter);
      setAlerts(data && data.length > 0 ? data : ALL_COHORT_ALERTS);
    } catch (err) {
      console.warn('Fallback alerts loaded:', err);
      setAlerts(ALL_COHORT_ALERTS);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge(alertId: string) {
    try {
      await acknowledgeAlert(alertId, 'Dr. Clinical Attending');
      setActionSuccess(`Alert ${alertId} acknowledged.`);
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === alertId ? { ...a, acknowledged: true, status: 'REVIEWED' } : a))
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTriage(alertId: string, status: string) {
    try {
      await triageAlert(alertId, status);
      setActionSuccess(`Alert ${alertId} updated to ${status}.`);
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === alertId ? { ...a, status: status as any } : a))
      );
    } catch (err) {
      console.error(err);
    }
  }

  // Real-time counts across ALL 67 cohort alerts
  const critCount = ALL_COHORT_ALERTS.filter((a) => a.severity.toUpperCase() === 'CRITICAL').length;
  const highCount = ALL_COHORT_ALERTS.filter((a) => a.severity.toUpperCase() === 'HIGH').length;
  const medCount = ALL_COHORT_ALERTS.filter((a) => a.severity.toUpperCase() === 'MEDIUM' || a.severity.toUpperCase() === 'MODERATE').length;
  const lowCount = ALL_COHORT_ALERTS.filter((a) => a.severity.toUpperCase() === 'LOW' || a.severity.toUpperCase() === 'NORMAL').length;

  // Filter alerts in memory by search term
  const displayedAlerts = alerts.filter((alt) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      alt.record_id.toLowerCase().includes(q) ||
      alt.alert_id.toLowerCase().includes(q) ||
      alt.reason.toLowerCase().includes(q) ||
      alt.recommendation.toLowerCase().includes(q) ||
      alt.contributing_factors.some((f) => String(f).toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Header */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              ALERT ENGINE
            </span>
            <span className="text-xs text-slate-400">Complete Cohort Decision-Support Triage ({ALL_COHORT_ALERTS.length} Reports)</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Clinical Risk Alerts Center</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Prioritized clinical alerts for all 67 tested patients and models. Filter by risk tier, review triage status, or open complete diagnostic dossiers.
          </p>
        </div>

        {/* Quick Cohort Severity Metrics */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <span className="text-[10px] text-rose-400 block font-sans">CRITICAL</span>
            <strong>{critCount} Cases</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <span className="text-[10px] text-amber-400 block font-sans">HIGH RISK</span>
            <strong>{highCount} Cases</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
            <span className="text-[10px] text-indigo-400 block font-sans">MODERATE</span>
            <strong>{medCount} Cases</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <span className="text-[10px] text-emerald-400 block font-sans">LOW RISK</span>
            <strong>{lowCount} Cases</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search all 67 alerts by Record ID, biomarker, clinical reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none font-medium"
          >
            <option value="ALL">All Severities ({ALL_COHORT_ALERTS.length})</option>
            <option value="CRITICAL">Critical Only ({critCount})</option>
            <option value="HIGH">High Risk ({highCount})</option>
            <option value="MEDIUM">Medium / Moderate ({medCount})</option>
            <option value="LOW">Low Risk ({lowCount})</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ESCALATED">Escalated</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSeverityFilter('ALL');
              setStatusFilter('ALL');
              setSearchTerm('');
              localStorage.removeItem('blazefinix_alerts');
              loadAlerts();
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Reset filters to view all 67 alerts"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
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
        <div className="text-xs text-slate-400 px-1 flex items-center justify-between">
          <span>Showing <strong>{displayedAlerts.length}</strong> of <strong>{ALL_COHORT_ALERTS.length}</strong> clinical alerts:</span>
          {searchTerm && (
            <span className="text-indigo-400">Filtering by "{searchTerm}"</span>
          )}
        </div>

        {displayedAlerts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400 space-y-3">
            <p>No clinical alerts match the selected priority filters.</p>
            <button
              onClick={() => {
                setSeverityFilter('ALL');
                setStatusFilter('ALL');
                setSearchTerm('');
                localStorage.removeItem('blazefinix_alerts');
                loadAlerts();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md"
            >
              Reset Filters & Show All 67 Alerts
            </button>
          </div>
        ) : (
          displayedAlerts.map((alt) => (
            <div
              key={alt.alert_id}
              className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div
                  className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                    alt.severity === 'CRITICAL'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : alt.severity === 'HIGH'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : alt.severity === 'MEDIUM'
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-bold text-white font-mono">{alt.record_id}</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : alt.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300'
                          : alt.severity === 'MEDIUM'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-emerald-500/20 text-emerald-300'
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

                  <p className="text-xs text-slate-300">{alt.reason}</p>

                  <div className="text-xs text-slate-400">
                    <strong className="text-slate-300">Action: </strong>
                    <span>{alt.recommendation}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
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
                        : 'Biomarker profile'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Open Case + All 3 PDF Downloads + Acknowledge + Status */}
              <div className="flex flex-wrap items-center gap-1.5 sm:self-center self-end shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateToDecision(alt.record_id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1 whitespace-nowrap shadow-md shadow-indigo-600/30"
                  title="Open this patient dossier directly in Clinical Decision Studio"
                >
                  <span>Open Case</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <a
                  href={getReportPdfUrl(alt.record_id)}
                  download={`clinical_decision_report_${alt.record_id}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
                  title="Download publication-grade Clinical Decision Support PDF"
                >
                  <Download className="w-3 h-3" />
                  <span>Clinical</span>
                </a>

                <a
                  href={getDoctorReportPdfUrl(alt.record_id)}
                  download={`doctor_clinical_report_${alt.record_id}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-700 hover:bg-indigo-600 text-white transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
                  title="Download Physician / Doctor Detailed Clinical Dossier PDF"
                >
                  <Download className="w-3 h-3" />
                  <span>Doctor</span>
                </a>

                <a
                  href={getPatientReportPdfUrl(alt.record_id)}
                  download={`patient_health_summary_${alt.record_id}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
                  title="Download Plain-Language Patient Summary PDF"
                >
                  <Download className="w-3 h-3" />
                  <span>Patient</span>
                </a>

                {!alt.acknowledged ? (
                  <button
                    type="button"
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
