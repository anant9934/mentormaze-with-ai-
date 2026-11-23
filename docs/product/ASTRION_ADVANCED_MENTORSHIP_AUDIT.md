# ASTRION Advanced Mentorship Intelligence System — Repository & Reference Audit

**Platform:** MentorMaze by AI Tathastu (`https://mentormaze.aitathastu.com`)  
**Component:** ASTRION CORE Architecture (`astrion-core`)  
**Document Version:** 1.0.0  
**Audit Date:** November 2026  
**Auditor:** Antigravity Engineering Intelligence

---

## 1. Executive Summary

This audit assesses the existing MentorMaze codebase and six leading pedagogical/memory reference architectures to establish the foundation for upgrading ASTRION from a conversational AI mentor into an **advanced, evidence-driven Adaptive Mentorship Intelligence System**.

ASTRION must act as **one unified, highly capable human mentor** across learning, technical problem solving, system design, projects, career strategy, and communication role-play. It must never appear as a disjointed collection of disconnected chatbots or switch personas arbitrarily.

### Core Architecture Mandates Enforced
1. **Unified AI Identity:** ASTRION is the single mentor persona (`UNIFIED_MENTOR_IDENTITY`). Internal specialist modules (pedagogy, code review, systems, career, communication) are internal faculties, not separate public bot personalities.
2. **Cloud-Only AI Inference:** All generative AI completions must use cloud-hosted APIs (Google Gemini, Groq, OpenRouter, OpenAI, Anthropic). **Zero** local LLMs, **zero** Ollama daemons, **zero** on-device inference, and **no local fine-tuned weights** in production.
3. **Deterministic Pedagogical Control:** Bayesian Knowledge Tracing (BKT), Free Spaced Repetition Scheduler (FSRS), Zone of Proximal Development (ZPD) activity selection, prerequisite validation, and diagnostic branching are executed via **deterministic TypeScript algorithms**, not unpredictable LLM self-assessment.
4. **Evidence-Backed Learner Model:** The existing `StudentIntelligenceGraph`, `StudentMemoryService`, `StudentGoalService`, and `PermissionAwareContextBuilder` are extended. Confidence scores alone never promote an AI inference to an independently verified fact.
5. **Multi-Tenant Security & Consent:** Strict student-level data isolation is enforced across all API endpoints. Client-supplied query/body user IDs are forbidden from overriding authenticated session identity. All consent purposes (`service_personalization`, `student_memory`, `external_llm_processing`, `mentor_sharing`) are checked prior to processing.

---

## 2. In-Depth Audit of Current MentorMaze Subsystems

### 2.1 ASTRION Conversation Lifecycle
- **Files:** `lib/ai-mentor/orchestrator.ts`, `app/api/ai-mentor/route.ts`, `lib/ai-mentor/conversation-store.ts`
- **Current Flow:**
  1. Student sends message via `POST /api/ai-mentor` with optional `focusArea`, `hintLevel`, `codeSnippet`, and `conversationId`.
  2. Input is passed through `SafetyGuardrails.inspectInput()` (scans for crisis signals, clinical topics, prompt injection, PII). Crisis signals immediately yield a deterministic safety response with Tele-MANAS helpline (14416) contacts.
  3. `SpecialistRegistry.resolveSpecialist()` detects the active internal domain (learning, coding, system design, career, resume, interview).
  4. `PermissionAwareContextBuilder.buildContext()` constructs the student's authorized context snapshot based on consent.
  5. `PedagogyEngine.decide()` selects a teaching strategy (socratic guidance, conceptual explanation, progressive hint, worked example).
  6. `KnowledgeRAGService.retrieve()` injects verified technical/career citations.
  7. `ModelProviderRouter.complete()` generates the mentor response using cloud providers.
  8. Messages and metadata (latency, citations, strategy, hint level) are persisted to `ConversationStore`.
- **Gaps Identified:**
  - Conversations lack structured multi-turn Socratic diagnostic state tracking (e.g., Jane Street's 3–5 question placement loop with prerequisite checks).
  - The teaching mode defaults to quick direct answers or unstructured conversational hints rather than tracking durable task attempts.

### 2.2 ModelProviderRouter
- **Files:** `lib/ai-mentor/model-provider-router.ts`
- **Current Functionality:**
  - Abstraction layer supporting Google Gemini (`gemini-2.5-flash`), Groq (`qwen/qwen3.8-27b`), OpenRouter (`meta-llama/llama-3.3-70b-instruct`), OpenAI (`gpt-4o-mini`), and Anthropic (`claude-3-5-sonnet`).
  - Implements multi-key rotation pools for Gemini, Groq, and OpenRouter.
  - Computes per-request token usage and estimated cost in USD.
  - Telemetry buffer maintains the last 500 requests for admin analytics.
  - Fallback engine falls back to `local_pedagogical` (deterministic rules) when no external cloud keys are configured.
- **Violations & Required Remediation:**
  - The router historically included hooks for `ollama` (`OLLAMA_BASE_URL`) and `mentormaze_2b` (local fine-tuned LoRA weights).
  - **Mandatory Fix:** Formally decommission and disable `ollama` and `mentormaze_2b` from production eligibility. Ensure cloud providers are the only active generative inference endpoints.

### 2.3 PermissionAwareContextBuilder
- **Files:** `lib/ai-mentor/permission-aware-context-builder.ts`
- **Current Functionality:**
  - Enforces cross-tenant ownership (`requestingUserId === studentUserId` or mentor/admin).
  - Checks purpose-specific consent (`service_personalization`). If revoked, returns an unpersonalized sanitized baseline context.
  - Sanitizes context strings against prompt-injection delimiters (`'''`, `<|im_start|>`, `[INST]`, `system:`).
  - Partitions evidence into categories: confirmed facts, student-reported, extracted evidence, system inferences, unverified hypotheses.
- **Defects Identified:**
  - Line 170 contains: `if (mem.studentConfirmed || mem.confidence >= 0.95) { confirmedFacts.push(entry); }`.
  - **Critical Flaw:** Confidence alone promotes an unverified AI inference into a confirmed fact if `confidence >= 0.95`. This directly violates the principle that AI inferences cannot self-promote to verified facts.
  - **Mandatory Fix:** Require explicit verification (`independently_verified`, `assessment_verified`, `mentor_recorded`, or `student_confirmed`) before any memory or skill is classified as a confirmed fact.

### 2.4 StudentIntelligenceGraph
- **Files:** `lib/ai-mentor/student-intelligence-graph.ts`
- **Current Functionality:**
  - Maintains `StudentIntelligenceGraphData` comprising skills, projects, career trajectory, confirmed strengths, confirmed weaknesses, and system hypotheses.
  - In-memory cache backed by SQL tables (`student_skill_nodes`, `student_intelligence_evidence`, `student_learning_profiles`).
  - Precedence weights: `independently_verified` (1.0) > `assessed` (0.9) > `project_demonstrated` (0.8) > `self_reported` (0.7) > `extracted` (0.6) > `inferred` (0.4).
- **Defects Identified:**
  - Lines 129–149 hardcode demo student profiles ("Anant Kumar" from LPU, "Rahul Verma" from Thapar) when no SQL profile exists.
  - **Mandatory Fix:** Remove all hardcoded demo student identities, universities, and default profile attributes from production paths. Missing profiles must construct an empty or authenticated default profile from the logged-in user session.

### 2.5 StudentMemoryService
- **Files:** `lib/ai-mentor/student-memory-service.ts`
- **Current Functionality:**
  - Manages persistent memories across categories (`learning_preferences`, `current_goals`, `confirmed_strengths`, `confirmed_weaknesses`, `active_projects`, `career_objectives`).
  - Dual storage: SQL table `student_memory` with disk JSON snapshot backup for local test resilience.
  - TTL expiration support (`expiresAt`).
  - Cross-user tenant isolation check.
- **Gaps Identified:**
  - Missing fine-grained provenance categorization (needs `student_reported`, `assessment_verified`, `independently_verified`, `project_demonstrated`, `mentor_recorded`, `transcript_extracted`, `ai_inferred`, `external_ecosystem`).
  - Needs structured user correction/deletion endpoints conforming to GDPR/DPDP requirements.

### 2.6 StudentGoalService
- **Files:** `lib/ai-mentor/goals/student-goal-service.ts`
- **Current Functionality:**
  - Full CRUD for student goals with priority (`primary`, `secondary`, `exploratory`), status (`active`, `paused`, `completed`), and state (`not_started`, `in_progress`, `blocked`, `achieved`).
  - Workload and time conflict detection (`detectGoalConflicts`). Computes weekly estimated effort against student-declared available hours.
  - Roadmap milestone linking (`roadmapId`).

### 2.7 Existing Skill Mastery and Evidence Tables
- **Files:** `lib/db/ai-mentor-schema.ts`, `lib/ai-mentor/student-skill-graph.ts`
- **Current Tables:**
  - `student_skill_nodes`: records `masteryState` (varchar: `not_assessed`, `introduced`, `developing`, `demonstrated`, `consistently_demonstrated`), `masteryScore` (real: 0.0–10.0), `confidence`, `knownWeaknesses`, `commonMisconceptions`.
  - `student_skill_dependencies`: defines prerequisite directed edges (`prerequisite_skill_id` -> `skill_id`).
  - `student_skill_evidence`: stores raw assessment scores, feedbacks, and source references.
  - `student_intelligence_evidence`: audit ledger of all facts, provenance, source system, and verification status.
- **Required Alignment:**
  - Must standardize on the canonical 0–5 mastery scale:
    - **0 — Unaware**
    - **1 — Familiar with the concept**
    - **2 — Can follow an explanation**
    - **3 — Can solve with assistance**
    - **4 — Can solve independently**
    - **5 — Can teach the concept and handle unfamiliar edge cases**
  - Promotion between levels must require verified evidence across at least two independent checks.

### 2.8 Learning Assessments and Quizzes
- **Files:** `lib/ai-mentor/assessment/personalized-assessment-service.ts`
- **Current Functionality:**
  - Evaluates student readiness against domain benchmark frameworks (Software Engineering, Machine Learning, Distributed Systems).
  - Generates readiness score, confirmed strengths, confirmed gaps, uncertain areas, and missing essential information.

### 2.9 Roadmap and Milestone Services
- **Files:** `lib/ai-mentor/roadmap/personalized-roadmap-service.ts`
- **Current Functionality:**
  - Dynamically synthesizes 12–24 week milestone plans adapted to diagnostic gap analysis.
  - Preserves completed milestones when roadmaps adapt or goals update.

### 2.10 Conversation Storage & Auth Controls
- **Files:** `lib/ai-mentor/conversation-store.ts`, `app/api/ai-mentor/conversations/route.ts`, `app/api/ai-mentor/skills/route.ts`
- **Critical Security Defect Identified:**
  - In `app/api/ai-mentor/conversations/route.ts`: `resolveAuthenticatedUser` falls back to `req.nextUrl.searchParams.get("userId")` or `"usr-student-1"` if unauthenticated.
  - In `app/api/ai-mentor/skills/route.ts`: defaults to `searchParams.get("userId") || "usr-student-1"`.
  - **Mandatory Fix:** Block unauthenticated access with `401 Unauthorized`. Forbid client query params from overriding authenticated session ID.

### 2.11 Human Mentorship Sessions, Bridge, & AI Tathastu Synchronization
- **Files:** `lib/mentorship/mentorship-bridge-service.ts`, `lib/ai-mentor/integrations/ai-tathastu-sync-service.ts`
- **Current Functionality:**
  - `MentorshipBridgeService`: Generates structured summaries (mentoring history, challenges, progress, questions for mentor) to bridge AI learning sessions with human 1-on-1 mentor appointments. Enforces student consent before sharing.
  - `AiTathastuSyncService`: Provides two-way sync with AI Tathastu Central platform using deterministic idempotency keys (`targetSystem:eventType:studentId:sourceType:sourceId:consentEpoch:sourceVersion`). Outbox pattern prevents duplicate event emissions.

---

## 3. Reference Architecture Review & Engineering Adaptations

### 3.1 Jane Street Socratic Tutor (`janestreet/agent_skills`)
- **License:** MIT License. Permissive open-source; allows reproduction, modification, and integration with attribution.
- **Engineering Patterns to Adapt:**
  1. **Strict Intent Boundaries:** Do not trigger an intensive Socratic interrogation when a student asks a simple factual or explanatory question (e.g., *"What is an index in Postgres?"* vs *"Teach me Postgres indexing"*).
  2. **Topic Decomposition:** Break topics into 4–10 atomic subskills before instruction begins.
  3. **Diagnostic Placement:** Run a concise 3–5 question placement diagnostic, asking strictly **one question per turn**.
  4. **Strict Turn Discipline:** In Socratic mode, never dump the solution in the same turn as a hint. Use narrow counter-questions to help the student spot contradictions in their own reasoning.

### 3.2 Ben Rosche Socratic Tutor (`benrosche/socratic-tutor`)
- **License:** MIT License. Permissive; fully compatible with commercial systems.
- **Engineering Patterns to Adapt:**
  1. **Persistent Assistance Ladder:** Maintain durable attempt counts and hint escalation state in persistent storage (not ephemeral in-memory chat state).
  2. **6-Stage Escalation Ladder:**
     - Level 1: Probing question.
     - Level 2: Conceptual hint.
     - Level 3: Property revelation.
     - Level 4: Simplified micro-example.
     - Level 5: Complete worked example.
     - Level 6: Step-by-step canonical solution explanation.
  3. **Session Persistence:** If a student disconnects and returns, the hint ladder resumes at their exact struggle state.

### 3.3 BloomTutor (`Li-Evan/BloomTutor`)
- **License:** MIT License. Permissive.
- **Engineering Patterns to Adapt:**
  1. **Structured Learning Journey Loop:**
     `Goal` → `Skill Graph` → `Diagnostic Placement` → `Personalized Path` → `Lesson Delivery` → `Guided Practice` → `Student Annotation/Feedback` → `Assessment Check` → `Next Adaptive Activity`.
  2. **Cognitive Load Control:** Deliver content strictly one chunk/lesson at a time with explicit comprehension checkpoints.

### 3.4 Tutor MCP (`ArnaudGuiovanna/tutor-mcp`)
- **License:** MIT License. Permissive.
- **Engineering Patterns to Adapt:**
  1. **Deterministic BKT (Bayesian Knowledge Tracing):**
     - Track latent knowledge state $P(L_t)$ per subskill:
       $$P(L_t | \text{obs}) = \begin{cases} \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)} & \text{if correct} \\ \frac{P(L_{t-1}) \cdot P(S)}{P(L_{t-1}) \cdot P(S) + (1 - P(L_{t-1})) \cdot (1 - P(G))} & \text{if incorrect} \end{cases}$$
       $$P(L_t) = P(L_t | \text{obs}) + (1 - P(L_t | \text{obs})) \cdot P(T)$$
     - Distinguish observation weights: independent success vs. hint-assisted success vs. worked solution study.
  2. **FSRS (Free Spaced Repetition Scheduler):**
     - Track Stability ($S$), Difficulty ($D$), and Retrievability ($R$) per concept.
     - Queue reviews deterministically when $R$ drops below retention threshold (0.85).

### 3.5 Mem0 (`mem0ai/mem0`)
- **License:** Apache 2.0 License. Permissive with explicit patent grant.
- **Engineering Evaluation:**
  - MentorMaze's current SQL-backed `StudentMemoryService` + `student_intelligence_evidence` ledger is already tightly coupled to Drizzle ORM, multi-tenant isolation, and explicit consent epochs.
  - Adding Mem0 as an external dependency would create competing vector/graph datastores, require third-party infrastructure, and complicate consent revocation.
  - **Decision:** Do NOT add Mem0 as a heavy external dependency. Enhance the native `StudentMemoryService` to incorporate Mem0's structured memory categorization (preferences, gaps, commitments, milestones) and purpose-filtered extraction.

### 3.6 SocialCoach (`GeminiLight/SocialCoach`)
- **License:** Apache 2.0 License. Permissive.
- **Engineering Patterns to Adapt:**
  1. **Controlled Role-Play Scenarios:** Structured technical interview, salary negotiation, system design tradeoff debate, giving critical feedback, and asking for help.
  2. **Independent Agent Motivations:** Give simulated counterparties realistic stakes, constraints, and professional skepticism.
  3. **Rubric-Grounded Evaluation:** Score communication against explicit rubrics citing the student's exact quotes as evidence, without psychological labeling.

---

## 4. License & IP Verification Summary

| Project | License | Commercial Permitted | Modification Permitted | Sub-licensing Permitted | Notes / Restrictions |
|---|---|---|---|---|---|
| `janestreet/agent_skills` | MIT | Yes | Yes | Yes | Include copyright notice in documentation |
| `benrosche/socratic-tutor` | MIT | Yes | Yes | Yes | Include copyright notice in documentation |
| `Li-Evan/BloomTutor` | MIT | Yes | Yes | Yes | Include copyright notice in documentation |
| `ArnaudGuiovanna/tutor-mcp` | MIT | Yes | Yes | Yes | Include copyright notice in documentation |
| `mem0ai/mem0` | Apache 2.0 | Yes | Yes | Yes | Do not adopt whole dependency; adapt patterns |
| `GeminiLight/SocialCoach` | Apache 2.0 | Yes | Yes | Yes | Adapt rubric and prompt engineering patterns |

All inspected reference projects carry permissive open-source licenses (MIT or Apache 2.0). None impose copyleft (GPL) requirements. All adaptations in MentorMaze are clean, native TypeScript implementations adhering to existing repository schemas.

---

## 5. Audit Remediation Action Items for PR A

1. **Purge Demo Student Profiles:** Remove hardcoded "Anant Kumar" and "Rahul Verma" data from `student-intelligence-graph.ts` and `permission-aware-context-builder.ts`.
2. **Eliminate Confidence-Only Promotion:** Disallow `confidence >= 0.95` from promoting memories to confirmed facts in `permission-aware-context-builder.ts`.
3. **Plug Auth Bypasses:** Enforce strict session authentication on `/api/ai-mentor/conversations` and `/api/ai-mentor/skills`, forbidding query parameter user ID impersonation.
4. **Decommission Local LLMs:** Disable `ollama` and `mentormaze_2b` local model options from production execution paths in `model-provider-router.ts`.
5. **Implement Socratic Teaching Engine:** Integrate Jane Street-style diagnostic placement, intent detection, 0–5 mastery state, and Ben Rosche-style persistent 6-level hint escalation.
6. **Deliver Complete Vertical Slice:** Ensure student goal selection, skill diagnosis, subskill mapping, Socratic guidance, evidence logging, and session-persistent adaptive activity selection execute end-to-end.
