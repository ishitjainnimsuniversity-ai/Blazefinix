import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface MedicalDisclaimerProps {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>AI-generated risk assessment — not a final medical diagnosis. Clinical review required.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-slate-300 text-xs shadow-sm">
      <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-semibold text-amber-300">CLINICAL DECISION-SUPPORT NOTICE: </span>
        <span>
          This software generates an AI-driven, research-grade risk assessment and does not produce a definitive medical diagnosis.
          All predictions, quantum probability outputs, and alert recommendations must be validated by a qualified healthcare professional before taking any clinical action.
        </span>
      </div>
    </div>
  );
};
