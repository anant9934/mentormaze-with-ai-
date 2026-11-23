# PHASE 00 — ASTRION MASTER IMPLEMENTATION PLAN
## Technical Roadmap, Schema Evolution, Architecture & Phase Milestones
**Project:** ASTRION — Adaptive Strategic Intelligence & Reasoning Network  
**Product:** MentorMaze by AI Tathastu  
**Domain:** `mentormaze.aitathastu.com`  
**Execution Environment:** macOS (Apple Silicon M4, 16 GB Unified Memory)  
**Status:** Approved Master Implementation Blueprint  

---

# 1. ARCHITECTURAL BASELINE & REUSABILITY MATRIX

The audit conducted in Phase 0 confirmed that the MentorMaze codebase has a solid foundation. We will follow the **Reuse-First Engineering Principle**: never discard working, tested systems simply to conform to a new directory naming convention.

```
                           +-------------------------------------------------+
                           |               ASTRION CLIENT (UI)               |
                           |   /ai-mentor (Next.js 14 App Router, Tailwind)  |
                           +-------------------------------------------------+
                                                    |
                                                    v
+---------------------------------------------------------------------------------------------------+
|                                 APPLICATION GATEWAY & ROUTE LAYER                                 |
|         /api/ai-mentor, /api/ai-mentor/conversations, /api/ai-mentor/memory, /api/ai-mentor/skills|
+---------------------------------------------------------------------------------------------------+
                                                    |
                                                    v
+---------------------------------------------------------------------------------------------------+
|                                     ASTRION CORE ORCHESTRATOR                                     |
|                                (lib/ai-mentor/orchestrator.ts)                                    |
|  +--------------------+   +-----------------------+   +--------------------+   +----------------+ |
|  | Safety Guardrails  |-->| Intent Classification |-->| Context Aggregator |-->| Model Router   | |
|  | (Tele-MANAS, PII)  |   | (8 Specialist Intents)|   | (Graph + Memory)   |   | (Hybrid Cloud) | |
|  +--------------------+   +-----------------------+   +--------------------+   +----------------+ |
+---------------------------------------------------------------------------------------------------+
             |                                          |                                |
             v                                          v                                v
+--------------------------+               +--------------------------+     +--------------------------+
|   8 SPECIALIST ENGINES   |               |   DATA & CONTEXT LAYER   |     |    INFERENCE RUNTIMES    |
| - SAGE (Learning)        |               | - PostgreSQL Neon / PGlite|     | - Local Qwen3.5-2B (MPS) |
| - CIPHER (Engineering)   |               | - Student Intel Graph    |     | - Google Gemini 2.5 Flash|
| - ATLAS (Systems)        |               | - Memory (8 Categories)  |     | - Groq Llama 3.3 70B     |
| - FORGE (Projects)       |               | - Inverted Index RAG     |     | - Offline Pedagogical    |
| - VECTRA (Career)        |               | - Consent & Audit Logs   |     +--------------------------+
| - PRISM (Resume)         |               +--------------------------+                  |
| - ORACLE (Interviews)    |                            |                                v
| - CHRONOS (Planning)     |                            v                   +--------------------------+
+--------------------------+               +--------------------------+     |    TRAINING PIPELINE     |
                                           |  AI TATHASTU CONNECTOR   |     | - mentormaze-v2 (8,483)  |
                                           | - Identity, Collaborate  |     | - LoRA SFT on MPS        |
                                           | - Avsar, IRIS, Resume/CV |     | - Quality & Benchmark    |
                                           | - GitHub, LeetCode (Opt) |     +--------------------------+
                                           +--------------------------+
```

---

# 2. REQUIRED DATABASE SCHEMA EVOLUTION

To eliminate the temporary JSON-file fallbacks (`.mentormaze-conversations.json`, `.mentormaze-memories.json`), the database initialization sequence in `lib/db/index.ts` will be updated to execute the DDL for all 17 tables from `lib/db/ai-mentor-schema.ts`.

In addition, the following relational enhancements will be introduced in subsequent phases:

### Migration 1: Student Intelligence Graph Extensions
```sql
-- Track individual pieces of verified evidence for student skills
CREATE TABLE IF NOT EXISTS student_skill_evidence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id VARCHAR(64) NOT NULL,
  evidence_type VARCHAR(64) NOT NULL, -- 'assessment', 'project_repo', 'resume_parsed', 'human_mentor_verified', 'self_reported'
  source_system VARCHAR(64) NOT NULL, -- 'MentorMaze', 'Collaborate', 'Avsar', 'IRIS', 'GitHub', 'LeetCode'
  source_record_id VARCHAR(128),
  confidence REAL DEFAULT 0.8 NOT NULL,
  proficiency_estimate VARCHAR(32) DEFAULT 'developing' NOT NULL, -- 'beginner', 'developing', 'demonstrated', 'verified', 'expert'
  verification_status VARCHAR(32) DEFAULT 'unverified' NOT NULL,
  observed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_skill_evidence_student ON student_skill_evidence_records(student_user_id, skill_id);
```

### Migration 2: Fine-Tuning Opt-in & Training Eligibility
```sql
-- Explicit, revocable, versioned consent for AI model fine-tuning
CREATE TABLE IF NOT EXISTS student_fine_tuning_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_opted_in BOOLEAN DEFAULT false NOT NULL,
  consent_version VARCHAR(32) DEFAULT '1.0' NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  data_categories JSONB DEFAULT '["conversations", "code_reviews", "rubric_evaluations"]'::jsonb NOT NULL,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Immutable provenance tracking for examples included in training candidate pools
CREATE TABLE IF NOT EXISTS training_dataset_candidates (
  id VARCHAR(64) PRIMARY KEY,
  student_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  task_category VARCHAR(64) NOT NULL,
  specialist_id VARCHAR(64) NOT NULL,
  source_type VARCHAR(64) NOT NULL, -- 'live_turn', 'expert_curated', 'synthetic_scaffold'
  prompt_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  quality_score REAL NOT NULL,
  is_pii_scrubbed BOOLEAN DEFAULT false NOT NULL,
  consent_verified BOOLEAN DEFAULT false NOT NULL,
  approval_status VARCHAR(32) DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected', 'quarantined'
  dataset_version VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### Migration 3: External Integration Connectors
```sql
-- Authorized OAuth and API credentials for connected student tools
CREATE TABLE IF NOT EXISTS student_connected_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(64) NOT NULL, -- 'aitathastu_identity', 'collaborate', 'avsar', 'iris', 'github', 'leetcode', 'linkedin'
  connection_status VARCHAR(32) DEFAULT 'connected' NOT NULL, -- 'connected', 'expired', 'revoked', 'error'
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  granted_scopes JSONB DEFAULT '[]'::jsonb NOT NULL,
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_user_id, provider)
);
```

---

# 3. IMPLEMENTATION ROADMAP & PHASE SPECIFICATION

The program is structured into 12 execution phases following Phase 0. Each phase is self-contained with verifiable criteria:

```
[Phase 0: Audit] (Completed)
       |
       v
[Phase 1: Core Contracts] ---> [Phase 2: Consent & Privacy] ---> [Phase 3: Student Intel Graph]
                                                                                |
                                                                                v
[Phase 6: Multi-LLM Engine] <-- [Phase 5: Memory & RAG] <--- [Phase 4: Ecosystem Connectors]
       |
       v
[Phase 7: ASTRION Orchestrator] -> [Phase 8: Personalization] -> [Phase 9: Dataset Governance]
                                                                                |
                                                                                v
[Phase 12: E2E Release] <--- [Phase 11: Admin Ops] <--- [Phase 10: Local SFT Fine-Tuning]
```

### Phase 1: Core Identity, Domain Contracts & Schema Runtime Activation
- **Goals**: Activate `ai-mentor-schema.ts` tables in `lib/db/index.ts`. Formalize TypeScript contracts for ASTRION CORE, typed request/response contracts, and specialist capability interfaces.
- **Dependencies**: Phase 0.
- **Estimated Effort**: 1-2 engineering days.
- **Acceptance Criteria**: All 17 AI tables created in database; conversation store and memory service read/write to SQL; zero regression on 57 existing vitest tests.

### Phase 2: Purpose-Specific Consent & Data Governance
- **Goals**: Implement granular consent management (`basic_operation`, `personalization`, `external_sync`, `fine_tuning_opt_in`). Create student privacy settings UI. Ensure strict exclusion of non-consented students from training candidacy.
- **Dependencies**: Phase 1.
- **Estimated Effort**: 2-3 engineering days.
- **Acceptance Criteria**: Non-opted-in student data is blocked from training candidate export; consent grants are revocable and timestamped with audit logs.

### Phase 3: Student Intelligence Graph Engine
- **Goals**: Build the relational Student Intelligence Graph linking skills, evidence, projects, assessments, and temporal progress. Replace hardcoded mock student personas with dynamic graph queries.
- **Dependencies**: Phase 1, Phase 2.
- **Estimated Effort**: 3-4 engineering days.
- **Acceptance Criteria**: A student's skill proficiency is calculated from observable evidence; temporal progress can answer "what skills improved since last month?"; no cross-student data leakage.

### Phase 4: AI Tathastu Ecosystem & External Connectors
- **Goals**: Implement standardized connector architecture. Build data adapters for AI Tathastu Identity, Collaborate, Avsar, IRIS (after contract verification), and user-uploaded resumes (PDF/DOCX).
- **Dependencies**: Phase 2, Phase 3.
- **Estimated Effort**: 3-4 engineering days.
- **Acceptance Criteria**: Connectors respect user permissions; background sync runs without blocking chat turns; disconnected sources cease synchronization immediately.

### Phase 5: Permission-Aware Memory & RAG Retrieval
- **Goals**: Connect RAG retrieval to database documents. Implement hybrid keyword + semantic search. Implement 8 memory categories with confidence evaluation, student confirmation, and revocation workflows.
- **Dependencies**: Phase 3, Phase 4.
- **Estimated Effort**: 3-4 engineering days.
- **Acceptance Criteria**: RAG retrieves relevant context with verified citations; memory items can be deleted by the student; unauthorized records are filtered out.

### Phase 6: Hybrid Multi-LLM Inference Engine
- **Goals**: Standardize provider abstraction for Local Qwen3.5-2B (MPS), Google Gemini, Groq, OpenAI, and Anthropic. Implement dynamic routing policies (cost, latency, privacy tier), circuit breakers, and token accounting.
- **Dependencies**: Phase 1.
- **Estimated Effort**: 2-3 engineering days.
- **Acceptance Criteria**: Seamless failover from local model to cloud providers; zero key leakage; per-turn token and estimated USD cost recorded.

### Phase 7: ASTRION CORE & Multi-Specialist Joint Orchestration
- **Goals**: Enhance ASTRION CORE to support multi-specialist query deconstruction. For compound queries (e.g. "Review my code, design a scalable queue for it, and update my resume"), synthesize responses from CIPHER, ATLAS, and PRISM under one coherent mentor voice.
- **Dependencies**: Phase 5, Phase 6.
- **Estimated Effort**: 3-4 engineering days.
- **Acceptance Criteria**: Compound queries activate multiple internal specialists; single conversation and unified voice preserved; transfer checks verified.

### Phase 8: Learning & Behavioral Personalization
- **Goals**: Track observable learning signals (difficulty level, hint usage, quiz performance, response feedback) to adapt instructional scaffolding. Provide user-facing preference controls (language, pacing, detail level).
- **Dependencies**: Phase 3, Phase 7.
- **Estimated Effort**: 2-3 engineering days.
- **Acceptance Criteria**: Personalization changes are explainable and backed by observed evidence; psychological diagnosis or unearned inferences are strictly prohibited.

### Phase 9: Feedback Pipeline & Training Data Governance
- **Goals**: Implement feedback collection (thumbs up/down, error reports, correction inputs). Build automated PII scrubbers, license validation, deduplication, and human review curation tooling for training eligibility.
- **Dependencies**: Phase 2, Phase 8.
- **Estimated Effort**: 3-4 engineering days.
- **Acceptance Criteria**: Every training candidate has verified consent lineage, license grant, and de-identification status; unconsented or disputed records are excluded automatically.

### Phase 10: Local ASTRION Model Fine-Tuning & Evaluation
- **Goals**: Complete full-epoch SFT training of `mentormaze-2b-core-sft-v2` on Apple Silicon MPS using the curated 7,211-example training split. Run comparative evaluation against base Qwen3.5-2B and log benchmark metrics.
- **Dependencies**: Phase 9, `training/` scripts.
- **Estimated Effort**: 3-4 engineering days (including training compute time on MPS).
- **Acceptance Criteria**: Full epoch completed; validation loss reduction verified; benchmark evaluation shows technical accuracy improvement without safety regression.

### Phase 11: Admin Model Operations & Observability
- **Goals**: Build administrative dashboard at `/admin/ai-mentor` for model registry inspection, provider health checks, live latency/cost tracking, evaluation scorecards, and dataset approval.
- **Dependencies**: Phase 6, Phase 10.
- **Estimated Effort**: 2-3 engineering days.
- **Acceptance Criteria**: Authorized admin can inspect model lifecycle, trigger evaluation suites, and view operational telemetry without exposing private student conversations.

### Phase 12: End-to-End Verification & Production Release
- **Goals**: Execute comprehensive end-to-end testing (unit, integration, adversarial prompt injection, cross-tenant isolation, load, and rollback verification). Prepare production release documentation.
- **Dependencies**: Phases 1 through 11.
- **Estimated Effort**: 2-3 engineering days.
- **Acceptance Criteria**: Zero cross-tenant data leakage; 100% test pass rate; verified responsive UI; fully reproducible build.

---

# 4. RISK MATRIX & MITIGATION STRATEGY

| Risk Category | Specific Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Data Privacy** | Student interaction data leaked into fine-tuning without explicit consent | **CRITICAL** | Strict default-exclusion policy: records require active, verified `student_fine_tuning_consent` record before entering training candidate pipeline. |
| **Model Weights** | Revoked student data cannot be removed from already-trained model weights | **HIGH** | Maintain exact training dataset manifests per release; document model version lineage; provide retraining / rollback path upon data revocation. |
| **Database Concurrency** | PGlite disk lock collision when running tests or multiple server instances | **MEDIUM** | In testing, configure single-threaded test execution or use in-memory database instances for parallel suites; in production, use Neon PostgreSQL pooler. |
| **Hardware Constraints** | 16 GB Apple Silicon M4 memory exhausted during simultaneous training + inference | **HIGH** | Strict operational separation: training runs as an isolated offline batch job; gradient checkpointing and batch size 2 with accumulation steps used; inference daemon started separately. |
| **External API Rate Limits** | Third-party LLM providers (Gemini, Groq) throttling requests during traffic spikes | **MEDIUM** | Central circuit breaker in `ModelProviderRouter`; exponential backoff with jitter; automatic fallback to local Qwen model and offline pedagogical engine. |
| **Prompt Injection** | Indirect injection embedded in parsed student resumes or external repository READMEs | **HIGH** | Untrusted document sandboxing: imported documents are treated strictly as data payloads, never as system instructions; regex and semantic injection scrubbers applied. |
| **Scope Creep** | Overcomplicating external connectors before core database and graph layers are stable | **MEDIUM** | Strict phase gating: Phase 1 (Database & Contracts) and Phase 2 (Consent) must be verified before external connectors in Phase 4 are initiated. |

---

# 5. RECOMMENDED IMMEDIATE NEXT STEP

Proceed directly to **PHASE 1: Core Identity, Domain Contracts & Schema Runtime Activation**.

### Phase 1 Deliverables:
1. Update `lib/db/index.ts` to include and execute DDL for all 17 tables from `lib/db/ai-mentor-schema.ts`.
2. Migrate `ConversationStore` from `.mentormaze-conversations.json` to relational `ai_mentor_conversations` and `ai_mentor_messages` tables.
3. Migrate `StudentMemoryService` from `.mentormaze-memories.json` to relational `student_memory` table.
4. Establish formal typed domain contracts for ASTRION CORE, the 8 specialist capabilities, and error normalization.
5. Run automated test suites to ensure zero regression across all existing features.
