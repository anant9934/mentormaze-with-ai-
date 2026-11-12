# MentorMaze — End-to-End Booking Lifecycle Architecture

**Official Platform:** MentorMaze by AI Tathastu  
**Official Production Domain:** `https://mentormaze.aitathastu.com`  
**Brand Identity:** Human mentorship, career guidance, and mock interview practice  

---

## 1. Executive Architecture Summary

The MentorMaze Booking Lifecycle Architecture establishes a fault-tolerant, concurrency-hardened foundation for scheduling, paying for, conducting, and reconciling human mentorship sessions and mock interviews. 

Prior architectures relying solely on in-process memory locks fail under multi-instance serverless deployments (such as Vercel serverless functions, container replicas, and edge workers). This architecture implements **two-tier concurrency protection**:
1. **Tier 1 (Process-Level Queue):** `MentorLockManager` serializes operations targeting the same mentor inside the local Node.js process to eliminate connection thrashing.
2. **Tier 2 (PostgreSQL ACID Row Locks):** Transactions use `SELECT ... FROM mentor_profiles WHERE id = $1 FOR UPDATE` to enforce serializability across all distributed workers, combined with interval overlap queries (`start_time_utc < $newEnd AND end_time_utc > $newStart`).

---

## 2. Authoritative 10-State State Machine

MentorMaze defines exactly **10 authoritative states** for bookings, managed exclusively by `BookingStateMachine` (`lib/db/booking-state-machine.ts`).

```
                +------------+
                |   draft    |
                +-----+------+
                      |
                      v
                +------------+
        +------>|    held    |--------+
        |       +-----+------+        |
        |             |               v
        |             v          +---------+
        |      +-------------+   | expired |
        |      |   pending   |   +---------+
        |      |   payment   |        ^
        |      +------+------+        |
        |             |               |
        |             +---------------+
        |             |
        |             v
        |       +------------+
        +-------| confirmed  |--------+
    (reschedule)| +---+----+ |        |
                |     |    |          v
                |     |    |    +-----------+
                |     |    +--->|  no_show  |
                |     v         +-----+-----+
                | +-----------+       |
                | |in_progress|       |
                | +-----+-----+       |
                |       |             |
                |       v             |
                | +-----------+       |
                | | completed |       |
                | +-----+-----+       |
                |       |             |
                v       v             v
             +-------------+    +------------+
             |  cancelled  |<---|  disputed  |
             +-------------+    +------------+
```

### State Definitions

| State | Trigger / Lifecycle Event | Financial State | LiveKit Access |
|---|---|---|---|
| `draft` | Student selects session parameters; slot unreserved | `unpaid` | Blocked |
| `held` | Student acquires temporary 10-minute hold reservation | `unpaid` | Blocked |
| `pending_payment` | Cashfree checkout order generated; awaiting gateway capture | `pending` | Blocked |
| `confirmed` | Payment verified via webhook HMAC or free session booked | `paid` / `waived` | Eligible during join window |
| `in_progress` | First participant joined room within window (`actual_start_time_utc`) | `paid` | Active WebRTC session |
| `completed` | Session ended by mentor/admin; notes & feedback submitted | `settled` | Expired |
| `cancelled` | Cancelled by student, mentor, or admin prior to session | `refunded` / `unpaid` | Revoked |
| `expired` | Slot hold expired without completed payment | `unpaid` | Blocked |
| `no_show` | Participant failed to join within session window | `forfeited` / `disputed` | Expired |
| `disputed` | Student or mentor filed formal complaint for investigation | `escrow_held` | Expired |

### Transition Rules Matrix

| From State | Allowed Target States | Enforcement Mechanism |
|---|---|---|
| `draft` | `held`, `cancelled` | `BookingStateMachine.transition` |
| `held` | `pending_payment`, `confirmed`, `expired`, `cancelled` | Automatic hold expiry cron or checkout |
| `pending_payment` | `confirmed`, `expired`, `cancelled` | Signed Cashfree webhook handler |
| `confirmed` | `in_progress`, `cancelled`, `no_show`, `confirmed` (rescheduled) | Attendance event or policy engine |
| `in_progress` | `completed`, `disputed` | Mentor session completion action |
| `completed` | `disputed` | Post-session dispute filing within 48h |
| `cancelled` | None (Terminal) | Immutably locked |
| `expired` | None (Terminal) | Immutably locked |
| `no_show` | `disputed` | Support escalation |
| `disputed` | `completed` (rejected claim), `cancelled` (upheld refund) | Admin arbitration decision |

---

## 3. Database Concurrency & Distributed Lock Architecture

### PostgreSQL Row-Locking Mechanism

When any client attempts to hold, book, or reschedule a slot:
```sql
BEGIN;

-- 1. Lock the parent mentor record exclusively
SELECT id, verification_status, is_accepting_bookings
FROM mentor_profiles
WHERE id = $1
FOR UPDATE;

-- 2. Detect booking collisions on interval [A, B) overlaps [C, D) iff A < D AND B > C
SELECT id FROM bookings
WHERE mentor_profile_id = $1
  AND status NOT IN ('cancelled', 'expired')
  AND start_time_utc < $requestedEndUtc
  AND end_time_utc > $requestedStartUtc
LIMIT 1;

-- 3. Detect active hold collisions
SELECT id FROM booking_holds
WHERE mentor_profile_id = $1
  AND status = 'active'
  AND expires_at > NOW()
  AND start_time_utc < $requestedEndUtc
  AND end_time_utc > $requestedStartUtc
LIMIT 1;

-- 4. Insert booking or hold, then commit
COMMIT;
```

This guarantees that even with 50 simultaneous incoming HTTP requests across 10 Vercel serverless workers, PostgreSQL serializes row inspection on the mentor's record. Exactly one transaction commits; the remaining 49 receive a collision error.

---

## 4. Append-Only Audit Trail (`booking_events`)

Every state mutation logs an immutable record in `booking_events`:

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` | Event unique identifier (`gen_random_uuid()`) |
| `booking_id` | `UUID` | Foreign key referencing `bookings.id` |
| `event_type` | `VARCHAR(64)` | Event discriminator (`payment_confirmed`, `rescheduled`, etc.) |
| `from_status` | `VARCHAR(32)` | Pre-transition state |
| `to_status` | `VARCHAR(32)` | Post-transition state |
| `actor_id` | `UUID` | User ID of actor who triggered the transition |
| `actor_role` | `VARCHAR(32)` | Role: `student`, `mentor`, `admin`, `system` |
| `metadata` | `JSONB` | Context payload (order ID, refund amount, policy evaluation) |
| `created_at` | `TIMESTAMPTZ` | Microsecond timestamp |

---

## 5. Outbox & Notification Asynchrony

To prevent database transactions from hanging on external network connections (such as SMTP or Web Push):
- Transactions record pending notification messages into `outbox_events`.
- Notification dispatching and scheduled reminder creation occur **strictly after** the database transaction has committed.
- If email transport is delayed or unavailable, the booking transaction remains 100% successful.
