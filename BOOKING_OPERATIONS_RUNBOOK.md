# MentorMaze — Booking & Financial Operations Runbook

**Official Platform:** MentorMaze by AI Tathastu  
**Official Production Domain:** `https://mentormaze.aitathastu.com`  
**Target Audience:** Platform Operations, Support Engineers, Admin Staff, and Financial Officers  
**Classification:** Internal Operating Procedures (SOPs)  

---

## 1. System Navigation & Operations Dashboards

MentorMaze provides administrative consoles for managing bookings, auditing payments, resolving disputes, and processing mentor payouts:

| Console Name | Route | Primary Purpose |
|---|---|---|
| **Bookings Operations** | `/admin/bookings` | Monitor state transitions, join meeting rooms, execute manual status overrides |
| **Payment Ledger Audit** | `/admin/payments` | Inspect double-entry journal entries, calculate GMV and take-rate, issue refunds |
| **Dispute Resolution** | `/admin/disputes` | Review student/mentor claims, evaluate session attendance, uphold or dismiss |
| **Settlements & Payouts** | `/admin/settlements` | Review weekly mentor earnings batches, approve payouts, record bank UTRs |
| **Calendar & Availability** | `/admin/calendar` | Monitor active holds, view mentor Google Calendar sync status, clear locks |

---

## 2. Standard Operating Procedures (SOPs)

### SOP-01: Resolving a Student Session Dispute

**Context:** A student files a dispute via `/dashboard/sessions` stating: *"Mentor did not attend the scheduled mock interview"* or *"Technical audio issues prevented the session"*.

1. **Navigate to the Disputes Console:**
   - Go to `https://mentormaze.aitathastu.com/admin/disputes`.
   - Locate the pending dispute by Booking ID or Student Email.
2. **Audit Session Attendance Evidence:**
   - Query the session attendance logs in database or inspect attendance metadata:
     ```sql
     SELECT * FROM session_attendance_events 
     WHERE booking_id = 'YOUR_BOOKING_ID' 
     ORDER BY event_time_utc ASC;
     ```
   - Check if the mentor logged `join` and `leave` events.
   - If mentor was absent or `actual_start_time_utc` was never populated, the student's claim is valid.
3. **Execute Dispute Resolution in UI:**
   - Click **Review** on the dispute record.
   - **Option A: Uphold Claim (Full Refund to Student):**
     - Select **Uphold Claim**.
     - System automatically executes `POST /api/payments/refund` with reason `DISPUTE_UPHELD`.
     - 100% of order amount is credited back via Cashfree gateway.
     - Booking status transitions to `cancelled`; dispute status transitions to `resolved_refunded`.
     - Ledger records reversing debit and credit journal entries.
   - **Option B: Dismiss Claim (Unfounded / Mentor Attended):**
     - If logs show mentor was present for full duration, select **Dismiss Claim**.
     - Enter admin notes: *"Attendance logs show mentor present for 58 minutes. Student joined 25m late."*
     - Dispute transitions to `resolved_dismissed`; booking remains `completed`.

---

### SOP-02: Manual Booking Status Override

**Context:** A session took place externally (or LiveKit automated webhook dropped), and the session remains in `in_progress` or `confirmed` instead of advancing to `completed`.

1. **Locate the Booking:**
   - Navigate to `/admin/bookings`.
   - Search for the Booking ID or filter by `Status = in_progress`.
2. **Execute State Override:**
   - Click **Change Status** $\to$ Select target status (e.g., `completed`).
   - Enter mandatory justification: *"Confirmed via mentor and student email confirmation that interview concluded successfully."*
   - Submit override.
3. **Automated Side Effects:**
   - Booking transitions to `completed`.
   - `booking_events` audit table appends an immutable record:
     - `actor_role: 'admin'`
     - `note: 'Admin manual status override'`
   - Session evaluation unlocked for the mentor at `/mock-interviews/[id]/evaluate`.

---

### SOP-03: Investigating Webhook Drop & Late Payment Recovery

**Context:** A student was charged on their bank card via Cashfree, but the booking shows `expired` or `pending_payment` because a network timeout interrupted the webhook delivery.

1. **Verify Payment in Cashfree Merchant Dashboard:**
   - Copy the Cashfree `order_id` (format: `ord_...`).
   - Search in Cashfree Merchant Dashboard to verify status is `PAID` and note transaction ID (`cf_payment_id`).
2. **Check Booking State in MentorMaze:**
   - Inspect booking in `/admin/bookings`.
   - If status is `pending_payment` and the slot is still free:
     - Run atomic payment confirmation in CLI or invoke internal webhook endpoint:
       ```bash
       curl -X POST https://mentormaze.aitathastu.com/api/payments/webhook \
         -H "Content-Type: application/json" \
         -H "x-webhook-signature: YOUR_ADMIN_KEY" \
         -d '{"data": {"order": {"order_id": "ord_..."}, "payment": {"payment_id": "cf_...", "payment_status": "SUCCESS", "payment_amount": 2500.00}}}'
       ```
   - If status is `expired` and slot has already been booked by another student:
     - The state machine will automatically initiate an immediate Cashfree refund.
     - Verify refund was generated under `/admin/payments` $\to$ **Refunds**.
     - Send notification email to student advising them to re-select a new slot.

---

### SOP-04: Weekly Mentor Settlement Batch & Payout

**Context:** Financial review every Monday to aggregate completed sessions from the preceding week, calculate platform commission (15%), and approve payouts.

1. **Review Settlement Batches:**
   - Navigate to `/admin/settlements`.
   - The system displays all mentors with unpaid completed sessions.
   - For each mentor:
     - Gross Volume (GMV)
     - Platform Commission (15%)
     - Net Mentor Payout (85%)
     - Session Count
2. **Approve Settlement Batch:**
   - Verify that no open disputes exist for the sessions in the batch.
   - Click **Approve Batch**.
   - Status updates from `pending_approval` $\to$ `approved`.
3. **Disburse via Banking Portal:**
   - Download the payout CSV containing Mentor Beneficiary Account Number, IFSC code, and Net Payout in INR.
   - Upload file to corporate banking portal (e.g., HDFC / ICICI Corporate Banking) and execute NEFT / IMPS batch payout.
4. **Record Bank UTR in MentorMaze:**
   - Once banking portal returns Unique Transaction Reference (UTR), return to `/admin/settlements`.
   - Click **Record Disbursement**.
   - Enter UTR: e.g. `HDFC26111300892`.
   - System updates status to `paid`, timestamps `paid_at_utc`, and notifies mentor via email and SMS notification.

---

### SOP-05: LiveKit Circuit Breaker Reset & Provider Failover

**Context:** Alerts indicate that a LiveKit provider cluster (e.g., Singapore or Mumbai) experienced network congestion and its circuit breaker tripped to `open`.

1. **Verify Health in Operations Log:**
   - Review `/api/livekit/health` or server logs:
     ```json
     {"providerId": "livekit-mumbai-1", "circuitBreaker": "open", "consecutiveErrors": 5}
     ```
   - Confirm that traffic automatically failed over to secondary cluster (`livekit-secondary`).
2. **Test Provider Connectivity:**
   - Run manual health probe against the cluster endpoint:
     ```bash
     curl -s https://mumbai.livekit.mentormaze.aitathastu.com/health
     ```
3. **Reset Circuit Breaker:**
   - When upstream network is restored, invoke the circuit breaker reset endpoint:
     ```bash
     curl -X POST https://mentormaze.aitathastu.com/api/admin/livekit/reset \
       -H "Authorization: Bearer ADMIN_TOKEN" \
       -d '{"providerId": "livekit-mumbai-1"}'
     ```
   - Health status returns to `healthy`; weighted session allocation resumes.

---

## 3. Emergency Contacts & Escalation Matrix

| Role | Contact | Availability | Escalation Triggers |
|---|---|---|---|
| **L1 Support Lead** | `support@mentormaze.aitathastu.com` | 24/7 | Student refund requests, booking hold issues |
| **L2 System Engineer** | `engineering@aitathastu.com` | Mon–Sat 9AM–9PM IST | Cashfree webhook failure, LiveKit room minting errors |
| **Finance Officer** | `finance@aitathastu.com` | Mon–Fri 10AM–6PM IST | Settlement batch approval, bank reconciliation discrepancies |
| **Security Officer** | `security@aitathastu.com` | On-Call 24/7 | Data leakage alerts, suspected payment fraud or tampering |
