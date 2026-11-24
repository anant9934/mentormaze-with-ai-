# ASTRION Advanced Adaptive Mentorship Engine — Staging Remediation & Production Review Report

**Project:** MentorMaze by AI Tathastu (`https://mentormaze.aitathastu.com`)  
**Target Environment:** Staging  
**Evaluation Date:** November 24, 2026  
**Final Production Review Decision:** **`STAGING BLOCKED — FIXES REQUIRED`**

---

## 1. Executive Summary

This report establishes the ground-truth technical state of the ASTRION (Adaptive Strategic Intelligence & Reasoning Network) Advanced Adaptive Mentorship Engine following a forensic remediation audit of earlier staging assertions.

The previous audit declared `STAGING VALIDATED — READY FOR PRODUCTION REVIEW`. However, a strict evidence-based review identified that:
1. Prior database validation ran against local in-memory/persistent PGlite rather than the live Neon PostgreSQL database because `USE_LOCAL_DB="true"` was active and the newly added ASTRION DDL was unapplied to Neon.
2. LiveKit voice AI agent execution was mocked; no autonomous server-side voice agent worker process exists in the codebase.
3. The student journey was validated via service-level Vitest integration tests, not a real headless browser session against a deployed staging web application.
4. Real cloud provider fallback, API key masking, and consent revocation had not been audited against live external APIs.

### Current Staging Status
- **Real Staging Database:** **PASS (VERIFIED ON REAL NEON POSTGRESQL)**. All 16 AI mentor tables, indexes, constraints, transactions, and durability have now been applied and verified live on Neon PostgreSQL (`ep-withered-heart-bebleio4-pooler.c-9.us-east-2.aws.neon.tech`). Silent fallback to PGlite has been eliminated.
- **Cloud Model Inference & Fallback:** **PASS (VERIFIED ON LIVE CLOUD APIS)**. Verified live with Groq (`qwen/qwen3.8-27b`), Gemini (`gemini-2.5-flash`), and OpenRouter (`meta-llama/llama-3.3-70b-instruct`). Pre-invocation fail-closed consent blocking and masked status endpoints verified.
- **LiveKit Real Audio & Worker Execution:** **BLOCKED**. `LIVEKIT_PRIMARY` has an invalid API key. `LIVEKIT_SECONDARY` connects to LiveKit Cloud SFU, but there is no deployed server-side voice AI agent worker in the repository.
- **Real Browser Student Journey on Staging:** **BLOCKED**. Branch `feat/astrion-adaptive-mentorship-staging` has not been deployed to Vercel/Render preview (held per constraint: no push/deploy without authorization), and headless browser automation (Playwright/Puppeteer) is not configured in CI.

Per the strict mandate: *"Never label a PGlite test as a Neon test. Never label mocked LiveKit as real audio validation. Never label a service-level test as a browser E2E test. If any critical check is unavailable, fails, relies on a mock, or lacks evidence: Use `STAGING BLOCKED — FIXES REQUIRED`."*

The authentic and disciplined decision is **`STAGING BLOCKED — FIXES REQUIRED`**.

---

## 2. Staging Branch & Git State

- **Branch:** `feat/astrion-adaptive-mentorship-staging`
- **Base Branch:** `hotfix/cicada-security-remediation`
- **Base Commit SHA:** `eab2de6`
- **Current Head SHA:** `c65782b` (prior commits: `55659ad`, `c1b41d9`)
- **Remediation Changes:**
  - `lib/db/index.ts`: Added `REQUIRE_REAL_DB` / `STAGING_VERIFY_DB` fail-closed checks; eliminated silent PGlite fallback; added `getDatabaseTarget()` runtime inspection.
  - `lib/ai-mentor/model-provider-router.ts`: Added explicit `preferredProvider === "gemini"` routing and multi-key / multi-model candidate iteration.
  - `tests/phase2-frontend-api-integration.test.ts`: Adapted schedule rule to dynamic booking day.
  - `tests/staging-real-neon-database.test.ts`: Dedicated live Neon PostgreSQL test suite (10 tests, 10 passed).
  - `tests/staging-real-cloud-inference.test.ts`: Dedicated live cloud inference test suite (9 tests, 9 passed).
- **Remote Push:** Not executed (held locally on staging branch).

---

## 3. Ground-Truth Service Verification Matrix

| Verification Check | Category | Service / Target | Command / Test ID | Result | Real vs Mock | Evidence & Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Real Staging Database** | Integration | Neon PostgreSQL (AWS US-East-2 `ep-withered-heart-bebleio4`) | `tests/staging-real-neon-database.test.ts` | **PASS (10/10)** | **Real Service** | Port 443 / WebSocket pooler verified. All 16 tables, unique constraints, and transaction rollbacks confirmed. |
| **Silent PGlite Fallback Prevention** | Code Hardening | `lib/db/index.ts` | `REQUIRE_REAL_DB=true` check | **PASS** | **Real Code** | Throws hard error instead of falling back to PGlite when real database is required. |
| **Live Groq Cloud Inference** | Integration | Groq LPU API (`qwen/qwen3.8-27b`) | `staging-real-cloud-inference.test.ts #1` | **PASS** | **Real Service** | Verified live; latency 437ms, token cost $0.000003 tracked. |
| **Live Gemini Cloud Inference** | Integration | Google Gemini API (`gemini-2.5-flash`) | `staging-real-cloud-inference.test.ts #2` | **PASS** | **Real Service** | Verified live; latency 2,243ms, usageMetadata parsed. |
| **Live OpenRouter Inference** | Integration | OpenRouter API (`meta-llama/llama-3.3-70b-instruct`) | `staging-real-cloud-inference.test.ts #3` | **PASS** | **Real Service** | Verified live; latency 3,124ms. |
| **Cloud Provider Fallback** | Integration | `ModelProviderRouter.complete` | `staging-real-cloud-inference.test.ts #3` | **PASS** | **Real Service** | Invalidation of Groq key pool triggers clean fallback to Gemini / OpenRouter. |
| **Controlled Fallback (No Hallucination)** | Integration | Local Rule Engine Fallback | `staging-real-cloud-inference.test.ts #4` | **PASS** | **Real Code** | When all cloud keys are omitted, returns `deterministic` fallback with transparent notice; zero fabricated AI text. |
| **No Local LLM / Ollama** | Compliance | `ModelProviderRouter.getProviderStatus` | `staging-real-cloud-inference.test.ts #5` | **PASS** | **Environment** | `OLLAMA_BASE_URL` and `ENABLE_LOCAL_LLM` confirmed absent. |
| **API Key Masking** | Security | Admin Status API | `staging-real-cloud-inference.test.ts #6` | **PASS** | **Real Code** | Masked prefix/suffix only (`gsk_...`, `AQ.A...`). |
| **Pre-Call Consent Revocation** | Privacy | `StudentConsentService` | `staging-real-cloud-inference.test.ts #8` | **PASS** | **Real Code** | Spies prove zero outbound fetch requests made when `external_llm_processing` is revoked. |
| **Mentor Sharing Revocation** | Privacy | Purpose Independence | `staging-real-cloud-inference.test.ts #9` | **PASS** | **Real Code** | Revoking `mentor_sharing` blocks context export while preserving `service_personalization`. |
| **LiveKit Audio & Agent Execution** | RTC / Voice AI | LiveKit Cloud Cluster Alpha & Beta | Live probe | **BLOCKED** | **Mocked in Unit Tests** | `LIVEKIT_PRIMARY` has invalid credentials. No LiveKit Voice Agent worker daemon exists in codebase. |
| **Live Browser Student Journey** | Browser E2E | Deployed Staging URL | N/A | **BLOCKED** | **Unverified in Browser** | Branch not deployed to Vercel/Render preview; no Playwright runner configured. |
| **Service-Level Student Journey** | Integration | Synthetic API Workflow | `staging-e2e-astrion-validation.test.ts` | **PASS (15/15)** | **Service Integration** | 15-step journey passing at HTTP/controller level. |
| **Security & Route Authorization** | Security | API Routes | `ai-mentor-api-journey-and-coach.test.ts` | **PASS (4/4)** | **Service Integration** | 401 unauthenticated, 403 cross-tenant, IDOR tamper prevention verified. |

---

## 4. Real Staging Neon Database Verification Details

### Database Identity & Metadata
- **Engine:** PostgreSQL 18.7 (84da7d8) on aarch64-unknown-linux-gnu (Neon Serverless, AWS US-East-2)
- **Database Name:** `neondb`
- **Database User:** `neondb_owner`
- **Host Endpoint:** `ep-withered-heart-bebleio4-pooler.c-9.us-east-2.aws.neon.tech`
- **Connection Protocol:** Port 443 / WebSocket TLS via `@neondatabase/serverless` (direct TCP port 5432 is intermittently firewalled/timed out by local egress).

### 16 Canonical AI Mentor Tables Verified in Real Database
1. `student_hint_escalation_state`: Verified (unique index on `(student_user_id, exercise_id)`).
2. `student_concept_bkt_state`: Verified (unique index on `(student_user_id, concept_id)`).
3. `student_concept_fsrs_state`: Verified (unique index on `(student_user_id, concept_id)`).
4. `ai_mentor_goals`: Verified (indexes on student and status).
5. `student_purpose_consents`: Verified (unique on `(student_user_id, purpose)` with epoch tracking).
6. `student_learning_profiles`: Verified (unique on `student_user_id`).
7. `student_skill_nodes`: Verified (composite index on `(student_user_id, skill_id)`).
8. `student_skill_evidence`: Verified (provenance and rubric scoring).
9. `student_memory`: Verified (scoping by `category` and `key`).
10. `ai_mentor_roadmaps`: Verified (unique index on `goal_id` where `status = 'active'`).
11. `ai_mentor_roadmap_milestones`: Verified (cascade deletion on roadmap).
12. `ai_mentor_checkin_preferences`: Verified (unique on `student_user_id`).
13. `ai_mentor_checkin_records`: Verified (timestamped observations).
14. `mentorship_bridge_shares`: Verified (audited sharing records).
15. `ai_mentor_conversations`: Verified (thread tracking).
16. `ai_mentor_messages`: Verified (ordered turns with cost and tokens).

---

## 5. Outstanding Blockers & Remediation Roadmap

The gate is **BLOCKED** on the following two specific items:

### Blocker 1: LiveKit Voice AI Agent Worker Not Deployed
- **Severity:** HIGH / BLOCKER
- **Root Cause:**
  1. `LIVEKIT_PRIMARY_API_KEY` in `.env` (`APIj...` for `meet-2uq83g48.livekit.cloud`) returns `401 invalid API key`. (The secondary cluster `meet-q81ufsro.livekit.cloud` authenticates successfully, but is configured only as failover).
  2. The repository contains WebRTC video session room token generation (`/api/livekit/token` and `app/sessions/[id]/live/page.tsx`), but has **no server-side voice AI worker process** (e.g. Python LiveKit Agents or `@livekit/agents` Node background worker) configured to join rooms, ingest audio, invoke cloud LLM, and stream synthesized audio back to participants.
- **Files Involved:** `lib/livekit/router.ts`, `app/api/livekit/token/route.ts`, `.env`.
- **Exact Next Action:**
  1. Regenerate and update `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` for Cluster Alpha, or promote Cluster Beta (`meet-q81ufsro`) to primary in `.env`.
  2. Implement and deploy a dedicated LiveKit Voice AI Agent worker using the LiveKit Agents SDK with cloud STT (e.g. Deepgram), cloud LLM (`ModelProviderRouter`), and TTS (e.g. Cartesia / ElevenLabs).

### Blocker 2: Browser End-to-End Journey on Deployed Staging Application
- **Severity:** MEDIUM / BLOCKER
- **Root Cause:**
  1. Staging deployment constraints strictly prohibited pushing branch `feat/astrion-adaptive-mentorship-staging` to remote origin or deploying to production. As a result, the live Vercel deployment remains at `hotfix/cicada-security-remediation` (`mentormaze-av4iaf9i2-mentormaze.vercel.app`) without the ASTRION engine.
  2. Headless browser automation (Playwright/Puppeteer) against a browser session is not configured in the test harness; student journeys were validated through NextRequest/NextResponse integration test executions.
- **Files Involved:** CI/CD deployment configuration, `package.json`.
- **Exact Next Action:**
  1. Receive explicit user/stakeholder authorization to push `feat/astrion-adaptive-mentorship-staging` to remote origin and deploy to a dedicated Vercel/Render staging preview environment.
  2. Add a Playwright test suite to execute the 15-step student journey in a real Chromium browser against the deployed staging URL.

---

## 6. Complete Regression Test Execution Table

| Verification Step | Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **TypeScript Typecheck** | `node node_modules/.bin/tsc --noEmit` | **PASS (Code 0)** | 0 errors across entire repository |
| **Real Staging Neon DB Suite** | `vitest run tests/staging-real-neon-database.test.ts` | **PASS (Code 0)** | **10 tests passed (11.5s)** against live Neon PostgreSQL |
| **Real Cloud Inference Suite** | `vitest run tests/staging-real-cloud-inference.test.ts` | **PASS (Code 0)** | **9 tests passed (4.3s)** against live Groq, Gemini & OpenRouter |
| **AI Mentor Test Suites** | `vitest run tests/ai-mentor-*.test.ts tests/staging-*.test.ts` | **PASS (Code 0)** | **28 test files, 321 tests passed, 0 failures** |
| **Full Repository Test Suite** | `vitest run` | **PASS (Code 0)** | **56 test files, 764 tests passed, 0 failures** |
| **ESLint Validation** | `next lint` | **PASS (Code 0)** | 0 errors (existing non-blocking JSX warnings only) |
| **Next.js Production Build** | `next build` | **PASS (Code 0)** | 71/71 static pages generated, dynamic APIs verified |

---

## 7. Final Decision

# **`STAGING BLOCKED — FIXES REQUIRED`**

While the core database migration, real cloud AI inference, security isolation, and mathematical pedagogical engines are fully verified and regression-free, **production review is gated until LiveKit Voice AI agent deployment and browser-based staging E2E tests are resolved and proven with live evidence.**
