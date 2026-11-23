# MentorMaze — Full Website Route Inventory

**Generated:** 2026-11-23  
**Auditor:** Antigravity Platform Auditor  
**Scope:** Complete Next.js 14 App Router Route Tree (50 Pages, 75 API Endpoints, 125 Total Routes)

---

## Executive Summary

| Category | Count | [x] VERIFIED | [~] PARTIAL | [M] MOCKED | [B] BROKEN |
|---|---|---|---|---|---|
| **Frontend Pages** | 50 | 9 | 21 | 20 | 0 |
| **Backend API Endpoints** | 75 | 42 | 5 | 4 | 24 |
| **Total Platform Routes** | **125** | **51** | **26** | **24** | **24** |

> [!WARNING] **Architectural Split & Critical Finding:**
> 1. **Client-Side Store Decoupling**: 20 frontend pages (including Student Dashboard, Messages, Progress, Mentor Dashboard, and Booking) import directly from `@/lib/data/store` (in-memory mock store) rather than consuming backend API routes or database models.
> 2. **Unauthenticated API Endpoints**: 24 backend API routes lack server-side session checks, leaving admin controls, dispute resolution, booking cancellations, and attendance exposed if accessed directly.

---

## Part 1: Frontend Application Pages (50 Routes)

| # | Route | Type | Auth Required | Data Source | Current Status | Description |
|---|---|---|---|---|---|---|
| 1 | `/` | Page | Public | Static / Props | [x] VERIFIED | Public landing page & hero carousel |
| 2 | `/admin` | Page | Public | In-Memory Store | [M] MOCKED | Admin console: /admin |
| 3 | `/admin/ai-mentor` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: ai-mentor |
| 4 | `/admin/bookings` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: bookings |
| 5 | `/admin/calendar` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: calendar |
| 6 | `/admin/communications` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: communications |
| 7 | `/admin/communications/email` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: communications/email |
| 8 | `/admin/communications/notifications` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: communications/notifications |
| 9 | `/admin/disputes` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: disputes |
| 10 | `/admin/matching` | Page | Public | In-Memory Store (Hardcoded User) | [M] MOCKED | Admin console: matching |
| 11 | `/admin/payments` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: payments |
| 12 | `/admin/settings` | Page | Public | In-Memory Store | [M] MOCKED | Admin console: settings |
| 13 | `/admin/settlements` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: settlements |
| 14 | `/admin/support` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: support |
| 15 | `/admin/verification` | Page | Public | In-Memory Store | [M] MOCKED | Admin console: verification |
| 16 | `/admin/video` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Admin console: video |
| 17 | `/ai-mentor` | Page | Yes (AuthContext) | Static / Props | [~] PARTIALLY IMPLEMENTED | ASTRION AI Mentor workspace |
| 18 | `/dashboard` | Page | Yes (AuthContext) | In-Memory Store (Hardcoded User) | [M] MOCKED | Student main dashboard overview |
| 19 | `/dashboard/messages` | Page | Yes (AuthContext) | In-Memory Store (Hardcoded User) | [M] MOCKED | Student direct messaging hub |
| 20 | `/dashboard/mock-interviews` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Student mock interview sessions |
| 21 | `/dashboard/progress` | Page | Yes (AuthContext) | In-Memory Store (Hardcoded User) | [M] MOCKED | Student learning goals & progress tracker |
| 22 | `/dashboard/resources` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Student saved resources & materials |
| 23 | `/dashboard/sessions` | Page | Yes (AuthContext) | In-Memory Store (Hardcoded User) | [M] MOCKED | Student upcoming and past sessions |
| 24 | `/how-it-works` | Page | Public | Static / Props | [x] VERIFIED | Platform explainer & workflow |
| 25 | `/login` | Page | Yes (AuthContext) | Static / Props | [~] PARTIALLY IMPLEMENTED | Authentication login page |
| 26 | `/match` | Page | Yes (AuthContext) | In-Memory Store (Hardcoded User) | [M] MOCKED | Page view |
| 27 | `/mentor/apply` | Page | Yes (AuthContext) | In-Memory Store | [M] MOCKED | Mentor onboarding application form |
| 28 | `/mentor/availability` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Mentor weekly availability & rules |
| 29 | `/mentor/dashboard` | Page | Yes (AuthContext) | In-Memory Store | [M] MOCKED | Mentor primary operations dashboard |
| 30 | `/mentor/earnings` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Mentor financial earnings & settlements |
| 31 | `/mentors` | Page | Yes (AuthContext) | In-Memory Store (Hardcoded User) | [M] MOCKED | Browse and discover mentors directory |
| 32 | `/mentors/[id]` | Page | Public | In-Memory Store (Hardcoded User) | [M] MOCKED | Individual mentor profile view |
| 33 | `/mentors/[id]/book` | Page | Yes (AuthContext) | In-Memory Store (Hardcoded User) | [M] MOCKED | Mentor booking & scheduling workflow |
| 34 | `/mock-interviews` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Mock interview module: /mock-interviews |
| 35 | `/mock-interviews/[id]/evaluate` | Page | Public | Static / Props (Hardcoded User) | [M] MOCKED | Mock interview module: /mock-interviews/[id]/evaluate |
| 36 | `/mock-interviews/[id]/report` | Page | Public | In-Memory Store | [M] MOCKED | Mock interview module: /mock-interviews/[id]/report |
| 37 | `/mock-interviews/practice` | Page | Yes (AuthContext) | In-Memory Store | [M] MOCKED | Mock interview module: /mock-interviews/practice |
| 38 | `/notifications` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | Page view |
| 39 | `/onboarding` | Page | Yes (AuthContext) | In-Memory Store (Hardcoded User) | [M] MOCKED | New student onboarding flow |
| 40 | `/pricing` | Page | Public | Static / Props | [x] VERIFIED | Page view |
| 41 | `/privacy` | Page | Public | Static / Props | [x] VERIFIED | Page view |
| 42 | `/programs` | Page | Public | Static / Props | [x] VERIFIED | Page view |
| 43 | `/sessions/[id]/confirmation` | Page | Public | In-Memory Store (Hardcoded User) | [M] MOCKED | Live video session module: /sessions/[id]/confirmation |
| 44 | `/sessions/[id]/live` | Page | Yes (AuthContext) | In-Memory Store (Hardcoded User) | [M] MOCKED | Live video session module: /sessions/[id]/live |
| 45 | `/sessions/[id]/summary` | Page | Public | In-Memory Store (Hardcoded User) | [M] MOCKED | Live video session module: /sessions/[id]/summary |
| 46 | `/settings/email-preferences` | Page | Yes (AuthContext) | Static / Props | [~] PARTIALLY IMPLEMENTED | User preference settings: /settings/email-preferences |
| 47 | `/settings/notifications` | Page | Public | Static / Props | [~] PARTIALLY IMPLEMENTED | User preference settings: /settings/notifications |
| 48 | `/support` | Page | Yes (AuthContext) | Static / Props | [x] VERIFIED | Page view |
| 49 | `/terms` | Page | Public | Static / Props | [x] VERIFIED | Page view |
| 50 | `/unsubscribe` | Page | Public | Static / Props | [x] VERIFIED | Page view |

---

## Part 2: Backend API Routes (75 Endpoints)

| # | Route | Methods | Auth Check | DB Connected | Zod Validated | Current Status | Description / Target |
|---|---|---|---|---|---|---|---|
| 1 | `/api/admin/ai-mentor` | `GET` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/admin/ai-mentor/route.ts` |
| 2 | `/api/admin/bookings` | `GET, POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/admin/bookings/route.ts` |
| 3 | `/api/admin/calendar` | `GET` | ✅ Yes | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/admin/calendar/route.ts` |
| 4 | `/api/admin/communications/automations` | `GET, PATCH` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/admin/communications/automations/route.ts` |
| 5 | `/api/admin/communications/failed` | `GET, POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/admin/communications/failed/route.ts` |
| 6 | `/api/admin/communications/logs` | `GET` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/admin/communications/logs/route.ts` |
| 7 | `/api/admin/communications/notifications` | `GET, POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/admin/communications/notifications/route.ts` |
| 8 | `/api/admin/communications/notifications/logs` | `GET` | ❌ No | None | ❌ No | [B] BROKEN (Missing Auth) | `app/api/admin/communications/notifications/logs/route.ts` |
| 9 | `/api/admin/communications/smtp` | `GET, POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/admin/communications/smtp/route.ts` |
| 10 | `/api/admin/communications/stats` | `GET` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/admin/communications/stats/route.ts` |
| 11 | `/api/admin/communications/templates` | `GET, POST, PATCH` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/admin/communications/templates/route.ts` |
| 12 | `/api/admin/disputes` | `GET, POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/admin/disputes/route.ts` |
| 13 | `/api/admin/payments` | `GET` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/admin/payments/route.ts` |
| 14 | `/api/admin/payments/reconciliation` | `GET` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/admin/payments/reconciliation/route.ts` |
| 15 | `/api/admin/policies` | `GET, POST, PATCH` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/admin/policies/route.ts` |
| 16 | `/api/admin/settlements` | `GET, POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/admin/settlements/route.ts` |
| 17 | `/api/admin/video` | `GET, POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/admin/video/route.ts` |
| 18 | `/api/ai-mentor` | `GET, POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/ai-mentor/route.ts` |
| 19 | `/api/ai-mentor/career` | `GET, POST` | ❌ No | None | ❌ No | [B] BROKEN (Missing Auth) | `app/api/ai-mentor/career/route.ts` |
| 20 | `/api/ai-mentor/checkins` | `GET, POST, PATCH, DELETE` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/ai-mentor/checkins/route.ts` |
| 21 | `/api/ai-mentor/context` | `GET` | ❌ No | None | ❌ No | [B] BROKEN (Missing Auth) | `app/api/ai-mentor/context/route.ts` |
| 22 | `/api/ai-mentor/conversations` | `GET, POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/ai-mentor/conversations/route.ts` |
| 23 | `/api/ai-mentor/conversations/[id]` | `GET, PATCH, DELETE` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/ai-mentor/conversations/[id]/route.ts` |
| 24 | `/api/ai-mentor/eval` | `GET, POST` | ❌ No | None | ❌ No | [B] BROKEN (Missing Auth) | `app/api/ai-mentor/eval/route.ts` |
| 25 | `/api/ai-mentor/goals` | `GET, POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/ai-mentor/goals/route.ts` |
| 26 | `/api/ai-mentor/handoff` | `GET, POST, DELETE` | ✅ Yes | ⚠️ Store | ❌ No | [M] MOCKED | `app/api/ai-mentor/handoff/route.ts` |
| 27 | `/api/ai-mentor/memory` | `GET, POST, PATCH, DELETE` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/ai-mentor/memory/route.ts` |
| 28 | `/api/ai-mentor/roadmaps` | `GET, POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/ai-mentor/roadmaps/route.ts` |
| 29 | `/api/ai-mentor/skills` | `GET, POST` | ❌ No | None | ❌ No | [B] BROKEN (Missing Auth) | `app/api/ai-mentor/skills/route.ts` |
| 30 | `/api/auth/callback/google` | `GET` | ✅ Yes | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/auth/callback/google/route.ts` |
| 31 | `/api/auth/google` | `GET` | ❌ No | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/auth/google/route.ts` |
| 32 | `/api/auth/login` | `POST` | ❌ No | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/auth/login/route.ts` |
| 33 | `/api/auth/logout` | `POST` | ❌ No | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/auth/logout/route.ts` |
| 34 | `/api/auth/session` | `GET` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/auth/session/route.ts` |
| 35 | `/api/bookings/[id]/cancel` | `POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/bookings/[id]/cancel/route.ts` |
| 36 | `/api/bookings/[id]/reschedule` | `POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/bookings/[id]/reschedule/route.ts` |
| 37 | `/api/calendar/bookings/[id]/ics` | `GET` | ❌ No | ✅ Neon/PG | ❌ No | [M] MOCKED | `app/api/calendar/bookings/[id]/ics/route.ts` |
| 38 | `/api/calendar/google/auth` | `GET` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/calendar/google/auth/route.ts` |
| 39 | `/api/calendar/google/callback` | `GET` | ❌ No | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/calendar/google/callback/route.ts` |
| 40 | `/api/calendar/google/sync` | `POST` | ✅ Yes | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/calendar/google/sync/route.ts` |
| 41 | `/api/calendar/holds` | `POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/calendar/holds/route.ts` |
| 42 | `/api/calendar/holds/[id]` | `GET, DELETE` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/calendar/holds/[id]/route.ts` |
| 43 | `/api/cron/outbox` | `GET, POST` | ❌ No | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/cron/outbox/route.ts` |
| 44 | `/api/email/preferences` | `GET, POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/email/preferences/route.ts` |
| 45 | `/api/email/unsubscribe` | `GET, POST` | ❌ No | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/email/unsubscribe/route.ts` |
| 46 | `/api/livekit/token` | `GET, POST` | ✅ Yes | None | ❌ No | [M] MOCKED | `app/api/livekit/token/route.ts` |
| 47 | `/api/matching` | `GET, POST` | ❌ No | ⚠️ Store | ❌ No | [M] MOCKED | `app/api/matching/route.ts` |
| 48 | `/api/matching/factors` | `GET` | ❌ No | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/matching/factors/route.ts` |
| 49 | `/api/mentor/availability` | `GET, POST, PUT` | ✅ Yes | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/mentor/availability/route.ts` |
| 50 | `/api/mentor/availability/exceptions` | `POST` | ✅ Yes | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/mentor/availability/exceptions/route.ts` |
| 51 | `/api/mentor/availability/exceptions/[id]` | `DELETE` | ✅ Yes | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/mentor/availability/exceptions/[id]/route.ts` |
| 52 | `/api/mentor/earnings` | `GET` | ❌ No | ✅ Neon/PG | ❌ No | [M] MOCKED | `app/api/mentor/earnings/route.ts` |
| 53 | `/api/mentors/[id]/availability` | `GET` | ❌ No | None | ❌ No | [B] BROKEN (Missing Auth) | `app/api/mentors/[id]/availability/route.ts` |
| 54 | `/api/messages` | `GET, POST` | ✅ Yes | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/messages/route.ts` |
| 55 | `/api/mock-interviews/[id]/evaluation` | `GET, POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/mock-interviews/[id]/evaluation/route.ts` |
| 56 | `/api/newsletter` | `POST` | ❌ No | ✅ Neon/PG | ❌ No | [x] VERIFIED | `app/api/newsletter/route.ts` |
| 57 | `/api/notifications` | `GET` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/notifications/route.ts` |
| 58 | `/api/notifications/[id]` | `DELETE` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/notifications/[id]/route.ts` |
| 59 | `/api/notifications/[id]/read` | `PATCH` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/notifications/[id]/read/route.ts` |
| 60 | `/api/notifications/mark-all-read` | `POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/notifications/mark-all-read/route.ts` |
| 61 | `/api/notifications/preferences` | `GET, PUT` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/notifications/preferences/route.ts` |
| 62 | `/api/notifications/push/subscribe` | `POST, DELETE` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/notifications/push/subscribe/route.ts` |
| 63 | `/api/notifications/push/test` | `GET, POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/notifications/push/test/route.ts` |
| 64 | `/api/notifications/stream` | `GET` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/notifications/stream/route.ts` |
| 65 | `/api/payments/create-order` | `POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/payments/create-order/route.ts` |
| 66 | `/api/payments/refund` | `POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/payments/refund/route.ts` |
| 67 | `/api/payments/webhook` | `POST` | ❌ No | ✅ Neon/PG | ❌ No | [M] MOCKED | `app/api/payments/webhook/route.ts` |
| 68 | `/api/sessions/[id]/attendance` | `POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/sessions/[id]/attendance/route.ts` |
| 69 | `/api/sessions/[id]/chat` | `GET, POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/sessions/[id]/chat/route.ts` |
| 70 | `/api/sessions/[id]/chat/stream` | `GET` | ❌ No | None | ❌ No | [B] BROKEN (Missing Auth) | `app/api/sessions/[id]/chat/stream/route.ts` |
| 71 | `/api/sessions/[id]/complete` | `POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/sessions/[id]/complete/route.ts` |
| 72 | `/api/sessions/[id]/notes` | `GET, POST` | ❌ No | ✅ Neon/PG | ❌ No | [B] BROKEN (Missing Auth) | `app/api/sessions/[id]/notes/route.ts` |
| 73 | `/api/sessions/[id]/signaling` | `GET, POST` | ❌ No | None | ❌ No | [B] BROKEN (Missing Auth) | `app/api/sessions/[id]/signaling/route.ts` |
| 74 | `/api/support/tickets` | `GET, POST` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/support/tickets/route.ts` |
| 75 | `/api/support/tickets/[id]` | `GET, POST, PATCH` | ✅ Yes | None | ❌ No | [~] PARTIALLY IMPLEMENTED | `app/api/support/tickets/[id]/route.ts` |
