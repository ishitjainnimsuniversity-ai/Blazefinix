# LOOP — AI Customer-Feedback Intelligence Platform (Part 2 Backend)

LOOP is an enterprise multi-tenant customer feedback intelligence platform that aggregates, analyzes, clusters, and synthesizes unstructured feedback into actionable product insights.

---

## 🏗️ Architecture Overview

```
                               ┌─────────────────────────────────────────┐
                               │           Next.js 14 App Router         │
                               │           Frontend & Client UI          │
                               └────────────────────┬────────────────────┘
                                                    │ HTTP Requests
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │    API Route Handlers (/app/api/*)      │
                               │  - Request Validation (Zod)             │
                               │  - Authentication & RBAC Middleware     │
                               │  - Standardized JSON Error Format       │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │             Service Layer               │
                               │  ├── Feedback Service                   │
                               │  ├── Ingestion Service (CSV/Simulated)  │
                               │  ├── Analytics & Spike Detection Service│
                               │  ├── AI Classification Service          │
                               │  ├── Embedding & Semantic Search Service│
                               │  ├── Ask LOOP Grounded Q&A Service      │
                               │  └── Voice-of-Customer (VOC) Service    │
                               └─────────┬──────────────────────┬────────┘
                                         │                      │
                  Server-side AI Calls   │                      │ Scoped DB Queries
                                         ▼                      ▼
                            ┌─────────────────────┐   ┌───────────────────┐
                            │ Anthropic Claude API│   │ Prisma ORM Client │
                            │ (Zero-Shot JSON +   │   └─────────┬─────────┘
                            │ Grounded Q&A + VOC) │             │
                            └─────────────────────┘             ▼
                                                      ┌───────────────────┐
                                                      │ PostgreSQL / DB   │
                                                      │ (Tenant Isolated) │
                                                      └───────────────────┘
```

---

## ⚡ Core Capabilities

1. **Multi-Tenant Isolation**: Every database query is strictly scoped to the authenticated workspace context (`workspaceId`). Cross-workspace data leakage is strictly blocked.
2. **Role-Based Access Control (RBAC)**:
   - **`ADMIN`**: Full permissions (feedback CRUD, CSV bulk import, VOC reports, workspace settings).
   - **`ANALYST`**: Analytics, feedback creation & status updates, Ask LOOP, CSV import, VOC reports.
   - **`VIEWER`**: Read-only analytics, dashboard inspection, Ask LOOP, and report viewing.
3. **AI Auto-Classification (Anthropic Claude API)**:
   - Server-side classification of sentiment (`POSITIVE`, `NEUTRAL`, `NEGATIVE`), normalized sentiment scores (`-1.0` to `1.0`), feature area assignment, theme tagging, and concise AI rationales.
   - Strict Zod validation of LLM outputs with automatic JSON recovery and resilient fallback heuristics.
4. **Explainable Statistical Spike Detection**:
   - Compares 7-day rolling window feedback volume against historical baseline averages ($\Delta = \frac{V_{\text{current}} - V_{\text{baseline}}}{V_{\text{baseline}}} \times 100\%$).
   - Flags anomaly surges ($\Delta \ge 100\%$) with minimum sample thresholds to prevent false positives.
5. **Ask LOOP (Grounded Semantic Retrieval)**:
   - Dense vector embeddings (128-dimensional) and cosine similarity ranking.
   - Grounded context injection into Claude with strict anti-hallucination constraints and verbatim evidence citation cards.
6. **Automated Voice-of-Customer (VOC) Reports**:
   - Aggregates true database statistics for custom periods (Last 7 Days, Last 30 Days, Last 90 Days).
   - Synthesizes executive summaries, sentiment trajectories, friction points, spike analysis, and strategic engineering recommendations.
7. **Production CSV Bulk Ingestion**:
   - Tolerant column mapping, per-row schema validation, partial failure accounting, and batch AI enrichment.

---

## 📦 Database Schema (`prisma/schema.prisma`)

- **`Workspace`**: Tenant partition identifier with slug.
- **`User`**: Role-based user belonging to a workspace (`ADMIN`, `ANALYST`, `VIEWER`).
- **`Feedback`**: Customer feedback record with source, raw text, status, sentiment, score, feature area, and AI rationale.
- **`AiAnalysis`**: Detailed AI classification record linked to feedback.
- **`Theme`**: Unique theme tag per workspace with real-time feedback counts.
- **`FeedbackTheme`**: Many-to-many join table for multi-theme feedback tagging.
- **`FeedbackEmbedding`**: High-dimensional vector storage for semantic retrieval.
- **`VoiceOfCustomerReport`**: Stored executive VOC report with computed metrics and AI narrative.

---

## 🔑 Demo Seed Users & Credentials (Local Development)

The database seed script initializes **Acme Corporation (`acme-corp`)** with 3 pre-configured demo users and **130+ realistic feedback items**:

| Role | Email | Auth Bearer Header / Custom Header | Permissions |
|---|---|---|---|
| **ADMIN** | `admin@loop.dev` | `Authorization: Bearer demo-admin-token` or `x-user-role: admin` | Full Management |
| **ANALYST** | `analyst@loop.dev` | `Authorization: Bearer demo-analyst-token` or `x-user-role: analyst` | Read/Write, AI, Ingestion |
| **VIEWER** | `viewer@loop.dev` | `Authorization: Bearer demo-viewer-token` or `x-user-role: viewer` | Read-Only |

---

## 🛠️ Environment Variables (`.env`)

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/loop_db?schema=public"

# Anthropic Claude API Key (Optional for local testing - heuristic fallback included)
ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

# Session Secret
NEXTAUTH_SECRET="loop-secret-key-32chars-minimum-entropy"
NEXTAUTH_URL="http://localhost:3000"

NODE_ENV="development"
```

---

## 🚀 Local Development Commands

```bash
# 1. Install dependencies
npm install

# 2. Validate and generate Prisma Client
npx prisma validate
npx prisma generate

# 3. Push schema to database and run seed
npm run prisma:push
npm run prisma:seed

# 4. Run test suite
npm run test

# 5. Build for production
npm run build

# 6. Start development server
npm run dev
```

---

## 📑 API Endpoints Summary

| Method | Endpoint | Description | Auth Roles |
|---|---|---|---|
| `GET` | `/api/feedback` | Paginated feedback list with multi-filters & search | All Roles |
| `POST` | `/api/feedback` | Create feedback item & run AI auto-classification | `ADMIN`, `ANALYST` |
| `GET` | `/api/feedback/:id` | Get single feedback item with AI rationale & themes | All Roles |
| `PATCH` | `/api/feedback/:id` | Update feedback status (`NEW` / `REVIEWED` / `RESOLVED` / `ARCHIVED`) | `ADMIN`, `ANALYST` |
| `DELETE`| `/api/feedback/:id` | Delete single feedback item | `ADMIN`, `ANALYST` |
| `POST` | `/api/feedback/status` | Batch update feedback statuses | `ADMIN`, `ANALYST` |
| `POST` | `/api/ingest/csv` | Bulk CSV upload with row-level validation & error reporting | `ADMIN`, `ANALYST` |
| `POST` | `/api/ingest/simulated` | Simulated channel ingestion webhook | `ADMIN`, `ANALYST` |
| `GET` | `/api/analytics/dashboard` | High-level KPIs, sentiment percentages & status distribution | All Roles |
| `GET` | `/api/analytics/themes` | Theme counts, rankings, and sentiment breakdowns | All Roles |
| `GET` | `/api/analytics/themes/:themeId` | Drill-down into a specific theme with feedback records | All Roles |
| `GET` | `/api/analytics/trends` | Time-series trendlines (7d, 30d, 90d buckets) | All Roles |
| `GET` | `/api/analytics/spikes` | Explainable statistical anomaly surge detection | All Roles |
| `POST` | `/api/ask-loop` | Grounded semantic Q&A with evidence citation cards | All Roles |
| `GET` | `/api/reports/voc` | List historical Voice-of-Customer reports | All Roles |
| `POST` | `/api/reports/voc` | Generate & persist new Voice-of-Customer executive report | `ADMIN`, `ANALYST` |
| `GET` | `/api/reports/voc/:id` | Get single Voice-of-Customer report | All Roles |

For full request/response schemas, refer to [`docs/API.md`](./docs/API.md).
