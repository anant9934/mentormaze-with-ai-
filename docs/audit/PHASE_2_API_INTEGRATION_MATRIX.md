# MentorMaze — Phase 2 & 2.1: API Integration Matrix & Behavioral Contract

**Product:** MentorMaze by AI Tathastu  
**Domain:** https://mentormaze.aitathastu.com  
**AI Mentor:** ASTRION  
**Scope:** Core Student and Mentor Experience Real API Integration & Regression Closure  
**Date:** November 2026  
**Status:** 100% Implemented, Hardened & Verified  

---

## 1. Overview & Data Flow Architecture

Phase 2 and 2.1 establish a unified, authenticated, database-backed data flow across the student and mentor application journeys:

$$\text{Authenticated Session} \longrightarrow \text{Authorized API Handler} \longrightarrow \text{Drizzle ORM Validation} \longrightarrow \text{PostgreSQL Database} \longrightarrow \text{Typed JSON Response} \longrightarrow \text{Frontend UI}$$

All client-side in-memory mock stores (`@/lib/data/store`, `DEMO_USERS`, hardcoded IDs like `"user-student-1"`, `"user-mentor-priya"`, and manufactured reviews like `"Ananya Roy"`, `"Devansh Dixit"`) have been excised from the five core product areas.

---

## 2. API Endpoint & Page Integration Matrix

| Focus Area | Target Frontend Page | HTTP Method & Route | Auth Required | Request Parameters / Body | Response Payload | Status & Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Area 1: Mentor Discovery** | `app/mentors/page.tsx` | `GET /api/mentors` | Public (Optional Session) | `?domain=string`<br>`?search=string` | `{ success: true, total: number, mentors: Mentor[], topRecommendations: Recommendation[] }` | **VERIFIED**<br>(Live DB query, domain & search filtering, 0 sensitive fields leaked) |
| **Area 1: Mentor Profile** | `app/mentors/[id]/page.tsx` | `GET /api/mentors/[id]` | Public | `id` (slug or UUID in path) | `{ success: true, mentor: DetailedMentorProfile }` | **VERIFIED**<br>(404 on unapproved/missing, includes `availabilityWeekly` rules, authentic review empty states) |
| **Area 2: Student Dashboard** | `app/dashboard/page.tsx` | `GET /api/student/dashboard` | Required (`student`, `mentor`, `admin`) | Session Cookie / Bearer Token | `{ success: true, user: User, profile: Profile, goals: Goal[], upcomingBooking: Booking, topMatches: Match[] }` | **VERIFIED**<br>(Strictly derives identity from session, ignores spoofed `studentId`, no `demo-live` fallback) |
| **Area 3: Mentor Applications** | `app/mentor/apply/page.tsx` | `GET /api/mentor/applications` | Required (`student`, `mentor`, `admin`) | Session Cookie / Bearer Token | `{ success: true, hasApplication: boolean, application: Application \| null }` | **VERIFIED**<br>(Returns latest application status and profile draft; `admin_notes` strictly omitted) |
| **Area 3: Mentor Applications** | `app/mentor/apply/page.tsx` | `POST /api/mentor/applications` | Required (`student`, `mentor`, `admin`) | JSON: `{ currentRole, organization, domain, yearsExperience, skills, linkedinUrl, resumeUrl }` | `{ success: true, applicationId: uuid, mentorProfileId: uuid, status: 'submitted' }` | **VERIFIED**<br>(Blocks `javascript:` URLs, prevents self-approval, deduplicates applications) |
| **Area 4: Mentor Availability** | `app/mentor/availability/page.tsx` | `GET /api/mentor/availability` | Required (`mentor`, `admin`) | Session Cookie; optional `?mentorProfileId` for admin | `{ success: true, mentorProfileId: uuid, settings: Settings, rules: Rule[], exceptions: Exception[] }` | **VERIFIED**<br>(Priya fallback removed; 401 unauthenticated, 403 non-owner) |
| **Area 4: Mentor Availability** | `app/mentor/availability/page.tsx` | `PUT /api/mentor/availability` | Required (`mentor`, `admin`) | JSON: `{ settings, rules, forceOverrideConflicts }` | `{ success: true, mentorProfileId: uuid, message: string }` | **VERIFIED**<br>(Non-admin cannot force override conflicts -> 409; only admins can override) |
| **Area 4: Mentor Dashboard** | `app/mentor/dashboard/page.tsx` | `GET /api/mentor/dashboard` | Required (`mentor`, `admin`) | Session Cookie / Bearer Token | `{ success: true, mentor: Profile, stats: Stats, todaySession: Booking \| null, bookingRequests: Request[] }` | **VERIFIED**<br>(403 for student accounts, returns real requests & live call links) |
| **Area 4: Mentor Dashboard** | `app/mentor/dashboard/page.tsx` | `POST /api/mentor/dashboard` | Required (`mentor`, `admin`) | JSON: `{ action: 'accept' \| 'decline', bookingId: uuid, reason?: string }` | `{ success: true, bookingId: uuid, status: 'confirmed' \| 'cancelled' }` | **VERIFIED**<br>(BookingStateMachine, MentorLockManager, double-booking prevention, audit logging) |
| **Area 5: Direct Messages** | `app/dashboard/messages/page.tsx` | `GET /api/messages` | Required (`student`, `mentor`, `admin`) | Optional `?conversationId=uuid`<br>Optional `?mentorId=string` | `{ success: true, conversations?: Conv[], messages?: Message[] }` | **VERIFIED**<br>(Lists user threads or messages; enforces participant membership, blocks self-messaging) |
| **Area 5: Direct Messages** | `app/dashboard/messages/page.tsx` | `POST /api/messages` | Required (`student`, `mentor`, `admin`) | JSON: `{ conversationId?, content, attachmentUrl?, mentorId?, recipientUserId? }` | `{ success: true, message: Message }` | **VERIFIED**<br>(Atomic transaction: insert message, update conversation, audit outbox event) |

---

## 3. Security Invariants & Behavioral Safeguards

### 3.1 Booking Lifecycle Integrity
1. **Canonical State Transitions**: All accept and decline operations are processed through `BookingStateMachine.canTransition`. Direct, unvalidated mutations of `bookings.status` are prohibited.
2. **Concurrency Serialization**: All mutation operations acquire a dedicated per-mentor lock via `MentorLockManager.acquire(mentorProfileId, ...)`.
3. **Double-Booking & Slot Collision Prevention**: Before accepting a booking, the system executes an overlapping interval check against all existing confirmed bookings for that mentor:
   $$\text{start\_time\_utc} < \text{new\_end\_time} \quad \land \quad \text{end\_time\_utc} > \text{new\_start\_time}$$
   If a collision is detected, the operation aborts with `HTTP 409 Conflict`.
4. **Audit Trail**: Every state transition writes a permanent record into `booking_events` capturing `booking_id`, `event_type`, `from_status`, `to_status`, `actor_id`, `actor_role`, and metadata.
5. **Outbox Events**: Real-time notifications and calendar synchronization are dispatched via transactional inserts into `outbox_events` (`status = 'pending'`).

### 3.2 Availability Override Privilege Escalation Defense
- Client-supplied `forceOverrideConflicts` is strictly checked against the server session role.
- If a standard mentor passes `forceOverrideConflicts: true`, the API ignores the flag and sets it to `false`.
- If deactivating rules would orphan confirmed future bookings, the API rejects the mutation with `HTTP 409 Conflict`.
- Only platform administrators (`admin` or `super_admin`) may override availability conflicts.

### 3.3 Direct Messaging Protections
- **Self-Messaging Prevention**: Users cannot start conversations with themselves or message themselves (`mentorUserId === session.id` or `recipientUserId === session.id` returns `HTTP 400 Bad Request`).
- **Mentor Status Verification**: Starting conversations with unapproved or suspended mentors is rejected with `HTTP 400` / `HTTP 403`.
- **Database Transaction Atomicity**: Message insertion, thread `last_message` updating, and outbox event logging execute within a single atomic database transaction (`db.transaction`).

### 3.4 Mentor Application Safeguards
- **URL Scheme Validation**: Rejects `javascript:`, `data:`, and `vbscript:` schemes for LinkedIn and resume URLs with `HTTP 400 Bad Request`.
- **Self-Approval Prevention**: Application status is strictly set to `'submitted'`; standard users cannot elevate their status to `'approved'`.
- **Compliance Privacy**: `admin_notes` is strictly omitted from applicant-facing API projections.
- **Duplicate Prevention**: Re-submitting an application updates the existing record rather than creating orphan duplicate rows.
