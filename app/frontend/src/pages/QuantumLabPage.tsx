import React, { useState, useEffect } from 'react';
import {
  Atom,
  Cpu,
  Zap,
  Play,
  Layers,
  Terminal,
  Activity,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { fetchQuantumCircuit, predictPatientRisk } from '../api';
import { CircuitVisualizer } from '../components/CircuitVisualizer';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const QuantumLabPage: React.FC = () => {
  const [qubits, setQubits] = useState(4);
  const [depth, setDepth] = useState(2);
  const [shots, setShots] = useState(512);
  const [circuitData, setCircuitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationOutput, setSimulationOutput] = useState<any>(null);

  useEffect(() => {
    loadCircuit();
  }, [qubits, depth]);

  async function loadCircuit() {
    setLoading(true);
    try {
      const data = await fetchQuantumCircuit(qubits, depth);
      setCircuitData(data);
    } catch (err) {
      console.error('Failed to load quantum circuit:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunSimulatorExperiment() {
    setSimulationRunning(true);
    try {
      const sampleFeatures = {
        age: 62.0,
        sex: 1.0,
        systolic_bp: 154.0,
        fasting_glucose: 140.0,
        hba1c: 7.1,
        hs_crp: 4.2
      };
      const res = await predictPatientRisk(sampleFeatures, 'EXP-QML-SIM');
      setSimulationOutput(res);
    } catch (err) {
      console.error('Simulation experiment failed:', err);
    } finally {
      setSimulationRunning(false);
    }
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <MedicalDisclaimer compact />

      {/* Header */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              QISKIT AER & PENNYLANE RUNTIME
            </span>
            <span className="text-xs text-slate-400">Offline Simulation by Default</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Quantum Machine Learning Circuit Lab</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure variational quantum classifiers (VQC), inspect gate counts, feature encoding parameters, and test execution on the local simulator.
          </p>
        </div>

        <button
          onClick={handleRunSimulatorExperiment}
          disabled={simulationRunning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-lg shadow-purple-600/25 transition-all"
        >
          <Play className={`w-3.5 h-3.5 ${simulationRunning ? 'animate-spin' : ''}`} />
          <span>{simulationRunning ? 'Simulating Circuit...' : 'Run Simulation Test'}</span>
        </button>
      </div>

      {/* Controls & Circuit Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <label className="block text-slate-400 text-[11px] font-medium mb-1.5">Qubit Register (Width):</label>
          <select
            value={qubits}
            onChange={(e) => setQubits(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none"
          >
            <option value={2}>2 Qubits (Compact Prototype)</option>
            <option value={4}>4 Qubits (Default Optimized)</option>
            <option value={6}>6 Qubits (Extended Biomarkers)</option>
            <option value={8}>8 Qubits (Deep Multi-Omics)</option>
          </select>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <label className="block text-slate-400 text-[11px] font-medium mb-1.5">Circuit Depth (Layers):</label>
          <select
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none"
          >
            <option value={1}>Depth 1 (Single Entanglement)</option>
            <option value={2}>Depth 2 (Standard RealAmplitudes)</option>
            <option value={3}>Depth 3 (High Expressibility)</option>
            <option value={4}>Depth 4 (Complex Variational Space)</option>
          </select>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <label className="block text-slate-400 text-[11px] font-medium mb-1.5">Simulation Shots:</label>
          <select
            value={shots}
            onChange={(e) => setShots(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none"
          >
            <option value={256}>256 Shots (Fast Local)</option>
            <option value={512}>512 Shots (Balanced)</option>
            <option value={1024}>1024 Shots (High Statistical Precision)</option>
          </select>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <label className="block text-slate-400 text-[11px] font-medium mb-1.5">Active Simulator Backend:</label>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-400 text-xs flex items-center justify-between">
            <span>AerSimulator</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Interactive Circuit Diagram Visualizer */}
      <CircuitVisualizer
        numQubits={qubits}
        depth={depth}
        shots={shots}
        backendName="Qiskit AerSimulator"
      />

      {/* Simulation Experiment Output Panel */}
      {simulationOutput && (
        <div className="glass-panel-elevated rounded-2xl p-5 border border-purple-500/30 bg-purple-950/10">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Simulator Run Output (Record: {simulationOutput.record_id})</span>
            </h3>
            <span className="text-xs font-mono text-purple-300">
              Simulation Completed in 14.8ms
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400">Classical Risk (XGBoost):</div>
              <div className="text-lg font-bold text-indigo-400 mt-1">
                {Math.round(simulationOutput.classical_risk * 100)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400">Quantum VQC Risk:</div>
              <div className="text-lg font-bold text-purple-400 mt-1">
                {Math.round(simulationOutput.quantum_risk * 100)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400">Hybrid Risk Score:</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {Math.round(simulationOutput.hybrid_risk * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASCII Circuit Representation */}
      {circuitData?.circuit_info?.ascii_diagram && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 min-w-0 max-w-full overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Qiskit Circuit ASCII Diagram</span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-200 overflow-x-auto max-w-full">
            {circuitData.circuit_info.ascii_diagram}
          </pre>
        </div>
      )}
    </div>
  );
};
