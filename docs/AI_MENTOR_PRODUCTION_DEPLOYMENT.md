# AI MENTOR PRODUCTION DEPLOYMENT GUIDE
**MentorMaze by AI Tathastu** · Production Domain: `https://mentormaze.aitathastu.com`  
**Application Server:** Next.js 14 App Router · Node.js 18+

---

## 1. Production Architecture & Topology

The AI Mentor is deployed as an integral subsystem of MentorMaze:

```
[Vercel / Node.js Production Host]
  ├── /ai-mentor (React Client Workspace, SSE Streaming, Code Lab, Memory UI)
  ├── /admin/ai-mentor (Staff Telemetry, Model Roster, Benchmark Runner)
  │
  ├── /api/ai-mentor (Central Turn Dispatcher, SSE Streamer)
  ├── /api/ai-mentor/conversations (Conversation Persistence CRUD)
  ├── /api/ai-mentor/memory (Structured Student Memory with User Ownership)
  ├── /api/ai-mentor/skills (Hierarchical Skill Graph Calibration)
  └── /api/admin/ai-mentor (Telemetry Aggregator, Provider Health, RAG Stats)
  │
  ├── Model Provider Router (Gemini -> OpenAI -> Claude -> Ollama -> Tathastu Core)
  ├── 8 RAG Collections (SHA-256 Deduplicated Pedagogical Corpus)
  └── Neon PostgreSQL (Drizzle ORM & pgvector Vector Store)
```

---

## 2. Environment Variables Checklist

Ensure the following variables are configured in production:

```bash
# Core Platform Configuration
NEXT_PUBLIC_APP_URL="https://mentormaze.aitathastu.com"
NODE_ENV="production"

# Database & Vector Storage
DATABASE_URL="postgresql://user:password@ep-mentor-maze.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Generative AI Model Providers
GEMINI_API_KEY="AIzaSy..."          # Primary generative inference engine
OPENAI_API_KEY="sk-..."             # Secondary general inference fallback
ANTHROPIC_API_KEY="sk-ant-..."      # High-complexity architecture reasoning
OLLAMA_BASE_URL="http://localhost:11434" # Optional local development cluster
```

> **Security Rule**: Never prefix provider API keys with `NEXT_PUBLIC_`. All provider invocations occur exclusively within server-side routes.

---

## 3. Production Health Check & Monitoring Endpoints

| Endpoint | Method | Expected Output | Purpose |
|---|---|---|---|
| `/api/health` | `GET` | `{"status":"ok","timestamp":"..."}` | Load balancer keep-alive |
| `/api/admin/ai-mentor` | `GET` | `{"success":true,"data":{"providers":...,"telemetry":...}}` | Real-time observability dashboard |
| `/api/ai-mentor/conversations?userId=...` | `GET` | `{"success":true,"conversations":[...]}` | Conversation persistence check |
| `/api/ai-mentor/eval` | `POST` | `{"success":true,"benchmark":{...}}` | On-demand holdout evaluation run |

---

## 4. Build & Deployment Commands

```bash
# Install dependencies
npm ci

# Run test suite to verify 100% pass rate
npx vitest run tests/matching-100-factors.test.ts tests/platform.test.ts tests/ai-mentor-intelligence.test.ts tests/ai-mentor-phase2.test.ts

# Production build
npm run build

# Start daemon server on port 3000
npm start
```
