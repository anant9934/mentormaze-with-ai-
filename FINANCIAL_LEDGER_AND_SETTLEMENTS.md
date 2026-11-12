# MentorMaze — Financial Ledger & Mentor Settlements Architecture

**Official Platform:** MentorMaze by AI Tathastu  
**Official Production Domain:** `https://mentormaze.aitathastu.com`  
**Platform Take-Rate:** 15.00% Marketplace Commission  

---

## 1. Accounting Philosophy

MentorMaze operates a **double-entry, audit-verifiable financial ledger** implemented in PostgreSQL. 

### Core Accounting Guarantees
1. **Zero Floating-Point Representation:** All financial metrics in `mentor_settlements` and runtime calculations are executed in integer paise (`1 INR = 100 paise`).
2. **Double-Entry Balance Invariant:** For every session transaction:
   $$\text{gross\_amount} = \text{platform\_fee} + \text{mentor\_payable}$$
   Any deviation raises an integrity exception and aborts checkout.
3. **Escrow Before Completion:** Funds collected from students remain in platform escrow (`ledger_transactions.status = 'settled'`) until the session is completed or policy cutoffs elapse.
4. **Separation of Concerns:** Ledger transactions (`ledger_transactions`) track session revenue accrual; settlement batches (`mentor_settlements`) track physical disbursements to mentor bank accounts.

---

## 2. Database Ledger Schema

### `ledger_transactions` Table
Records individual session earnings and fee splits.

```sql
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  student_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
  gross_amount_inr INTEGER NOT NULL,
  platform_commission_percent NUMERIC(4,2) DEFAULT 15.00 NOT NULL,
  platform_fee_inr INTEGER NOT NULL,
  mentor_payable_inr INTEGER NOT NULL,
  status VARCHAR(32) DEFAULT 'pending' NOT NULL, -- pending, settled, refunded, partially_refunded
  payment_provider VARCHAR(64) DEFAULT 'cashfree' NOT NULL,
  provider_order_id VARCHAR(160),
  provider_payment_id VARCHAR(160),
  refund_amount_inr INTEGER DEFAULT 0,
  refund_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  settled_at TIMESTAMPTZ
);
```

### `mentor_settlements` Table
Records disbursement batches for payout execution.

```sql
CREATE TABLE IF NOT EXISTS mentor_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  session_count INTEGER DEFAULT 0 NOT NULL,
  gross_amount_paise INTEGER NOT NULL,
  platform_fee_paise INTEGER NOT NULL,
  net_payable_paise INTEGER NOT NULL,
  status VARCHAR(32) DEFAULT 'pending' NOT NULL, -- pending, approved, processing, settled, failed
  payout_method VARCHAR(64) DEFAULT 'manual_bank_transfer' NOT NULL,
  payout_reference VARCHAR(160), -- Bank UTR / NEFT reference
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

---

## 3. Settlement Lifecycle Flow

```
+-----------------------------------------------------------+
| 1. Session Completed & Paid                               |
|    - ledger_transactions recorded                         |
|    - Net payable accrued to mentor's balance              |
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------------------------------------+
| 2. Payout Batch Generated                                 |
|    - Created automatically weekly or on mentor request    |
|    - status: 'pending'                                    |
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------------------------------------+
| 3. Administrator Review & Approval                        |
|    - Route: /admin/settlements                            |
|    - Verification of session logs and dispute status      |
|    - status: 'approved', approved_at: NOW()               |
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------------------------------------+
| 4. Bank Transfer / UPI Disbursement                       |
|    - Finance team executes NEFT / RTGS transfer           |
|    - Enters Bank UTR reference in Admin Center            |
|    - status: 'settled', settled_at: NOW()                 |
+-----------------------------------------------------------+
```

---

## 4. Mentor Earnings Dashboard (`/mentor/earnings`)

Mentors access a dedicated financial dashboard styled with official MentorMaze brand tokens (Forest 900 `#123B2E`, Sage 100 `#EDF1E8`, Cream 50 `#FBF8F1`):
- **Live KPI Metrics:** Total Net Earnings, Pending Settlement, Disbursed Payouts, Gross Session Volume.
- **Double-Entry Transaction History:** Full audit table showing student name, session date, gross fee, 15% platform deduction, and net earnings.
- **Disbursement Batches Table:** Historical record of all settlement periods with associated Bank UTR references.
- **On-Demand Payout Request:** Mentors can generate a settlement request for their pending balance.

---

## 5. Admin Settlements Center (`/admin/settlements`)

Administrators have access to operations controls:
- Filter settlements by status (`all`, `pending`, `approved`, `settled`).
- Batch approve pending settlement invoices.
- Record bank transfer UTR references with timestamping.

