# Python script to generate docs/audit/FULL_WEBSITE_IMPLEMENTATION_PLAN.md and docs/audit/FULL_WEBSITE_FINAL_ACCEPTANCE_REPORT.md
import os

plan_content = """# MentorMaze — Full Website Implementation & Remediation Plan

**Generated:** 2026-11-23  
**Auditor & Technical Architect:** Antigravity Engineering Lead  
**Scope:** Prioritized, Auditable Roadmap to Bring MentorMaze to a 100% Verified Production State

---

## 1. High-Level Dependency Graph & Execution Phases

```mermaid
flowchart TD
    subgraph Phase1_Security ["Phase 1: Security & Auth Hardening (Blockers)"]
        A1["Rotate .env Secrets (Neon, Google, SMTP)"] --> A2["Add Auth Guard to 24 /api/admin/* Endpoints"]
        A2 --> A3["Fix IDOR in Booking Mutation APIs (/cancel, /reschedule)"]
        A3 --> A4["Wire Frontend AuthContext to /api/auth/login Cookie Session"]
    end

    subgraph Phase2_Database_Migration ["Phase 2: Database Migration & API Layer"]
        B1["Enable USE_LOCAL_DB=false (Connect to Neon PostgreSQL)"] --> B2["Create Missing API Endpoints (GET /api/mentors, GET /api/student/dashboard)"]
        B2 --> B3["Migrate Matching Engine (/api/matching) from store. to Drizzle"]
    end

    subgraph Phase3_UI_Rewiring ["Phase 3: Frontend Mock Store Deprecation"]
        C1["Rewire Student Dashboard (app/dashboard/page.tsx)"] --> C2["Rewire Mentor Catalog (app/mentors/page.tsx)"]
        C2 --> C3["Rewire Mentor Dashboard & Applications (app/mentor/*)"]
        C3 --> C4["Rewire Admin Console (app/admin/*) to Real DB Aggregates"]
    end

    subgraph Phase4_Integrations ["Phase 4: Integrations & Payments Productionization"]
        D1["Switch Cashfree Adapter from Sandbox to Production Keys"] --> D2["Setup Google Calendar Refresh Token Exchange Flow"]
        D2 --> D3["Configure VAPID Keys for Web Push Notifications"]
    end

    subgraph Phase5_Verification ["Phase 5: Automated Verification & E2E Testing"]
        E1["Run Distributed Concurrency Tests on Neon"] --> E2["Run 32 Automated Vitest Suites"]
        E2 --> E3["Execute Browser Journey Smoke Tests on Desktop & Mobile"]
    end

    Phase1_Security --> Phase2_Database_Migration
    Phase2_Database_Migration --> Phase3_UI_Rewiring
    Phase3_UI_Rewiring --> Phase4_Integrations
    Phase4_Integrations --> Phase5_Verification
```

---

## 2. Phase 1 — Critical Launch Blockers (Must Fix Before Any Public Traffic)

| ID | Issue / Work Item | Affected Files | Effort | Dependency Order |
|---|---|---|---|---|
| **BLK-01** | **Rotate & Secure Production Secrets**: Remove committed secrets from `.env`, add `.env` to `.gitignore`, generate new passwords for Neon PostgreSQL, Google Cloud OAuth, and SMTP. | `.env`, `.gitignore`, `ENVIRONMENT_SETUP.md` | **S** (1-2 hrs) | Step 1 (Immediate) |
| **BLK-02** | **Protect All Admin API Routes**: Add `getServerSession(req)` validation and `role === "admin"` check across all 24 `/api/admin/*` endpoints. Return HTTP 403 on failure. | `app/api/admin/**/*.ts` (24 files) | **M** (3-4 hrs) | Step 2 (Requires BLK-01) |
| **BLK-03** | **Remediate Horizontal Privilege Escalation (IDOR)**: Enforce ownership checks in `/api/bookings/[id]/cancel` and `/api/bookings/[id]/reschedule` verifying user owns booking or is the assigned mentor. | `app/api/bookings/[id]/cancel/route.ts`, `app/api/bookings/[id]/reschedule/route.ts` | **S** (1 hr) | Step 3 |
| **BLK-04** | **Replace Mock AuthContext with Real Backend Auth**: Update `lib/auth/context.tsx` to call `POST /api/auth/login` and verify cookie against `GET /api/auth/session` instead of `localStorage` role-switching. | `lib/auth/context.tsx`, `app/login/page.tsx` | **M** (3-4 hrs) | Step 4 |
| **BLK-05** | **Switch to Neon Production Database**: Change `USE_LOCAL_DB=true` to `USE_LOCAL_DB=false` in environment configuration and run Drizzle push rehearsal. | `.env`, `lib/db/index.ts` | **S** (1 hr) | Step 5 |

---

## 3. Phase 2 — High Priority (Frontend Mock Elimination & API Wiring)

| ID | Issue / Work Item | Affected Files | Effort | Dependency Order |
|---|---|---|---|---|
| **HI-01** | **Build `/api/mentors` Public Catalog Endpoint**: Query `mentor_profiles` filtered by `verificationStatus = "approved"`, `isAcceptingBookings = true`, with expertise joins. | `app/api/mentors/route.ts` (New), `lib/db/schema.ts` | **M** (3 hrs) | After BLK-05 |
| **HI-02** | **Rewire `/mentors` Page to Real Database**: Replace `store.getApprovedMentors()` in `app/mentors/page.tsx` with `fetch('/api/mentors')` and SSR hydration. | `app/mentors/page.tsx` | **M** (2 hrs) | After HI-01 |
| **HI-03** | **Rewire Student Dashboard**: Replace `store.getStudentProfile('user-student-1')` in `app/dashboard/page.tsx` with dynamic user profile and booking fetch. | `app/dashboard/page.tsx` | **L** (4 hrs) | After BLK-04 |
| **HI-04** | **Rewire Mentor Application & Dashboard**: Connect `app/mentor/apply/page.tsx` to `POST /api/mentor/applications` and `app/mentor/dashboard/page.tsx` to real mentor sessions. | `app/mentor/apply/page.tsx`, `app/mentor/dashboard/page.tsx` | **L** (5 hrs) | After HI-01 |
| **HI-05** | **Migrate Matching Engine Input**: Update `app/api/matching/route.ts` to query `student_profiles` and `mentor_profiles` from Drizzle rather than in-memory `store.`. | `app/api/matching/route.ts`, `lib/matching/engine.ts` | **M** (3 hrs) | After HI-01 |
| **HI-06** | **Wire Direct Messaging to Database**: Replace `store.getMessages()` with `GET /api/messages` and `POST /api/messages` persisting to `direct_messages` table. | `app/dashboard/messages/page.tsx` | **M** (3 hrs) | After BLK-04 |

---

## 4. Phase 3 — Medium Priority (Third-Party Integrations & Admin Operations)

| ID | Issue / Work Item | Affected Files | Effort | Dependency Order |
|---|---|---|---|---|
| **MED-01** | **Cashfree Production Configuration**: Toggle `CASHFREE_ENVIRONMENT=production` and test webhook signature verification with live webhook payload. | `lib/payments/adapter.ts`, `app/api/payments/webhook/route.ts` | **S** (2 hrs) | Prior to payments launch |
| **MED-02** | **Google Calendar Token Refresh Flow**: Implement automatic access token renewal using `refreshTokenEncrypted` in `lib/calendar/providers/google-calendar-provider.ts`. | `lib/calendar/providers/google-calendar-provider.ts` | **M** (3 hrs) | Prior to calendar sync launch |
| **MED-03** | **Admin Dashboard Real Metrics**: Update `app/admin/page.tsx` to query real platform aggregates (`count(users)`, `count(bookings)`, `sum(gross_amount_paise)`). | `app/admin/page.tsx`, `app/api/admin/metrics/route.ts` | **M** (3 hrs) | After BLK-02 |
| **MED-04** | **Global API Rate Limiting**: Apply `rateLimiter.check()` across all public POST endpoints (`/api/newsletter`, `/api/ai-mentor`, `/api/payments/create-order`). | `app/api/**/*.ts` | **S** (2 hrs) | Any time |

---

## 5. Phase 4 — Low Priority & Future Polish

| ID | Issue / Work Item | Affected Files | Effort | Dependency Order |
|---|---|---|---|---|
| **LOW-01** | **AI Tathastu SSO Protocol**: Finalize mutual authentication contracts with AI Tathastu core identity server. | `app/api/auth/aitathastu/route.ts` | **M** (3 hrs) | Post-beta |
| **LOW-02** | **Dark Mode & Accessibility Enhancements**: Validate ARIA labels and keyboard focus on all modals and dropdowns. | `components/**/*.tsx` | **M** (4 hrs) | Post-beta |
| **LOW-03** | **Bundle Size Optimization**: Analyze and optimize dynamic imports for LiveKit client and KaTeX in ASTRION workspace. | `next.config.mjs`, `app/ai-mentor/page.tsx` | **S** (2 hrs) | Post-beta |

---

## 6. Effort & Timeline Summary

- **Phase 1 (Security Blockers)**: 10 - 12 Engineer Hours (1.5 Days)
- **Phase 2 (Mock Elimination & API Wiring)**: 18 - 20 Engineer Hours (2.5 Days)
- **Phase 3 (Integrations & Admin Ops)**: 10 - 12 Engineer Hours (1.5 Days)
- **Phase 4 (Testing & Verification Rehearsal)**: 8 - 10 Engineer Hours (1 Day)
- **Total Estimated Effort to Full Production Readiness**: **46 - 54 Engineering Hours (~6.5 Working Days)**
"""

with open("docs/audit/FULL_WEBSITE_IMPLEMENTATION_PLAN.md", "w") as f:
    f.write(plan_content)

print("Generated docs/audit/FULL_WEBSITE_IMPLEMENTATION_PLAN.md")

# GENERATE FINAL ACCEPTANCE REPORT
report_content = """# MentorMaze — Full Website Final Acceptance Report

**Generated:** 2026-11-23  
**Auditor:** Antigravity Full-Stack Platform Auditor  
**Product:** MentorMaze by AI Tathastu  
**Website:** https://mentormaze.aitathastu.com  
**AI Mentor:** ASTRION  

---

## 1. Executive Summary & Verdict

| Audit Dimension | Target Standard | Current Score / Status | Assessment |
|---|---|---|---|
| **Total Routes Inventoried** | 100% Accounted For | **125 Total** (50 Pages, 75 API Routes) | Complete |
| **Verified Features (`[x]`)** | Production Verified | **51 Routes / Features (41%)** | Solid Core Foundations |
| **Partially Implemented (`[~]`)** | Near Completion | **26 Routes / Features (21%)** | Minor Gaps |
| **Mocked Features (`[M]`)** | Zero Mocks Allowed in Prod | **24 Routes / Features (19%)** | 🔴 Critical Disconnect |
| **Broken / Security Blockers (`[B]`)** | Zero Vulnerabilities | **24 Routes (19%)** | 🔴 Unauthenticated Admin APIs |
| **Database Architecture** | Neon PostgreSQL ACID | 66 Tables, Row Locks, Ledger Verified | 🟢 Architecture Excellent |
| **Automated Tests** | Comprehensive Coverage | 32 Test Suites, 400+ Automated Tests | 🟢 Strong Backend Testing |
| **Overall Platform Verdict** | **PRODUCTION READINESS** | **BLOCKED (Requires Phase 1 & 2 Remediation)** | 🔴 Action Required |

> [!CAUTION] **FINAL ACCEPTANCE VERDICT: BLOCKED**
> While the backend architectures (Drizzle ORM schema, ASTRION AI Mentor, LiveKit 12-provider failover mesh, and Double-Entry financial ledger) are thoroughly engineered and tested, the platform **CANNOT be marked VERIFIED for production** due to two critical blockers:
> 1. **Client-Side Mock Decoupling**: 20 frontend pages (including the Student Dashboard, Mentor Catalog, and Booking UI) import directly from an in-memory mock store (`lib/data/store.ts`) and use hardcoded IDs (`user-student-1`), bypassing real database persistence.
> 2. **Unauthenticated Admin & Mutation Endpoints**: 24 API routes under `/api/admin/*` and booking mutation endpoints lack server-side authentication, exposing platform controls if deployed live.

---

## 2. Statistical Breakdown of Platform Features

```
Total Routes Evaluated: 125
├── Frontend Application Pages: 50
│   ├── [x] Verified: 9 (Landing, How It Works, Pricing, Terms, Privacy, Support, Unsubscribe)
│   ├── [~] Partially Implemented: 21 (Various sub-pages, settings, informational views)
│   └── [M] Mocked / In-Memory Store: 20 (Student Dashboard, Mentor Dashboard, Booking, Mentors Catalog)
└── Backend API Endpoints: 75
    ├── [x] Verified: 42 (AI Mentor, Calendar, Booking Engine, Outbox Email, Sessions)
    ├── [~] Partially Implemented: 5 (Cashfree sandbox adapter, Google sync, Earnings)
    ├── [M] Mocked: 4 (Matching engine, AI handoff, ICS export, Webhook sync)
    └── [B] Broken / Missing Auth Check: 24 (Admin operations, Booking cancel/reschedule IDOR)
```

---

## 3. Summary of Component Audits

### 3.1 Database Inventory (`docs/audit/FULL_WEBSITE_DATABASE_AUDIT.md`)
- **Total Tables**: 66 tables (43 in `schema.ts`, 23 in `ai-mentor-schema.ts`).
- **Engine Status**: Code contains configuration for Neon PostgreSQL (`postgresql://...`), but `.env` specifies `USE_LOCAL_DB=true`, forcing execution against local disk PGlite.
- **Concurrency Protections**: Verified row-level locking via `SELECT ... FOR UPDATE` in `MentorLockManager`, serialized double-booking prevention tested under distributed concurrency.
- **Ledger Accounting**: Verified triple-entry accounting balance (`debit_amount_paise == credit_amount_paise`) in `journal_entries`.

### 3.2 Route & API Inventory (`docs/audit/FULL_WEBSITE_ROUTE_INVENTORY.md` & `FULL_WEBSITE_API_AUDIT.md`)
- **Inventoried**: 50 frontend routes and 75 API routes.
- **Auth Vulnerability**: 24 `/api/admin/*` routes have zero session checks and zero role enforcement.
- **IDOR Vulnerability**: `/api/bookings/[id]/cancel` and `/api/bookings/[id]/reschedule` do not verify booking ownership against caller session.

### 3.3 Integration Audit (`docs/audit/FULL_WEBSITE_INTEGRATION_AUDIT.md`)
- **LiveKit Cloud**: 12 providers configured with weighted routing and active health checking. Verified.
- **Cashfree Payments**: Sandbox mode operational with webhook signature validation; production credentials pending.
- **SMTP Email**: Operational via Gmail SMTP app credentials with RFC 8058 one-click unsubscribe support.
- **Google OAuth**: Code exchange and session issuance verified.

### 3.4 Security Audit (`docs/audit/FULL_WEBSITE_SECURITY_AUDIT.md`)
- **Critical Exposure**: Neon database password and Google OAuth client secret are committed in `.env`. Immediate rotation required.
- **Rate Limiting**: Sliding-window rate limiter exists in `lib/security/rate-limiter.ts`, but is only wired to `/api/auth/login`.

### 3.5 Test Audit (`docs/audit/FULL_WEBSITE_TEST_AUDIT.md`)
- **Total Test Suites**: 32 test files covering AI Mentor capabilities (adaptive learning, RAG retrieval 100-query benchmark), calendar scheduling, and outbox email queues.
- **Gaps**: Zero component or browser-level E2E tests for React UI flows.

---

## 4. Key Implementation Artifacts Generated

All required audit documents have been compiled in `docs/audit/`:
1. `docs/audit/FULL_WEBSITE_ROUTE_INVENTORY.md`
2. `docs/audit/FULL_WEBSITE_FEATURE_CHECKLIST.md`
3. `docs/audit/FULL_WEBSITE_DATABASE_AUDIT.md`
4. `docs/audit/FULL_WEBSITE_API_AUDIT.md`
5. `docs/audit/FULL_WEBSITE_INTEGRATION_AUDIT.md`
6. `docs/audit/FULL_WEBSITE_SECURITY_AUDIT.md`
7. `docs/audit/FULL_WEBSITE_TEST_AUDIT.md`
8. `docs/audit/FULL_WEBSITE_IMPLEMENTATION_PLAN.md`
9. `docs/audit/FULL_WEBSITE_FINAL_ACCEPTANCE_REPORT.md`

---

## 5. Mandatory Remediation Checklist for Production Sign-Off

To move the platform status from **BLOCKED** to **VERIFIED**:

1. [ ] **Rotate Credentials**:
   - Rotate Neon database credentials in Neon Console.
   - Rotate Google OAuth client secret in Google Cloud Console.
   - Rotate Gmail SMTP app password.
   - Add `.env` to `.gitignore` and document keys in `.env.example`.
2. [ ] **Enforce Admin & Owner API Security**:
   - Add `getServerSession()` + admin role check to all 24 `/api/admin/*` endpoints.
   - Add user/mentor ownership checks on `/api/bookings/[id]/cancel` and `/api/bookings/[id]/reschedule`.
3. [ ] **Unify Frontend Authentication**:
   - Replace mock `DEMO_USERS` in `lib/auth/context.tsx` with calls to `/api/auth/login` and `/api/auth/session`.
4. [ ] **Deprecate In-Memory `store.` from UI Pages**:
   - Replace `store.` in `app/dashboard/page.tsx` with dynamic fetch from `/api/student/dashboard`.
   - Replace `store.` in `app/mentors/page.tsx` with dynamic fetch from `/api/mentors`.
   - Replace `store.` in `app/mentor/dashboard/page.tsx` with dynamic fetch from `/api/mentor/dashboard`.
5. [ ] **Switch DB Configuration**:
   - Set `USE_LOCAL_DB=false` in staging and production to run against Neon PostgreSQL.
"""

with open("docs/audit/FULL_WEBSITE_FINAL_ACCEPTANCE_REPORT.md", "w") as f:
    f.write(report_content)

print("Generated docs/audit/FULL_WEBSITE_FINAL_ACCEPTANCE_REPORT.md")
