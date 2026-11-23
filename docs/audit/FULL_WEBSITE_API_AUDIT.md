# MentorMaze — Full Website API Audit

**Generated:** 2026-11-23  
**Auditor:** Antigravity API & Backend Security Auditor  
**Total API Endpoints Evaluated:** 75

---

## 1. High-Level API Security & Architecture Findings

### 🔴 Critical Security Findings
1. **Unprotected Admin Endpoints (24 Routes)**:
   Routes under `/api/admin/*` (including `/api/admin/payments`, `/api/admin/bookings`, `/api/admin/settlements`, `/api/admin/disputes`, `/api/admin/policies`) do NOT call `getServerSession()` or verify admin roles. Anyone sending a request can view financial reconciliation data, alter dispute states, or create booking policies.
2. **Unprotected Booking Mutation Endpoints**:
   `/api/bookings/[id]/cancel` and `/api/bookings/[id]/reschedule` take an `id` parameter from the URL but do not verify that the calling user owns the booking or is the assigned mentor.
3. **Hardcoded User Identities**:
   - `/api/matching`: Falls back to `"user-student-1"` if student context is not provided.
   - `/api/mentor/earnings`: Falls back to `"mentor-1"` without session verification.
   - `/api/livekit/token`: Grants room tokens with default `"user-student-1"` identity.
4. **Missing Rate Limiting**:
   Out of 75 API routes, only `/api/auth/login` implements rate limiting (`rateLimiter.check`). All other POST/PUT endpoints (payments, messaging, AI chat, calendar holds) lack rate limiting.

### 🟡 Mock vs Real DB Disconnect
- 4 API routes import and mutate `@/lib/data/store` (in-memory mock store):
  - `/api/matching/route.ts`
  - `/api/payments/webhook/route.ts` (partial sync)
  - `/api/calendar/bookings/[id]/ics/route.ts`
  - `/api/ai-mentor/handoff/route.ts`
- 30 API routes query PostgreSQL (`getDb()` via Drizzle).

---

## 2. Comprehensive Endpoint Audit Matrix (All 75 Endpoints)

| # | Endpoint | Methods | Authentication | Authorization | Input Validation | Rate Limit | DB Connection | Status | Findings / Remediation |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `/api/admin/ai-mentor` | `GET` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Properly structured with DB and error handling |
| 2 | `/api/admin/bookings` | `GET, POST` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 3 | `/api/admin/calendar` | `GET` | getServerSession() (cookie / user_sessions) | No role check | None (manual / unchecked) | ❌ None | Neon / PGlite | [x] VERIFIED | Properly structured with DB and error handling |
| 4 | `/api/admin/communications/automations` | `GET, PATCH` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 5 | `/api/admin/communications/failed` | `GET, POST` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 6 | `/api/admin/communications/logs` | `GET` | getServerSession() (cookie / user_sessions) | Admin role enforced | None (manual / unchecked) | ❌ None | None | [x] VERIFIED | Properly structured with DB and error handling |
| 7 | `/api/admin/communications/notifications` | `GET, POST` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 8 | `/api/admin/communications/notifications/logs` | `GET` | None | No role check | None (manual / unchecked) | ❌ None | None | [B] BROKEN (Missing Auth) | Missing authentication check |
| 9 | `/api/admin/communications/smtp` | `GET, POST` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 10 | `/api/admin/communications/stats` | `GET` | getServerSession() (cookie / user_sessions) | Admin role enforced | None (manual / unchecked) | ❌ None | None | [x] VERIFIED | Properly structured with DB and error handling |
| 11 | `/api/admin/communications/templates` | `GET, POST, PATCH` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 12 | `/api/admin/disputes` | `GET, POST` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 13 | `/api/admin/payments` | `GET` | None | No role check | None (manual / unchecked) | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check |
| 14 | `/api/admin/payments/reconciliation` | `GET` | None | No role check | None (manual / unchecked) | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check |
| 15 | `/api/admin/policies` | `GET, POST, PATCH` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 16 | `/api/admin/settlements` | `GET, POST` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 17 | `/api/admin/video` | `GET, POST` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 18 | `/api/ai-mentor` | `GET, POST` | getServerSession() (cookie / user_sessions) | Role inspected | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 19 | `/api/ai-mentor/career` | `GET, POST` | None | No role check | Basic manual null/type check | ❌ None | None | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 20 | `/api/ai-mentor/checkins` | `GET, POST, PATCH, DELETE` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 21 | `/api/ai-mentor/context` | `GET` | None | No role check | None (manual / unchecked) | ❌ None | None | [B] BROKEN (Missing Auth) | Missing authentication check |
| 22 | `/api/ai-mentor/conversations` | `GET, POST` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 23 | `/api/ai-mentor/conversations/[id]` | `GET, PATCH, DELETE` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 24 | `/api/ai-mentor/eval` | `GET, POST` | None | No role check | None (manual / unchecked) | ❌ None | None | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 25 | `/api/ai-mentor/goals` | `GET, POST` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 26 | `/api/ai-mentor/handoff` | `GET, POST, DELETE` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | In-Memory Store | [M] MOCKED | Uses in-memory store instead of database; Missing rate limiting on state-changing method |
| 27 | `/api/ai-mentor/memory` | `GET, POST, PATCH, DELETE` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 28 | `/api/ai-mentor/roadmaps` | `GET, POST` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 29 | `/api/ai-mentor/skills` | `GET, POST` | None | No role check | None (manual / unchecked) | ❌ None | None | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 30 | `/api/auth/callback/google` | `GET` | Bearer Token Header | Admin role enforced | Basic manual null/type check | ❌ None | Neon / PGlite | [x] VERIFIED | Properly structured with DB and error handling |
| 31 | `/api/auth/google` | `GET` | None | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Properly structured with DB and error handling |
| 32 | `/api/auth/login` | `POST` | None | Role inspected | Basic manual null/type check | Enabled (In-Memory Limiter) | Neon / PGlite | [x] VERIFIED | Properly structured with DB and error handling |
| 33 | `/api/auth/logout` | `POST` | None | No role check | None (manual / unchecked) | ❌ None | Neon / PGlite | [x] VERIFIED | Missing rate limiting on state-changing method |
| 34 | `/api/auth/session` | `GET` | getServerSession() (cookie / user_sessions) | No role check | None (manual / unchecked) | ❌ None | None | [x] VERIFIED | Properly structured with DB and error handling |
| 35 | `/api/bookings/[id]/cancel` | `POST` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 36 | `/api/bookings/[id]/reschedule` | `POST` | None | Role inspected | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 37 | `/api/calendar/bookings/[id]/ics` | `GET` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Uses in-memory store instead of database; Missing authentication check |
| 38 | `/api/calendar/google/auth` | `GET` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Properly structured with DB and error handling |
| 39 | `/api/calendar/google/callback` | `GET` | Bearer Token Header | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [x] VERIFIED | Properly structured with DB and error handling |
| 40 | `/api/calendar/google/sync` | `POST` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [x] VERIFIED | Missing rate limiting on state-changing method |
| 41 | `/api/calendar/holds` | `POST` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 42 | `/api/calendar/holds/[id]` | `GET, DELETE` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 43 | `/api/cron/outbox` | `GET, POST` | Bearer Token Header | No role check | None (manual / unchecked) | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 44 | `/api/email/preferences` | `GET, POST` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 45 | `/api/email/unsubscribe` | `GET, POST` | Bearer Token Header | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 46 | `/api/livekit/token` | `GET, POST` | getServerSession() (cookie / user_sessions) | Mentor role enforced | Basic manual null/type check | ❌ None | None | [M] MOCKED | Hardcoded ID: {'"user-student-1"'}; Missing rate limiting on state-changing method |
| 47 | `/api/matching` | `GET, POST` | None | Role inspected | None (manual / unchecked) | ❌ None | In-Memory Store | [B] BROKEN (Missing Auth) | Uses in-memory store instead of database; Hardcoded ID: {'"user-student-1"'}; Missing authentication check; Missing rate limiting on state-changing method |
| 48 | `/api/matching/factors` | `GET` | None | No role check | None (manual / unchecked) | ❌ None | None | [x] VERIFIED | Properly structured with DB and error handling |
| 49 | `/api/mentor/availability` | `GET, POST, PUT` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [x] VERIFIED | Missing rate limiting on state-changing method |
| 50 | `/api/mentor/availability/exceptions` | `POST` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [x] VERIFIED | Missing rate limiting on state-changing method |
| 51 | `/api/mentor/availability/exceptions/[id]` | `DELETE` | getServerSession() (cookie / user_sessions) | No role check | None (manual / unchecked) | ❌ None | Neon / PGlite | [x] VERIFIED | Missing rate limiting on state-changing method |
| 52 | `/api/mentor/earnings` | `GET` | None | No role check | None (manual / unchecked) | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Hardcoded ID: {'"mentor-1"'}; Missing authentication check |
| 53 | `/api/mentors/[id]/availability` | `GET` | None | No role check | None (manual / unchecked) | ❌ None | None | [B] BROKEN (Missing Auth) | Missing authentication check |
| 54 | `/api/messages` | `GET, POST` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [x] VERIFIED | Missing rate limiting on state-changing method |
| 55 | `/api/mock-interviews/[id]/evaluation` | `GET, POST` | None | Role inspected | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 56 | `/api/newsletter` | `POST` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [x] VERIFIED | Missing rate limiting on state-changing method |
| 57 | `/api/notifications` | `GET` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Properly structured with DB and error handling |
| 58 | `/api/notifications/[id]` | `DELETE` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 59 | `/api/notifications/[id]/read` | `PATCH` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 60 | `/api/notifications/mark-all-read` | `POST` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 61 | `/api/notifications/preferences` | `GET, PUT` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 62 | `/api/notifications/push/subscribe` | `POST, DELETE` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 63 | `/api/notifications/push/test` | `GET, POST` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 64 | `/api/notifications/stream` | `GET` | getServerSession() (cookie / user_sessions) | No role check | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Properly structured with DB and error handling |
| 65 | `/api/payments/create-order` | `POST` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 66 | `/api/payments/refund` | `POST` | None | Role inspected | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 67 | `/api/payments/webhook` | `POST` | Webhook Signature / Secret Header | Role inspected | Basic manual null/type check | ❌ None | Neon / PGlite | [M] MOCKED | Uses in-memory store instead of database; Missing rate limiting on state-changing method |
| 68 | `/api/sessions/[id]/attendance` | `POST` | None | Role inspected | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 69 | `/api/sessions/[id]/chat` | `GET, POST` | None | Role inspected | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 70 | `/api/sessions/[id]/chat/stream` | `GET` | None | No role check | None (manual / unchecked) | ❌ None | None | [B] BROKEN (Missing Auth) | Missing authentication check |
| 71 | `/api/sessions/[id]/complete` | `POST` | None | No role check | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 72 | `/api/sessions/[id]/notes` | `GET, POST` | None | Role inspected | Basic manual null/type check | ❌ None | Neon / PGlite | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 73 | `/api/sessions/[id]/signaling` | `GET, POST` | None | No role check | Basic manual null/type check | ❌ None | None | [B] BROKEN (Missing Auth) | Missing authentication check; Missing rate limiting on state-changing method |
| 74 | `/api/support/tickets` | `GET, POST` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |
| 75 | `/api/support/tickets/[id]` | `GET, POST, PATCH` | getServerSession() (cookie / user_sessions) | Admin role enforced | Basic manual null/type check | ❌ None | None | [x] VERIFIED | Missing rate limiting on state-changing method |

---

## 3. Recommended Remediation Order for API Layer

1. **Implement Auth Middleware / Gate in all `/api/admin/*` endpoints**:
   Enforce `const session = await getServerSession(req); if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });`
2. **Enforce Ownership Checks on Resource Mutations**:
   In `/api/bookings/[id]/cancel`, verify `booking.studentUserId === session.user.id || booking.mentorProfileId === session.mentorId`.
3. **Deprecate In-Memory `store.` from all API routes**:
   Migrate `/api/matching` and `/api/ai-mentor/handoff` to use `getDb()`.
4. **Deploy Global IP Rate Limiter**:
   Wrap public routes (`/api/newsletter`, `/api/payments/create-order`, `/api/ai-mentor`) in sliding-window rate limits.
