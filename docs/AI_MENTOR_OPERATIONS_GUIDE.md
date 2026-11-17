# AI Mentor Operations & Deployment Guide

**System:** MentorMaze AI Mentor  
**Target Environment:** Node.js 20+ / Next.js 14 Production Server / Neon Serverless PostgreSQL  
**Domain:** `https://mentormaze.aitathastu.com`

---

## 1. Prerequisites & Environment Variables

The system runs out-of-the-box using the local deterministic pedagogical core (`tathastu-pedagogy-v1`). External LLM API keys are optional and can be added to `.env` or the production secret store to activate multi-provider failover:

```bash
# Optional External Model Providers (Never commit real keys to source control)
GEMINI_API_KEY="AIzaSy..."
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-..."
OLLAMA_BASE_URL="http://localhost:11434"

# PostgreSQL Database (Neon Serverless Connection String)
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-withered-heart-bebleio4.neon.tech/neondb?sslmode=require"
```

---

## 2. Production Build & Server Lifecycle

### Building for Production
```bash
npm run build
```
The build executes TypeScript type checking, route linting, and static optimization across all 75+ application routes.

### Starting Production Daemon
```bash
node ./node_modules/next/dist/bin/next start -p 3000
```
Server binds to port 3000 with sub-150ms boot time.

---

## 3. Health & Telemetry Verification

### Health Probe
```bash
curl -I http://localhost:3000/ai-mentor
# Expected: HTTP/1.1 200 OK
```

### Turn Latency Probe
```bash
curl -s -X POST http://localhost:3000/api/ai-mentor \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain Cache-Aside directly","mode":"learn"}' | grep "latencyMs"
# Expected: latencyMs <= 1.0ms on local core
```

### Benchmark Suite Trigger
```bash
curl -s http://localhost:3000/api/ai-mentor/eval | grep "socraticQuotientScore"
# Expected: socraticQuotientScore >= 85%
```

---

## 4. Disaster Recovery & Rollback

- **Fallback Cascade**: If an external provider (Gemini or OpenAI) fails, times out, or throws a quota limit, `ModelProviderRouter` automatically cascades to `tathastu-pedagogy-v1` with zero student-facing interruption.
- **Rollback**: If a code change degrades performance, revert to Git commit `2385be6` or latest tag.
