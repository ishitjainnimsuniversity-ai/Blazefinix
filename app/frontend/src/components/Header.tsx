import React from 'react';
import { Cpu, Bell, Activity, PlayCircle, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeModelVersion?: string;
  pendingAlertsCount: number;
  onRunDemo: () => void;
  isDemoRunning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeModelVersion = 'Hybrid-VQC-v1.0',
  pendingAlertsCount,
  onRunDemo,
  isDemoRunning = false
}) => {
  return (
    <header className="h-16 px-6 glass-panel border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-300 tracking-wider">SYSTEM MODE:</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            OFFLINE SIMULATOR
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Pipeline:</span>
          <span className="font-mono text-indigo-300 font-medium">{activeModelVersion}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Full Demo Trigger Button */}
        <button
          onClick={onRunDemo}
          disabled={isDemoRunning}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-sm hover:shadow-indigo-500/25 active:scale-95"
        >
          <PlayCircle className={`w-4 h-4 ${isDemoRunning ? 'animate-spin' : ''}`} />
          <span>{isDemoRunning ? 'Executing Demo Pipeline...' : 'Run Full Pipeline Demo'}</span>
        </button>

        {/* Alerts Notification Badge */}
        <div className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          {pendingAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
              {pendingAlertsCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-bold">
            MD
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-medium text-slate-200">Clinical Attending</div>
            <div className="text-[10px] text-slate-500">Research & Triage</div>
          </div>
        </div>
      </div>
    </header>
  );
};
