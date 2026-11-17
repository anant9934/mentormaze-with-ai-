# AI MENTOR LIVE INFERENCE GUIDE
**MentorMaze by AI Tathastu** · Production Domain: `https://mentormaze.aitathastu.com`  
**Route:** `/ai-mentor` · **Admin Observability:** `/admin/ai-mentor`

---

## 1. Multi-Provider Architecture Overview

MentorMaze's AI Mentor operates through a production-grade multi-provider inference router ([`lib/ai-mentor/model-provider-router.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/ai-mentor/model-provider-router.ts)) that abstracts live generative reasoning models from deterministic safety fallbacks:

```
                                  [Student Turn]
                                        │
                                        ▼
                           [Safety & PII Guardrails]
                                        │
                                        ▼
                        [Student Context & Pedagogy Engine]
                                        │
                                        ▼
                          [Model Provider Router]
                                        │
         ┌──────────────────┬───────────┴───────────┬──────────────────┐
         ▼                  ▼                       ▼                  ▼
  [Google Gemini]    [OpenAI GPT-4o]       [Anthropic Claude]    [Ollama Local]
  gemini-1.5-flash   gpt-4o-mini           claude-3-5-sonnet     llama3.2
         │                  │                       │                  │
         └──────────────────┴───────────┬───────────┴──────────────────┘
                                        │ (If keys unset or rate limit 429)
                                        ▼
                     [Deterministic Pedagogical Core]
                          tathastu-pedagogy-v1
                       (Zero-latency, 100% uptime)
```

---

## 2. Environment Configuration

The router resolves credentials dynamically from server-side environment variables. **No API keys are ever sent or exposed to client browsers.**

| Provider | Environment Variable | Model Name | Use Case | Estimated Cost / 1M Tokens |
|---|---|---|---|---|
| **Google Gemini** (Primary) | `GEMINI_API_KEY` | `gemini-1.5-flash` | General concept explanation, Socratic practice, real-time streaming | $0.075 prompt / $0.30 completion |
| **OpenAI** (Fallback) | `OPENAI_API_KEY` | `gpt-4o-mini` | Secondary fallback, fast instruction adherence | $0.15 prompt / $0.60 completion |
| **Anthropic** (Advanced) | `ANTHROPIC_API_KEY` | `claude-3-5-sonnet-20241022` | Complex distributed systems architecture reviews | $3.00 prompt / $15.00 completion |
| **Ollama** (Local Dev) | `OLLAMA_BASE_URL` | `llama3.2` | Local isolated offline development | $0.00 (Self-hosted) |
| **Tathastu Pedagogical Core** | *None required* | `tathastu-pedagogy-v1` | Deterministic baseline & resilient zero-key fallback | $0.00 (In-process) |

### Setup Instructions for Administrators
1. Copy or edit your `.env` file in the root directory:
   ```bash
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
   OPENAI_API_KEY=sk-...your_openai_api_key_here
   ```
2. Verify live configuration by navigating to `/admin/ai-mentor` and inspecting the **Model Providers** panel.
3. The dashboard verifies key presence and displays masked previews (e.g., `AIzaSy...4a2b`) without exposing credentials.

---

## 3. Streaming and Abort Protocol

MentorMaze supports progressive Server-Sent Events (SSE) streaming via `/api/ai-mentor`:
- **Progressive Delivery:** Tokens stream incrementally with natural cadence.
- **Client Cancellation:** Backed by an active `AbortController`. Triggering "Stop Generation" sends an abort signal that halts server chunking and preserves the completed portion of the response.
- **Terminal Metadata:** The final SSE payload (`done: true`) attaches:
  - `requestId` (UUID)
  - `modelProvider` and `inferenceMode` ("generative" vs "deterministic")
  - `tokenUsage` ({ promptTokens, completionTokens, totalTokens })
  - `estimatedCostUsd`
  - `postInteractionCheck` verification question

---

## 4. Telemetry & Error Handling

- **Automatic Fallback:** When external APIs return `429 Too Many Requests`, `503 Service Unavailable`, or authentication errors, the router automatically falls back to `tathastu-pedagogy-v1`.
- **Telemetry Buffer:** Maintains a ring buffer of the last 500 requests, calculating:
  - P50 and P95 latency percentiles
  - Generative vs. deterministic ratio
  - Cumulative USD cost
  - Recent provider error timestamps
- **Zero-Fabrication Guarantee:** When running in deterministic fallback mode, a transparent banner informs the student that local rule-based pedagogy is active.

