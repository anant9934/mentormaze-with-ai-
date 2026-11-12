# MentorMaze — Cancellation, Rescheduling & Refund Policy Engine

**Official Platform:** MentorMaze by AI Tathastu  
**Official Production Domain:** `https://mentormaze.aitathastu.com`  
**Policy Engine Implementation:** `lib/policies/policy-engine.ts`  

---

## 1. Overview & Policy Philosophy

MentorMaze balances **fairness to students** with **respect for mentor time and opportunity cost**. When a student books a session, the mentor reserves that slot and declines other students and work commitments.

The Policy Engine implements a deterministic, automated decision framework governing cancellations, refunds, and rescheduling. All bookings store a `policy_version_id` to ensure that bookings are evaluated against the terms active at the time of reservation.

---

## 2. Policy Version Models (`booking_policies`)

```sql
CREATE TABLE IF NOT EXISTS booking_policies (
  id VARCHAR(64) PRIMARY KEY,                  -- e.g. "policy-v1"
  version VARCHAR(32) NOT NULL,                -- "1.0"
  name VARCHAR(160) NOT NULL,
  cancellation_cutoff_hours INTEGER DEFAULT 24 NOT NULL,
  rescheduling_cutoff_hours INTEGER DEFAULT 12 NOT NULL,
  max_reschedules INTEGER DEFAULT 2 NOT NULL,
  refund_eligibility_percent INTEGER DEFAULT 100 NOT NULL,
  no_show_refund_percent INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### Standard Policy (`policy-v1`) Parameters
- **Cancellation Notice Cutoff:** 24 Hours
- **Rescheduling Notice Cutoff:** 12 Hours
- **Maximum Reschedules per Booking:** 2
- **Full Notice Refund Rate:** 100%
- **Late Cancellation Refund Rate:** 0%
- **Student No-Show Refund Rate:** 0%

---

## 3. Cancellation Policy Logic (`/api/bookings/[id]/cancel`)

When a cancellation request is submitted:

$$\Delta t = \frac{\text{startTimeUtc} - \text{currentTime}}{3600 \text{ seconds}}$$

```
                       [ Scheduled Session Time ]
                                   |
         <--- 24 Hours Notice      |
------------|----------------------|------------------------------------>
            |                      |
   Delta t >= 24h                  |            Delta t < 24h
            |                      |                  |
            v                      |                  v
   [ 100% Full Refund ]            |         [ 0% Non-Refundable ]
   - booking.status: cancelled     |         - booking.status: cancelled
   - payment_status: refunded      |         - payment_status: paid
   - auto-credit via Cashfree      |         - mentor compensated
   - slot released                 |         - slot released
```

### Cancellation Evaluation Response
```json
{
  "isEligibleForRefund": true,
  "refundPercent": 100,
  "hoursUntilSession": 36.5,
  "cutoffHours": 24,
  "reasonNote": "Cancelled with 36.5 hours advance notice (cutoff: 24h) - Eligible for 100% refund."
}
```

---

## 4. Rescheduling Policy Logic (`/api/bookings/[id]/reschedule`)

A booking may be rescheduled to a new open slot if:
1. `booking.reschedule_count < policy.max_reschedules` (Maximum 2 reschedules).
2. $\Delta t \ge 12 \text{ hours}$ (At least 12 hours advance notice).
3. The new requested slot has no conflicting bookings for the mentor.

### Rescheduling Rejections
- **Exceeded Limit:** Returns `422 Unprocessable Entity` with:
  `"Maximum rescheduling limit (2 times) reached for this booking."`
- **Late Notice:** Returns `422 Unprocessable Entity` with:
  `"Rescheduling requires at least 12 hours notice. Only 4.5h remaining."`
- **Slot Collision:** Returns `409 Conflict` with:
  `"The newly requested time slot conflicts with another existing booking."`

---

## 5. Dependent System Updates on Mutation

When a booking is cancelled or rescheduled:
1. **Financial Ledger:** If refunded, `ledger_transactions.status` updates to `refunded` with `refund_amount_inr` and `refund_reason`.
2. **Notification Engine:** Pending reminder jobs in `scheduled_notifications` are marked cancelled.
3. **Calendar Synchronizer:** If the mentor connected Google Calendar, external sync events are updated or deleted.
4. **Outbox Event:** Emits `booking.cancelled` or `booking.rescheduled` for downstream audit pipelines.
