# MentorMaze — Vercel & Render Multi-Cloud Deployment Guide

**Target Production Architecture:**
- **Frontend Layer:** Vercel (Edge Network, Next.js 14 App Router, Server Actions, Dynamic UI)
- **Backend Layer:** Render (Persistent API Web Service + 24/7 Outbox Background Worker Daemon)
- **Database:** Neon PostgreSQL Serverless (with connection pooling)
- **Media RTC:** LiveKit Cloud
- **Security & Bot Defense:** Cloudflare Turnstile

---

## 🏗️ 1. Architecture Overview (Frontend vs. Backend Roles)

```
                         ┌──────────────────────────────────────────┐
                         │              Client Browser              │
                         └────────────────────┬─────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
          [Frontend / Next.js UI]                           [Backend API Routes]
         Vercel Edge & Serverless                          Render Web Service (Node.js)
        mentormaze.aitathastu.com                         mentormaze-backend.onrender.com
                      │                                               │
                      │                                               ▼
                      │                                 ┌───────────────────────────┐
                      │                                 │   Render Outbox Worker    │
                      │                                 │   Continuous Daemon 24/7  │
                      │                                 └─────────────┬─────────────┘
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              ▼
                                 ┌─────────────────────────┐
                                 │     Neon PostgreSQL     │
                                 │    (ACID Outbox & DB)   │
                                 └─────────────────────────┘
```

| Deployment Component | Platform | Primary Purpose | Scaling / Runtime |
| :--- | :--- | :--- | :--- |
| **MentorMaze Frontend** | **Vercel** | Next.js App Router, SSR/SSG, Static Assets, Edge Caching, Webhooks | Serverless / Global Edge |
| **MentorMaze Backend** | **Render** | Standalone Node.js Web API, Heavy Processing, Health Checks (`/api/health`) | Persistent Web Service |
| **MentorMaze Outbox Worker** | **Render** | 24/7 Transactional Outbox processor (AI Tathastu sync, Email dispatch, Webhooks) | Continuous Background Daemon |

---

## ⚡ 2. Frontend Deployment on Vercel

### Step-by-Step Vercel Setup:
1. **Import Git Repository:**
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select `anant9934/mentormaze-with-ai-`.
2. **Framework Preset:**
   - Auto-detected as **Next.js**.
3. **Root Directory:**
   - `./` (repository root).
4. **Environment Variables:**
   Add the following in the Vercel dashboard:
   - `NEXT_PUBLIC_APP_NAME`: `MentorMaze`
   - `NEXT_PUBLIC_APP_URL`: `https://mentormaze.aitathastu.com`
   - `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`: `0x4AAAAAAGPNIAKkr1sYRPY7`
   - `CLOUDFLARE_TURNSTILE_SITE_KEY`: `0x4AAAAAAGPNIAKkr1sYRPY7`
   - `CLOUDFLARE_TURNSTILE_SECRET_KEY`: `0x4AAAAAAGPNIHNxiJ34MZGxFTQm5PKGMKo`
   - `DATABASE_URL`: Your Neon pooled connection string
   - `AUTH_SECRET`: Random 32-character string (`openssl rand -base64 32`)
   - `LIVEKIT_PRIMARY_PROVIDER_ID`: `meet-2uq83g48`
   - `LIVEKIT_PRIMARY_URL`: `wss://meet-2uq83g48.livekit.cloud`
   - `LIVEKIT_PRIMARY_API_KEY`: `APIjJRP4kUctuJB`
   - `LIVEKIT_PRIMARY_API_SECRET`: (Configured in your `.env`)
5. **Deploy:** Click **Deploy**.
6. **Automatic Vercel Cron:**
   - Vercel automatically detects `vercel.json` and configures a cron trigger calling `/api/cron/outbox` every minute as a fallback outbox processor.

---

## 🚀 3. Backend & Worker Deployment on Render

MentorMaze includes an Infrastructure-as-Code Blueprint (`render.yaml`) that configures both the Backend Web Service and Background Worker automatically.

### Option A: 1-Click Render Blueprint Deployment (Recommended)
1. Go to [dashboard.render.com](https://dashboard.render.com) $\rightarrow$ **Blueprints** $\rightarrow$ **New Blueprint Instance**.
2. Connect `anant9934/mentormaze-with-ai-`.
3. Render automatically discovers `render.yaml` and sets up:
   - **`mentormaze-backend` (Web Service)**: Node.js server with `/api/health` monitoring.
   - **`mentormaze-outbox-worker` (Background Worker)**: 24/7 queue daemon running `npm run start:worker`.
4. Enter your secret environment variables (`DATABASE_URL`, `SMTP_PASSWORD`, `LIVEKIT_PRIMARY_API_SECRET`).
5. Click **Apply**.

### Option B: Manual Service Creation on Render
- **Backend Web Service:**
  - Build Command: `npm install && npm run build`
  - Start Command: `npm start`
  - Health Check Path: `/api/health`
- **Background Worker:**
  - Build Command: `npm install`
  - Start Command: `npm run start:worker`

---

## 🐳 4. Docker Deployment (Alternative Container Hosting)

A multi-stage, hardened `Dockerfile` is provided at the repository root:
```bash
# Build production Docker image
docker build -t mentormaze:latest .

# Run Web Service (Port 3000)
docker run -p 3000:3000 --env-file .env mentormaze:latest

# Run Background Worker Daemon
docker run --env-file .env mentormaze:latest npm run start:worker
```

---

## 🔍 5. Verification & Health Check Endpoints

- **Health Check:** `GET /api/health`
  - Returns `200 OK` with detailed system telemetry:
  ```json
  {
    "status": "ok",
    "service": "mentormaze",
    "role": "backend",
    "timestamp": "2026-11-24T00:15:00.000Z",
    "uptimeSeconds": 1420,
    "checks": {
      "database": { "status": "connected", "latencyMs": 14 },
      "outbox": { "status": "active" }
    }
  }
  ```
- **CORS Preflight:** `OPTIONS /api/*`
  - Returns `204 No Content` with dynamic origin validation supporting Vercel and Render domains.
