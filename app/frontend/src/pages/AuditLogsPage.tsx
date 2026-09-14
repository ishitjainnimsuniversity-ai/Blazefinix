import React, { useState, useEffect } from 'react';
import { ShieldCheck, Filter, Clock, CheckCircle2 } from 'lucide-react';
import { AuditLog } from '../types';
import { fetchAuditLogs } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [roleFilter]);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await fetchAuditLogs(roleFilter);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              GOVERNANCE & COMPLIANCE
            </span>
            <span className="text-xs text-slate-400">Immutable Audit Trail</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">System & Clinical Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Cryptographically timestamped logs tracking patient predictions, alerts, doctor feedback submissions, and model lifecycle actions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="CLINICIAN">Clinician</option>
            <option value="RESEARCHER">Researcher</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      <div className="glass-panel-elevated rounded-2xl p-5 border border-slate-800">
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No audit records matching criteria.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.log_id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{log.action}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {log.user_role}
                      </span>
                      {log.record_id && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          Target: {log.record_id}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      {JSON.stringify(log.details)}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono sm:self-center self-end flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
