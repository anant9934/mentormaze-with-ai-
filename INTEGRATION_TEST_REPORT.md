# MENTORMAZE — INTEGRATION TEST REPORT

**Test Runner:** Vitest v2.1.9  
**Execution Environment:** Node.js v24.22.0 / Next.js 14.2.35  
**Database Test Engine:** PGlite WASM (PostgreSQL 16) with disk persistence in `./.mentormaze-pgdata`  
**Test Suite Result:** 18 Tests Passed (100% Success Rate)  
**Production Build Result:** 31 Routes Compiled Cleanly  

---

## 1. Test Suite Summary

```
 RUN  v2.1.9 /Users/quantum/Desktop/MENTOR MAZE

 ✓ tests/platform.test.ts (11 tests)
 ✓ tests/database.test.ts (7 tests)

 Test Files  2 passed (2)
      Tests  18 passed (18)
   Duration  721ms
```

---

## 2. Detailed Test Cases & Verification Breakdown

### 2.1 Platform Business Logic Suite (`tests/platform.test.ts`)

| # | Test Case Description | Assertion / Condition Verified | Status |
|---|---|---|---|
| **1** | **Deterministic Matching Algorithm Scoring** | Computes multi-factor match score between student and mentor profiles; verifies score falls between 0 and 100 with explainable match reasons. | **PASS** |
| **2** | **Career Goal Alignment Weight** | Verifies that a mentor sharing the student's target role ("Software Engineer") receives a higher score than a mentor from an unrelated domain. | **PASS** |
| **3** | **Skill Gap Alignment Weight** | Confirms that mentors offering skills the student needs ("System Design", "Distributed Systems") gain significant score boosts. | **PASS** |
| **4** | **Multi-Criteria Filtering by Domain** | Tests domain filtering ("Software Engineering", "Data Science", "Product Management") returning only matching verified mentors. | **PASS** |
| **5** | **Multi-Criteria Filtering by Price Range** | Verifies filtering mentors within pilot pricing boundaries (e.g. `<= 250`). | **PASS** |
| **6** | **In-Memory Store Double-Booking Prevention** | Rejects booking requests when a mentor already has an active overlapping booking in that time slot (`start < end && end > start`). | **PASS** |
| **7** | **Marketplace Commission Calculation** | Validates exact 15% platform take-rate calculation: on ₹249 gross, platform fee = ₹37, mentor payable = ₹212. | **PASS** |
| **8** | **Pilot Pricing Tier Verification** | Asserts exact configured pilot pricing: Mentorship = ₹149, ₹249, ₹449; Mock Interviews = ₹299, ₹399, ₹499. | **PASS** |
| **9** | **Role Authorization Helper (`checkRole`)** | Verifies that a user with role `'student'` is denied access to `'admin'` or `'mentor'` permissions. | **PASS** |
| **10**| **AI Tathastu Consent Grant & Revocation** | Tests creating consent grant with granular scopes (`["academic", "skills", "projects"]`) and updating `isRevoked: true`. | **PASS** |
| **11**| **Mock Interview Scorecard Calculation** | Verifies overall score computation across technical (8.5), problem solving (9.0), communication (8.0), and confidence (8.5). | **PASS** |

### 2.2 PostgreSQL Database Integration Suite (`tests/database.test.ts`)

| # | Test Case Description | Real SQL Verification / Constraint Checked | Status |
|---|---|---|---|
| **12**| **Table DDL & Raw SQL Execution** | Executes `SELECT 1 + 1 as sum;` against the persistent PostgreSQL engine and validates integer arithmetic result. | **PASS** |
| **13**| **Persistent User Records in PostgreSQL** | Executes `SELECT count(*) as total FROM users;` and confirms at least 6 initial seed user records are persisted. | **PASS** |
| **14**| **Mentor Profile Verification Status in SQL** | Queries `mentor_profiles` for headline `'Microsoft'` and asserts `verification_status = 'approved'`. | **PASS** |
| **15**| **Unique Email Constraint at Database Level** | Attempts to insert a duplicate user with `email = 'anant@example.com'`; verifies that PostgreSQL throws a unique key violation. | **PASS** |
| **16**| **SQL Overlap Query Double-Booking Prevention** | Inserts a confirmed booking and runs the SQL overlap query (`start_time_utc < $end AND end_time_utc > $start`); verifies exactly 1 conflict detected. | **PASS** |
| **17**| **Transactional Booking Service with Collision Handling** | Calls `createBookingInDb()`; then attempts a second concurrent booking overlapping by 15 minutes. Asserts that the second attempt fails with `"Slot reservation collision"`. Then tests `cancelBookingInDb()` and verifies status transition to `'cancelled'`. | **PASS** |
| **18**| **Reliable Outbox Worker Batch Processing** | Inserts a pending `'booking.created'` event into `outbox_events`. Executes `processOutboxBatch(10)`. Asserts event transitions to `'completed'` and a new row is created in `notifications` for the student. | **PASS** |

---

## 3. Production Build Verification

Next.js production build was executed with zero errors across all 31 application and API routes:

```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.25 kB         111 kB
├ ○ /_not-found                          873 B          88.2 kB
├ ƒ /admin                               2.86 kB         111 kB
├ ƒ /admin/matching                      2.5 kB          111 kB
├ ƒ /admin/settings                      2.69 kB         111 kB
├ ƒ /admin/verification                  3.05 kB         112 kB
├ ƒ /api/auth/login                      0 B                0 B
├ ƒ /api/auth/logout                     0 B                0 B
├ ƒ /api/auth/session                    0 B                0 B
├ ƒ /api/livekit/token                   0 B                0 B
├ ƒ /api/messages                        0 B                0 B
├ ƒ /api/payments/webhook                0 B                0 B
├ ○ /dashboard                           4.46 kB         118 kB
├ ○ /dashboard/messages                  3.06 kB         117 kB
├ ○ /dashboard/mock-interviews           1.13 kB         114 kB
├ ○ /dashboard/progress                  2.11 kB         115 kB
├ ○ /dashboard/resources                 1.61 kB         115 kB
├ ○ /dashboard/sessions                  1.67 kB         115 kB
├ ○ /how-it-works                        200 B           101 kB
├ ○ /login                               4.75 kB         101 kB
├ ○ /mentor/apply                        3.55 kB         112 kB
├ ○ /mentor/availability                 2.03 kB         103 kB
├ ○ /mentor/dashboard                    2.56 kB         108 kB
├ ○ /mentors                             4.16 kB         118 kB
├ ƒ /mentors/[id]                        4.36 kB         118 kB
├ ƒ /mentors/[id]/book                   3.56 kB         117 kB
├ ○ /mock-interviews                     200 B           101 kB
├ ƒ /mock-interviews/[id]/report         2.45 kB         111 kB
├ ○ /mock-interviews/practice            2.98 kB         109 kB
├ ○ /onboarding                          3.96 kB         108 kB
├ ○ /pricing                             200 B           101 kB
├ ○ /programs                            200 B           101 kB
├ ƒ /sessions/[id]/confirmation          4.51 kB         118 kB
├ ƒ /sessions/[id]/live                  4.68 kB         114 kB
└ ƒ /sessions/[id]/summary               1.75 kB         110 kB
```
