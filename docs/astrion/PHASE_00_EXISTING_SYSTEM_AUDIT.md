# PHASE 00 — EXISTING SYSTEM & REPOSITORY AUDIT
## ASTRION — Unified Multi-LLM Intelligence Platform
**Product:** MentorMaze by AI Tathastu (`mentormaze.aitathastu.com`)  
**Audit Timestamp:** 2026-11-19T21:30:00+05:30  
**Environment:** macOS (Apple Silicon M4, 16 GB Unified Memory)  
**Branch:** `main` | **Node/Next.js:** Next.js 14.2.35 / React 18.3.1  
**Database:** Dual-Engine (PostgreSQL Neon Serverless / PGlite WASM Local) + In-Memory Fallback  
**Local ML Stack:** PyTorch 2.4+ (Apple MPS), HuggingFace Transformers, PEFT LoRA, Qwen3.5-2B-Base  

---

# 1. EXECUTIVE SUMMARY

An exhaustive forensic audit of the MentorMaze repository was conducted to assess all architectural subsystems required for the implementation of **ASTRION (Adaptive Strategic Intelligence & Reasoning Network)** under **AI Tathastu**.

The system already possesses a highly sophisticated, production-grade AI mentor workspace UI, a central model provider router with live cloud fallback (Gemini 2.5 Flash, Groq Llama 3.3, offline pedagogical rules), an authoritative pedagogical engine with 8 canonical specialist modules, an empirical 105-query retrieval benchmark (97.89% Recall@5), and a curated 8,483-example training corpus (`mentormaze-v2`).

However, several critical architectural gaps were uncovered:
1. **Database Schema Disconnect**: While `lib/db/ai-mentor-schema.ts` defines 17 relational tables for conversations, messages, skill nodes, student memory, roadmaps, and evaluation runs, `lib/db/index.ts` never initializes them in PostgreSQL/PGlite. Consequently, conversation history and student memory currently fall back to local JSON disk persistence (`.mentormaze-conversations.json` and `.mentormaze-memories.json`).
2. **Ecosystem & External Integrations are Mocked**: Context references to AI Tathastu ecosystem products (*Collaborate*, *Avsar*, *IRIS*) and external developer platforms (*GitHub*, *LinkedIn*, *LeetCode*) are currently simulated with mock records in `lib/ai-mentor/student-context-builder.ts`. No live OAuth connectors, sync webhooks, or API clients exist yet.
3. **Keyword-Based RAG vs. Vector Retrieval**: Retrieval-Augmented Generation (`KnowledgeRAGService`) operates via an in-memory inverted index and keyword token scoring over 8 seeded curriculum documents, rather than live dense vector embeddings (`pgvector` / HNSW).
4. **Local Model Incomplete Training State**: The local adapter `mentormaze-2b-core-sft-v2` has executed only 1 training step (2 examples, 0.03% epoch coverage), while `v1` executed 25 steps (200 examples). Neither candidate has completed a full training epoch. The local inference script (`serve_model.py`) is verified and functional on MPS, but runs as a separate daemon.
5. **Multi-Specialist Synthesis Limitation**: While the 8 specialist capabilities are defined and verified, request orchestration dispatches to a single specialist per turn; cross-specialist multi-domain joint synthesis (e.g. simultaneous architecture + resume + code review) is not yet orchestrated.

---

# 2. SUBSYSTEM AUDIT & CLASSIFICATION MATRIX

Every subsystem has been verified against physical code, test suites, and runtime logs:

| Component / Subsystem | Primary Path(s) | Status | Key Evidence / Observations |
| :--- | :--- | :--- | :--- |
| **ASTRION Studio UI Shell** | `app/ai-mentor/page.tsx`<br>`components/ai-mentor/` | **VERIFIED** | Full-viewport studio shell, left navigation sidebar, 8 specialist chips, DM Serif Display typography, verified in Headless Chrome 1440×900. |
| **ASTRION CORE Orchestrator** | `lib/ai-mentor/orchestrator.ts` | **VERIFIED** | Central pipeline: safety guardrail check, intent resolution, context injection, unified system prompt, turn dispatch. |
| **8 Specialist Capabilities** | `lib/ai-mentor/specialists/` | **VERIFIED** | SAGE, CIPHER, ATLAS, FORGE, VECTRA, PRISM, ORACLE, CHRONOS fully defined and registered in `SpecialistRegistry`. |
| **Multi-Specialist Synthesis** | `lib/ai-mentor/orchestrator.ts` | **PARTIALLY IMPLEMENTED** | Single-specialist dispatch per turn. Does not yet decompose complex queries across multiple specialists in a single turn. |
| **Model Provider Router** | `lib/ai-mentor/model-provider-router.ts` | **VERIFIED** | 1333-line router with live Gemini 2.5 Flash, Groq, offline pedagogical engine, token usage tracking, 500-event telemetry buffer. |
| **Local Model Server (`serve_model.py`)** | `training/scripts/serve_model.py` | **VERIFIED** | OpenAI-compatible HTTP server loading Qwen3.5-2B-Base + LoRA safetensors on Apple Silicon MPS. |
| **Core Database Schema** | `lib/db/schema.ts` | **VERIFIED** | 35+ tables (users, userIdentities, studentProfiles, studentSkills, studentGoals, consentGrants, auditLogs). |
| **AI Mentor DB Schema** | `lib/db/ai-mentor-schema.ts` | **PARTIALLY IMPLEMENTED** | 17 tables defined, but DDL not executed in `lib/db/index.ts`. System currently falls back to JSON file stores. |
| **Student Memory Service** | `lib/ai-mentor/student-memory-service.ts` | **PARTIALLY IMPLEMENTED** | 8 memory categories, confidence scoring, 403 ownership checks, but persists to `.mentormaze-memories.json` instead of SQL. |
| **Student Intelligence Graph** | `lib/ai-mentor/student-skill-graph.ts` | **PARTIALLY IMPLEMENTED** | 18-node DAG with prerequisite verification in-memory. Not connected to relational `student_skill_nodes` or `student_skill_evidence`. |
| **Context Aggregator** | `lib/ai-mentor/student-context-builder.ts` | **PARTIALLY IMPLEMENTED** | Aggregates profile, mentorship history, active projects. Seeded fallback personas ("Anant Kumar", "Rahul Verma"). |
| **AI Tathastu Connectors** | `lib/ai-mentor/student-context-builder.ts` | **MOCKED** | Collaborate, Avsar, and IRIS are simulated via static mock project objects. No real network API client or webhook sync. |
| **Resume & CV Extraction** | `lib/ai-mentor/specialists/resume-specialist.ts` | **MOCKED** | Google XYZ formula alignment rules exist; PDF/DOCX parser and live parsing pipeline do not exist. |
| **External Platform Connectors** | `lib/ai-mentor/specialists/coding-specialist.ts` | **NOT IMPLEMENTED** | GitHub, LinkedIn, LeetCode, and HackerRank have regex keyword routing, but no OAuth connectors or sync workers. |
| **Knowledge Base & RAG** | `lib/ai-mentor/knowledge-rag-service.ts` | **VERIFIED (Keyword)** | 8 collections, 8 verified documents, stopword filtering, keyword scoring. 97.89% Recall@5 on 105-query benchmark. |
| **Dense Vector Embeddings** | — | **NOT IMPLEMENTED** | No live `pgvector`, HNSW ANN search, or embedding model endpoint integration currently exists. |
| **Safety & Privacy Guardrails** | `lib/ai-mentor/safety-guardrails.ts` | **VERIFIED** | Tele-MANAS crisis helpline triggers, clinical boundary enforcement, prompt injection scrubbers, PII redaction. |
| **Consent & Governance Rules** | `lib/ai-mentor/dataset-governance.ts`<br>`lib/db/schema.ts` | **PARTIALLY IMPLEMENTED** | `consent_grants` schema exists. Dedicated training opt-in UI controls and provenance ledger require implementation. |
| **Local Model SFT Training** | `training/adapters/mentormaze-2b-core-sft-v2` | **PARTIALLY IMPLEMENTED** | Safetensors weights exist (67.3 MB), but only 1 step completed (0.03% epoch). Base model is untrained on full epoch. |
| **Curated SFT Dataset** | `training/datasets/mentormaze-v2/` | **VERIFIED** | 7,211 train / 848 val / 424 test / 10 quarantine. Deduplicated, template-bias analyzed, SHA-256 manifest locked. |
| **AI Mentor Test Suite** | `tests/ai-mentor*` | **VERIFIED** | 57/57 tests passing across 7 test suites (architecture, intelligence, multi-provider, fallback, 30-task pedagogy, 100-query RAG). |

---

# 3. DETAILED SUBSYSTEM FORENSIC AUDIT

## 3.1 AI Mentor Architecture & Naming State

- **Current Master Identity**: Successfully migrated to **ASTRION** (`astrion-core` — *Adaptive Strategic Intelligence & Reasoning Network*).
- **Specialist Naming Alignment**:
  - `learn`: **SAGE Learning Intelligence** (`sage-learning`) — Conceptual explanations, Socratic tutoring, mathematical proofs.
  - `coding_dsa`: **CIPHER Engineering Intelligence** (`cipher-engineering`) — Programming fundamentals, DSA, asymptotic analysis, code review.
  - `system_design`: **ATLAS Systems Intelligence** (`atlas-systems`) — Distributed architectures, high availability, database trade-offs.
  - `projects`: **FORGE Project Intelligence** (`forge-projects`) — Project architecture, portfolio milestones, production readiness.
  - `career`: **VECTRA Career Intelligence** (`vectra-career`) — Career roadmap planning, Naukri/LinkedIn JD analysis, role matching.
  - `resume`: **PRISM Resume Intelligence** (`prism-resume`) — Google XYZ formula alignment, ATS diagnostics, zero fabrication.
  - `interview`: **ORACLE Interview Intelligence** (`oracle-interviews`) — STAR calibration, behavioral & technical mock rubrics.
  - `study_planning`: **CHRONOS Planning Intelligence** (`chronos-planning`) — 24-week milestone calendars, spaced retrieval protocols.
- **Brand Assets**: Production SVG vectors generated in `public/brand/`:
  - `astrion-emblem.svg`: Central intelligence core with 8 orbital specialist nodes.
  - `astrion-wordmark.svg`: Official wordmark with DM Serif Display typography.
  - `astrion-icon.svg`: Compact application icon (32×32 / 24×24).
  - `astrion-monochrome.svg`, `astrion-light.svg`, `astrion-dark.svg`.

## 3.2 Database & Data Persistence Audit

### Existing Schemas:
1. `lib/db/schema.ts` (Core Platform):
   - Tables: `users`, `userIdentities`, `studentProfiles`, `studentSkills`, `studentGoals`, `actionItems`, `mentorProfiles`, `mentorExpertise`, `mentorApplications`, `availabilityRules`, `availabilityExceptions`, `mentorAvailabilitySettings`, `bookingHolds`, `calendarConnections`, `externalCalendarEvents`, `bookings`, `bookingEvents`, `bookingPolicies`, `policyAuditLogs`, `sessionAttendanceEvents`, `interviewEvaluations`, `sessionNotes`, `mentorSettlements`, `disputes`, `mentorshipSessions`, `mockInterviews`, `conversations`, `messages`, `sessionChatMessages`, `notifications`, `notificationPreferences`, `pushSubscriptions`, `notificationDeliveries`, `notificationAnnouncements`, `scheduledNotifications`, `ledgerTransactions`, `journalEntries`, `webhookEvents`, `userSessions`, `outboxEvents`, `consentGrants`, `auditLogs`, `platformSettings`, `emailTemplates`, `emailAutomations`, `emailDeliveryLogs`, `emailPreferences`, `emailSuppressions`, `supportTickets`, `supportMessages`, `emailAuditLogs`.
2. `lib/db/ai-mentor-schema.ts` (AI Mentor Specific):
   - Tables: `ai_mentor_conversations`, `ai_mentor_messages`, `student_learning_profiles`, `student_skill_nodes`, `student_skill_dependencies`, `student_skill_evidence`, `student_memory`, `ai_mentor_roadmaps`, `ai_mentor_roadmap_milestones`, `knowledge_sources`, `knowledge_documents`, `knowledge_chunks`, `dataset_registry`, `job_descriptions`, `ai_evaluation_cases`, `ai_evaluation_runs`, `ai_feedback`.

### Critical Persistence Divergence:
In `lib/db/index.ts`, `initializeDatabaseSchema()` runs SQL `CREATE TABLE IF NOT EXISTS` statements for core platform tables, but **omits** all 17 tables from `ai-mentor-schema.ts`.
As a result:
- Conversations are stored in `.mentormaze-conversations.json` via `ConversationStore`.
- Student memories are stored in `.mentormaze-memories.json` via `StudentMemoryService`.
- Skill nodes and dependencies run in an in-memory Map in `StudentSkillGraph`.
- Roadmaps and knowledge chunks are stored in in-memory caches.

**Required Action**: Integrate `ai-mentor-schema.ts` into `lib/db/index.ts` so that PostgreSQL (Neon in production, PGlite in local dev) serves as the authoritative, durable relational store.

## 3.3 Model Provider & Inference Routing Audit

### Router Structure (`lib/ai-mentor/model-provider-router.ts`):
- Line count: 1,333 lines.
- Registered Providers:
  1. `mentormaze_2b`: Target local fine-tuned Qwen model served via HTTP `http://127.0.0.1:8000/v1/chat/completions`.
  2. `gemini`: Google Gemini API (`gemini-2.5-flash`, `gemini-flash-latest`). Primary production cloud engine.
  3. `groq`: Groq High-Speed Inference (`llama-3.3-70b-versatile`).
  4. `openrouter`: Multi-model cloud gateway.
  5. `openai`: OpenAI GPT API adapter.
  6. `anthropic`: Anthropic Claude API adapter.
  7. `ollama`: Local Ollama API adapter (`http://127.0.0.1:11434`).
  8. `local_pedagogical`: Offline deterministic rule-based pedagogical engine. Zero API cost, zero external latency.
- Failover Behavior: Strict cascading fallback. If `mentormaze_2b` is unavailable or errors out, requests route to `gemini` -> `groq` -> `local_pedagogical`.
- Cost & Latency Governance: Token usage calculation, estimated USD cost per turn, 500-turn in-memory circular telemetry buffer for admin inspection.

## 3.4 Local Model Training & Artifact Forensic Audit

### Base Model:
- Repository: `Qwen/Qwen3.5-2B-Base`
- Architecture: Hybrid Gated DeltaNet + Multi-Head Full Attention (1.882 Billion parameters text backbone).
- License: Apache 2.0.

### Adapter State:
1. `mentormaze-2b-core-sft-v2`:
   - Path: `training/adapters/mentormaze-2b-core-sft-v2/`
   - Files: `adapter_model.safetensors` (67.3 MB), `adapter_config.json`, `tokenizer.json`, `chat_template.jinja`.
   - LoRA Config: Rank 16, Alpha 32, Dropout 0.05, Trainable params: 16,819,200 (0.886% of backbone).
   - Training Status: **1 step executed** (`phase6-core-sft-v2-1794977132`), 2 examples processed, 0.03% epoch coverage. **Untrained for full epoch.**
2. `mentormaze-2b-sft-v1`:
   - Path: `training/adapters/mentormaze-2b-sft-v1/`
   - Training Status: 25 steps executed, 200 examples processed, 2.35% epoch coverage.
3. Specialist Adapters:
   - 8 specialist adapters registered in `training/configs/adapter_registry.yaml` (`mentormaze-2b-adapter-learning`, `coding`, `system-design`, etc.).
   - Weights on disk: **None**. Specialist capabilities are executed at runtime via TypeScript specialist modules.

### Dataset Intelligence (`mentormaze-v2`):
- Location: `training/datasets/mentormaze-v2/`
- Split Counts:
  - `train.jsonl`: 7,211 examples (SHA-256: `164c3dc69e82...`)
  - `validation.jsonl`: 848 examples (SHA-256: `f7bc8722be52...`)
  - `test.jsonl`: 424 examples (SHA-256: `685cb487bacd...`)
  - `quarantine.jsonl`: 10 examples (defective or template-biased samples isolated)
- Total Records: 8,483.
- Provenance & Licensing: 100% commercially permissive (Apache 2.0, MIT, ODC-BY, Proprietary Consented).
- Template Bias: Cleaned of synthetic openings ("Certainly! Let's explore...", "Great question! As an AI...").

## 3.5 Knowledge Base & RAG Architecture Audit

- Implementation: `lib/ai-mentor/knowledge-rag-service.ts`
- Collections: 8 distinct domains (`programming_dsa`, `cs_fundamentals`, `ai_machine_learning`, `software_system_design`, `career_job_descriptions`, `interview_preparation`, `academic_resources`, `mentormaze_platform`).
- Documents: 8 foundational documents with content hashes, licensing, and metadata.
- Retrieval Engine: In-memory keyword-based inverted index with stopword filtering and term-frequency scoring.
- Benchmark Verification (`tests/ai-mentor-rag-retrieval-100.test.ts`):
  - 105 queries evaluated.
  - Recall@5: **97.89%** (93/95 in-domain queries).
  - Out-of-Domain Detection Accuracy: **100%** (10/10).
  - Mean Reciprocal Rank (MRR): **0.9684**.
- Limitation: Non-vector retrieval. No embeddings, no vector database, and no cosine similarity over high-dimensional vector representations.

## 3.6 Ecosystem & External Connectors Audit

- AI Tathastu Identity: Handled via `users`, `user_identities`, and `user_sessions`. Server-side session verification via `getServerSession()` in `lib/auth/server-auth.ts`.
- AI Tathastu Collaborate: Referenced in `student-context-builder.ts` line 101 as a mock project ("Peer-to-Peer Low-Latency Collaboration Engine"). No live API client.
- AI Tathastu Avsar: Referenced in `student-context-builder.ts` line 93 as a mock project ("Customer Churn Prediction Model"). No live API client.
- AI Tathastu IRIS: Referenced in `types.ts` as an allowed source system, but has zero active API connections or endpoints.
- External Platforms (GitHub, LinkedIn, LeetCode, HackerRank): No OAuth flows, credentials, or synchronization workers exist.

---

# 4. SECURITY, PRIVACY & CONSENT GAP ANALYSIS

1. **Fine-Tuning Consent Isolation**:
   - `consent_grants` table exists in `lib/db/schema.ts`, but does not currently have a dedicated `fine_tuning_opt_in` purpose or immutable consent lineage.
   - Training dataset curation does not query live consent states before exporting examples.
2. **Student Memory Cross-User Isolation**:
   - `StudentMemoryService.getMemories(studentUserId, requestingUserId)` has an explicit 403 authorization check.
   - However, `app/api/ai-mentor/conversations` and `app/api/ai-mentor/route.ts` default unauthenticated requests to `"usr-student-1"`, which is acceptable for local development/demo, but must be hardened in production with strict session token enforcement.
3. **Secret Governance**:
   - Provider API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`) are managed strictly on the server side (`lib/ai-mentor/model-provider-router.ts`). They are never leaked to client bundles.
   - PII filtering is enforced via regex in `SafetyGuardrails.inspectInput()` (phone numbers, email addresses, credit cards redacted).
4. **Prompt Injection Defenses**:
   - Basic heuristic injection scanning in `SafetyGuardrails.inspectInput()` checks for jailbreak phrases ("ignore previous instructions", "system prompt", "DAN mode").
   - Needs strengthening against indirect prompt injection in user-uploaded documents and parsed resume files.

---

# 5. REUSABLE ASSETS VS. MISSING COMPONENTS

### Reusable Assets (Do Not Rewrite):
1. **Frontend AI Workspace Shell** (`components/ai-mentor/*`): Complete, polished, responsive (Desktop 1440×900, Tablet 1024×768, Mobile 390×844 drawer), styled with approved minimalist editorial tokens.
2. **Model Provider Router** (`lib/ai-mentor/model-provider-router.ts`): Highly reliable, battle-tested cascading fallback with live Gemini, Groq, local model, and offline engine.
3. **8 Canonical Specialists** (`lib/ai-mentor/specialists/*`): Complete domain prompts, deterministic engines, and transfer checks for SAGE, CIPHER, ATLAS, FORGE, VECTRA, PRISM, ORACLE, and CHRONOS.
4. **Safety & Guardrails Engine** (`lib/ai-mentor/safety-guardrails.ts`): Real-time crisis routing, clinical guardrails, and PII masking.
5. **Curated Training Corpus** (`training/datasets/mentormaze-v2/`): 8,483 validated records with full provenance, SHA-256 manifests, and license audits.
6. **Local MPS Inference Script** (`training/scripts/serve_model.py`): Real, working Apple Silicon MPS inference server loading Qwen3.5-2B-Base with LoRA adapters.
7. **Comprehensive Test Suites** (`tests/ai-mentor*`): 57 automated tests covering routing, fallbacks, 30 pedagogy tasks, and 100 RAG queries.

### Missing or Incomplete Components (To Build):
1. **Database Runtime Migration**: Execute DDL for `ai-mentor-schema.ts` in `lib/db/index.ts` and replace `.mentormaze-conversations.json` and `.mentormaze-memories.json` with SQL queries.
2. **Student Intelligence Graph Engine**: Build relational schema and query engine linking skills, evidence, projects, assessments, and temporal progress.
3. **Consent & Fine-Tuning Opt-in System**: Purpose-specific consent UI, audit logging, and automated training eligibility filters.
4. **AI Tathastu Connector Architecture**: Standardized connector interface with credential storage, sync scheduling, and data adapters for Identity, Collaborate, Avsar, and IRIS.
5. **External Data Connectors**: User-authorized resume parser (PDF/DOCX), GitHub repository inspector, and LeetCode export ingestor.
6. **Vector Search / Dense Retrieval**: Connect text embeddings to `pgvector` or local embedding models for semantic retrieval alongside keyword search.
7. **Multi-Specialist Joint Orchestrator**: Deconstruct multi-domain prompts into sub-tasks for multiple specialists, synthesizing a unified response.
8. **Admin Model Operations Dashboard**: Web interface for model registry, evaluation scorecards, training job status, and consent-aware dataset auditing.
