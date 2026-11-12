# MentorMaze — Booking & Payment Security Audit

**Official Platform:** MentorMaze by AI Tathastu  
**Official Production Domain:** `https://mentormaze.aitathastu.com`  
**Brand Identity:** Human mentorship, career guidance, and mock interview practice  
**Audit Scope:** Concurrency, Payment Tampering, Webhook Authenticity, Token Security, and Data Isolation  

---

## 1. Threat Model & Attack Surface Overview

MentorMaze connects students with vetted human mentors for 1-on-1 career guidance and rigorous mock technical interviews. Because monetary transactions (via Cashfree), private participant audio/video streams (via LiveKit), and confidential hiring assessments (mock interview rubrics) flow through this infrastructure, strict security perimeters are mandatory.

```
                      ATTACK SURFACE & SECURITY PERIMETER
                      
  [ Attacker / Student ]                      [ Attacker / Webhook Spoofer ]
            │                                               │
            ▼                                               ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 1. Client-Side Amount Tampering: Rebuffed by authoritative DB pricing  │
  │ 2. Race Condition Collisions: Rebuffed by PostgreSQL row-level locks    │
  │ 3. Webhook Forgery: Rebuffed by HMAC-SHA256 signature validation        │
  │ 4. Unauthorized Video Snoop: Rebuffed by join window & participant ACL │
  │ 5. Private Evaluation Leak: Rebuffed by role-based schema projection   │
  └────────────────────────────────────────────────────────────────────────┘
```

The primary threat vectors identified and audited include:
1. **Double-Booking & Slot Race Conditions:** Concurrent checkout attempts by adversarial or simultaneous users targeting the same mentor availability slot.
2. **Client-Side Pricing & Parameter Tampering:** Attempts to submit arbitrary minor unit amounts (e.g., ₹1 instead of ₹2,500) or alter mentor payouts.
3. **Webhook Spoofing & Replay Attacks:** Unauthenticated adversaries POSTing forged `PAYMENT_SUCCESS` payloads to gain free access or replaying captured webhooks.
4. **LiveKit Room Snooping & Privilege Escalation:** Unauthorized students or third parties minting LiveKit tokens to spy on private mentoring sessions or publish unauthorized media tracks.
5. **Private Evaluation & Notes Information Leakage:** Students querying API endpoints to view private mentor notes or unreleased draft interview rubrics prior to formal publication.

---

## 2. Race Condition & Double-Booking Mitigation

### 2.1 Threat Vector
An adversary fires 20 simultaneous HTTP POST requests to reserve or book the exact same mentor slot (e.g., 2026-11-20 10:00 - 10:30 UTC), attempting to cause a database race condition where multiple confirmed bookings are created for a single time window.

### 2.2 Implemented Countermeasures
MentorMaze deploys a **defense-in-depth, two-tier concurrency control architecture**:

1. **Process-Level Serialization (`MentorLockManager` in `lib/db/concurrency.ts`):**
   - Serializes requests targeting the same mentor within the Node.js runtime queue.
   - Fault-tolerant catch handler (`.catch(() => {})`) prevents stuck queues even if an unexpected exception occurs during request processing.

2. **Database ACID Row-Level Locks (`lib/db/booking-service.ts` & `lib/db/booking-state-machine.ts`):**
   - Transactions execute `SELECT ... FROM mentor_profiles WHERE id = $1 FOR UPDATE`. This blocks concurrent database transactions from reading or mutating the mentor's booking schedule until the active transaction commits or rolls back.
   - Double-booking overlap query:
     ```sql
     SELECT id FROM bookings
     WHERE mentor_profile_id = $1
       AND status IN ('held', 'pending_payment', 'confirmed', 'in_progress')
       AND start_time_utc < $newEndTime
       AND end_time_utc > $newStartTime
     ```
   - If an overlapping booking exists, the transaction rolls back immediately with `SLOT_ALREADY_BOOKED`.

3. **Temporary Hold Manager TTL (`lib/calendar/hold-manager.ts`):**
   - Temporary slot reservations are strictly time-bound (default: 10 minutes = 600 seconds).
   - Holds are validated for expiration on every payment attempt and webhook callback.

### 2.3 Verification Evidence
- Verified via `tests/booking-lifecycle-e2e.test.ts` ("Concurrency & Collision Hardening"):
  - When two simultaneous booking requests compete for the identical slot, exactly **1 succeeds** and **1 is rejected** with `SLOT_ALREADY_BOOKED`.
  - Verified via `tests/database.test.ts`: Exactly **1 of 20 simultaneous requests** acquires the slot, with 19 requests deterministically rejected.

---

## 3. Payment Tampering & Integer Minor Unit Accounting

### 3.1 Threat Vector
A malicious user intercepts the checkout API call and modifies the JSON payload from `{"amount": 2500}` to `{"amount": 1}`, or exploits floating-point rounding inaccuracies (`0.1 + 0.2 = 0.30000000000000004`) to induce financial drift.

### 3.2 Implemented Countermeasures
1. **Authoritative Server-Side Pricing:**
   - The client **never** specifies the price in `POST /api/payments/create-order`.
   - The server queries `services` and `mentor_services` tables directly using the validated `serviceType` and `mentorProfileId`.
   - The order amount is computed exclusively on the backend:
     ```ts
     const baseAmountPaise = Math.round(servicePriceInr * 100);
     ```

2. **Integer Minor Unit (Paise) Precision:**
   - All financial operations across the platform, including order creation, ledger journal entries, refunds, and mentor settlements, operate strictly in integer minor units (paise).
   - In `lib/payments/adapter.ts`:
     ```ts
     export function calculateSplitPaise(totalPaise: number, takeRatePercent: number = 15) {
       const platformFeePaise = Math.round((totalPaise * takeRatePercent) / 100);
       const mentorEarningsPaise = totalPaise - platformFeePaise;
       return { totalPaise, platformFeePaise, mentorEarningsPaise };
     }
     ```
   - Strict invariant: `platformFeePaise + mentorEarningsPaise === totalPaise`. No fractions or rounding leakage.

3. **Double-Entry Ledger Integrity:**
   - Every completed payment records balanced debits and credits in `ledger_transactions`:
     - Gateway Account Debit: `+totalPaise`
     - Mentor Payable Credit: `+mentorEarningsPaise`
     - Platform Revenue Credit: `+platformFeePaise`
   - Sum of credits exactly equals sum of debits (`Δ = 0`).

---

## 4. Cashfree Webhook Security & Idempotency

### 4.1 Threat Vector
An adversary sends fraudulent webhook events mimicking Cashfree's `PAYMENT_SUCCESS_WEBHOOK` or replays past captured webhooks to mark unpaid bookings as confirmed.

### 4.2 Implemented Countermeasures
1. **HMAC-SHA256 Signature Verification (`app/api/payments/webhook/route.ts`):**
   - The raw request body text is captured before any parsing or transformation:
     ```ts
     const rawBody = await req.text();
     ```
   - Signature header `x-webhook-signature` is verified against Cashfree's signing key using HMAC-SHA256:
     ```ts
     const expectedSignature = crypto
       .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
       .update(rawBody)
       .digest("base64");
     ```
   - If the signature does not match, the route returns HTTP `401 Unauthorized` and aborts immediately.

2. **Timestamp Freshness & Replay Prevention:**
   - Header `x-webhook-timestamp` is evaluated. Requests with timestamps older than 300 seconds (5 minutes) are rejected to mitigate replay attacks.

3. **Event Idempotency via Unique Event ID:**
   - Every processed webhook records its unique gateway event ID in the database.
   - Subsequent identical webhooks immediately return HTTP `200 OK` with `{"status": "already_processed"}` without executing duplicate financial credits or state changes.

4. **Late Payment Handling & Hold Expiry Race:**
   - If a webhook confirms payment for an order whose temporary hold expired and whose slot was subsequently booked by another student, MentorMaze detects the collision, transitions the booking to `cancelled`, and automatically triggers a full Cashfree gateway refund (`app/api/payments/refund/route.ts`).

---

## 5. LiveKit Session Join Window & Token ACL

### 5.1 Threat Vector
An eavesdropper obtains a LiveKit room token hours before a session, or an unauthenticated third party attempts to mint tokens to listen into active sessions.

### 5.2 Implemented Countermeasures
1. **Strict Join Eligibility Window (`lib/livekit/token-service.ts`):**
   - Tokens can only be minted within the strict window:
     $$\text{Window} = [\text{startTimeUtc} - 15\text{ minutes},\; \text{endTimeUtc} + 30\text{ minutes}]$$
   - Attempts prior to `startTime - 15m` are rejected with `JOIN_WINDOW_NOT_OPEN`.
   - Attempts after `endTime + 30m` are rejected with `SESSION_WINDOW_EXPIRED`.

2. **Least-Privilege Participant Grants:**
   - Only validated `studentUserId`, assigned `mentorUserId`, or authenticated platform administrators can mint tokens. Third parties receive `UNAUTHORIZED_PARTICIPANT`.
   - Tokens are minted with short lifespans (default: 60 minutes) and specific video/audio publication permissions:
     - `canPublish: true`
     - `canSubscribe: true`
     - `canPublishData: true`
     - `hidden: false`
     - `recorder: false` (only recording bot can record)

3. **Credential Masking in Application Logs:**
   - Application logs never print raw LiveKit JWT tokens or API secrets. Tokens are masked with `[REDACTED]` or truncated SHA256 checksums.

---

## 6. Confidential Data Isolation (Mentor Notes & Rubrics)

### 6.1 Threat Vector
A student inspecting browser network tools fetches `/api/sessions/[id]/notes` or `/api/mock-interviews/[id]/evaluation` to read private mentor notes, internal candidate ratings, or unpublished rubric scores.

### 6.2 Implemented Countermeasures
1. **Private Mentor Scratchpad Isolation (`app/api/sessions/[id]/notes/route.ts`):**
   - The database stores two distinct note fields: `shared_notes` (agenda and shared takeaways) and `mentor_private_notes` (confidential observations).
   - In the API endpoint:
     ```ts
     if (userRole !== "mentor" && userRole !== "admin") {
       delete responseData.mentorPrivateNotes;
     }
     ```
   - Students querying the endpoint receive `mentorPrivateNotes: null` unconditionally.

2. **Draft Interview Rubric Isolation (`app/api/mock-interviews/[id]/evaluation/route.ts`):**
   - Evaluation records remain in `draft` status until explicitly published by the mentor (`status = "published"`).
   - When a student queries an evaluation in `draft` status:
     ```ts
     if (userRole === "student" && evaluation.status === "draft") {
       return NextResponse.json({
         success: true,
         evaluation: null,
         message: "Evaluation is currently being prepared by the mentor."
       });
     }
     ```
   - Only when `status === "published"` are the final dimension scores and feedback visible to the student.

---

## 7. Security Verification Matrix

| Vulnerability Vector | Test Suite Reference | Test Outcome |
|---|---|---|
| Slot Collision & Concurrency | `tests/booking-lifecycle-e2e.test.ts` (Phase 1) | **PASSED** (1 winner, 1 rejected) |
| Multi-Threaded Double-Booking (20 concurrent) | `tests/database.test.ts` | **PASSED** (1 winner, 19 rejected) |
| State Machine Illegal Transitions | `tests/booking-lifecycle-e2e.test.ts` (Phase 2) | **PASSED** (`completed` → `held` blocked) |
| Cashfree HMAC-SHA256 Verification | `tests/booking-lifecycle-e2e.test.ts` (Phase 3) | **PASSED** (Invalid signature rejected) |
| Integer Paise Minor Unit Precision | `tests/booking-lifecycle-e2e.test.ts` (Phase 3) | **PASSED** (₹2,500.00 = 250000 paise split) |
| Webhook Idempotent Replay Protection | `tests/booking-lifecycle-e2e.test.ts` (Phase 3) | **PASSED** (Second webhook no-ops) |
| LiveKit Join Window Timing Check | `tests/booking-lifecycle-e2e.test.ts` (Phase 4) | **PASSED** (`JOIN_WINDOW_NOT_OPEN` enforced) |
| LiveKit Third-Party Intruder Rejection | `tests/livekit-routing.test.ts` | **PASSED** (`UNAUTHORIZED_PARTICIPANT`) |
| Private Mentor Notes Data Isolation | `tests/booking-lifecycle-e2e.test.ts` (Phase 5) | **PASSED** (Private notes scrubbed) |
| Draft Rubric Evaluation Isolation | `tests/booking-lifecycle-e2e.test.ts` (Phase 6) | **PASSED** (Student receives `null`) |
| Double-Entry Settlement Balance Check | `tests/booking-lifecycle-e2e.test.ts` (Phase 8) | **PASSED** ($\Delta = 0$ paise) |

---

## 8. Conclusion & Production Readiness Verdict

The MentorMaze Booking and Payment infrastructure demonstrates a **production-grade security posture**. Concurrency hazards, payment fraud, unauthorized video access, and data leakage vectors are robustly mitigated at the database, service, and routing layers.
