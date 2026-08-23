# LOOP — API Documentation & Frontend Integration Guide

This document specifies the complete API contracts for **LOOP — AI Customer-Feedback Intelligence Platform**.

## Base URL
All API routes are served under `/api`.

## Authentication & Headers
Requests automatically inherit the active session. For development/testing/simulation, client requests can send:

| Header | Description | Default / Example |
|---|---|---|
| `x-user-role` | Overrides the active user role (`admin` \| `analyst` \| `viewer`) | `admin` |
| `x-workspace-id` | Explicit workspace context | `ws_demo_acme` |
| `Authorization` | Bearer token auth | `Bearer demo-admin-token` |
| `Content-Type` | Standard JSON payload header | `application/json` |

## Standard Error Response Format
All error responses adhere to the standard JSON structure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR | FORBIDDEN | NOT_FOUND | BAD_REQUEST | INTERNAL_SERVER_ERROR",
    "message": "Human-readable explanation of error",
    "details": [...]
  }
}
```

---

## 1. Feedback Management APIs

### `GET /api/feedback`
Retrieves a paginated, filterable list of customer feedback.

**Query Parameters:**
- `page` (number, default: `1`): Current page.
- `pageSize` (number, default: `20`, max: `100`): Items per page.
- `search` (string, optional): Server-side search over feedback text, customer name, customer email, and feature area.
- `sentiment` (enum, optional): `POSITIVE` | `NEUTRAL` | `NEGATIVE`
- `status` (enum, optional): `NEW` | `REVIEWED` | `RESOLVED` | `ARCHIVED`
- `source` (string, optional): `Website` | `App` | `Support` | `Survey` | `Social` | `CSV Import`
- `theme` (string, optional): Specific theme name filter (e.g. `Payment Gateway Failures`)
- `featureArea` (string, optional): Specific feature area (e.g. `Billing & Pricing`)
- `startDate` / `endDate` (string, optional): ISO date string or `YYYY-MM-DD`
- `sortBy` (enum, default: `createdAt`): `createdAt` | `sentimentScore` | `status`
- `sortOrder` (enum, default: `desc`): `asc` | `desc`

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx...",
        "workspaceId": "ws_demo_acme",
        "source": "Website",
        "customerName": "Sarah Jenkins",
        "customerEmail": "sarah.j@acmecorp.net",
        "rawText": "My credit card was charged twice for the renewal.",
        "status": "NEW",
        "sentiment": "NEGATIVE",
        "sentimentScore": -0.85,
        "featureArea": "Billing & Pricing",
        "aiRationale": "AI classified as negative (-0.85) concerning Billing & Pricing.",
        "aiStatus": "COMPLETED",
        "createdAt": "2026-08-21T12:00:00.000Z",
        "updatedAt": "2026-08-21T12:00:00.000Z",
        "themes": [
          { "id": "th_1", "name": "Payment Gateway Failures" }
        ]
      }
    ],
    "total": 130,
    "page": 1,
    "pageSize": 20,
    "totalPages": 7,
    "hasMore": true
  }
}
```

---

### `POST /api/feedback`
Creates a single feedback item and triggers server-side AI auto-classification.

**Authorization:** `ADMIN` or `ANALYST`

**Request Body:**
```json
{
  "rawText": "The new dark mode design is gorgeous and super easy on the eyes!",
  "source": "Website",
  "customerName": "David Miller",
  "customerEmail": "david@example.com",
  "status": "NEW",
  "skipAi": false
}
```

**Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "sentiment": "POSITIVE",
    "sentimentScore": 0.92,
    "featureArea": "UI / UX",
    "aiRationale": "Feedback demonstrates positive customer sentiment concerning ui / ux (Dark Mode Request).",
    "aiStatus": "COMPLETED"
  }
}
```

---

### `GET /api/feedback/:id`
Retrieves a single feedback item by ID with full AI analysis and linked themes.

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "rawText": "...",
    "sentiment": "POSITIVE",
    "sentimentScore": 0.95,
    "analysis": {
      "sentiment": "POSITIVE",
      "sentimentScore": 0.95,
      "themes": ["Login & SSO"],
      "featureArea": "Authentication",
      "rationale": "...",
      "model": "claude-3-5-sonnet-20241022"
    },
    "themes": [
      { "id": "th_1", "name": "Login & SSO" }
    ]
  }
}
```

---

### `PATCH /api/feedback/:id`
Updates the lifecycle status of a feedback item.

**Authorization:** `ADMIN` or `ANALYST`

**Request Body:**
```json
{
  "status": "RESOLVED"
}
```

---

### `POST /api/feedback/status`
Batch updates status for multiple feedback IDs.

**Authorization:** `ADMIN` or `ANALYST`

**Request Body:**
```json
{
  "feedbackIds": ["id_1", "id_2", "id_3"],
  "status": "REVIEWED"
}
```

---

## 2. Ingestion APIs

### `POST /api/ingest/csv`
Bulk imports customer feedback from CSV text or multipart file upload.

**Authorization:** `ADMIN` or `ANALYST`

**JSON Payload Format:**
```json
{
  "csvContent": "text,source,customerName,customerEmail\n\"App crashed on login\",App,John,john@test.com",
  "source": "CSV Import",
  "skipAi": false
}
```
*Also supports `multipart/form-data` with `file` field.*

**Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "successful": 147,
    "failed": 3,
    "createdIds": ["id_1", "id_2"],
    "errors": [
      {
        "rowNumber": 12,
        "data": { "text": "" },
        "reason": "Feedback text is required"
      }
    ]
  }
}
```

---

### `POST /api/ingest/simulated`
Ingests webhook payloads from simulated customer touchpoints.

**Authorization:** `ADMIN` or `ANALYST`

**Request Body:**
```json
{
  "source": "Support",
  "text": "User reported that invoice receipts are missing company tax IDs.",
  "customerIdentifier": "Enterprise Client #402",
  "customerEmail": "finance@client402.com"
}
```

---

## 3. Analytics & Intelligence APIs

### `GET /api/analytics/dashboard`
Provides consolidated KPI counters and sentiment ratios for dashboard widgets.

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "totalFeedback": 130,
    "sentimentCounts": { "positive": 60, "neutral": 28, "negative": 42 },
    "sentimentPercentages": { "positive": 46.2, "neutral": 21.5, "negative": 32.3 },
    "averageSentimentScore": 0.18,
    "activeThemesCount": 14,
    "activeSpikesCount": 2,
    "statusCounts": { "new": 72, "reviewed": 31, "resolved": 27, "archived": 0 }
  }
}
```

---

### `GET /api/analytics/themes`
Returns theme rankings, frequency, and sentiment distribution per theme.

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "th_1",
      "name": "Payment Gateway Failures",
      "count": 18,
      "percentage": 13.8,
      "sentimentBreakdown": { "positive": 0, "neutral": 1, "negative": 17 },
      "recentTrend": "UP"
    }
  ]
}
```

---

### `GET /api/analytics/themes/:themeId`
Drills down into a specific theme, returning theme metadata and recent feedback records.

---

### `GET /api/analytics/trends?period=7d|30d|90d`
Retrieves daily time-series buckets for volume and sentiment trajectory.

---

### `GET /api/analytics/spikes`
Statistical anomaly spike detector comparing 7-day rolling volume against historical baseline averages ($\Delta \ge 100\%$).

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "theme": "Payment Gateway Failures",
      "currentCount": 14,
      "baselineAverage": 4.0,
      "changePercent": 250.0,
      "isSpike": true,
      "explanation": "Surged +250.0% in the last 7 days (14 mentions vs 4.0 baseline avg)."
    }
  ]
}
```

---

## 4. Ask LOOP — Semantic Grounded Assistant

### `POST /api/ask-loop`
Performs semantic vector retrieval against workspace embeddings and asks Claude to synthesize a grounded, cited answer.

**Request Body:**
```json
{
  "question": "What are customers saying about payment issues?",
  "topK": 5
}
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "question": "What are customers saying about payment issues?",
    "answer": "Customers frequently report checkout failures accompanied by timeout error codes and delays in receiving refunds for duplicate charges.",
    "grounded": true,
    "evidence": [
      {
        "feedbackId": "clx...",
        "text": "My credit card was charged twice for the renewal...",
        "similarity": 0.8921,
        "source": "Website",
        "sentiment": "NEGATIVE",
        "featureArea": "Billing & Pricing",
        "createdAt": "2026-08-21T12:00:00.000Z"
      }
    ],
    "metadata": {
      "retrievedCount": 5,
      "averageSimilarity": 0.8124,
      "model": "claude-3-5-sonnet-20241022"
    }
  }
}
```

---

## 5. Voice-of-Customer (VOC) Reports

### `GET /api/reports/voc`
Lists all generated Voice-of-Customer executive reports.

### `POST /api/reports/voc`
Generates and persists a new Voice-of-Customer report with an AI-synthesized executive narrative.

**Authorization:** `ADMIN` or `ANALYST`

**Request Body:**
```json
{
  "period": "Last 30 Days"
}
```

### `GET /api/reports/voc/:id`
Retrieves a single VOC report for display and export.
