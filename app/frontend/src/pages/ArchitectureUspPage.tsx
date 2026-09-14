import React, { useState, useEffect } from 'react';
import {
  Layers,
  Database,
  Filter,
  BarChart3,
  Cpu,
  Search,
  Target,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Coins,
  Shield,
  HeartHandshake,
  Globe,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Zap,
  ChevronRight,
  Sliders,
  Award
} from 'lucide-react';
import { fetchArchitectureUsp } from '../api';
import { ArchitectureUspData } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { SimulationVideoSection } from '../components/SimulationVideoSection';

export const ArchitectureUspPage: React.FC = () => {
  const [data, setData] = useState<ArchitectureUspData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'simulation' | 'both' | 'slide4' | 'slide5'>('simulation');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetchArchitectureUsp();
      setData(res);
    } catch (err) {
      console.error('Failed to load architecture USP data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Helper to render icons for the 5 pipeline stages
  function getStageIcon(iconName: string) {
    switch (iconName) {
      case 'Database':
        return <Database className="w-5 h-5 text-sky-400" />;
      case 'Filter':
        return <Filter className="w-5 h-5 text-indigo-400" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5 text-purple-400" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-emerald-400" />;
      case 'Search':
        return <Search className="w-5 h-5 text-amber-400" />;
      default:
        return <Layers className="w-5 h-5 text-sky-400" />;
    }
  }

  // Helper to render icons for the 4 pillars
  function getPillarIcon(pillarId: string) {
    switch (pillarId) {
      case 'cost_effectiveness':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'privacy_security':
        return <Shield className="w-5 h-5 text-sky-400" />;
      case 'healthcare_impact':
        return <HeartHandshake className="w-5 h-5 text-emerald-400" />;
      case 'national_scalability':
        return <Globe className="w-5 h-5 text-purple-400" />;
      default:
        return <Award className="w-5 h-5 text-slate-400" />;
    }
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <MedicalDisclaimer compact />

      {/* Main Header & View Mode Switcher */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-gradient-to-r from-sky-500/20 to-purple-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> HYBRID AI / QML ARCHITECTURE & STRATEGY
            </span>
            <span className="text-xs text-slate-400">Clinical Cancer Risk Prediction Platform</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-1.5 tracking-tight">
            Hybrid Classical-Quantum Architecture, USP & Scalability
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            A practical, efficient and explainable pipeline combining XGBoost gradient boosted trees with Parameterized Variational Quantum Classifiers (VQC) for early oncologic risk detection.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex flex-wrap items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'simulation'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-950/50'
                : 'text-purple-400 hover:text-white bg-purple-950/30 border border-purple-900/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            🎬 Simulation Video
          </button>
          <button
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'both'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All & Overview
          </button>
          <button
            onClick={() => setActiveTab('slide4')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'slide4'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4. Architecture & USP
          </button>
          <button
            onClick={() => setActiveTab('slide5')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'slide5'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5. Impact & Scalability
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HYBRID QUANTUM-CLASSICAL SIMULATION VIDEO SECTION                          */}
      {/* ========================================================================= */}
      {(activeTab === 'simulation' || activeTab === 'both') && (
        <SimulationVideoSection />
      )}

      {/* ========================================================================= */}
      {/* SLIDE 4: HYBRID AI / QML ARCHITECTURE + USP                               */}
      {/* ========================================================================= */}
      {(activeTab === 'both' || activeTab === 'slide4') && (
        <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 space-y-6">
          
          {/* Header Tag */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-indigo-900/40">
                4
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {data?.title_slide4 || 'Hybrid AI/QML Architecture + USP'}
                </h2>
                <p className="text-xs text-slate-400">
                  {data?.subtitle_slide4 || 'A practical, efficient and explainable pipeline for cancer risk prediction'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-800/80">
              5-STAGE PIPELINE
            </span>
          </div>

          {/* 5-Stage Pipeline Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {data?.pipeline_stages.map((stage, idx) => (
              <div
                key={stage.step}
                className="glass-panel rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between relative group hover:shadow-xl hover:shadow-indigo-950/20"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center justify-center font-mono">
                      {stage.step}
                    </span>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {getStageIcon(stage.icon)}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-white mb-0.5 leading-snug">
                    {stage.title}
                  </h3>
                  <div className="text-[10px] text-indigo-400 font-medium mb-3">
                    {stage.subtitle}
                  </div>

                  {/* Bullet points */}
                  <ul className="space-y-1.5">
                    {stage.points.map((pt, pIdx) => (
                      <li key={pIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-tight">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sub-label tag */}
                <div className="mt-4 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Stage {stage.step} of 5
                </div>
              </div>
            ))}
          </div>

          {/* OUR USP CARD */}
          <div className="glass-panel rounded-xl p-5 border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              {/* USP Quote */}
              <div className="flex items-start gap-3.5 max-w-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-950/50">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
                    OUR CORE UNIQUE SELLING PROPOSITION (USP)
                  </div>
                  <div className="text-base font-extrabold text-white mt-0.5 italic">
                    &ldquo;{data?.usp_quote || "Don't assume quantum advantage – measure it."}&rdquo;
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    We benchmark classical and quantum models on identical patient-stratified test partitions to rigorously validate real clinical utility.
                  </p>
                </div>
              </div>

              {/* USP 4 Checkmarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full lg:w-auto">
                {(data?.usp_bullets || [
                  "Hybrid approach: best of classical + quantum",
                  "Efficient feature processing",
                  "Explainable and uncertainty-aware predictions",
                  "Designed for real-world healthcare use"
                ]).map((bullet, bIdx) => (
                  <div
                    key={bIdx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-indigo-500/20 text-xs font-medium text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 5: COST-EFFECTIVENESS, VALIDATION, IMPACT & SCALABILITY             */}
      {/* ========================================================================= */}
      {(activeTab === 'both' || activeTab === 'slide5') && (
        <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 space-y-6">
          
          {/* Header Tag */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-emerald-900/40">
                5
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {data?.title_slide5 || 'Cost-Effectiveness, Validation, Impact & Scalability'}
                </h2>
                <p className="text-xs text-slate-400">
                  {data?.subtitle_slide5 || 'From prototype to real-world impact, for one cancer and beyond'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/80">
              CLINICAL VALIDATION
            </span>
          </div>

          {/* Model Comparison & Evaluation Metrics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Interactive Model Comparison Bar Chart (XGBoost vs VQC vs Hybrid) */}
            <div className="lg:col-span-8 glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Model Comparison (Illustrative Empirical Benchmark)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comparing Classical XGBoost, Parameterized Quantum VQC, and Calibrated Hybrid Stacking:
                  </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-sky-500" />
                    <span className="text-slate-300 font-medium">XGBoost</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-purple-500" />
                    <span className="text-slate-300 font-medium">VQC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-emerald-400 font-bold">Hybrid (Ours)</span>
                  </div>
                </div>
              </div>

              {/* 4 Metric Groups: Accuracy, Precision, Recall, F1-Score */}
              <div className="space-y-4 pt-1">
                {(data?.metrics_comparison || [
                  { metric: 'Accuracy', xgboost: 0.82, vqc: 0.78, hybrid: 0.87, description: '+5.0% performance lift from quantum-classical ensemble synergy' },
                  { metric: 'Precision', xgboost: 0.80, vqc: 0.75, hybrid: 0.85, description: 'Reduces false positive biopsies and unnecessary clinical interventions' },
                  { metric: 'Recall', xgboost: 0.78, vqc: 0.72, hybrid: 0.83, description: 'Catches early-stage malignant alterations and subtle mutations' },
                  { metric: 'F1-Score', xgboost: 0.79, vqc: 0.74, hybrid: 0.84, description: 'Optimal harmonic balance across imbalanced clinical screening cohorts' }
                ]).map((pt) => {
                  return (
                    <div key={pt.metric} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="flex justify-between items-center text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{pt.metric}</span>
                          <span className="text-[10px] text-slate-400">{pt.description}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="text-sky-400">XGB: {pt.xgboost.toFixed(2)}</span>
                          <span className="text-purple-400">VQC: {pt.vqc.toFixed(2)}</span>
                          <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            Hybrid: {pt.hybrid.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* 3 Comparative Bars */}
                      <div className="space-y-1.5">
                        {/* Hybrid (Ours) */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-400 w-20">Hybrid (Ours)</span>
                          <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                              style={{ width: `${pt.hybrid * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-300 w-10 text-right">
                            {(pt.hybrid * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* XGBoost */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-sky-400 w-20">XGBoost</span>
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full transition-all duration-700"
                              style={{ width: `${pt.xgboost * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-sky-300 w-10 text-right">
                            {(pt.xgboost * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* VQC */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-purple-400 w-20">VQC</span>
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-700"
                              style={{ width: `${pt.vqc * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-purple-300 w-10 text-right">
                            {(pt.vqc * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Other Evaluation Metrics Panel */}
            <div className="lg:col-span-4 glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  Other Evaluation Metrics
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive statistical discrimination & calibration
                </p>
              </div>

              <div className="space-y-3">
                {(data?.other_metrics || [
                  { name: 'ROC-AUC', description: 'Area under receiver operating characteristic curve', xgboost_val: '0.86', vqc_val: '0.81', hybrid_val: '0.91' },
                  { name: 'Sensitivity / Specificity', description: 'True positive rate vs true negative discrimination', xgboost_val: '78% / 84%', vqc_val: '72% / 81%', hybrid_val: '83% / 89%' },
                  { name: 'Calibration', description: 'Expected Calibration Error (ECE) for reliable probability outputs', xgboost_val: '0.082', vqc_val: '0.095', hybrid_val: '0.041' },
                  { name: 'Uncertainty Estimation', description: 'Quantifies model disagreement & edge-case flagging', xgboost_val: 'Heuristic', vqc_val: 'Shot variance', hybrid_val: '±0.082' }
                ]).map((m, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white">{m.name}</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        {m.hybrid_val}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{m.description}</p>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2 pt-1 border-t border-slate-800/50">
                      <span>XGB: {m.xgboost_val}</span>
                      <span>VQC: {m.vqc_val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 4 Pillars Grid: Cost-Effectiveness, Privacy, Healthcare Impact, National Scalability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(data?.pillars || [
              {
                id: 'cost_effectiveness',
                title: 'Cost-Effectiveness',
                bullets: [
                  'Use small, optimized quantum circuits',
                  'Leverage cloud quantum platforms (no hardware cost)',
                  'Efficient hybrid design'
                ]
              },
              {
                id: 'privacy_security',
                title: 'Privacy & Security',
                bullets: [
                  'Handle sensitive patient data securely',
                  'Follow data privacy standards',
                  'Federated / secure learning (future scope)'
                ]
              },
              {
                id: 'healthcare_impact',
                title: 'Healthcare Impact',
                bullets: [
                  'Early risk prediction',
                  'Personalized treatment support',
                  'Improved clinical decision-making',
                  'Better patient outcomes'
                ]
              },
              {
                id: 'national_scalability',
                title: 'National Scalability',
                bullets: [
                  'Start with one cancer (e.g., breast cancer)',
                  'Extend to other cancers using same architecture',
                  'Support national cancer control efforts'
                ]
              }
            ]).map((pillar) => (
              <div
                key={pillar.id}
                className="glass-panel rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {getPillarIcon(pillar.id)}
                  </div>
                  <h4 className="text-xs font-bold text-white">{pillar.title}</h4>
                </div>

                <ul className="space-y-1.5 pt-1">
                  {pillar.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* National Scalability Roadmap Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 text-center space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-emerald-300">
              <span className="px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700">One cancer</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span className="px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700">Validated platform</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span className="px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700">Other cancers</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span className="px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700">National cancer decision-support ecosystem</span>
            </div>
            <div className="text-xs font-semibold text-slate-300 tracking-wide">
              {data?.tagline || 'Practical. Scalable. Impactful. For a healthier nation.'}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
export default ArchitectureUspPage;
