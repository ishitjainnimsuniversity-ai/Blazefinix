import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Dna,
  Download,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { DataQualityAudit } from '../types';
import { fetchDatasets, fetchDatasetAudit, fetchNCBIGenomics, fetchNCBIRecords } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const DataQualityPage: React.FC = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState('cardiometabolic_cohort.csv');
  const [audit, setAudit] = useState<DataQualityAudit | null>(null);
  const [loading, setLoading] = useState(false);

  // NCBI Ingestion state
  const [ncbiAccession, setNcbiAccession] = useState('GCF_000001405.40');
  const [ncbiLoading, setNcbiLoading] = useState(false);
  const [ncbiResult, setNcbiResult] = useState<any>(null);
  const [ncbiHistory, setNcbiHistory] = useState<any[]>([]);

  useEffect(() => {
    loadDatasetsAndAudit();
    loadNCBIHistory();
  }, []);

  async function loadDatasetsAndAudit() {
    setLoading(true);
    try {
      const ds = await fetchDatasets();
      setDatasets(ds.datasets || []);
      const auditRes = await fetchDatasetAudit(selectedDataset);
      setAudit(auditRes);
    } catch (err) {
      console.error('Failed to load dataset audit:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDatasetSelect(name: string) {
    setSelectedDataset(name);
    setLoading(true);
    try {
      const auditRes = await fetchDatasetAudit(name);
      setAudit(auditRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadNCBIHistory() {
    try {
      const records = await fetchNCBIRecords();
      setNcbiHistory(records || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleFetchNCBI(e: React.FormEvent) {
    e.preventDefault();
    setNcbiLoading(true);
    try {
      const res = await fetchNCBIGenomics(ncbiAccession);
      setNcbiResult(res);
      await loadNCBIHistory();
    } catch (err) {
      console.error('NCBI fetch failed:', err);
    } finally {
      setNcbiLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Top Header */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              DATA VALIDATION ENGINE
            </span>
            <span className="text-xs text-slate-400">Strict Leakage & Hygiene Verification</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Clinical Data Quality & NCBI Genomics Ingestion
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Audits datasets for missingness, duplicates, outliers, and class balance.
            Enables direct retrieval of real reference genome metrics from the NCBI Datasets API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {datasets.map((d) => (
            <button
              key={d.name}
              onClick={() => handleDatasetSelect(d.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedDataset === d.name
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {d.name.replace('.csv', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Data Quality Report Cards (Section 6 Specification) */}
      {audit && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Score Card */}
            <div className="glass-panel rounded-xl p-5 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Data Quality Score</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-emerald-400">
                  {audit.quality_score}
                </span>
                <span className="text-slate-400 text-xs">/ 100</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-emerald-300">
                {audit.quality_grade}
              </div>
            </div>

            {/* Missing Values */}
            <div className="glass-panel rounded-xl p-5 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Missing Values</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-white">
                  {audit.missing_values_pct}%
                </span>
                <span className="text-slate-400 text-xs font-mono">({audit.missing_values_count} cells)</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Median imputation applied on train split
              </div>
            </div>

            {/* Duplicate Records */}
            <div className="glass-panel rounded-xl p-5 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Duplicate Records</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-white">
                  {audit.duplicate_records_pct}%
                </span>
                <span className="text-slate-400 text-xs font-mono">({audit.duplicate_records_count} rows)</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Unique patient ID isolation active
              </div>
            </div>

            {/* Class Balance */}
            <div className="glass-panel rounded-xl p-5 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Class Balance</div>
              <div className="mt-2 text-xl font-bold font-mono text-slate-200">
                {audit.class_balance_status}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Dist: {JSON.stringify(audit.class_distribution)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">
              <strong>Quality Recommendation:</strong> {audit.recommendation}
            </span>
          </div>
        </div>
      )}

      {/* NCBI Real Genome Sequencing API Integration Section */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Dna className="w-4 h-4 text-emerald-400" />
              <span>Real NCBI Genome Assembly & Sequencing Ingestion</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Queries official NCBI Datasets REST API for human genome assemblies and extracts structural metrics
            </p>
          </div>

          <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            NCBI API v2alpha
          </span>
        </div>

        {/* Query Input */}
        <form onSubmit={handleFetchNCBI} className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-slate-400 text-[11px] mb-1">NCBI Genome Assembly Accession:</label>
            <input
              type="text"
              value={ncbiAccession}
              onChange={(e) => setNcbiAccession(e.target.value)}
              placeholder="e.g. GCF_000001405.40 (GRCh38.p14)"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="self-end">
            <button
              type="submit"
              disabled={ncbiLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold shadow-md transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ncbiLoading ? 'animate-spin' : ''}`} />
              <span>{ncbiLoading ? 'Querying NCBI...' : 'Fetch NCBI Report'}</span>
            </button>
          </div>
        </form>

        {/* Display Fetched Genomic Attributes */}
        {ncbiResult && ncbiResult.features && (
          <div className="mt-5 p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30">
            <div className="text-xs font-bold text-emerald-400 mb-3 flex items-center justify-between">
              <span>Retrieved Reference: {ncbiResult.features.organism_name} ({ncbiResult.features.accession})</span>
              <span className="font-mono text-[11px] text-slate-400">TaxID: {ncbiResult.features.tax_id}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">GC PERCENT</div>
                <div className="text-white font-bold mt-0.5">{ncbiResult.features.gc_percent}%</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">CONTIG N50</div>
                <div className="text-white font-bold mt-0.5">{ncbiResult.features.contig_n50.toLocaleString()} bp</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">CODING GENES</div>
                <div className="text-white font-bold mt-0.5">{ncbiResult.features.coding_genes.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">BUSCO COMPLETENESS</div>
                <div className="text-emerald-400 font-bold mt-0.5">{ncbiResult.features.busco_completeness}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
