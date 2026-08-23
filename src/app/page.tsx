import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/60 p-10 shadow-2xl backdrop-blur-md">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          LOOP Backend & AI Services Online
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          LOOP Intelligence Platform
        </h1>

        <p className="mt-4 text-lg text-slate-400">
          Autonomous AI Customer-Feedback Intelligence Layer, Semantic Vector Retrieval, Voice-of-Customer Reports, and Multi-Tenant Engine.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200">Feedback Engine</h3>
            <p className="mt-1 text-xs text-slate-400">
              CRUD, pagination, multi-criteria filtering, and keyword search.
            </p>
            <code className="mt-3 block text-[11px] text-indigo-400">GET /api/feedback</code>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200">AI Classification</h3>
            <p className="mt-1 text-xs text-slate-400">
              Claude sentiment scoring, theme clustering & rationales.
            </p>
            <code className="mt-3 block text-[11px] text-indigo-400">POST /api/feedback</code>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200">Ask LOOP</h3>
            <p className="mt-1 text-xs text-slate-400">
              Vector semantic search with grounded context & citations.
            </p>
            <code className="mt-3 block text-[11px] text-indigo-400">POST /api/ask-loop</code>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200">CSV Bulk Ingestion</h3>
            <p className="mt-1 text-xs text-slate-400">
              Granular row validation, error accounting & AI enrichment.
            </p>
            <code className="mt-3 block text-[11px] text-indigo-400">POST /api/ingest/csv</code>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200">Spike Detection</h3>
            <p className="mt-1 text-xs text-slate-400">
              Explainable statistical surge detection over theme baselines.
            </p>
            <code className="mt-3 block text-[11px] text-indigo-400">GET /api/analytics/spikes</code>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200">VOC Reports</h3>
            <p className="mt-1 text-xs text-slate-400">
              Automated executive summaries with statistical grounding.
            </p>
            <code className="mt-3 block text-[11px] text-indigo-400">GET /api/reports/voc</code>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/api/analytics/dashboard"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            Explore Dashboard KPIs
          </Link>
          <Link
            href="/api/feedback"
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            View Feedback API
          </Link>
        </div>
      </div>
    </main>
  );
}
