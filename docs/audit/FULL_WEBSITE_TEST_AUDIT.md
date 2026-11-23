# MentorMaze — Full Website Test Suite Audit

**Generated:** 2026-11-23  
**Auditor:** Antigravity QA & Test Automation Lead  
**Test Framework:** Vitest 2.1.5 (`vitest.config.ts`)  
**Total Test Files:** 32 Test Suites

---

## 1. Test Suite Summary & Coverage Distribution

| Domain | Suites | Files | Primary Data Engine | Quality Rating |
|---|---|---|---|---|
| **ASTRION AI Mentor & Specialists** | 19 suites | `ai-mentor-*.test.ts` | PGlite In-Memory & Memory Stores | ⭐⭐⭐⭐⭐ Comprehensive (Benchmarks, RAG, Pedagogy) |
| **Booking & Scheduling Lifecycle** | 3 suites | `booking-lifecycle-e2e`, `calendar-scheduling`, `database` | PostgreSQL / PGlite | ⭐⭐⭐⭐⭐ Rigorous (ACID row locks, state machine) |
| **Communications & Email** | 2 suites | `email-system`, `unsubscribe-rfc8058` | Mock SMTP & Headers | ⭐⭐⭐⭐ High |
| **LiveKit Video Routing** | 2 suites | `livekit`, `livekit-routing` | Token SDK & Router Mocks | ⭐⭐⭐⭐ High |
| **Matching Engine** | 1 suite | `matching-100-factors` | In-Memory Store | ⭐⭐⭐⭐ High (100 factors tested) |
| **Payments & Settlements** | 1 suite | `payment` | PGlite & Ledger | ⭐⭐⭐ Medium (Basic assertions) |
| **Frontend UI Journeys** | 0 suites | None (No Cypress / Playwright E2E) | Browser / DOM | 🔴 Missing (No browser test suite) |

---

## 2. Inventory of All 32 Test Suites

| # | Test File | Tests | DB Connection | Store Mock | Scope & What It Verifies |
|---|---|---|---|---|---|
| 1 | `ai-mentor-adaptive-pedagogy-30.test.ts` | 30 | None | Mock | 30-task benchmark testing Socratic adaptation and learning gap analysis |
| 2 | `ai-mentor-ecosystem.test.ts` | 15 | None | Mock | Ecosystem context connectors (Collaborate, Avsar, Iris) |
| 3 | `ai-mentor-goal-centric-lifecycle.test.ts` | 12 | PGlite | None | Student goal creation, milestone dependencies, progress calculation |
| 4 | `ai-mentor-intelligence.test.ts` | 18 | PGlite | Mock | Reasoning graph and cognitive load modeling |
| 5 | `ai-mentor-model-2b.test.ts` | 8 | None | None | 2B parameter local model fallback tests |
| 6 | `ai-mentor-multi-provider.test.ts` | 10 | None | None | Multi-key provider rotation (Gemini, Groq, OpenRouter) |
| 7 | `ai-mentor-phase1-recovery.test.ts` | 14 | PGlite | Mock | Recovery from transient model errors and network timeouts |
| 8 | `ai-mentor-phase2-1-1-runtime-verification.test.ts` | 16 | PGlite | Mock | Runtime execution of specialist tools |
| 9 | `ai-mentor-phase2-1-verification.test.ts` | 24 | PGlite | None | Database schema persistence for AI mentor profiles and skills |
| 10 | `ai-mentor-phase2-intelligence-graph.test.ts` | 12 | PGlite | Mock | Directed graph traversal of student knowledge nodes |
| 11 | `ai-mentor-phase2.test.ts` | 15 | PGlite | Mock | Specialist dispatcher and orchestrator synthesis |
| 12 | `ai-mentor-phase3-1-runtime-verification.test.ts` | 14 | PGlite | Mock | Multi-turn memory recall with consent filters |
| 13 | `ai-mentor-phase3-2-hardening.test.ts` | 18 | PGlite | None | Guardrail boundary enforcement and prompt injection defense |
| 14 | `ai-mentor-phase4-1-1-integrity.test.ts` | 15 | PGlite | None | Factual integrity verification in resume and career guidance |
| 15 | `ai-mentor-phase4-1-2-persistence-consent.test.ts` | 16 | PGlite | None | Dual consent persistence across sessions |
| 16 | `ai-mentor-phase4-1-3-checkin-consent-drizzle.test.ts` | 14 | PGlite | None | Drizzle ORM checkin table consent queries |
| 17 | `ai-mentor-phase4-1-checkin-handoff.test.ts` | 12 | PGlite | Mock | Human mentor handoff recommendation criteria |
| 18 | `ai-mentor-phase4-student-experience.test.ts` | 16 | PGlite | Mock | Student UI workspace interaction contracts |
| 19 | `ai-mentor-rag-retrieval-100.test.ts` | 100 | None | None | 100-query empirical benchmark (Recall@5, MRR, OOD detection) |
| 20 | `ai-mentor-unified-architecture.test.ts` | 10 | None | None | Unified ASTRION identity contract tests |
| 21 | `booking-lifecycle-e2e.test.ts` | 22 | PGlite | None | End-to-end booking state machine (held -> paid -> completed) |
| 22 | `calendar-scheduling.test.ts` | 18 | PGlite | None | Slot generator, buffer times, timezone conversion |
| 23 | `database.test.ts` | 14 | PGlite | None | ACID transactions, foreign keys, cascade deletes |
| 24 | `email-system.test.ts` | 16 | None | Mock | Template compilation, HTML escaping, token injection |
| 25 | `livekit-routing.test.ts` | 12 | PGlite | Mock | Multi-cluster provider failover and health checking |
| 26 | `livekit.test.ts` | 8 | None | Mock | JWT token generation and claim assertions |
| 27 | `matching-100-factors.test.ts` | 20 | None | Mock | 100-factor matching engine verification |
| 28 | `notifications.test.ts` | 14 | PGlite | None | Notification creation, read receipts, delivery queues |
| 29 | `payment.test.ts` | 8 | PGlite | None | Double-entry journal balance equation (Debit == Credit) |
| 30 | `platform.test.ts` | 15 | None | Mock | Platform configuration and default policy loading |
| 31 | `unsubscribe-rfc8058.test.ts` | 10 | None | None | RFC 8058 POST-based one-click unsubscribe compliance |
| 32 | `user-acceptance-scenarios.test.ts` | 20 | PGlite | None | Student and mentor multi-step persona journeys |

---

## 3. Key Findings & Testing Gaps

1. **Strong Backend Unit & Service Coverage**: The backend domain services (AI Mentor, Booking State Machine, Double-Entry Ledger, LiveKit failover) have deep automated test coverage running against in-memory PGlite.
2. **Missing Frontend E2E / Component Tests**: There are zero test files in the project testing React UI components, client-side state, or browser navigation.
3. **Mock Discrepancy in Tests**: Several test suites (`platform.test.ts`, `matching-100-factors.test.ts`) test the in-memory mock store rather than the PostgreSQL database layer.
