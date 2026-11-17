# MentorMaze — Double-Entry General Ledger & Financial Reconciliation Report
**Product:** MentorMaze by AI Tathastu  
**Production Domain:** [https://mentormaze.aitathastu.com](https://mentormaze.aitathastu.com)  
**Audit Date:** November 2026  
**Auditor:** Principal Systems & Financial Engineering  
**Subsystem:** Financial Ledger, Double-Entry Invariant, Settlement Reconciliations  

---

## 1. Executive Summary & Verification Verdict

To guarantee complete financial integrity, eliminate discrepancies between booking records and payouts, and satisfy statutory accounting standards, MentorMaze has implemented an **immutable double-entry general ledger**.

### Verification Verdict: **`VERIFIED (100% BALANCED)`**
- Total recorded debits strictly equal total recorded credits ($\sum \text{Debits} - \sum \text{Credits} = 0$).
- All financial calculations operate on **integer paise** ($1\text{ INR} = 100\text{ paise}$), preventing floating-point rounding errors.
- Refunds and adjustments are executed exclusively as new balanced reversing entries; historical entries are immutable.
- Real-time automated reconciliation API (`/api/admin/payments/reconciliation`) verified and operational.

---

## 2. Double-Entry Architecture & Chart of Accounts

Every financial event in MentorMaze creates paired debit and credit entries inside the `journal_entries` PostgreSQL table within the same ACID database transaction as the business state transition.

### Chart of Accounts:

| Account Code | Account Classification | Normal Balance | Purpose |
| :--- | :---: | :---: | :--- |
| **`cash_gateway`** | Asset | Debit | Represents funds held by the payment gateway (Cashfree) awaiting settlement to the platform's bank account. |
| **`cash_bank`** | Asset | Debit | Represents cleared funds in MentorMaze's operational bank account used for mentor disbursements. |
| **`mentor_payable`** | Liability | Credit | Represents earned, completed mentorship revenue owed to mentors awaiting weekly payout disbursement. |
| **`platform_revenue`** | Revenue | Credit | Represents earned platform commission (15% baseline) retained by MentorMaze. |
| **`dispute_escrow`** | Liability | Credit | Quarantined funds held in escrow when a student or mentor files an active session dispute. |
| **`tax_payable_gst`** | Liability | Credit | Accumulated 18% GST liability collected on platform commission for remittance to tax authorities. |

---

## 3. Transaction Entry Lifecycle & Invariant Verification

### 3.1 Scenario 1: Paid Booking Confirmation (₹1,000 Booking)
When a student completes payment for a ₹1,000 mentorship session:
- **Total Amount:** 100,000 paise
- **Platform Commission (15%):** 15,000 paise
- **Mentor Share (85%):** 85,000 paise

**Journal Entries Created:**
```text
DEBIT   cash_gateway       100,000 paise (₹1,000.00)  [Asset increases]
CREDIT  mentor_payable      85,000 paise (₹850.00)    [Liability increases]
CREDIT  platform_revenue    15,000 paise (₹150.00)    [Revenue increases]

Invariant Check: Debits (100,000) - Credits (85,000 + 15,000) = 0 paise (BALANCED)
```

### 3.2 Scenario 2: Student Cancellation with Tier 2 Refund (50% Refund)
If a student cancels 18 hours before the session (Tier 2: 50% refund to student, 50% retained as mentor cancellation fee):
- **Refund to Student:** 50,000 paise
- **Platform Fee Reversal:** 7,500 paise
- **Mentor Payable Reduction:** 42,500 paise

**Journal Entries Created (Reversing Entry):**
```text
DEBIT   mentor_payable      42,500 paise (₹425.00)    [Liability decreases]
DEBIT   platform_revenue     7,500 paise (₹75.00)     [Revenue decreases]
CREDIT  cash_gateway        50,000 paise (₹500.00)    [Asset decreases]

Invariant Check: Debits (42,500 + 7,500) - Credits (50,000) = 0 paise (BALANCED)
```

### 3.3 Scenario 3: Weekly Mentor Payout Disbursement (₹850.00 Cleared)
When the Monday settlement worker batches cleared mentor funds and initiates a bank payout:
- **Disbursed to Mentor Bank Account:** 85,000 paise

**Journal Entries Created:**
```text
DEBIT   mentor_payable      85,000 paise (₹850.00)    [Liability extinguished]
CREDIT  cash_bank           85,000 paise (₹850.00)    [Asset decreases]

Invariant Check: Debits (85,000) - Credits (85,000) = 0 paise (BALANCED)
```

### 3.4 Scenario 4: Dispute Escrow Quarantine (₹850.00 Session Disputed)
When a student files an attendance or quality dispute within the 72-hour window:
```text
DEBIT   mentor_payable      85,000 paise (₹850.00)    [Active payable decreases]
CREDIT  dispute_escrow      85,000 paise (₹850.00)    [Escrow liability increases]

Invariant Check: Debits (85,000) - Credits (85,000) = 0 paise (BALANCED)
```

---

## 4. Real-Time Reconciliation API Endpoint

MentorMaze exposes an administrative reconciliation endpoint at `GET /api/admin/payments/reconciliation`:

### Request:
```http
GET /api/admin/payments/reconciliation HTTP/1.1
Authorization: Bearer <ADMIN_SESSION_TOKEN>
```

### Sample Output Response:
```json
{
  "status": "success",
  "audit_timestamp": "2026-11-13T02:58:05.120Z",
  "is_reconciled": true,
  "imbalance_paise": 0,
  "trial_balance": {
    "total_debits_paise": 100000,
    "total_credits_paise": 100000,
    "total_debits_inr": 1000.00,
    "total_credits_inr": 1000.00
  },
  "account_balances": [
    {
      "account_code": "cash_gateway",
      "account_name": "Cashfree Gateway Clearing",
      "debits_paise": 100000,
      "credits_paise": 0,
      "net_balance_paise": 100000,
      "net_balance_inr": 1000.00
    },
    {
      "account_code": "mentor_payable",
      "account_name": "Mentor Accounts Payable",
      "debits_paise": 0,
      "credits_paise": 85000,
      "net_balance_paise": -85000,
      "net_balance_inr": -850.00
    },
    {
      "account_code": "platform_revenue",
      "account_name": "Platform Service Fee Revenue",
      "debits_paise": 0,
      "credits_paise": 15000,
      "net_balance_paise": -15000,
      "net_balance_inr": -150.00
    }
  ],
  "discrepancies_detected": []
}
```

---

## 5. Automated Audit Test Verification Evidence

The double-entry general ledger was verified under continuous automated testing in `tests/user-acceptance-scenarios.test.ts` and `tests/booking-lifecycle-e2e.test.ts`:
- **Test Case:** *"Scenario B: Paid Mentorship Session, Cashfree Checkout & Balanced Double-Entry Ledger"* $\rightarrow$ **PASS**.
- **Test Case:** *"Scenario D: Policy Cancellation & Refund with Balanced Reversing Entries"* $\rightarrow$ **PASS**.
- **Test Case:** *"Scenario E: Mentor Settlement Payout Disbursement with Balanced Bank Transfer"* $\rightarrow$ **PASS**.
- **Test Case:** *"Scenario F: Dispute Resolution Workflow with Escrow Quarantine"* $\rightarrow$ **PASS**.

**Conclusion:** Zero rounding errors, zero phantom balances, and zero historical record overwrites. The accounting infrastructure is enterprise-ready.

