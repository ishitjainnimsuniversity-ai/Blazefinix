# LOOP — Enterprise AI Customer-Feedback Intelligence Platform
**Author:** Ishit Jain  
**Version:** 3.0.0 (Showcase Enterprise Edition)  
**Architecture:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma ORM + PostgreSQL + pgvector + Claude AI + Web Speech Audio API

---

## 🌟 Executive Project Overview
**LOOP** is an enterprise-grade Customer-Feedback Intelligence and Voice-of-Customer (VOC) platform designed to ingest high-volume customer feedback from multi-channel streams (Websites, Mobile Apps, Zendesk Support Tickets, and In-App Surveys), classify sentiment in real-time with granular semantic vector embeddings, detect volume and sentiment anomaly surges, generate executive VOC briefing reports, and power **Ask LOOP** — a conversational grounded intelligence copilot with zero hallucinations and real-time Web Speech AI voice capabilities.

---

## 🚀 Key Features & Enterprise Capabilities

### 1. Grounded Conversational AI Copilot ("Ask LOOP")
- **Semantic Vector Retrieval**: Performs cosine similarity matching against multi-dimensional vector embeddings with multi-tier synonym expansion.
- **Strict Citation Deduplication**: Eliminates duplicate quotes and repetitions across queries.
- **Multi-Intent Intelligence**:
  - Technical / Cyber Concepts (e.g. *"what is hacking"*, *"explain 2FA"*): Delivers structured, educational definitions with practical SaaS security context.
  - Customer Sentiment Queries (e.g. *"why are payments failing"*, *"what do users like"*): Synthesizes customer friction drivers, verbatim quotes, and actionable engineering recommendations.
- **Voice AI Enabled**:
  - **Text-to-Speech (TTS)**: One-click natural audio briefings with 4-bar equalizer visualization and speed controls (`0.9x`, `1.0x`, `1.2x`).
  - **Speech-to-Text (STT)**: Hands-free voice querying via microphone.

### 2. Multi-Tenant Role-Based Access Control (RBAC)
- **`ADMIN` Mode (Cyan Glow)**: Full administrative control (Write, Ingest, Status Updates, CSV Bulk Ingest, VOC Reports, Anomaly Monitoring, Delete Records, Webhook Simulation).
- **`ANALYST` Mode (Purple Glow)**: Intelligence suite (Single Ingest, Theme Clustering, Sentiment Divergence, VOC Reports, Filter Stream, Ask LOOP Copilot).
- **`VIEWER` Mode (Emerald Glow)**: Executive read-only portal (Real-time Analytics, Time-Series Charts, Theme Drilldown, and Ask LOOP queries).

### 3. Real-Time Telemetry & Anomaly Surge Detection
- Top telemetry bar displaying live streaming webhook events, latency metrics (`18ms`), database status (`ONLINE`), and tenant isolation status (`ISOLATED`).
- Anomaly surge detector identifying volume spikes $\ge 100\%$ against rolling 7-day baselines.

### 4. Interactive Visualizations & Executive VOC Reports
- **Interactive SVG Time-Series Chart**: Daily sentiment volume stacked bars across 7d, 30d, and 90d.
- **Theme Drilldown Modal**: One-click deep dive into any theme's sentiment breakdown and customer quotes.
- **1-Click Executive PDF Export**: Formats Voice-of-Customer reports for executive print/PDF sharing.

---

## 📁 Complete Project Structure

```
LOOP_Complete_Enterprise_Platform/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analytics/
│   │   │   │   ├── dashboard/route.ts      # KPI metrics & sentiment percentages
│   │   │   │   ├── spikes/route.ts         # Anomaly surge detection engine
│   │   │   │   ├── themes/route.ts         # Theme clustering & stats
│   │   │   │   └── trends/route.ts         # Multi-period time-series trends
│   │   │   ├── ask-loop/route.ts           # Grounded semantic question-answering
│   │   │   ├── feedback/
│   │   │   │   ├── route.ts                # List, filter, search, create feedback
│   │   │   │   └── [id]/route.ts           # Update status, delete, get single
│   │   │   ├── ingest/
│   │   │   │   ├── csv/route.ts            # Bulk CSV batch ingestion engine
│   │   │   │   └── simulated/route.ts      # Live webhook stream simulation
│   │   │   └── reports/
│   │   │       └── voc/route.ts            # VOC executive report generation
│   │   ├── globals.css                     # Cyber glassmorphic styling & audio waveforms
│   │   ├── layout.tsx                      # App root layout & metadata
│   │   └── page.tsx                        # Main enterprise single-page dashboard
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── ask-loop.ts                 # Grounded synthesis engine & deduplication
│   │   │   ├── claude.ts                   # Anthropic Claude SDK client
│   │   │   ├── classifier.ts               # Sentiment & feature area classifier
│   │   │   ├── embeddings.ts               # 1536-dim embeddings & cosine similarity
│   │   │   └── voc-generator.ts            # Automated VOC narrative generator
│   │   ├── validation/
│   │   │   └── feedback.schema.ts          # Zod validation schemas
│   │   ├── api-response.ts                 # Standardized JSON response helpers
│   │   ├── auth.ts                         # RBAC session & multi-tenant isolation
│   │   ├── db.ts                           # Prisma PostgreSQL client instance
│   │   └── memory-store.ts                 # High-performance in-memory fallback store
│   ├── services/
│   │   ├── analytics.service.ts            # Analytics calculations & anomaly detection
│   │   ├── ask-loop.service.ts             # Semantic vector ranking service
│   │   ├── feedback.service.ts             # Feedback CRUD & classification pipeline
│   │   ├── ingestion.service.ts            # CSV parsing & batch ingestion
│   │   └── voc-report.service.ts           # Report compilation & caching
│   └── types/
│       └── api.ts                          # Comprehensive TypeScript interfaces & DTOs
├── prisma/
│   ├── schema.prisma                       # Canonical Prisma schema (PostgreSQL + pgvector)
│   └── seed.ts                             # 150+ unique multi-channel seed generator
├── test/
│   ├── ai-classifier.test.ts               # AI classification test suite
│   ├── analytics.test.ts                   # Analytics & KPI test suite
│   ├── embeddings.test.ts                  # Cosine similarity & vector tests
│   ├── ingestion.test.ts                   # CSV ingestion & validation tests
│   ├── integration.test.ts                 # End-to-end integration tests
│   ├── security.test.ts                    # Tenant isolation & RBAC security tests
│   └── validation.test.ts                  # Input schema validation tests
├── docs/
│   ├── ARCHITECTURE.md                     # System architecture & data flow diagrams
│   └── API_REFERENCE.md                    # REST API endpoints & payload specifications
├── public/
│   ├── cyber-bg.jpg                        # Cyber intelligence visual wallpaper
│   └── logo.png                            # High-resolution brand logo
├── artifacts/                              # Screenshots, test logs, telemetry reports
├── setup_and_run.bat                       # ⚡ 1-Click Complete Setup & Run
├── start_app.bat                           # 🚀 1-Click Server Launcher
├── package.json                            # Scripts & dependency definitions
├── tsconfig.json                           # TypeScript configuration
├── tailwind.config.ts                      # Tailwind CSS design system
├── postcss.config.js                       # PostCSS configuration
├── next.config.mjs                         # Next.js configuration
├── .env.example                            # Environment blueprint
└── README.md                               # Project documentation
```

---

## ⚡ How to Run

### Option 1: 1-Click Windows Batch (Fastest)
- Double-click **`setup_and_run.bat`** in the project folder to install dependencies, run test suites, and launch the server.

### Option 2: Command Line
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (32 tests across 7 suites)
npm run test

# 3. Start development server
npm run dev
```

Open your browser at: **[http://localhost:3005](http://localhost:3005)**

---

## 🧪 Test Verification Results
- **Test Suites:** 7 passed (100%)
- **Total Tests:** 32 passed (100%)
- **Test Categories:** Unit, Validation, Security (Multi-Tenant Isolation & RBAC), Embeddings, AI Classifier, Analytics, End-to-End Ingestion.
