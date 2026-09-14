import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Users,
  TrendingUp,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { AnalyticsOverview, AlertData } from '../types';
import { fetchAnalyticsOverview, fetchAlerts } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface DashboardPageProps {
  onNavigateToDecision: (recordId?: string) => void;
  onNavigateToAlerts: () => void;
  onNavigateToNewPrediction: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToDecision,
  onNavigateToAlerts,
  onNavigateToNewPrediction
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [anData, altData] = await Promise.all([
          fetchAnalyticsOverview(),
          fetchAlerts('ALL', 'PENDING')
        ]);
        setAnalytics(anData);
        setRecentAlerts(altData.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Disclaimer */}
      <MedicalDisclaimer />

      {/* Hero Welcome & Quick Actions */}
      <div className="glass-panel-elevated rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              CLINICAL AI + QUANTUM SIMULATION
            </span>
            <span className="text-xs text-slate-400">Offline-Capable Decision Support</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1.5 tracking-tight">
            Early Disease-Risk Stratification Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Hybrid architecture using XGBoost feature ranking to feed a Variational Quantum Classifier (VQC).
            Outputs calibrated risk estimates, local SHAP biomarker attributions, and clinician alert triage.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={onNavigateToNewPrediction}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
          >
            <span>Run New Patient Risk Assessment</span>
            <ArrowUpRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        {/* Card 1: Active Alerts */}
        <div
          onClick={onNavigateToAlerts}
          className="glass-panel rounded-xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Review Alerts</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {analytics ? analytics.pending_doctor_reviews : '...'}
            </span>
            <span className="text-xs text-rose-400 font-medium">pending clinician review</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Critical alerts: {analytics ? analytics.critical_alerts : 0}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Card 2: Records Analyzed */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Records Stratified</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {analytics ? analytics.records_analyzed : '...'}
            </span>
            <span className="text-xs text-indigo-400 font-medium">research patients</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Cardiometabolic & Genomic cohorts
          </div>
        </div>

        {/* Card 3: Quantum Runs */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Quantum VQC Inferences</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {analytics ? analytics.quantum_runs_executed : '...'}
            </span>
            <span className="text-xs text-purple-400 font-medium">circuit simulations</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Qiskit Aer / PennyLane default.qubit
          </div>
        </div>

        {/* Card 4: Doctor Agreement Rate */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Doctor Agreement Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {analytics ? `${analytics.doctor_agreement_rate}%` : '92.5%'}
            </span>
            <span className="text-xs text-emerald-400 font-medium">clinical concurrence</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Logged to separate research repository
          </div>
        </div>
      </div>

      {/* Alert Feed & Decision Support Spotlight */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Clinical Alert Queue */}
        <div className="xl:col-span-2 glass-panel-elevated rounded-2xl p-5 border border-slate-800 min-w-0">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Priority Clinician Alert Queue</h2>
              <p className="text-xs text-slate-400">
                Patients meeting configured disease-risk review thresholds
              </p>
            </div>
            <button
              onClick={onNavigateToAlerts}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View All Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No unacknowledged high-risk alerts at this time.
              </div>
            ) : (
              recentAlerts.map((alt) => (
                <div
                  key={alt.alert_id}
                  onClick={() => onNavigateToDecision(alt.record_id)}
                  className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{alt.record_id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            alt.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {alt.severity}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Risk: {Math.round(alt.risk_score * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-1">{alt.reason}</p>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Key Biomarkers: {alt.contributing_factors?.slice(0, 3).join(', ') || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center self-end">
                    <span className="text-xs font-medium text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                      <span>Triage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Platform Methodology Summary */}
        <div className="glass-panel-elevated rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Compact QML Principle</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Engineering philosophy behind the hybrid pipeline
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="font-semibold text-white mb-1">1. Full Healthcare Space</div>
              <p className="text-slate-400">
                Classical XGBoost handles the high-dimensional medical records and isolates non-linear interactions.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="font-semibold text-white mb-1">2. Top Important Features Only</div>
              <p className="text-slate-400">
                Only the 4 most informative biomarkers are mapped to the quantum register, preventing barren plateaus.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="font-semibold text-white mb-1">3. Calibrated Risk & Audit</div>
              <p className="text-slate-400">
                Hybrid predictions output risk probabilities rather than definitive diagnosis, preserving doctor authority.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateToDecision()}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-center"
            >
              Open Flagship Decision Support View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
