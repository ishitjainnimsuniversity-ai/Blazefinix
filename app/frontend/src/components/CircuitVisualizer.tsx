import React from 'react';
import { Cpu, Zap, Layers } from 'lucide-react';

interface CircuitVisualizerProps {
  numQubits: number;
  depth: number;
  selectedFeatures?: string[];
  backendName?: string;
  shots?: number;
}

export const CircuitVisualizer: React.FC<CircuitVisualizerProps> = ({
  numQubits = 4,
  depth = 2,
  selectedFeatures = ['systolic_bp', 'fasting_glucose', 'hba1c', 'hs_crp'],
  backendName = 'Qiskit AerSimulator',
  shots = 512
}) => {
  const qubitIndices = Array.from({ length: numQubits }, (_, i) => i);
  const rowHeight = 44;
  const svgHeight = numQubits * rowHeight + 30;

  return (
    <div className="glass-panel-elevated rounded-2xl p-5 border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Variational Quantum Classifier Circuit Architecture</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Top informative biomarkers encoded via angle embedding into parameterized ansatz register
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
            {numQubits} Qubits
          </span>
          <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
            Depth: {depth}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
            {shots} Shots
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {backendName}
          </span>
        </div>
      </div>

      {/* SVG Interactive Circuit Layout */}
      <div className="overflow-x-auto py-4 min-w-0">
        <svg viewBox={`0 0 780 ${svgHeight}`} width="100%" className="w-full max-w-[780px] h-auto select-none font-mono min-w-[580px]">
          {/* Qubit Wire Tracks */}
          {qubitIndices.map((q) => {
            const y = 30 + q * rowHeight;
            const feat = selectedFeatures[q] || `x_${q}`;
            return (
              <g key={`wire-${q}`}>
                {/* Qubit Label and Feature Name */}
                <text x="10" y={y + 4} fill="#818cf8" fontSize="11" fontWeight="bold">
                  |q{q}⟩
                </text>
                <text x="44" y={y + 4} fill="#94a3b8" fontSize="10">
                  ({feat.slice(0, 11)})
                </text>

                {/* Wire Line */}
                <line x1="145" y1={y} x2="750" y2={y} stroke="#334155" strokeWidth="2" />

                {/* Layer 1: Hadamard Superposition */}
                <rect x="165" y={y - 14} width="28" height="28" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
                <text x="179" y={y + 4} fill="#e0e7ff" fontSize="11" fontWeight="bold" textAnchor="middle">
                  H
                </text>

                {/* Layer 2: Rz Feature Encoding */}
                <rect x="220" y={y - 14} width="40" height="28" rx="4" fill="#311042" stroke="#a855f7" strokeWidth="1.5" />
                <text x="240" y={y + 4} fill="#f3e8ff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Rz(x)
                </text>

                {/* Layer 3: Parameterized Ry Ansatz */}
                <rect x="360" y={y - 14} width="44" height="28" rx="4" fill="#042f2e" stroke="#14b8a6" strokeWidth="1.5" />
                <text x="382" y={y + 4} fill="#ccfbf1" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Ry(θ₁)
                </text>

                {/* Layer 4: Parameterized Ry Layer 2 */}
                <rect x="520" y={y - 14} width="44" height="28" rx="4" fill="#042f2e" stroke="#14b8a6" strokeWidth="1.5" />
                <text x="542" y={y + 4} fill="#ccfbf1" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Ry(θ₂)
                </text>

                {/* Measurement Gate */}
                <rect x="680" y={y - 14} width="32" height="28" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                <path d={`M ${688} ${y + 6} Q ${696} ${y - 6} ${704} ${y + 6} M ${696} ${y + 6} L ${702} ${y - 4}`} stroke="#38bdf8" strokeWidth="1.5" fill="none" />
              </g>
            );
          })}

          {/* Entanglement CNOT Bridges */}
          {qubitIndices.slice(0, numQubits - 1).map((q) => {
            const y1 = 30 + q * rowHeight;
            const y2 = 30 + (q + 1) * rowHeight;
            const xOffset = 300 + q * 18;
            const xOffset2 = 450 + q * 18;

            return (
              <g key={`entangle-${q}`}>
                {/* Stage 1 Entanglement */}
                <line x1={xOffset} y1={y1} x2={xOffset} y2={y2} stroke="#6366f1" strokeWidth="2" strokeDasharray="2 2" />
                <circle cx={xOffset} cy={y1} r="4" fill="#6366f1" />
                <circle cx={xOffset} cy={y2} r="9" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
                <line x1={xOffset - 5} y1={y2} x2={xOffset + 5} y2={y2} stroke="#6366f1" strokeWidth="1.5" />
                <line x1={xOffset} y1={y2 - 5} x2={xOffset} y2={y2 + 5} stroke="#6366f1" strokeWidth="1.5" />

                {/* Stage 2 Entanglement */}
                <line x1={xOffset2} y1={y1} x2={xOffset2} y2={y2} stroke="#14b8a6" strokeWidth="2" strokeDasharray="2 2" />
                <circle cx={xOffset2} cy={y1} r="4" fill="#14b8a6" />
                <circle cx={xOffset2} cy={y2} r="9" fill="#0f172a" stroke="#14b8a6" strokeWidth="2" />
                <line x1={xOffset2 - 5} y1={y2} x2={xOffset2 + 5} y2={y2} stroke="#14b8a6" strokeWidth="1.5" />
                <line x1={xOffset2} y1={y2 - 5} x2={xOffset2} y2={y2 + 5} stroke="#14b8a6" strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
            <span>H: Superposition</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-500" />
            <span>Rz(x): Feature Encoding</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-teal-500" />
            <span>Ry(θ): Variational Ansatz</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-sky-500" />
            <span>⟨Z⟩: Pauli Expectation</span>
          </div>
        </div>

        <div className="italic text-slate-400 text-[11px]">
          "We don't make the quantum computer process everything; we make it process what matters."
        </div>
      </div>
    </div>
  );
};
