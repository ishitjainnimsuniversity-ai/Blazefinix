import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Award,
  TrendingUp,
  Clock,
  ShieldCheck,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { BenchmarkResult } from '../types';
import { fetchBenchmark, trainPipeline } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const ModelLabPage: React.FC = () => {
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [topK, setTopK] = useState(4);
  const [datasetName, setDatasetName] = useState('cardiometabolic_cohort.csv');
  const [trainingMessage, setTrainingMessage] = useState<string | null>(null);

  useEffect(() => {
    loadBenchmark();
  }, []);

  async function loadBenchmark() {
    setLoading(true);
    try {
      const data = await fetchBenchmark();
      setBenchmark(data);
    } catch (err) {
      console.error('Failed to load benchmark:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRetrain(e: React.FormEvent) {
    e.preventDefault();
    setRetraining(true);
    setTrainingMessage(null);
    try {
      await trainPipeline({
        dataset_name: datasetName,
        selected_features_count: topK,
        cv_folds: 5
      });
      setTrainingMessage('Research pipeline trained and evaluated on fresh cross-validation splits.');
      await loadBenchmark();
    } catch (err) {
      console.error(err);
      setTrainingMessage('Training failed: Verify dataset structure.');
    } finally {
      setRetraining(false);
    }
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <MedicalDisclaimer compact />

      {/* Header & Retrain Controls */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              RESEARCH BENCHMARK LAB
            </span>
            <span className="text-xs text-slate-400">Strict Identical Split Evaluation</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Classical vs Quantum vs Hybrid Benchmark Suite
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Empirical evaluation across linear, ensemble tree, and variational quantum circuits on identical patient-stratified test partitions.
          </p>
        </div>

        {/* Retraining Configuration Form */}
        <form onSubmit={handleRetrain} className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Cohort:</label>
            <select
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            >
              <option value="cardiometabolic_cohort.csv">Cardiometabolic (600 pts)</option>
              <option value="oncology_genomic_cohort.csv">Oncology & Genomic (500 pts)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Quantum Qubits (Top Features):</label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            >
              <option value={4}>4 Features (4 Qubits)</option>
              <option value={6}>6 Features (6 Qubits)</option>
              <option value={8}>8 Features (8 Qubits)</option>
            </select>
          </div>

          <div className="self-end">
            <button
              type="submit"
              disabled={retraining}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold shadow-md transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Training Models...' : 'Execute Benchmark'}</span>
            </button>
          </div>
        </form>
      </div>

      {trainingMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{trainingMessage}</span>
        </div>
      )}

      {/* Scientific Honesty Banner */}
      {benchmark && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-indigo-300">SCIENTIFIC FINDING & HONEST EVALUATION: </span>
            <span className="text-slate-300">{benchmark.scientific_summary}</span>
          </div>
        </div>
      )}

      {/* Benchmark Comparison Table */}
      <div className="glass-panel-elevated rounded-2xl p-5 border border-slate-800 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">Full Metric Performance Panel</h2>
            <p className="text-xs text-slate-400">Evaluated on identical test partition (n = {benchmark?.test_samples || 120})</p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4 min-w-0">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-semibold">Model Architecture</th>
                <th className="pb-3 font-semibold">Accuracy</th>
                <th className="pb-3 font-semibold text-emerald-400">Recall (Sens)</th>
                <th className="pb-3 font-semibold">Specificity</th>
                <th className="pb-3 font-semibold">F1 Score</th>
                <th className="pb-3 font-semibold text-indigo-400">ROC-AUC</th>
                <th className="pb-3 font-semibold">Train Time</th>
                <th className="pb-3 font-semibold">Inference</th>
                <th className="pb-3 font-semibold">Gen Gap</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {benchmark?.models_comparison.map((m) => (
                <tr key={m.model_name} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 font-sans font-medium text-slate-200 flex items-center gap-2">
                    {m.is_winner && <Award className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{m.model_name}</span>
                    {m.model_name.includes('Hybrid') && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        BEST HYBRID
                      </span>
                    )}
                    {m.model_name === 'XGBoost' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        BEST CLASSICAL
                      </span>
                    )}
                  </td>
                  <td className="py-3.5">{m.accuracy.toFixed(3)}</td>
                  <td className="py-3.5 font-bold text-emerald-400">{m.sensitivity.toFixed(3)}</td>
                  <td className="py-3.5">{m.specificity.toFixed(3)}</td>
                  <td className="py-3.5">{m.f1_score.toFixed(3)}</td>
                  <td className="py-3.5 font-bold text-indigo-300">{m.roc_auc.toFixed(3)}</td>
                  <td className="py-3.5 text-slate-400">{m.training_time}s</td>
                  <td className="py-3.5 text-slate-400">{m.inference_time_ms}ms</td>
                  <td className="py-3.5 text-slate-400">
                    {m.generalization_gap > 0 ? `+${m.generalization_gap.toFixed(3)}` : m.generalization_gap.toFixed(3)}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                        m.overfitting_status.includes('Healthy')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {m.overfitting_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Fold Stratified Cross Validation Grid */}
      {benchmark?.cross_validation && (
        <div className="glass-panel-elevated rounded-2xl p-5 border border-slate-800">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Stratified 5-Fold Cross-Validation Metrics (Mean ± Std)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Honest variance bounds derived from actual k-fold cross validation on training data
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">ROC-AUC (Mean ± Std)</div>
              <div className="text-lg font-bold font-mono text-indigo-300 mt-1">
                {benchmark.cross_validation.roc_auc_mean} ± {benchmark.cross_validation.roc_auc_std}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Sensitivity (Mean ± Std)</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {benchmark.cross_validation.sensitivity_mean} ± {benchmark.cross_validation.sensitivity_std}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Precision (Mean ± Std)</div>
              <div className="text-lg font-bold font-mono text-slate-200 mt-1">
                {benchmark.cross_validation.precision_mean} ± {benchmark.cross_validation.precision_std}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">F1 Score (Mean ± Std)</div>
              <div className="text-lg font-bold font-mono text-slate-200 mt-1">
                {benchmark.cross_validation.f1_mean} ± {benchmark.cross_validation.f1_std}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
