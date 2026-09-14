import React, { useState, useEffect } from 'react';
import { Users, FileText, ChevronRight, Search, Download } from 'lucide-react';
import { fetchPredictionHistory, getReportHtmlUrl, getReportPdfUrl, getDoctorReportPdfUrl, getPatientReportPdfUrl } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface PatientRecordsPageProps {
  onSelectRecord: (recordId: string) => void;
}

export const PatientRecordsPage: React.FC<PatientRecordsPageProps> = ({ onSelectRecord }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const hist = await fetchPredictionHistory();
        setRecords(hist);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = records.filter(
    (r) =>
      r.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.risk_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              PATIENT COHORT ARCHIVE
            </span>
            <span className="text-xs text-slate-400">De-identified Identifiers</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Evaluated Patient Records</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Historical repository of research predictions, hybrid risk probabilities, and model version assignments.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Record ID or Risk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="glass-panel-elevated rounded-2xl p-5 border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-semibold">Record ID</th>
                <th className="pb-3 font-semibold">Hybrid Risk</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Classical</th>
                <th className="pb-3 font-semibold">Quantum VQC</th>
                <th className="pb-3 font-semibold">Top Biomarker</th>
                <th className="pb-3 font-semibold">Model Version</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No evaluated patient records found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.prediction_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 font-bold text-white">{r.record_id}</td>
                    <td className="py-3 font-bold text-emerald-400">
                      {Math.round(r.hybrid_risk * 100)}%
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                          r.risk_category.includes('High')
                            ? 'bg-rose-500/20 text-rose-300'
                            : r.risk_category.includes('Moderate')
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {r.risk_category}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{Math.round(r.classical_risk * 100)}%</td>
                    <td className="py-3 text-purple-300">{Math.round(r.quantum_risk * 100)}%</td>
                    <td className="py-3 text-slate-300 font-sans">{r.top_factor}</td>
                    <td className="py-3 text-slate-500 text-[10px]">{r.model_version}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => onSelectRecord(r.record_id)}
                          className="px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <a
                          href={getReportPdfUrl(r.record_id)}
                          download={`clinical_decision_report_${r.record_id}.pdf`}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                          title="Download Clinical Decision Support PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>Clinical</span>
                        </a>
                        <a
                          href={getDoctorReportPdfUrl(r.record_id)}
                          download={`doctor_clinical_report_${r.record_id}.pdf`}
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                          title="Download Physician / Doctor Detailed PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>Doctor</span>
                        </a>
                        <a
                          href={getPatientReportPdfUrl(r.record_id)}
                          download={`patient_health_summary_${r.record_id}.pdf`}
                          className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                          title="Download Patient-Friendly Summary PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>Patient</span>
                        </a>
                        <a
                          href={getReportHtmlUrl(r.record_id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="View Printable Web Summary"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
