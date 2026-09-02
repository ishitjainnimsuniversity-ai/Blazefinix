"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DashboardKpis,
  ThemeStatItem,
  SpikeDetectionItem,
  FeedbackDto,
  PaginatedResponse,
  AskLoopResponse,
  VocReportDto,
  CsvImportResult,
  TrendResponse,
} from "@/types/api";

function RenderRichContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-3.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Header ###
        if (trimmed.startsWith("###")) {
          const title = trimmed.replace(/^###\s*/, "");
          return (
            <div key={idx} className="pt-3 pb-1.5 border-b border-cyan-500/20 flex items-center justify-between">
              <span className="text-xs font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 tracking-wider uppercase">
                {title}
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                VERIFIED AI
              </span>
            </div>
          );
        }

        // Bullet item
        if (trimmed.startsWith("•") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const itemText = trimmed.replace(/^[•\-\*]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-3 text-xs text-slate-200 pl-1.5 leading-relaxed">
              <span className="text-cyan-400 font-bold text-sm leading-none mt-0.5">✦</span>
              <span className="flex-1">
                {renderInlineFormatted(itemText)}
              </span>
            </div>
          );
        }

        // Numbered quote item: **1. ...** or 1. ...
        if (/^\*?\*?\d+\./.test(trimmed)) {
          return (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed hover:border-cyan-500/40 transition-all shadow-sm">
              {renderInlineFormatted(trimmed)}
            </div>
          );
        }

        // Normal paragraph
        return (
          <p key={idx} className="text-xs text-slate-200 leading-relaxed font-normal">
            {renderInlineFormatted(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineFormatted(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-cyan-200">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} className="italic text-slate-400">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-cyan-300">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function LoopApp() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "inbox" | "ask" | "reports" | "ingest"
  >("dashboard");

  // --- Auth Role State ---
  const [currentRole, setCurrentRole] = useState<"ADMIN" | "ANALYST" | "VIEWER">("ADMIN");

  // --- Dashboard State ---
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [themes, setThemes] = useState<ThemeStatItem[]>([]);
  const [spikes, setSpikes] = useState<SpikeDetectionItem[]>([]);
  const [trends, setTrends] = useState<TrendResponse | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // --- Feedback Inbox State ---
  const [feedbackData, setFeedbackData] = useState<PaginatedResponse<FeedbackDto> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [activeChip, setActiveChip] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // --- New Feedback Modal State ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFeedbackText, setNewFeedbackText] = useState("");
  const [newFeedbackSource, setNewFeedbackSource] = useState("Website");
  const [newFeedbackName, setNewFeedbackName] = useState("");
  const [newFeedbackEmail, setNewFeedbackEmail] = useState("");
  const [creatingFeedback, setCreatingFeedback] = useState(false);

  // --- Theme Details Modal State ---
  const [selectedThemeModal, setSelectedThemeModal] = useState<ThemeStatItem | null>(null);
  const [themeFeedbacks, setThemeFeedbacks] = useState<FeedbackDto[]>([]);
  const [loadingThemeFeedbacks, setLoadingThemeFeedbacks] = useState(false);

  // --- Ask LOOP State ---
  const [askQuestion, setAskQuestion] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askResponse, setAskResponse] = useState<AskLoopResponse | null>(null);
  const [isListening, setIsListening] = useState(false);

  // --- Voice / Audio TTS State ---
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeakingText, setAudioSpeakingText] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // --- CSV Ingestion State ---
  const [csvText, setCsvText] = useState(
    `text,source,customerName,customerEmail\n"Payment timeout error when checking out on mobile app",App,Sarah Jenkins,sarah@example.com\n"The onboarding checklist made setup so easy and fast!",Website,Alex Rivera,alex@example.com\n"2FA code is taking 10 minutes to arrive via SMS",Support,James Wilson,jwilson@test.io`
  );
  const [importingCsv, setImportingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState<CsvImportResult | null>(null);

  // --- VOC Reports State ---
  const [reports, setReports] = useState<VocReportDto[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<VocReportDto | null>(null);
  const [reportPeriod, setReportPeriod] = useState<string>("Last 30 Days");

  // --- Toast Notification State ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Ticker Event State ---
  const [tickerIndex, setTickerIndex] = useState(0);
  const tickerEvents = [
    "⚡ [Live Stream] Ingested Zendesk ticket #4082 — Resolved 2FA latency inquiry",
    "🚨 [Surge Alert] Payment Gateway Failures surging +250.0% vs rolling baseline",
    "🤖 [Ask LOOP] Vector embeddings indexed across 150 customer feedback documents",
    "📈 [Analytics] Customer positive sentiment ratio reaching 41.3% net positive",
    "🔒 [Zero-Trust Security] Session verified for Acme Corporation (ADMIN role)",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerEvents.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- Speech Recognition (STT - Voice Input) ---
  const handleToggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("⚠️ Voice input not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      showToast("🎙️ Listening... Speak your question now!");

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAskQuestion(transcript);
        setIsListening(false);
        showToast(`🎙️ Recognized: "${transcript}"`);
        handleAsk(transcript);
      };

      recognition.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
        showToast("⚠️ Speech recognition cancelled or unsupported.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // --- Text-to-Speech (TTS - Voice Synthesis) ---
  const handleSpeakText = (text: string, title = "Voice Briefing") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      showToast("⚠️ Speech Synthesis not supported in this browser.");
      return;
    }

    if (isPlayingAudio && audioSpeakingText === text) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setAudioSpeakingText(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown symbols for natural audio speech
    const cleanText = text
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .replace(/•/g, "")
      .replace(/✦/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))) ||
      voices.find((v) => v.lang.startsWith("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setAudioSpeakingText(text);
      showToast(`🔊 Playing ${title}...`);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setAudioSpeakingText(null);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setAudioSpeakingText(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setAudioSpeakingText(null);
  };

  // Load Dashboard Data
  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const [kpiRes, themeRes, spikeRes, trendRes] = await Promise.all([
        fetch("/api/analytics/dashboard").then((r) => r.json()),
        fetch("/api/analytics/themes").then((r) => r.json()),
        fetch("/api/analytics/spikes").then((r) => r.json()),
        fetch(`/api/analytics/trends?period=${trendPeriod}`).then((r) => r.json()),
      ]);
      if (kpiRes.success) setKpis(kpiRes.data);
      if (themeRes.success) setThemes(themeRes.data);
      if (spikeRes.success) setSpikes(spikeRes.data);
      if (trendRes.success) setTrends(trendRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Load Feedback Data
  const loadFeedback = async (p = 1, chip = activeChip) => {
    setLoadingInbox(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        pageSize: "10",
      });

      if (searchQuery) params.append("search", searchQuery);
      if (sentimentFilter) params.append("sentiment", sentimentFilter);
      if (statusFilter) params.append("status", statusFilter);

      // Handle Quick Filter Chips
      if (chip === "SPIKES") params.append("search", "Payment Gateway Failures");
      else if (chip === "PAYMENTS") params.append("featureArea", "Billing & Pricing");
      else if (chip === "AUTH") params.append("featureArea", "Authentication");
      else if (chip === "CRASHES") params.append("sentiment", "NEGATIVE");
      else if (chip === "DELIGHTERS") params.append("sentiment", "POSITIVE");

      const res = await fetch(`/api/feedback?${params.toString()}`).then((r) => r.json());
      if (res.success) {
        setFeedbackData(res.data);
        setPage(p);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInbox(false);
    }
  };

  // Load Reports
  const loadReports = async () => {
    try {
      const res = await fetch("/api/reports/voc").then((r) => r.json());
      if (res.success) {
        setReports(res.data);
        if (res.data.length > 0 && !selectedReport) {
          setSelectedReport(res.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadFeedback(1);
    loadReports();
  }, [trendPeriod]);

  // Handle Status Update
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentRole,
        },
        body: JSON.stringify({ status: newStatus }),
      }).then((r) => r.json());
      if (res.success) {
        loadFeedback(page);
        loadDashboard();
        showToast(`✅ [${currentRole}] Status updated to ${newStatus}`);
      } else {
        showToast(`❌ Error: ${res.error?.message}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Delete Feedback (ADMIN only)
  const handleDeleteFeedback = async (id: string) => {
    if (currentRole !== "ADMIN") {
      showToast("⛔ Only ADMIN role can delete feedback records.");
      return;
    }
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentRole,
        },
      }).then((r) => r.json());

      if (res.success) {
        loadFeedback(page);
        loadDashboard();
        showToast("🗑️ [ADMIN] Feedback record deleted.");
      } else {
        showToast(`❌ ${res.error?.message}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Add Feedback
  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackText.trim()) return;
    setCreatingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: newFeedbackText,
          source: newFeedbackSource,
          customerName: newFeedbackName || undefined,
          customerEmail: newFeedbackEmail || undefined,
        }),
      }).then((r) => r.json());

      if (res.success) {
        setNewFeedbackText("");
        setNewFeedbackName("");
        setNewFeedbackEmail("");
        setShowAddModal(false);
        loadFeedback(1);
        loadDashboard();
        showToast(`🚀 [${currentRole}] Feedback ingested and AI classified!`);
      } else {
        showToast(`❌ ${res.error?.message}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingFeedback(false);
    }
  };

  // Live Webhook Simulation
  const handleSimulateWebhook = async () => {
    const sampleItems = [
      { source: "Website", name: "Elena Rostova", email: "elena@design.io", text: "Checkout with Apple Pay failed with code ERR_PAYMENT_UNAVAILABLE. Please fix!" },
      { source: "App", name: "David Chen", email: "david@chen.org", text: "Loving the new v3.0 analytics dashboard. Incredibly fast load speeds!" },
      { source: "Support", name: "Marcus Vance", email: "marcus@tech.io", text: "SMS 2FA token arrived after 12 minutes on T-Mobile network." },
    ];
    const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    try {
      const res = await fetch("/api/ingest/simulated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: item.source,
          customerIdentifier: item.name,
          customerEmail: item.email,
          text: item.text,
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(`⚡ [${currentRole}] Live Webhook Ingested from ${item.source}!`);
        loadFeedback(1);
        loadDashboard();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Ask LOOP
  const handleAsk = async (questionToAsk?: string) => {
    const q = questionToAsk || askQuestion;
    if (!q.trim()) return;
    setAskLoading(true);
    setAskResponse(null);
    try {
      const res = await fetch("/api/ask-loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      }).then((r) => r.json());

      if (res.success) {
        setAskResponse(res.data);
      } else {
        showToast(`❌ ${res.error?.message}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAskLoading(false);
    }
  };

  // Handle CSV Ingest
  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    setImportingCsv(true);
    setCsvResult(null);
    try {
      const res = await fetch("/api/ingest/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: csvText }),
      }).then((r) => r.json());

      if (res.success) {
        setCsvResult(res.data);
        loadDashboard();
        loadFeedback(1);
        showToast(`🎉 [${currentRole}] Imported ${res.data.successful} feedback records!`);
      } else {
        showToast(`❌ CSV Import Error: ${res.error?.message}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImportingCsv(false);
    }
  };

  // Handle Generate VOC Report
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/reports/voc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: reportPeriod }),
      }).then((r) => r.json());

      if (res.success) {
        setSelectedReport(res.data);
        loadReports();
        showToast(`📄 [${currentRole}] VOC Executive Report generated!`);
      } else {
        showToast(`❌ ${res.error?.message}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Open Theme Drilldown Modal
  const handleOpenThemeModal = async (theme: ThemeStatItem) => {
    setSelectedThemeModal(theme);
    setLoadingThemeFeedbacks(true);
    try {
      const res = await fetch(`/api/feedback?theme=${encodeURIComponent(theme.name)}&pageSize=15`).then((r) => r.json());
      if (res.success) {
        setThemeFeedbacks(res.data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingThemeFeedbacks(false);
    }
  };

  return (
    <div className="min-h-screen cinematic-bg text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce bg-slate-900/95 border border-cyan-500/60 text-cyan-300 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3">
          <span className="text-lg">⚡</span>
          <span className="font-semibold text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Top Telemetry Ticker Bar */}
      <div className="bg-slate-950/90 border-b border-cyan-500/20 px-6 py-1.5 flex items-center justify-between text-[11px] text-slate-400 overflow-hidden no-print">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono font-bold text-cyan-400 uppercase tracking-wider text-[10px]">
            Live Telemetry
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-medium transition-all duration-500">
            {tickerEvents[tickerIndex]}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-slate-400">
          <span>LATENCY: <strong className="text-emerald-400">18ms</strong></span>
          <span>PG VECTOR: <strong className="text-cyan-400">ONLINE</strong></span>
          <span>TENANT: <strong className="text-purple-400">ISOLATED</strong></span>
        </div>
      </div>

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 border-b border-cyan-500/20 backdrop-blur-xl px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
            <span className="text-xl font-black text-white tracking-tighter">∞</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-400">
                LOOP
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 tracking-wider">
                Cyber Intelligence
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Workspace:</span>
              <strong className="text-slate-200">Acme Corporation</strong>
              <span className="text-slate-500 font-mono">(ws_demo_acme)</span>
            </div>
          </div>
        </div>

        {/* Global Controls: Audio HUD, Role Switcher & Actions */}
        <div className="flex items-center gap-3">
          {/* Audio Playing Equalizer HUD */}
          {isPlayingAudio && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-purple-950/90 border border-purple-500/60 text-purple-300 text-xs shadow-lg shadow-purple-500/20">
              <div className="flex items-end gap-1 h-3.5 w-6">
                <span className="w-1 bg-cyan-400 rounded-full waveform-bar" style={{ animationDelay: "0.1s" }} />
                <span className="w-1 bg-purple-400 rounded-full waveform-bar" style={{ animationDelay: "0.3s" }} />
                <span className="w-1 bg-pink-400 rounded-full waveform-bar" style={{ animationDelay: "0.2s" }} />
                <span className="w-1 bg-emerald-400 rounded-full waveform-bar" style={{ animationDelay: "0.4s" }} />
              </div>
              <span className="font-semibold text-[11px]">AI Speaking</span>
              <button
                onClick={handleStopAudio}
                className="hover:text-rose-400 font-bold ml-1 text-xs"
                title="Stop Audio Playback"
              >
                ✕
              </button>
            </div>
          )}

          {/* Role Switcher */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold pl-1">ROLE:</span>
            {(["ADMIN", "ANALYST", "VIEWER"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setCurrentRole(r);
                  showToast(`Active identity switched to ${r} mode`);
                }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  currentRole === r
                    ? r === "ADMIN"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30"
                      : r === "ANALYST"
                      ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                      : "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Ingest Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 active:scale-95 border border-cyan-400/30"
          >
            <span>+ Ingest Feedback</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="px-6 pt-3.5 pb-2 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md no-print">
        <nav className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "dashboard", label: "Analytics Grid", icon: "📊" },
            { id: "inbox", label: "Feedback Stream", icon: "📥" },
            { id: "ask", label: "Ask LOOP AI (Voice & Text)", icon: "🤖" },
            { id: "reports", label: "Voice-of-Customer VOC", icon: "📄" },
            { id: "ingest", label: "Batch CSV Ingestion", icon: "📁" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/15"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Active Role Perspective Console Banner */}
        <div
          className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${
            currentRole === "ADMIN"
              ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-200 shadow-xl shadow-cyan-500/10"
              : currentRole === "ANALYST"
              ? "bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-xl shadow-purple-500/10"
              : "bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-xl shadow-emerald-500/10"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${
              currentRole === "ADMIN"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40"
                : currentRole === "ANALYST"
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/40"
                : "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40"
            }`}>
              {currentRole === "ADMIN" ? "👑" : currentRole === "ANALYST" ? "📊" : "👁️"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs uppercase tracking-wider text-white">
                  {currentRole === "ADMIN"
                    ? "Admin Full Control Workspace Active"
                    : currentRole === "ANALYST"
                    ? "Analyst Intelligence Suite Active"
                    : "Executive Viewer Read-Only Portal Active"}
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/40 border border-current font-bold">
                  {currentRole === "ADMIN" ? "READ / WRITE / DELETE" : currentRole === "ANALYST" ? "READ / WRITE / REPORTS" : "READ-ONLY EXPLORATION"}
                </span>
              </div>
              <p className="text-[11px] opacity-85 mt-0.5">
                {currentRole === "ADMIN"
                  ? "Full administrative control: Ingest single feedback, delete records, batch resolve issues, trigger simulated webhooks, and execute CSV pipelines."
                  : currentRole === "ANALYST"
                  ? "Analytical deep-dive: Explore theme clusters, run Ask LOOP AI copilot queries, generate VOC executive reports, and update triage status."
                  : "Executive overview: Inspect live customer sentiment, time-series trends, and test Ask LOOP AI grounded answers in read-only mode."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(["ADMIN", "ANALYST", "VIEWER"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setCurrentRole(r);
                  showToast(`Switched active mode to ${r}`);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  currentRole === r
                    ? "bg-white text-slate-950 shadow-md"
                    : "bg-black/40 border border-white/20 text-white/80 hover:bg-black/60"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        {/* =================================================================== */}
        {/* TAB 1: ANALYTICS GRID & DASHBOARD                                   */}
        {/* =================================================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Feedback */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-slate-400">Total Feedback Ingested</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                    Live Stream
                  </span>
                </div>
                <div className="text-3xl font-black text-white mt-2">
                  {kpis ? kpis.totalFeedback : "..."}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>New: <strong className="text-cyan-400 font-bold">{kpis?.statusCounts.new ?? 0}</strong></span>
                  <span>Resolved: <strong className="text-emerald-400 font-bold">{kpis?.statusCounts.resolved ?? 0}</strong></span>
                </div>
              </div>

              {/* Sentiment Ratio */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-slate-400">Customer Sentiment Ratio</span>
                </div>
                <div className="text-3xl font-black text-emerald-400 mt-2">
                  {kpis ? `${kpis.sentimentPercentages.positive}%` : "..."}
                  <span className="text-xs font-normal text-slate-400 ml-2">Positive Net</span>
                </div>
                <div className="mt-3 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden flex">
                  <div style={{ width: `${kpis?.sentimentPercentages.positive ?? 0}%` }} className="bg-emerald-400 h-full" />
                  <div style={{ width: `${kpis?.sentimentPercentages.neutral ?? 0}%` }} className="bg-amber-400 h-full" />
                  <div style={{ width: `${kpis?.sentimentPercentages.negative ?? 0}%` }} className="bg-rose-400 h-full" />
                </div>
              </div>

              {/* Active Themes */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-slate-400">Active Theme Clusters</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300">
                    Vectorized
                  </span>
                </div>
                <div className="text-3xl font-black text-purple-300 mt-2">
                  {kpis ? kpis.activeThemesCount : "..."}
                </div>
                <div className="mt-3 text-[11px] text-slate-400">
                  Avg Score: <strong className={Number(kpis?.averageSentimentScore ?? 0) >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {Number(kpis?.averageSentimentScore ?? 0) > 0 ? "+" : ""}{kpis?.averageSentimentScore ?? "0.00"}
                  </strong>
                </div>
              </div>

              {/* Anomaly Spikes */}
              <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-slate-400">Anomaly Spike Surges</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 font-extrabold animate-pulse">
                    ALERT
                  </span>
                </div>
                <div className="text-3xl font-black text-rose-400 mt-2">
                  {kpis ? kpis.activeSpikesCount : "..."}
                </div>
                <div className="mt-3 text-[11px] text-slate-400">
                  Surging <strong className="text-rose-400 font-bold">≥100%</strong> vs rolling baseline
                </div>
              </div>
            </div>

            {/* Middle Row: Anomaly Spikes & Top Customer Themes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Anomaly Spike Monitor */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400">⚡</span>
                    <h3 className="font-bold text-sm text-slate-100 tracking-wide">
                      Anomaly Surge Monitor
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">7-Day Rolling Baseline</span>
                </div>

                <div className="space-y-3">
                  {spikes.filter((s) => s.isSpike).length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No active volume anomaly surges detected.
                    </div>
                  )}
                  {spikes
                    .filter((s) => s.isSpike)
                    .map((s, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between gap-4 hover:border-rose-500/50 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-rose-200">{s.theme}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 font-bold">
                              +{s.changePercent}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{s.explanation}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-rose-400">{s.currentCount}</span>
                          <span className="text-[10px] text-slate-500 block">mentions</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top Themes Leaderboard with Clickable Drilldown */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="font-bold text-sm text-slate-100 tracking-wide">
                    Top Customer Themes
                  </h3>
                  <span className="text-xs text-slate-500">Click theme to drill down</span>
                </div>

                <div className="space-y-3">
                  {themes.slice(0, 5).map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => handleOpenThemeModal(theme)}
                      className="p-2.5 rounded-xl hover:bg-slate-900/60 transition-all cursor-pointer border border-transparent hover:border-cyan-500/30"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-200 hover:text-cyan-300 flex items-center gap-1.5">
                          <span>{theme.name}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">→</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">
                            {theme.count} items ({theme.percentage}%)
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              theme.recentTrend === "UP"
                                ? "bg-rose-950 text-rose-300"
                                : theme.recentTrend === "DOWN"
                                ? "bg-emerald-950 text-emerald-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {theme.recentTrend}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800/60 rounded-full h-1.5 flex overflow-hidden">
                        <div
                          style={{
                            width: `${
                              theme.count > 0
                                ? (theme.sentimentBreakdown.positive / theme.count) * 100
                                : 0
                            }%`,
                          }}
                          className="bg-emerald-400 h-full"
                        />
                        <div
                          style={{
                            width: `${
                              theme.count > 0
                                ? (theme.sentimentBreakdown.neutral / theme.count) * 100
                                : 0
                            }%`,
                          }}
                          className="bg-amber-400 h-full"
                        />
                        <div
                          style={{
                            width: `${
                              theme.count > 0
                                ? (theme.sentimentBreakdown.negative / theme.count) * 100
                                : 0
                            }%`,
                          }}
                          className="bg-rose-400 h-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Interactive Sentiment Time-Series Chart */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">📈</span>
                  <h3 className="font-bold text-sm text-slate-100">
                    Daily Customer Sentiment Trajectory (Time-Series)
                  </h3>
                </div>
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                  {(["7d", "30d", "90d"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setTrendPeriod(p)}
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-all ${
                        trendPeriod === p
                          ? "bg-cyan-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive SVG Chart */}
              {trends && trends.dataPoints.length > 0 ? (
                <div className="w-full h-44 relative flex items-end gap-1.5 pt-6 pb-2">
                  {trends.dataPoints.map((dp, i) => {
                    const maxVal = Math.max(...trends.dataPoints.map((d) => d.total), 10);
                    const heightPct = Math.max(8, (dp.total / maxVal) * 100);
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center group relative h-full justify-end"
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 border border-cyan-500/40 text-[10px] text-slate-200 px-2 py-1 rounded shadow-xl whitespace-nowrap z-20">
                          <strong>{dp.date}</strong>: {dp.total} items (🟢 {dp.positive} | 🟡 {dp.neutral} | 🔴 {dp.negative})
                        </div>
                        {/* Stacked bar */}
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full max-w-[16px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all group-hover:brightness-125"
                        >
                          <div
                            style={{
                              height: `${dp.total > 0 ? (dp.negative / dp.total) * 100 : 0}%`,
                            }}
                            className="bg-rose-500 w-full"
                          />
                          <div
                            style={{
                              height: `${dp.total > 0 ? (dp.neutral / dp.total) * 100 : 0}%`,
                            }}
                            className="bg-amber-400 w-full"
                          />
                          <div
                            style={{
                              height: `${dp.total > 0 ? (dp.positive / dp.total) * 100 : 0}%`,
                            }}
                            className="bg-emerald-400 w-full"
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 font-mono hidden sm:block">
                          {i % 4 === 0 ? dp.date.slice(5) : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">Loading trends...</div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: FEEDBACK STREAM (INBOX)                                      */}
        {/* =================================================================== */}
        {activeTab === "inbox" && (
          <div className="space-y-4">
            {/* Quick Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "All Items (150)" },
                { id: "SPIKES", label: "🚨 Spikes & Outages" },
                { id: "PAYMENTS", label: "💳 Payment & Billing" },
                { id: "AUTH", label: "🔐 2FA & Login" },
                { id: "CRASHES", label: "🔥 Negative Friction" },
                { id: "DELIGHTERS", label: "🌟 Positive Delighters" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => {
                    setActiveChip(chip.id);
                    loadFeedback(1, chip.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeChip === chip.id
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 glass-card p-4 rounded-2xl">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search customer feedback, customer name, email, feature..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadFeedback(1)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value)}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All Sentiments</option>
                  <option value="POSITIVE">Positive</option>
                  <option value="NEUTRAL">Neutral</option>
                  <option value="NEGATIVE">Negative</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="ARCHIVED">Archived</option>
                </select>

                <button
                  onClick={() => loadFeedback(1)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all"
                >
                  Filter Stream
                </button>

                <button
                  onClick={handleSimulateWebhook}
                  className="px-3 py-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 font-semibold text-xs hover:bg-purple-900/80 transition-all flex items-center gap-1.5"
                  title="Simulate incoming real-time customer feedback webhook"
                >
                  <span>⚡ Webhook</span>
                </button>
              </div>
            </div>

            {/* Feedback Items List */}
            <div className="space-y-3">
              {loadingInbox && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Loading customer feedback stream...
                </div>
              )}

              {!loadingInbox && feedbackData?.items.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No customer feedback matched your search filter criteria.
                </div>
              )}

              {!loadingInbox &&
                feedbackData?.items.map((item) => (
                  <div
                    key={item.id}
                    className="glass-card p-4 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Sentiment Pill */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            item.sentiment === "POSITIVE"
                              ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                              : item.sentiment === "NEGATIVE"
                              ? "bg-rose-950/80 border border-rose-500/40 text-rose-300"
                              : "bg-amber-950/80 border border-amber-500/40 text-amber-300"
                          }`}
                        >
                          {item.sentiment ?? "NEUTRAL"} ({item.sentimentScore != null ? (item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore) : "0.0"})
                        </span>

                        {/* Feature Area */}
                        {item.featureArea && (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-cyan-300 font-medium">
                            {item.featureArea}
                          </span>
                        )}

                        <span className="text-slate-500 text-[11px]">via {item.source}</span>
                        {item.customerName && (
                          <span className="text-slate-400 text-[11px]">
                            • <strong>{item.customerName}</strong>
                          </span>
                        )}
                      </div>

                      {/* Actions & Status Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>

                        {currentRole === "VIEWER" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-400">
                            {item.status}
                          </span>
                        ) : (
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            <option value="NEW">NEW</option>
                            <option value="REVIEWED">REVIEWED</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                          </select>
                        )}

                        {currentRole === "ADMIN" && (
                          <button
                            onClick={() => handleDeleteFeedback(item.id)}
                            className="px-2 py-1 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-bold hover:bg-rose-900 transition-all"
                            title="Admin: Delete Feedback Item"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Raw Text */}
                    <p className="text-slate-200 text-xs leading-relaxed font-normal">
                      {item.rawText}
                    </p>

                    {/* AI Rationale */}
                    {item.aiRationale && (
                      <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-200/90 flex items-start gap-2">
                        <span className="font-bold text-cyan-400">AI Rationale:</span>
                        <span>{item.aiRationale}</span>
                      </div>
                    )}

                    {/* Tags */}
                    {item.themes && item.themes.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {item.themes.map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 font-mono"
                          >
                            #{t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {feedbackData && feedbackData.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3">
                <span>
                  Page {feedbackData.page} of {feedbackData.totalPages} ({feedbackData.total} items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => loadFeedback(page - 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:border-cyan-500"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!feedbackData.hasMore}
                    onClick={() => loadFeedback(page + 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:border-cyan-500"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: ASK LOOP AI (VOICE & TEXT GROUNDED INTELLIGENCE)             */}
        {/* =================================================================== */}
        {activeTab === "ask" && (
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                    <span>🤖</span> Ask LOOP — Grounded Customer Intelligence Engine
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Synthesizes grounded answers strictly from customer feedback vector embeddings. 100% tenant-isolated, verifiable, and voice-enabled.
                  </p>
                </div>

                {/* Voice Speed Controls */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Audio Speed:</span>
                  {[0.9, 1.0, 1.2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setSpeechRate(rate)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        speechRate === rate
                          ? "bg-purple-500 text-slate-950 font-black"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Quick Questions */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {[
                  "Why are customers unhappy about payments and billing?",
                  "What issues are being reported with 2FA and login?",
                  "What do users like most about the product?",
                  "Are there crashes being reported on mobile?",
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAskQuestion(q);
                      handleAsk(q);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-all text-xs text-left"
                  >
                    &ldquo;{q}&rdquo;
                  </button>
                ))}
              </div>

              {/* Input Form with Voice Button */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Ask any question (e.g. 'Why are payments failing?' or 'What is zero-trust?')..."
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />

                {/* Voice Input Microphone Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`px-4 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                    isListening
                      ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30"
                      : "bg-slate-900 border border-purple-500/40 text-purple-300 hover:bg-purple-950/80"
                  }`}
                  title="Speak question via microphone"
                >
                  <span>{isListening ? "🔴 Listening..." : "🎙️ Voice"}</span>
                </button>

                {/* Submit Ask Button */}
                <button
                  onClick={() => handleAsk()}
                  disabled={askLoading || !askQuestion.trim()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 transition-all shadow-lg shadow-cyan-500/20"
                >
                  {askLoading ? "Synthesizing..." : "Ask LOOP"}
                </button>
              </div>
            </div>

            {/* AI Response Card */}
            {askResponse && (
              <div className="glass-card p-6 rounded-2xl space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                      Grounded AI Answer
                    </span>
                    <span className="text-xs text-slate-400">
                      Retrieved from {askResponse.metadata.retrievedCount} vector records (Avg Sim: {(askResponse.metadata.averageSimilarity * 100).toFixed(1)}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(askResponse.answer);
                        showToast("📋 Answer copied to clipboard!");
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-cyan-500 transition-all"
                    >
                      📋 Copy
                    </button>

                    {/* Audio TTS Button for Ask LOOP Response */}
                    <button
                      onClick={() => handleSpeakText(askResponse.answer, `Answer for "${askResponse.question}"`)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-300 text-xs font-semibold hover:bg-purple-900 transition-all"
                    >
                      <span>{isPlayingAudio && audioSpeakingText === askResponse.answer ? "⏸️ Pause Voice" : "🔊 Listen with AI Voice"}</span>
                    </button>
                  </div>
                </div>

                {/* Markdown-Formatted AI Answer */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <RenderRichContent content={askResponse.answer} />
                </div>

                {/* Retrieved Evidence Citation Cards */}
                {askResponse.evidence.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 tracking-wide">
                      Retrieved Evidence Citations ({askResponse.evidence.length} items):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {askResponse.evidence.map((ev, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2 hover:border-cyan-500/40 transition-all"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Via {ev.source}</span>
                            <span className="font-mono text-cyan-400 font-bold">
                              Sim: {ev.similarity}
                            </span>
                          </div>
                          <p className="text-slate-200 italic">&ldquo;{ev.text}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: VOICE-OF-CUSTOMER (VOC) EXECUTIVE REPORTS                    */}
        {/* =================================================================== */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl space-y-4 no-print">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    Voice-of-Customer (VOC) Executive Reports
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Automated strategic reports synthesizing real volume, sentiment, top themes, and anomaly spikes.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                    <option value="All Time">All Time</option>
                  </select>

                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    {generatingReport ? "Generating..." : "Generate VOC Report"}
                  </button>
                </div>
              </div>
            </div>

            {/* Rendered Selected Report */}
            {selectedReport && (
              <div className="glass-card p-6 rounded-2xl space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Executive Report — {selectedReport.period}
                    </h3>
                    <span className="text-xs text-slate-400">
                      Generated on {new Date(selectedReport.generatedAt).toLocaleString()} ({selectedReport.totalFeedback} feedback items)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                      {selectedReport.positivePercent}% Positive
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300">
                      {selectedReport.negativePercent}% Negative
                    </span>

                    {/* Print / Export PDF Button */}
                    <button
                      onClick={() => window.print()}
                      className="no-print px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:border-cyan-500 transition-all flex items-center gap-1.5"
                    >
                      <span>📥 PDF Export</span>
                    </button>

                    {/* Audio TTS Button for VOC Report */}
                    <button
                      onClick={() => handleSpeakText(selectedReport.aiNarrative, `Executive Briefing for ${selectedReport.period}`)}
                      className="no-print flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500 transition-all"
                    >
                      <span>{isPlayingAudio && audioSpeakingText === selectedReport.aiNarrative ? "⏸️ Pause Audio" : "🔊 Listen with AI Voice"}</span>
                    </button>
                  </div>
                </div>

                {/* AI Executive Narrative Content */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <RenderRichContent content={selectedReport.aiNarrative} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: BATCH CSV INGESTION                                          */}
        {/* =================================================================== */}
        {activeTab === "ingest" && (
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-100">Bulk CSV Ingestion Engine</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paste customer feedback in CSV format or drag-and-drop a file. The ingestion pipeline parses rows, validates emails/text, enriches embeddings, and runs AI sentiment classification.
                </p>
              </div>

              {/* CSV Textarea */}
              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handleImportCsv}
                  disabled={importingCsv || !csvText.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 transition-all shadow-lg shadow-cyan-500/20"
                >
                  {importingCsv ? "Importing & Vectorizing..." : "Execute CSV Import"}
                </button>
              </div>
            </div>

            {/* Import Results Banner */}
            {csvResult && (
              <div className="glass-card p-6 rounded-2xl space-y-3 animate-fadeIn">
                <h4 className="font-bold text-xs text-slate-200">Import Summary</h4>
                <div className="flex items-center gap-4 text-xs">
                  <span>Total: <strong>{csvResult.total}</strong></span>
                  <span className="text-emerald-400">Successful: <strong>{csvResult.successful}</strong></span>
                  <span className="text-rose-400">Failed: <strong>{csvResult.failed}</strong></span>
                </div>

                {csvResult.errors && csvResult.errors.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-400">Row Errors:</span>
                    {csvResult.errors.map((err, i) => (
                      <div key={i} className="text-[11px] text-rose-300/90 bg-rose-950/20 p-2 rounded border border-rose-500/20">
                        Row #{err.rowNumber}: {err.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL: INGEST SINGLE FEEDBACK                                       */}
        {/* =================================================================== */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card max-w-lg w-full p-6 rounded-2xl space-y-4 border border-cyan-500/40 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-100">Ingest Customer Feedback</h3>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    currentRole === "ADMIN"
                      ? "bg-cyan-950 border border-cyan-500/50 text-cyan-300"
                      : currentRole === "ANALYST"
                      ? "bg-purple-950 border border-purple-500/50 text-purple-300"
                      : "bg-emerald-950 border border-emerald-500/50 text-emerald-300"
                  }`}>
                    {currentRole} MODE
                  </span>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-base"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateFeedback} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Customer Feedback Text *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter customer quote, ticket message, or review..."
                    value={newFeedbackText}
                    onChange={(e) => setNewFeedbackText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Source Channel</label>
                    <select
                      value={newFeedbackSource}
                      onChange={(e) => setNewFeedbackSource(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="Website">Website</option>
                      <option value="App">Mobile App</option>
                      <option value="Support">Support Ticket</option>
                      <option value="Survey">Customer Survey</option>
                      <option value="Social">Social / Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Customer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Jenkins"
                      value={newFeedbackName}
                      onChange={(e) => setNewFeedbackName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Customer Email</label>
                  <input
                    type="email"
                    placeholder="e.g. sarah@example.com"
                    value={newFeedbackEmail}
                    onChange={(e) => setNewFeedbackEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-semibold hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingFeedback}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 shadow-lg shadow-cyan-500/20"
                  >
                    {creatingFeedback ? "Classifying with AI..." : "Ingest & Classify"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL: THEME DRILL-DOWN MODAL                                       */}
        {/* =================================================================== */}
        {selectedThemeModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card max-w-2xl w-full p-6 rounded-2xl space-y-4 border border-cyan-500/40 shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                    <span>🏷️ Theme Drilldown:</span> {selectedThemeModal.name}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {selectedThemeModal.count} total mentions ({selectedThemeModal.percentage}% of workspace feedback)
                  </span>
                </div>
                <button
                  onClick={() => setSelectedThemeModal(null)}
                  className="text-slate-400 hover:text-white text-base"
                >
                  ✕
                </button>
              </div>

              {/* Sentiment Breakdown */}
              <div className="flex items-center gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-semibold">🟢 Positive: {selectedThemeModal.sentimentBreakdown.positive}</span>
                <span className="text-amber-400 font-semibold">🟡 Neutral: {selectedThemeModal.sentimentBreakdown.neutral}</span>
                <span className="text-rose-400 font-semibold">🔴 Negative: {selectedThemeModal.sentimentBreakdown.negative}</span>
              </div>

              {/* Associated Feedback Items List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {loadingThemeFeedbacks && (
                  <div className="text-center py-8 text-xs text-slate-400">Loading theme mentions...</div>
                )}
                {!loadingThemeFeedbacks && themeFeedbacks.map((fb) => (
                  <div key={fb.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>via {fb.source} ({fb.sentiment})</span>
                      <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-200 italic">&ldquo;{fb.rawText}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 px-6 py-4 text-center text-xs text-slate-500 no-print flex items-center justify-between max-w-7xl mx-auto w-full">
        <span>LOOP Enterprise AI Intelligence Engine • PostgreSQL + Prisma Architecture</span>
        <span className="font-mono text-[10px] text-cyan-400">100% TENANT ISOLATED</span>
      </footer>
    </div>
  );
}
