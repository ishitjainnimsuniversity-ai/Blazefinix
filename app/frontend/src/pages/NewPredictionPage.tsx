import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Play,
  CheckCircle2,
  FileSpreadsheet,
  Cpu,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { DemoCase, PredictionResult } from '../types';
import { fetchDemoCases, predictPatientRisk } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface NewPredictionPageProps {
  onPredictionComplete: (pred: PredictionResult) => void;
}

export const NewPredictionPage: React.FC<NewPredictionPageProps> = ({
  onPredictionComplete
}) => {
  const [demoCases, setDemoCases] = useState<DemoCase[]>([]);
  const [recordId, setRecordId] = useState(`R-${Math.floor(100000 + Math.random() * 900000)}`);
  const [loading, setLoading] = useState(false);

  // Clinical feature inputs
  const [features, setFeatures] = useState<Record<string, number>>({
    age: 58.0,
    sex: 1.0,
    systolic_bp: 142.0,
    diastolic_bp: 88.0,
    fasting_glucose: 126.0,
    hba1c: 6.5,
    total_cholesterol: 228.0,
    hdl_cholesterol: 42.0,
    ldl_cholesterol: 145.0,
    triglycerides: 195.0,
    bmi: 29.4,
    resting_heart_rate: 76.0,
    smoking_status: 1.0,
    physical_activity_hours: 2.0,
    family_history_cad: 1.0,
    hs_crp: 3.2,
    egfr: 78.0
  });

  useEffect(() => {
    async function load() {
      try {
        const cases = await fetchDemoCases();
        setDemoCases(cases);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  function loadDemoProfile(demoCase: DemoCase) {
    setRecordId(demoCase.case_id);
    setFeatures({ ...demoCase.features });
  }

  function handleFeatureChange(key: string, val: number) {
    setFeatures((prev) => ({ ...prev, [key]: val }));
  }

  async function handleExecutePrediction(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const pred = await predictPatientRisk(features, recordId);
      onPredictionComplete(pred);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Header */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            CLINICAL INFERENCE ENGINE
          </span>
          <span className="text-xs text-slate-400">Hybrid Classical + VQC Simulation</span>
        </div>
        <h1 className="text-xl font-bold text-white mt-1">New Patient Risk Assessment</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Enter laboratory biomarkers or select a standardized synthetic research profile to evaluate disease risk.
        </p>

        {/* 1-Click Demo Profiles */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-300 block mb-2">
            Instant 1-Click Research Profiles:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {demoCases.map((c) => (
              <button
                key={c.case_id}
                type="button"
                onClick={() => loadDemoProfile(c)}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center justify-between">
                  <span>{c.label.split('(')[0]}</span>
                  <span className="text-[10px] font-mono text-slate-400">{c.expected_risk}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {c.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Clinical Biomarkers Form */}
      <form onSubmit={handleExecutePrediction} className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">Biomarkers & Clinical Covariates</h2>
            <p className="text-xs text-slate-400">All metrics are normalized and passed through the leakage-free preprocessor</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Record ID:</span>
            <input
              type="text"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Feature Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          {Object.entries(features).map(([key, val]) => (
            <div key={key} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <label className="block text-slate-400 font-mono text-[11px] mb-1">
                {key}
              </label>
              <input
                type="number"
                step="any"
                value={val}
                onChange={(e) => handleFeatureChange(key, parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 italic">
            XGBoost feature selection will automatically isolate the top 4 features for the quantum register.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Cpu className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Simulating Hybrid Pipeline...' : 'Generate AI Risk Prediction'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
