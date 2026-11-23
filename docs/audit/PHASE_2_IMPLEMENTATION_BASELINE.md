# MentorMaze — Phase 2: Implementation Baseline & Gap Analysis

**Product:** MentorMaze by AI Tathastu  
**Domain:** https://mentormaze.aitathastu.com  
**AI Mentor:** ASTRION  
**Scope:** Core Student and Mentor Experience Mock Elimination & Real Database Integration  
**Date:** November 2026  
**Status:** Preflight Inspection Completed — Implementation Underway  

---

## 1. Executive Summary

Phase 1 successfully hardened platform security, remediating 29 administrative endpoints across 17 route files, enforcing booking ownership verification, upgrading password cryptography to Bcrypt-12 with legacy SHA-256 zero-downtime migration, and securing all session tokens. 

Phase 2 focuses on eliminating the frontend mock layer (`@/lib/data/store`, `DEMO_USERS`, hardcoded identifiers such as `"user-student-1"` and `"user-mentor-priya"`) across the core student and mentor product journeys, replacing them with authenticated, authorized, database-backed API endpoints powered by PostgreSQL via Drizzle ORM.

### The Five Target Focus Areas
1. **Approved Mentor Discovery & Profiles**: Public directory (`app/mentors/page.tsx`) and mentor profile details (`app/mentors/[id]/page.tsx`).
2. **Student Dashboard**: Real authenticated student dashboard (`app/dashboard/page.tsx`), showing enrolled goals, scheduled sessions, and tailored recommendations.
3. **Mentor Application & Lifecycle**: Multi-step onboarding application (`app/mentor/apply/page.tsx`) submitting directly to `mentor_applications` and `mentor_profiles`.
4. **Mentor Workspace & Availability**: Authenticated mentor command center (`app/mentor/dashboard/page.tsx`), real booking requests, and persistent schedule configuration.
5. **Direct Messaging System**: Durable, authorized 1:1 participant messaging (`app/dashboard/messages/page.tsx`) reading from and writing to PostgreSQL `conversations` and `messages`.

---

## 2. Preflight Inventory: Target Pages & Current Mock State

| Target Frontend Page | Primary Mock Dependencies | Current Hardcoded Identifiers | Missing / Defective Endpoints |
| :--- | :--- | :--- | :--- |
| `app/mentors/page.tsx` | `store.getMentors(true)`, `store.getTopRecommendedMentors` | `currentUserId = user?.id \|\| "user-student-1"` | Missing `GET /api/mentors` with domain filtering, search, and recommendation scoring. |
| `app/mentors/[id]/page.tsx` | `store.getMentorById(id)`, hardcoded fallback `"mentor-priya"` | Hardcoded demo names, avatars, and review strings | Missing `GET /api/mentors/[id]` returning public profile, reviews, and availability rules. |
| `app/dashboard/page.tsx` | `store.getStudentProfile`, `store.getTopRecommendedMentors`, `store.getBookingsForUser` | Fallback to `"user-student-1"` and hardcoded name `"Anant"` | Missing `GET /api/student/dashboard` returning user profile, goals, next booking, and recommended mentors. |
| `app/mentor/apply/page.tsx` | `store.submitMentorApplication` mutating in-memory store | Preset form state `"Rahul Mehta"`, hardcoded mentor profile id `"mentor-rahul"` | Missing `POST /api/mentor/applications` and `GET /api/mentor/applications/status`. |
| `app/mentor/dashboard/page.tsx` | In-memory local state `requests` array (`req-1`, `req-2`, `req-3`) | Hardcoded `"Priya"`, static stats (12, 48, 4.9) | Missing `GET /api/mentor/dashboard` aggregating live booking requests, session stats, and today's schedule. Defective `app/api/mentor/availability/route.ts` with IDOR fallback. |
| `app/dashboard/messages/page.tsx` | `store.getMessages`, `store.sendMessage`, synthetic `setTimeout` auto-reply | Hardcoded contact list, fallback to `"conv-priya-anant"` | Existing `GET/POST /api/messages` requires `conversationId` parameter but lacks a conversation list endpoint `GET /api/messages/conversations`. |

---

## 3. Database Schema Verification (PostgreSQL / Drizzle ORM)

All required tables already exist in `lib/db/schema.ts` and have been verified against both PostgreSQL and in-memory PGlite:

1. **Mentor Discovery & Profile**:
   - `mentor_profiles`: `id`, `user_id`, `headline`, `bio`, `organization`, `current_role`, `years_of_experience`, `location`, `rating`, `total_sessions`, `total_mentees`, `verification_status`, `languages`, `session_modes`, `price_15min_inr`, `price_30min_inr`, `price_60min_inr`.
   - `mentor_expertise`: `primary_domain`, `skills`, `focus_areas`.
   - Joined with `users`: `display_name`, `avatar_url`.
2. **Student Dashboard**:
   - `student_profiles`: `id`, `user_id`, `institution`, `degree`, `target_role`, `current_level`, `bio`.
   - `student_goals`: `title`, `description`, `category`, `status`, `progress_percentage`, `target_date`.
   - `bookings`: `id`, `service_type`, `start_time_utc`, `end_time_utc`, `status`, `meeting_room_id`.
3. **Mentor Application**:
   - `mentor_applications`: `id`, `mentor_profile_id`, `status`, `identity_proof_type`, `professional_proof_type`, `resume_url`, `linkedin_url`, `admin_notes`.
4. **Mentor Workspace & Availability**:
   - `availability_rules`: `mentor_profile_id`, `day_of_week`, `start_time`, `end_time`, `is_active`.
   - `availability_exceptions`: `exception_date`, `is_blocked`, `start_time`, `end_time`, `reason`.
   - `mentor_availability_settings`: `buffer_time_minutes`, `min_notice_hours`, `max_advance_days`, `daily_session_limit`.
5. **Direct Messaging**:
   - `conversations`: `id`, `student_user_id`, `mentor_user_id`, `last_message_text`, `last_message_at`.
   - `messages`: `id`, `conversation_id`, `sender_user_id`, `content`, `attachment_url`, `is_read`, `created_at`.

---

## 4. Key Security & Architecture Invariants

1. **Strict Session-Derived Identity**:
   - Never trust client-supplied `userId`, `studentId`, `mentorId`, or role claims.
   - All authenticated requests resolve caller identity through `getServerSession()` / `requireAuth()`.
2. **Authorization Enforcement**:
   - Student dashboard endpoints strictly restrict queries to `session.id`.
   - Mentor workspace endpoints verify that `session.id` corresponds to an approved mentor profile in `mentor_profiles`.
   - Messaging endpoints verify participant membership on every conversation read and write.
   - Mentor availability modification (`PUT /api/mentor/availability`) requires an authenticated mentor session matching the target profile; all arbitrary query overrides and demo fallbacks must be eliminated.
3. **Public Privacy Protection**:
   - Public mentor listings (`GET /api/mentors` and `GET /api/mentors/[id]`) return only approved mentors (`verification_status = 'approved'`).
   - Private personal data (email, phone number, password hash, identity proof URLs, internal admin notes) are strictly omitted from public API projections.
4. **Resilient Frontend UI State**:
   - Loading skeletons matching the warm-neutral design tokens (`#123B2E`, `cream-50`, `font-serif`).
   - Clean, accurate empty states when records do not exist (e.g. no upcoming sessions, no active applications).
   - Real, transparent error banners when network or server errors occur — never fabricated mock success.

---

## 5. Implementation Roadmap

- **Step 1: Public Mentor Discovery & Profile Endpoints & Pages**
  - Create `app/api/mentors/route.ts` and `app/api/mentors/[id]/route.ts`.
  - Update `components/mentors/mentor-card.tsx` to display live database fields.
  - Rewire `app/mentors/page.tsx` and `app/mentors/[id]/page.tsx` to fetch from real endpoints.
- **Step 2: Student Dashboard API & Frontend Integration**
  - Create `app/api/student/dashboard/route.ts` with authenticated session derivation.
  - Rewire `app/dashboard/page.tsx` with dynamic goal rendering, next session data, and personalized recommendations.
- **Step 3: Mentor Application Lifecycle API & Frontend Integration**
  - Create `app/api/mentor/applications/route.ts` for submission and status lookup.
  - Rewire `app/mentor/apply/page.tsx` to bind authenticated user, handle submissions, and render real submission status.
- **Step 4: Mentor Workspace & Availability Hardening**
  - Fix security vulnerability in `app/api/mentor/availability/route.ts` (remove client-supplied override & Priya fallback).
  - Create `app/api/mentor/dashboard/route.ts` for mentor session requests and metrics.
  - Rewire `app/mentor/dashboard/page.tsx` to manage live requests and view real schedule.
- **Step 5: Direct Messaging API & Chat Stream Integration**
  - Add conversation listing capability (`GET /api/messages` or conversations endpoint).
  - Rewire `app/dashboard/messages/page.tsx` to load real user conversations and post durable messages to PostgreSQL.
- **Step 6: Automated Test Verification & Documentation**
  - Author comprehensive test suite `tests/phase2-frontend-api-integration.test.ts`.
  - Validate TypeScript compilation and Next.js production build.
  - Generate full set of Phase 2 audit reports.
