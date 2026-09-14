import { SimulationVideoSection } from '../components/SimulationVideoSection';
import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Cpu,
  Atom,
  Dna,
  Camera,
  FileText,
  UserCheck,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  Database
} from 'lucide-react';

export const UserGuidePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('quickstart');

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="glass-panel p-6 border border-slate-800 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
            Clinical System Operating Manual
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          How to Use the Hybrid Classical-Quantum Clinical AI Model
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Comprehensive, easy-to-understand operational guide explaining every stage of the 5-tier architecture, live cancer genomic APIs, real patient cohort evaluation, and dual PDF report generation.
        </p>
      </div>

      {/* Mandatory Medical Disclaimer Banner */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-300 text-xs">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400" />
        <div>
          <b>MANDATORY MEDICAL DISCLAIMER:</b> AI-generated risk assessment — not a final medical diagnosis. Final clinical decision remains with a qualified healthcare professional. This platform provides computational decision support for clinical research and triage.
        </div>
      </div>

      {/* Navigation Pills for User Guide */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          onClick={() => setActiveSection('simulation_video')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'simulation_video'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-950/50'
              : 'text-purple-300 hover:text-white bg-purple-950/30 border border-purple-900/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          🎬 Simulation Video & Symbiosis
        </button>
        <button
          onClick={() => setActiveSection('quickstart')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSection === 'quickstart'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🚀 4-Step Quick Start
        </button>
        <button
          onClick={() => setActiveSection('how_model_works')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSection === 'how_model_works'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🧠 How the AI/QML Model Works
        </button>
        <button
          onClick={() => setActiveSection('cancer_genomics_guide')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSection === 'cancer_genomics_guide'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🧬 Live Cancer APIs & Patients
        </button>
        <button
          onClick={() => setActiveSection('vision_camera_guide')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSection === 'vision_camera_guide'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📷 Optical Camera & Vision Derm
        </button>
        <button
          onClick={() => setActiveSection('reading_results')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSection === 'reading_results'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 Reading Scores & Bloch Angles
        </button>
        <button
          onClick={() => setActiveSection('reports_guide')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSection === 'reports_guide'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📄 Doctor vs Patient PDF Reports
        </button>
      </div>

      {/* SECTION 0: SIMULATION VIDEO & ARCHITECTURAL SYMBIOSIS */}
      {activeSection === 'simulation_video' && (
        <div className="space-y-6 animate-fadeIn">
          <SimulationVideoSection />
        </div>
      )}

      {/* SECTION 1: 4-STEP QUICK START */}
      {activeSection === 'quickstart' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 border border-slate-800 rounded-2xl bg-slate-900/50 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Quick-Start Guide: Evaluating a Patient in 4 Simple Steps
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Whether you are an attending oncologist, researcher, or clinical assistant, here is how you can perform an end-to-end risk stratification in under 60 seconds:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-mono">1</span>
                  Select Patient or Cancer Type
                </div>
                <p className="text-xs text-slate-300">
                  Navigate to <b>"Cancer Genomics & APIs"</b> in the sidebar. Choose either the <b>Female Cohort</b> (Breast, Cervix, Ovary, Oral, Colorectum) or <b>Male Cohort</b> (Oral, Lung, Prostate, Stomach, Colorectum).
                </p>
                <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800/80">
                  💡 <i>Tip: You can also select from the 10 pre-loaded verified real patients from NCI GDC and cBioPortal!</i>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-mono">2</span>
                  Inspect Genomic DNA & Exon Architecture
                </div>
                <p className="text-xs text-slate-300">
                  The system queries the <b>Ensembl REST API</b> live to retrieve the chromosome coordinates and individual <b>Exon boundaries</b>. Click on driver genes (e.g., <code>TP53</code>, <code>BRCA1</code>, <code>EGFR</code>) to inspect them.
                </p>
                <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800/80">
                  💡 <i>Tip: Exons are the protein-coding units of DNA where mutations most frequently cause disease.</i>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center text-xs font-mono">3</span>
                  Run Hybrid AI/QML Inference
                </div>
                <p className="text-xs text-slate-300">
                  Click the gradient button <b>"Run Hybrid AI/QML Cancer Assessment"</b>. In milliseconds, the system runs XGBoost + AdaBoost on tabular biomarkers and executes a 4-Qubit Variational Quantum Circuit on key risk projections.
                </p>
                <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800/80">
                  💡 <i>Tip: The model outputs both a combined percentage (e.g. 95.0%) and individual quantum Bloch sphere angles!</i>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">4</span>
                  Download Dual PDF Reports
                </div>
                <p className="text-xs text-slate-300">
                  Click <b>"Download Doctor Dossier (PDF)"</b> for the comprehensive oncologist report with full genomic details, or <b>"Download Patient Summary (PDF)"</b> for an easy-to-understand explanation for the patient.
                </p>
                <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800/80">
                  💡 <i>Tip: Both reports are generated dynamically as publication-grade PDF documents ready for printing.</i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: HOW THE MODEL WORKS */}
      {activeSection === 'how_model_works' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 border border-slate-800 rounded-2xl bg-slate-900/50 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Inside the Engine: The 5-Stage Hybrid Architecture
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our clinical platform is grounded in our USP: <b>"Don't assume quantum advantage — measure it."</b> Here is the exact data flow through all 5 stages:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-400 font-mono">STAGE 1: Multi-Modal Data Ingestion</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Clean & Normalize</span>
                </div>
                <p className="text-xs text-slate-300">
                  Takes multi-modal inputs: clinical biomarkers (age, systolic/diastolic BP, fasting glucose, lipids, hs-CRP), genomic alterations (TP53, BRCA1/2, EGFR, KRAS), and optical skin spectrophotometry ($L^*a^*b^*$). Missing values are imputed without data leakage.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-400 font-mono">STAGE 2: Dual Boosting Ensemble (XGBoost + AdaBoost)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Classical ML</span>
                </div>
                <p className="text-xs text-slate-300">
                  XGBoost handles non-linear interactions across biomarkers, while AdaBoost refines decision boundaries on difficult edge cases. This outputs a robust tabular risk probability.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-pink-400 font-mono">STAGE 3: Dimensionality Reduction & Quantum Encoding</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">PCA / Latent Map</span>
                </div>
                <p className="text-xs text-slate-300">
                  The feature space is projected into 4 orthogonal latent dimensions preserving &gt;85% variance. Each dimension is mapped to parameterized rotation angles ($\theta_i, \phi_i$) for quantum register initialization.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-cyan-400 font-mono">STAGE 4: 4-Qubit Variational Quantum Classifier (VQC)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Qiskit Aer / PennyLane</span>
                </div>
                <p className="text-xs text-slate-300">
                  A parameterized quantum circuit applies interleaved single-qubit rotations ($R_Y, R_Z$) and CNOT entangling gates. Measuring the expectation value $\langle Z_0 \rangle$ evaluates the quantum state probability in high-dimensional Hilbert space.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-400 font-mono">STAGE 5: Calibrated Consensus & Clinician Decision Support</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Bayesian Combination</span>
                </div>
                <p className="text-xs text-slate-300">
                  Combines the classical prediction (60% weight) and quantum prediction (40% weight) using Bayesian calibration. Calculates epistemic uncertainty ($\pm \sigma$) and flags alerts if discordance or high risk is detected.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: LIVE CANCER GENOMICS & PATIENTS */}
      {activeSection === 'cancer_genomics_guide' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 border border-slate-800 rounded-2xl bg-slate-900/50 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Dna className="w-5 h-5 text-emerald-400" />
              Live Cancer APIs & Real Patient Cohort Guide
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              How the platform interfaces with live biomedical databases and how to use the data:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  NCI Genomic Data Commons (GDC)
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <b>What it does:</b> Fetches real patient cases, pathology stages (e.g. Stage IIA, Stage III), and histological diagnoses across TCGA cancer projects.<br/>
                  <b>How to use:</b> Browse the patient table in the left panel. Click <b>"Select"</b> on any patient row to target that patient's exact stage and age in the assessment engine.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                  cBioPortal for Cancer Genomics
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <b>What it does:</b> Fetches somatic mutations identified in real tumor studies. Shows exact amino acid alterations (e.g. <code>R175H</code>, <code>Q934*</code>) and genomic coordinates.<br/>
                  <b>How to use:</b> Review the right table to identify whether high-impact missense or nonsense driver mutations are active in that tumor.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  Ensembl REST API
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <b>What it does:</b> Resolves real human genome coordinates (GRCh38.p14) and visualizes the exon structure of driver genes.<br/>
                  <b>How to use:</b> Click on any gene button (e.g. <code>TP53</code>, <code>BRCA1</code>, <code>EGFR</code>). The green boxes show exons; hover over them to view start/end coordinates.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  ICGC-ARGO Data Harmonization
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <b>What it does:</b> Harmonizes clinical outcomes, progression-free survival (PFS), and international cancer donor schemas under GA4GH standards.<br/>
                  <b>How to use:</b> Ensures consistency between American (TCGA) and international cancer cohorts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: OPTICAL CAMERA & SKIN VISION DERM */}
      {activeSection === 'vision_camera_guide' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 border border-slate-800 rounded-2xl bg-slate-900/50 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400" />
              Optical Camera & CIE L*a*b* Skin Vision Colorimetry
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our platform uses real computer vision to analyze skin phototype without racial bias:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-white block mb-1">Step 1: Start Optical Webcam Feed</span>
                <p className="text-xs text-slate-400">
                  Navigate to <b>"Skin & Genomic Vision"</b> in the sidebar. Click <b>"Start Optical Camera"</b> and allow camera permissions in your browser.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-white block mb-1">Step 2: Center Skin ROI within Reticle</span>
                <p className="text-xs text-slate-400">
                  Align your cheek, forehead, or inner arm within the central circular reticle. Click <b>"Capture Frame & Analyze"</b> to run OpenCV colorimetry.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-white block mb-1">Step 3: Understand CIE L*a*b* & ITA Angle</span>
                <p className="text-xs text-slate-400">
                  The algorithm converts RGB to CIE L*a*b* and calculates the Individual Typology Angle:
                  <span className="block my-1 font-mono text-indigo-300 font-semibold text-center">
                    ITA° = [arctan((L* - 50) / b*) × 180] / π
                  </span>
                  This objectively classifies skin into Fitzpatrick Types I through VI without cultural or racial bias.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-white block mb-1">Step 4: Combine with Genomic Biomarkers</span>
                <p className="text-xs text-slate-400">
                  The skin phototype is merged with the patient's genomic profile to predict UV-induced melanoma risk and vitamin D synthesis capability.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: READING SCORES & BLOCH ANGLES */}
      {activeSection === 'reading_results' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 border border-slate-800 rounded-2xl bg-slate-900/50 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              How to Interpret Risk Tiers, Uncertainty & Bloch Angles
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Clear clinical guidelines on what each metric and visualization means:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-1">
                <div className="text-xs font-bold text-emerald-400 font-mono">LOW RISK (&lt; 25%)</div>
                <p className="text-[11px] text-slate-300">
                  Routine annual wellness screening. Standard healthy lifestyle maintenance.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-1">
                <div className="text-xs font-bold text-amber-400 font-mono">MODERATE RISK (25% – 45%)</div>
                <p className="text-[11px] text-slate-300">
                  Repeat biomarker panel in 3 months. Lifestyle interventions and non-invasive imaging.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/40 space-y-1">
                <div className="text-xs font-bold text-orange-400 font-mono">HIGH RISK (45% – 70%)</div>
                <p className="text-[11px] text-slate-300">
                  Specialist oncology consult within 3 weeks. Targeted gene sequencing (NGS panel).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/40 space-y-1">
                <div className="text-xs font-bold text-red-400 font-mono">CRITICAL RISK (&gt; 70%)</div>
                <p className="text-[11px] text-slate-300">
                  Immediate multidisciplinary tumor board review. Urgent staging CT/PET scan.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-4">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <Atom className="w-4 h-4 text-emerald-400" />
                What are the Quantum Bloch Sphere Coordinates (θ, φ)?
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                In quantum mechanics, a qubit's state is represented as a point on the surface of a unit sphere (the <b>Bloch sphere</b>). 
                The angles θ (polar angle) and φ (azimuthal phase) correspond to the relative contribution of each clinical biomarker projection:
                <span className="block my-1 font-mono text-emerald-300 font-semibold text-center">
                  |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩
                </span>
                When you see θ and φ for Qubits 0 through 3, you are viewing the physical quantum state of the patient's biomarkers encoded inside the quantum simulator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: DOCTOR VS PATIENT PDF REPORTS */}
      {activeSection === 'reports_guide' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 border border-slate-800 rounded-2xl bg-slate-900/50 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Doctor Dossier vs. Patient Summary: Which Report to Use?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              We generate two completely distinct, specialized PDF documents designed for different audiences:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <FileText className="w-4 h-4" />
                  Doctor Detailed Clinical Dossier
                </div>
                <div className="text-xs text-slate-300 space-y-1.5">
                  <div><b>Intended for:</b> Oncologists, genetic counselors, tumor board physicians.</div>
                  <div><b>Key sections:</b>
                    <ul className="list-disc pl-4 space-y-1 text-slate-400 mt-1">
                      <li>Full Ensembl genomic coordinate breakdown & canonical transcripts</li>
                      <li>cBioPortal driver mutations catalog (protein changes, locus, mutation types)</li>
                      <li>Dual boosting (XGBoost + AdaBoost) feature importance attributions</li>
                      <li>4-Qubit VQC expectation value, state fidelity, and entanglement entropy</li>
                      <li>Specific clinical recommendations and treatment directives</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <UserCheck className="w-4 h-4" />
                  Patient-Friendly Health Summary
                </div>
                <div className="text-xs text-slate-300 space-y-1.5">
                  <div><b>Intended for:</b> The patient and their family.</div>
                  <div><b>Key sections:</b>
                    <ul className="list-disc pl-4 space-y-1 text-slate-400 mt-1">
                      <li>Non-jargon, compassionate explanation of what the test evaluated</li>
                      <li>Clear visual risk tier (Low, Moderate, High, or Critical)</li>
                      <li>Suggested questions to ask their doctor at their next consultation</li>
                      <li>Actionable lifestyle, dietary, and preventive screening advice</li>
                      <li>Reassurance and guidance on next steps without causing panic</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
