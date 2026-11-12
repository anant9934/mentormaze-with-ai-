# MentorMaze — End-to-End User Acceptance Test (UAT) Report
**Product:** MentorMaze by AI Tathastu  
**Production Domain:** [https://mentormaze.aitathastu.com](https://mentormaze.aitathastu.com)  
**Test Suite:** `tests/user-acceptance-scenarios.test.ts` & `tests/booking-lifecycle-e2e.test.ts`  
**Audit Date:** November 2026  
**Status:** **`100% PASS (6/6 SCENARIOS VERIFIED)`**  

---

## 1. Executive Summary & Verification Overview

To validate that the entire operational lifecycle of free and paid human mentorship sessions and mock interviews functions seamlessly, six comprehensive **User Acceptance Scenarios (A through F)** were designed, executed, and verified against the production database state machine.

### Scenario Acceptance Matrix:

| Scenario | Title | Scope & Subsystems Verified | Result | Execution Time |
| :---: | :--- | :--- | :---: | :---: |
| **A** | **Free Mentorship Lifecycle** | Discovery $\rightarrow$ Slot Reservation $\rightarrow$ Zero Payment Bypass $\rightarrow$ Confirmation $\rightarrow$ Session Completion $\rightarrow$ Feedback & Rating Update | **`PASS`** | 185ms |
| **B** | **Paid Mentorship & Cashfree Ledger** | Paid Discovery $\rightarrow$ Slot Hold $\rightarrow$ Cashfree Webhook $\rightarrow$ State Machine $\rightarrow$ Double-Entry Journal Entries $\rightarrow$ Attendance $\rightarrow$ Completion | **`PASS`** | 242ms |
| **C** | **Human Mock Interview & Rubrics** | Mock Booking $\rightarrow$ SDE Backend Dimensions $\rightarrow$ Weighted Scoring (0-10) $\rightarrow$ Draft Isolation $\rightarrow$ Report Publishing | **`PASS`** | 164ms |
| **D** | **Tiered Policy Cancellation & Refund** | Policy Engine $\rightarrow$ Tier 2 Cancellation (12-24h) $\rightarrow$ 50% Refund $\rightarrow$ Balanced Reversing Journal Entries $\rightarrow$ Slot Release | **`PASS`** | 198ms |
| **E** | **Mentor Settlement Payout** | Completed Session $\rightarrow$ 3-Day Holding Window $\rightarrow$ Settlement Batch Eligibility $\rightarrow$ Manual Disbursement $\rightarrow$ Bank Transfer Ledger Entry | **`PASS`** | 211ms |
| **F** | **Dispute Resolution & Escrow** | 72h Dispute Window $\rightarrow$ Student Complaint $\rightarrow$ Booking Disputed $\rightarrow$ Quarantine to `dispute_escrow` $\rightarrow$ Admin Resolution | **`PASS`** | 179ms |

---

## 2. Detailed Scenario Execution Traces

### 2.1 Scenario A: Free Mentorship Session Lifecycle
- **Objective:** Verify that students can book free discovery sessions without being routed to a payment gateway, and that completing the session updates mentor ratings.
- **Trace:**
  1. Student discovers mentor `prof-scenario-a`.
  2. Booking requested for slot `2026-11-21T10:00:00Z` with `amount_paise = 0`.
  3. `BookingStateMachine.create` transitions booking directly to `confirmed` without payment requirement.
  4. At session time, `LiveKitTokenService` verifies join window and authorizes room `mm-booking-free-a`.
  5. Both student and mentor log attendance.
  6. Session marked `completed`.
  7. Student submits 5-star review. Mentor aggregate rating recalculates dynamically from 0.0 to 5.0.
- **Verification Evidence:** `expect(booking.status).toBe("confirmed")`, `expect(mentor.rating).toBe(5.0)`.

### 2.2 Scenario B: Paid Mentorship Session & Double-Entry Ledger
- **Objective:** Verify slot hold, Cashfree order generation, HMAC webhook confirmation, balanced double-entry ledger entries, and completion.
- **Trace:**
  1. Student initiates booking for ₹1,500 (`150,000 paise`).
  2. Booking status set to `hold` with 10-minute expiration.
  3. Cashfree webhook arrives at `POST /api/payments/webhook` with valid HMAC-SHA256 signature and `orderAmount = 1500.00`.
  4. `BookingStateMachine.confirmPayment` transitions booking from `hold` $\rightarrow$ `confirmed`.
  5. Immutable double-entry journal entries recorded in `journal_entries`:
     - **Debit:** `cash_gateway` 150,000 paise
     - **Credit:** `mentor_payable` 127,500 paise (85%)
     - **Credit:** `platform_revenue` 22,500 paise (15%)
  6. Mathematical balance check: $\Delta = 150000 - (127500 + 22500) = 0$ paise.
- **Verification Evidence:** `expect(journalEntries.length).toBe(3)`, `expect(imbalance).toBe(0)`.

### 2.3 Scenario C: Human Mock Interview & Weighted Rubric Scoring
- **Objective:** Verify weighted scoring across interview dimensions and ensure draft evaluations remain confidential until published.
- **Trace:**
  1. Student books "SDE II Backend Mock Interview" with mentor.
  2. Mentor opens evaluation form at `/mock-interviews/[id]/evaluate`.
  3. Mentor inputs scores across 5 dimensions:
     - DSA (25%): 8.5
     - Problem Solving (25%): 8.0
     - Code Quality (20%): 7.5
     - Edge Cases (15%): 6.5
     - Communication (15%): 9.0
  4. Formula computation:
     $$\text{Overall Score} = (8.5 \times 0.25) + (8.0 \times 0.25) + (7.5 \times 0.20) + (6.5 \times 0.15) + (9.0 \times 0.15) = 7.95$$
  5. Mentor saves draft. Student queries `/api/mock-interviews/[id]/evaluation`: returns draft status (scores hidden).
  6. Mentor clicks "Publish Report". Report transitions to `published_at: timestamp`. Student notification dispatched.
- **Verification Evidence:** `expect(evaluation.overall_score).toBe(7.95)`, `expect(draftHiddenFromStudent).toBe(true)`.

### 2.4 Scenario D: Tiered Policy Cancellation & Reversing Entries
- **Objective:** Verify cancellation rules and non-destructive reversing ledger entries.
- **Trace:**
  1. Paid session booked for ₹2,000 (200,000 paise).
  2. Student cancels 16 hours prior to session (falls within Tier 2: 12 to 24-hour notice).
  3. `PolicyEngine.evaluateCancellation` awards 50% refund to student (100,000 paise) and retains 50% for mentor/platform compensation.
  4. State machine transitions booking to `cancelled`.
  5. Reversing journal entries created:
     - **Debit:** `mentor_payable` 85,000 paise
     - **Debit:** `platform_revenue` 15,000 paise
     - **Credit:** `cash_gateway` 100,000 paise
  6. Slot immediately freed in calendar. A second student successfully reserves the slot.
- **Verification Evidence:** `expect(refundAmount).toBe(100000)`, `expect(slotFreed).toBe(true)`.

### 2.5 Scenario E: Mentor Settlement Payout & 3-Day Holding Rule
- **Objective:** Verify that mentor earnings are quarantined during the 3-day holding period and properly disbursed upon clearing.
- **Trace:**
  1. Session completed on November 10. Mentor share = ₹1,700 (170,000 paise).
  2. Payout worker queries eligible settlements on November 11:
     - Record identified as `hold_status: "in_holding_period"`. Owed balance = 0.
  3. Clock advances past 72 hours (November 14):
     - `SettlementService.getEligibleSettlements` now includes the ₹1,700 balance.
  4. Settlement batch executed. Status updated to `manually_recorded`.
  5. Double-entry bank disbursement recorded:
     - **Debit:** `mentor_payable` 170,000 paise
     - **Credit:** `cash_bank` 170,000 paise
- **Verification Evidence:** `expect(settlement.status).toBe("manually_recorded")`, `expect(clearedAfterHold).toBe(true)`.

### 2.6 Scenario F: Dispute Resolution & Escrow Quarantine
- **Objective:** Verify the 72-hour dispute window, funds quarantine into `dispute_escrow`, and admin dispute resolution.
- **Trace:**
  1. Student attends session but mentor experiences persistent connection failure.
  2. Student logs dispute within 72 hours via `/support`.
  3. Booking transitions to `disputed`.
  4. Quarantine journal entry executed:
     - **Debit:** `mentor_payable` (funds deducted from mentor's active balance).
     - **Credit:** `dispute_escrow` (quarantined in escrow).
  5. Admin reviews dispute log in `/admin/disputes`, validates connection logs, and rules in favor of student.
  6. Admin issues full refund:
     - **Debit:** `dispute_escrow`
     - **Credit:** `cash_gateway`
- **Verification Evidence:** `expect(disputeStatus).toBe("resolved_refunded")`, `expect(escrowBalance).toBe(0)`.

---

## 3. Automated Test Suite Metrics

```text
 ✓ tests/booking-lifecycle-e2e.test.ts (18)
 ✓ tests/user-acceptance-scenarios.test.ts (6)
 ✓ tests/calendar-scheduling.test.ts (14)
 ✓ tests/database.test.ts (8)
 ✓ tests/email-system.test.ts (19)
 ✓ tests/livekit-routing.test.ts (10)
 ✓ tests/livekit.test.ts (4)
 ✓ tests/notifications.test.ts (11)
 ✓ tests/payment.test.ts (4)
 ✓ tests/platform.test.ts (11)
 ✓ tests/unsubscribe-rfc8058.test.ts (6)

Test Files:  11 passed (11)
Total Tests: 111 passed (111)
Duration:    6.41 seconds
Pass Rate:   100.0%
```

All 6 User Acceptance Scenarios have passed with full mathematical, structural, and state consistency.
