# ASTRION Adaptive Mentorship Architecture

**Platform:** MentorMaze by AI Tathastu (`https://mentormaze.aitathastu.com`)  
**Core System:** ASTRION CORE (`astrion-core`)  
**Architectural Identity:** Adaptive Strategic Intelligence & Reasoning Network  
**Document Version:** 1.0.0 — Production Standard  

---

## 1. Architectural Philosophy & Core Tenets

ASTRION is the unified AI Mentorship Intelligence for MentorMaze. It operates as **one singular, exceptionally capable mentor** rather than a fragmented suite of disjointed specialist bots.

```
+---------------------------------------------------------------------------------------------------+
|                                        STUDENT INTERFACE                                          |
|                               (Chat, Practice, Diagnostics, Progress)                             |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                  ASTRION CORE ORCHESTRATOR                                        |
|  - Unified Mentor Identity (UNIFIED_MENTOR_IDENTITY)                                              |
|  - Single Turn Lifecycle & Streaming Response Engine                                              |
+-------+--------------------+-------------------+---------------------+--------------------+-------+
        |                    |                   |                     |                    |
        v                    v                   v                     v                    v
+---------------+    +---------------+   +---------------+    +-----------------+   +---------------+
| Safety & PII  |    | Intent & Mode |   | Context &     |    | Pedagogical     |   | Deterministic |
| Guardrails    |    | Classifier    |   | Consent       |    | Decision Engine |   | Learning Alg. |
| - Crisis (14416)   | - Socratic    |   | Aggregator    |    | - Socratic      |   | - BKT State   |
| - Injection   |    | - Diagnostic  |   | - Purpose Chk |    | - Hints (1-6)   |   | - FSRS Spaced |
| - Clinical    |    | - Practice    |   | - Evidence    |    | - Concept Expl. |   | - ZPD Select  |
+---------------+    +---------------+   +---------------+    +-----------------+   +---------------+
        |                    |                   |                     |                    |
        +--------------------+-------------------+---------------------+--------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                     CLOUD-ONLY MODEL ROUTER                                       |
|  - Google Gemini 2.5 Flash / Flash Latest (Primary Educational & General Reasoning)              |
|  - Groq LPU (Ultra-Low Latency Inference Pool)                                                    |
|  - OpenRouter Multi-Model Gateway (Llama 3.3 70B Frontier Fallback)                               |
|  - OpenAI (GPT-4o-mini Coding & Reasoning)                                                        |
|  - Anthropic Claude 3.5 Sonnet (Advanced Reasoning & Role-Play)                                  |
|  * Strictly NO Local LLMs / NO Ollama / NO Local Model Hosting in Production                      |
|  * Deterministic Local Pedagogical Fallback when Keys are Unconfigured                            |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 AUTHORITATIVE PERSISTENCE LAYER                                   |
|  - PostgreSQL via Drizzle ORM                                                                     |
|  - student_skill_nodes (0-5 Mastery) & student_skill_dependencies                                  |
|  - student_intelligence_evidence (8 Provenance Tiers)                                             |
|  - ai_mentor_goals & ai_mentor_roadmaps & ai_mentor_roadmap_milestones                             |
|  - student_memory & student_purpose_consents                                                      |
|  - ai_mentor_conversations & ai_mentor_messages                                                    |
+---------------------------------------------------------------------------------------------------+
```

### Invariant Architectural Rules
1. **No Bot Switching:** The user never encounters a "coding bot", a "career bot", or an "interview bot". ASTRION draws upon specialized faculties internally while preserving its identity, tone, and memory.
2. **Cloud-Hosted Model Inference Only:** Model inference is conducted strictly via secured cloud endpoints with API key rotation, request timeouts, and cost tracking. No Ollama, no on-device weights, and no local fine-tuned models in production.
3. **Deterministic Pedagogical Control:** Student skill progression is governed by deterministic cognitive models (Bayesian Knowledge Tracing, FSRS, prerequisite graph traversal) rather than stochastic LLM self-assessment.
4. **Evidence-Driven State:** Every assertion about a student's ability is backed by a structured evidence record with explicit provenance, verification status, and timestamp.
5. **Multi-Tenant Isolation & Zero Trust:** All operations verify ownership against the authenticated session user ID. Client-supplied query/body user IDs can never override authentication.

---

## 2. Component Architecture & System Boundaries

### 2.1 Central Orchestrator (`AIMentorOrchestrator`)
The entry point for all student interactions. It runs an 8-stage pipeline:
1. **Input Inspection:** Screen for safety boundaries, crisis signals, clinical topics, and prompt-injection tokens.
2. **Intent & Mode Detection:** Categorize student intent (one-off question, explanation request, teach me, quiz me, debug my code, practice interview, review progress).
3. **Authorized Context Assembly:** Retrieve student profile, goals, active subskill map, and validated memories filtered by purpose consent (`service_personalization`).
4. **Pedagogical Strategy Selection:** Choose strategy from Socratic question, conceptual explanation, progressive hint (levels 1–6), worked example, guided practice, retrieval quiz, or transfer challenge.
5. **Knowledge Retrieval (RAG):** Retrieve verified technical documentation, interview rubrics, and curriculum nodes from verified collections.
6. **Cloud Model Inference:** Format system prompt and context for `ModelProviderRouter` using the highest-priority available cloud API.
7. **Evidence & State Update:** Record assessment evidence, update 0–5 mastery state, update persistent hint escalation history, and adjust the learning path.
8. **Durable Persistence:** Save turn records, token metrics, and metadata to PostgreSQL.

### 2.2 Learner Model & Skill Graph Subsystem
- **Canonical 0–5 Mastery Scale:** Unifies skill tracking across all platform surfaces:
  - `0`: Unaware
  - `1`: Familiar with concept
  - `2`: Can follow an explanation
  - `3`: Can solve with assistance
  - `4`: Can solve independently
  - `5`: Can teach concept and handle unfamiliar edge cases
- **Multi-Evidence Verification:** Promoting a skill from Level 3 to Level 4 requires at least two independent checks, including an unprompted recall, practical code execution, or transfer challenge.

### 2.3 Socratic Teaching & Diagnostic Engine
- **Diagnostic Placement:** When encountering a new topic, decomposes it into 4–10 subskills, queries prerequisites, and conducts a 3–5 question placement diagnostic (asking strictly 1 question per turn).
- **Persistent Hint Escalation Ladder:** Durable 6-level hint progression tracked per student, skill, and exercise. State persists across separate browser sessions.

### 2.4 Deterministic Cognitive Algorithms
- **Bayesian Knowledge Tracing (BKT):** Updates latent skill probability $P(L_t)$ from structured assessment events.
- **Free Spaced Repetition Scheduler (FSRS):** Computes memory stability, difficulty, and retrievability to maintain a daily review queue.
- **Zone of Proximal Development (ZPD) Orchestrator:** Selects optimal next activities where prerequisite mastery $\ge 3$ and target skill mastery $< 4$.

---

## 3. Security, Privacy & Data Governance

1. **Session Enforcement:** Every API route verifies `getServerSession(req)`. Unauthenticated requests receive `401 Unauthorized`.
2. **Ownership Guard:** Any attempt to query or mutate another student's data without mentor/admin roles is rejected with `403 Forbidden`.
3. **Consent Purposes:** Granular consent ledger (`student_purpose_consents`) governs:
   - `service_personalization`
   - `student_memory`
   - `external_llm_processing`
   - `mentor_sharing`
4. **Revocation Semantics:** When consent for a purpose is revoked, affected context blocks immediately revert to unpersonalized baselines.
