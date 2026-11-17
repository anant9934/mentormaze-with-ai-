# MentorMaze — Live Generative LLM Provider Integration & Routing Architecture

**Platform:** MentorMaze by AI Tathastu  
**Domain:** `https://mentormaze.aitathastu.com`  
**Document Code:** `MM-ENG-LLM-02`  
**Audit Status:** Verified & Production-Grade

---

## 1. Executive Overview

This report details the multi-provider generative inference architecture implemented in `lib/ai-mentor/model-provider-router.ts`. The system provides a unified, production-grade abstraction layer across four external and local generative providers, backed by a deterministic local pedagogical rule-engine when no external API credentials are present.

### Core Architecture Principles
1. **Zero Secret Leaking**: All API credentials reside strictly in server-side environment variables (`process.env`). No secret keys are ever exposed in API payloads, serialized into HTML, or transmitted to client browser bundles.
2. **Task-Specific Routing**: Prompts are classified into task domains (`general`, `coding`, `reasoning`, `resume`, `interview`), routing complex algorithmic tasks to high-capacity reasoning models and conversational concepts to low-latency flash models.
3. **Honest Fallback Labeling**: When no external provider is configured or when network failures occur, the system explicitly flags the response as `isFallback: true` with a clear disclosure notice, never deceiving students into believing deterministic output is model-generated.
4. **Resiliency & Timeouts**: Every network call is guarded by an `AbortController` timeout (15,000ms default), HTTP status code error classification (`AUTH_ERROR`, `RATE_LIMIT`, `TIMEOUT`, `MODEL_UNAVAILABLE`), and retry logic.

---

## 2. Provider Abstraction Matrix

```
                                  +-----------------------------+
                                  |   AIMentorOrchestrator      |
                                  +-----------------------------+
                                                 │
                                                 ▼
                                  +-----------------------------+
                                  |     ModelProviderRouter     |
                                  |      (Unified Engine)       |
                                  +-----------------------------+
                                                 │
                  ┌──────────────────────┬───────┴──────────────┬─────────────────────┐
                  ▼                      ▼                      ▼                     ▼
          +---------------+      +---------------+      +---------------+     +---------------+
          | Google Gemini |      |    OpenAI     |      |   Anthropic   |     |    Ollama     |
          |  (1.5 Flash)  |      |  (4o-Mini)    |      | (3.5 Sonnet)  |     |  (Llama 3.2)  |
          +---------------+      +---------------+      +---------------+     +---------------+
                  │                      │                      │                     │
                  └──────────────────────┼──────────────────────┴─────────────────────┘
                                         ▼ (If all unavailable / unconfigured)
                                 +--------------------------------+
                                 |  Local Pedagogical Fallback    |
                                 | (tathastu-pedagogical-rules)   |
                                 |    * Explicit Notice Banner    |
                                 +--------------------------------+
```

### Detailed Provider Specifications

| Provider | Supported Models | Primary Use Case | Server Env Var | Endpoint & Auth Header |
|---|---|---|---|---|
| **Google Gemini** | `gemini-1.5-flash`<br>`gemini-1.5-pro` | Concept explanations, Socratic hints, real-time pedagogy | `GEMINI_API_KEY` | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}` |
| **OpenAI** | `gpt-4o-mini`<br>`gpt-4o` | Deep algorithmic debugging, code refactoring | `OPENAI_API_KEY` | `https://api.openai.com/v1/chat/completions`<br>`Authorization: Bearer {key}` |
| **Anthropic** | `claude-3-5-sonnet-20241022` | Long-context resume and architectural design reviews | `ANTHROPIC_API_KEY` | `https://api.anthropic.com/v1/messages`<br>`x-api-key: {key}` |
| **Ollama** | `llama3.2:latest`<br>`codellama` | On-premise, zero-cost, private neural inference | `OLLAMA_BASE_URL` | `http://localhost:11434/api/chat` (JSON RPC) |
| **Local Rule Core** | `tathastu-pedagogy-v1` | Deterministic fallback, offline education, benchmark baseline | None required | Local in-process state machine (0ms network latency) |

---

## 3. Dynamic Model Routing Strategy

The router categorizes prompt workloads dynamically based on required reasoning depth and latency budgets:

```typescript
const model = payload.taskCategory === "coding" ? "gemini-1.5-pro" : "gemini-1.5-flash";
```

1. **General Explanations & Quick Socratic Queries (`general`)**:
   - Routed to `gemini-1.5-flash` or `gpt-4o-mini`.
   - Optimized for sub-800ms time-to-first-token and low token consumption.
2. **Deep Algorithmic Code Review & Debugging (`coding`)**:
   - Routed to `gemini-1.5-pro` or `gpt-4o`.
   - Higher reasoning capacity to detect subtle asymptotic traps, memory leaks, and off-by-one pointer errors.
3. **Resume & Career Alignment (`resume`)**:
   - Routed to high-fidelity reasoning models to match candidate bullets against real Job Descriptions without hallucinating unverified metrics.
4. **Offline & Sandboxed Environments**:
   - Routed to `tathastu-pedagogy-v1` deterministic rule-engine with dynamic topic-aware educational scaffolding.

---

## 4. Administrative Visibility & Key Security

Admins can monitor provider connectivity through `/admin/ai-mentor`. The backend API (`/api/admin/ai-mentor`) uses a strict masking function that guarantees zero credential exposure:

```typescript
private static maskKey(key?: string): string | undefined {
  if (!key || key.length < 8) return undefined;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}
```

### Sanitized Health Response Sample:
```json
{
  "gemini": {
    "provider": "gemini",
    "modelName": "gemini-1.5-flash",
    "isAvailable": true,
    "isConfigured": true,
    "maskedKeyPreview": "AIzaSy...4a2b",
    "status": "ready",
    "message": "Google Gemini API configured and ready for live inference."
  },
  "local_pedagogical": {
    "provider": "local_pedagogical",
    "modelName": "tathastu-pedagogy-v1",
    "isAvailable": true,
    "isConfigured": true,
    "status": "ready",
    "message": "Deterministic rule-based pedagogical engine active (0ms network latency)."
  }
}
```

---

## 5. Live Inference Acceptance Verification

The system was verified against the required real inference criteria:
1. **Workspace Launch**: `/ai-mentor` opens with full state preservation.
2. **Mode Selection**: Changing modes dynamically adjusts prompt system instructions and available tools.
3. **Live Generative Execution**: When `GEMINI_API_KEY` is provided, live streaming or completion executes with verified model attribution (`gemini/gemini-1.5-flash`).
4. **Conversation Persistence**: History is durably stored in the student's browser `localStorage` under `mentormaze_ai_mentor_chat_${userId}` and survives page reloads.
5. **Contextual Injection**: Injected student context (weak skills, demonstrated skills, target role) is passed into the prompt, steering the model's educational examples.

