# MENTORMAZE — INTEGRATION TEST REPORT & HARDENED VERIFICATION

**Test Runner:** Vitest v2.1.9  
**Execution Environment:** Node.js v24.22.0 / Next.js 14.2.35  
**Database Test Engine:** PGlite WASM (PostgreSQL 16) with disk persistence in `./.mentormaze-pgdata`  
**Test Suite Result:** 27 Tests Passed Across 4 Test Suites (100% Success Rate)  
**Production Build Result:** 32 Routes Compiled Cleanly (0 Errors)

---

## 1. Test Suite Summary

```
 RUN  v2.1.9 /Users/quantum/Desktop/MENTOR MAZE

 ✓ tests/platform.test.ts (11 tests)
 ✓ tests/database.test.ts (8 tests)
 ✓ tests/payment.test.ts (4 tests)
 ✓ tests/livekit.test.ts (4 tests)

 Test Files  4 passed (4)
      Tests  27 passed (27)
   Start at  18:55:52
   Duration  1.11s (transform 67ms, setup 0ms, collect 268ms, tests 348ms, environment 0ms, prepare 85ms)
```

---

## 2. Detailed Test Cases & Verification Breakdown

### 2.1 Platform Business Logic Suite (`tests/platform.test.ts` — 11 Tests)

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

---

### 2.2 PostgreSQL Database Integration Suite (`tests/database.test.ts` — 8 Tests)

| # | Test Case Description | Real SQL Verification / Constraint Checked | Status |
|---|---|---|---|
| **12**| **Table DDL & Raw SQL Execution** | Executes `SELECT 1 + 1 as sum;` against the persistent PostgreSQL engine and validates integer arithmetic result. | **PASS** |
| **13**| **Persistent User Records in PostgreSQL** | Executes `SELECT count(*) as total FROM users;` and confirms at least 6 initial seed user records are persisted. | **PASS** |
| **14**| **Mentor Profile Verification Status in SQL** | Queries `mentor_profiles` for headline `'Microsoft'` and asserts `verification_status = 'approved'`. | **PASS** |
| **15**| **Unique Email Constraint at Database Level** | Attempts to insert a duplicate user with `email = 'anant@example.com'`; verifies that PostgreSQL throws a unique key violation. | **PASS** |
| **16**| **SQL Overlap Query Double-Booking Prevention** | Inserts a confirmed booking and runs the SQL overlap query (`start_time_utc < $end AND end_time_utc > $start`); verifies exactly 1 conflict detected. | **PASS** |
| **17**| **Transactional Booking Service with Collision Handling** | Calls `createBookingInDb()`; then attempts a second concurrent booking overlapping by 15 minutes. Asserts that the second attempt fails with `"Slot reservation collision"`. Then tests `cancelBookingInDb()` and verifies status transition to `'cancelled'`. | **PASS** |
| **18**| **Reliable Outbox Worker Batch Processing** | Inserts a pending `'booking.created'` event into `outbox_events`. Executes `processOutboxBatch(10)` with `FOR UPDATE SKIP LOCKED`. Asserts event transitions to `'completed'` and a new row is created in `notifications` for the student. | **PASS** |
| **19**| **20-Request Simultaneous Booking Concurrency** | Submits 20 concurrent booking requests simultaneously via `Promise.all()` for the exact same mentor and slot. Asserts that **exactly 1 succeeds** and **19 fail** with `"Slot reservation collision"`. | **PASS** |

---

### 2.3 Cashfree Payment & Ledger Suite (`tests/payment.test.ts` — 4 Tests)

| # | Test Case Description | Assertion / Condition Verified | Status |
|---|---|---|---|
| **20**| **Cashfree Sandbox Order Creation** | Generates sandbox order with customer details, order amount (₹249), and asserts returned `paymentSessionId` containing `"session_cf_"`. | **PASS** |
| **21**| **Webhook HMAC-SHA256 Signature Verification** | Computes valid HMAC-SHA256 digest over `${timestamp}${rawBody}` using secret; asserts `timingSafeEqual()` returns true. Asserts tampered payload returns false. | **PASS** |
| **22**| **Double-Entry Ledger Balancing Across 6 Pilot Tiers** | Evaluates all pilot tiers (Mentorship ₹149, ₹249, ₹449; Mock Interviews ₹299, ₹399, ₹499) at 15% commission. Asserts `platformFee + mentorPayable === grossAmount` and `balanced === true` for 100% of tiers. | **PASS** |
| **23**| **Refund Processing & Reversal** | Calls `paymentGateway.createRefund()`; verifies refund response `status: "SUCCESS"` and generated `refundId`. | **PASS** |

---

### 2.4 LiveKit Two-Client Security & Token Suite (`tests/livekit.test.ts` — 4 Tests)

| # | Test Case Description | Assertion / Condition Verified | Status |
|---|---|---|---|
| **24**| **Two-Client Token Creation for Identical Room** | Generates LiveKit WebRTC access tokens for student and mentor targeting the same booking room ID. Asserts both receive valid signed JWTs with room join permissions. | **PASS** |
| **25**| **IDOR Prevention: Intruder Rejection** | Attempts to request room token for an unauthorized third-party user ID. Asserts authorization fails (`allowed === false`), preventing eavesdropping. | **PASS** |
| **26**| **Cancelled Booking Access Rejection** | Attempts to obtain token for a booking whose status is `'cancelled'`. Asserts authorization fails, closing room access post-cancellation. | **PASS** |
| **27**| **Token Metadata & Expiration Claims** | Decodes token header and payload; verifies expiration claim (`exp`) and identity metadata. | **PASS** |

---

## 3. Production Build Route Table (32 Routes)

Next.js production build succeeded with zero errors across all 32 application and API routes:

```
Route (app)                              Size     First Load JS
┌ ○ /                                    6.15 kB         111 kB
├ ○ /_not-found                          873 B          88.2 kB
├ ƒ /admin                               3.82 kB         112 kB
├ ƒ /admin/matching                      3.44 kB         111 kB
├ ƒ /admin/settings                      3.63 kB         111 kB
├ ƒ /admin/verification                  4.01 kB         112 kB
├ ƒ /api/auth/login                      0 B                0 B
├ ƒ /api/auth/logout                     0 B                0 B
├ ƒ /api/auth/session                    0 B                0 B
├ ƒ /api/cron/outbox                     0 B                0 B
├ ƒ /api/livekit/token                   0 B                0 B
├ ƒ /api/messages                        0 B                0 B
├ ƒ /api/payments/webhook                0 B                0 B
├ ○ /dashboard                           4.46 kB         118 kB
├ ○ /dashboard/messages                  4.03 kB         117 kB
├ ○ /dashboard/mock-interviews           1.13 kB         115 kB
├ ○ /dashboard/progress                  2.1 kB          116 kB
├ ○ /dashboard/resources                 1.61 kB         115 kB
├ ○ /dashboard/sessions                  1.67 kB         115 kB
├ ○ /how-it-works                        1.28 kB         101 kB
├ ○ /login                               4.82 kB         101 kB
├ ○ /mentor/apply                        4.5 kB          112 kB
├ ○ /mentor/availability                 3.01 kB         103 kB
├ ○ /mentor/dashboard                    3.52 kB         109 kB
├ ○ /mentors                             5.11 kB         118 kB
├ ƒ /mentors/[id]                        5.31 kB         118 kB
├ ƒ /mentors/[id]/book                   4.52 kB         118 kB
├ ○ /mock-interviews                     1.28 kB         101 kB
├ ƒ /mock-interviews/[id]/report         3.41 kB         111 kB
├ ○ /mock-interviews/practice            3.92 kB         109 kB
├ ○ /onboarding                          4.04 kB         109 kB
├ ○ /pricing                             1.28 kB         101 kB
├ ○ /programs                            1.28 kB         101 kB
├ ƒ /sessions/[id]/confirmation          5.45 kB         119 kB
├ ƒ /sessions/[id]/live                  4.69 kB         114 kB
└ ƒ /sessions/[id]/summary               2.73 kB         111 kB
+ First Load JS shared by all            87.3 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```
