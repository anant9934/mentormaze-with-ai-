# MentorMaze — Cashfree Payment Gateway & Hold Coordination Integration

**Official Platform:** MentorMaze by AI Tathastu  
**Official Production Domain:** `https://mentormaze.aitathastu.com`  
**Currency Standard:** Indian Rupee (INR) calculated in integer paise (`1 INR = 100 paise`)  

---

## 1. Overview & Architecture

MentorMaze integrates **Cashfree Payment Gateway (PG)** for processing student session payments. To ensure financial accuracy and eliminate race conditions:
- **Server-Side Authoritative Checkout:** Orders are minted on the server via `CashfreePaymentAdapter` (`lib/payments/adapter.ts`). Client redirects are never trusted for payment confirmation.
- **Integer Paise Arithmetic:** All calculations internally operate in integer paise (`amount_paise`), guaranteeing zero floating-point rounding errors during marketplace commission deductions.
- **Hold-Coordinated Checkout:** Orders require an active, unexpired slot hold (`booking_holds`).
- **Cryptographic Signature Verification:** Webhook payloads must pass HMAC-SHA256 signature verification over `timestamp + rawBody`.
- **Idempotent Webhook Processing:** Webhooks can be retried indefinitely by Cashfree without creating duplicate ledger records or charging extra fees.
- **Late Payment Auto-Refund:** If a student completes payment after their hold expired and another user has booked the slot, the system automatically triggers a 100% gateway refund.

---

## 2. Integer Paise (Minor Units) Accounting

Marketplace revenue deductions are executed with exact integer arithmetic:

$$\text{amountPaise} = \text{priceInr} \times 100$$
$$\text{platformFeePaise} = \left\lfloor \frac{\text{amountPaise} \times 15}{100} + 0.5 \right\rfloor$$
$$\text{mentorPayablePaise} = \text{amountPaise} - \text{platformFeePaise}$$

### Example Breakdown
| Price (INR) | Gross Paise | Platform Commission (15%) | Mentor Net Payable | Balance Invariant Check |
|---|---|---|---|---|
| ₹1,500.00 | 150,000 paise | 22,500 paise (₹225.00) | 127,500 paise (₹1,275.00) | $22,500 + 127,500 = 150,000$ ✓ |
| ₹2,499.00 | 249,900 paise | 37,485 paise (₹374.85) | 212,415 paise (₹2,124.15) | $37,485 + 212,415 = 249,900$ ✓ |
| ₹449.00 | 44,900 paise | 6,735 paise (₹67.35) | 38,165 paise (₹381.65) | $6,735 + 38,165 = 44,900$ ✓ |

---

## 3. Checkout Order Creation Flow (`/api/payments/create-order`)

```
Student Browser            MentorMaze API                 Cashfree API
      |                           |                             |
      |-- 1. POST /create-order ->|                             |
      |   { holdId }              |-- 2. Verify hold active     |
      |                           |      and unexpired          |
      |                           |                             |
      |                           |-- 3. Insert booking in      |
      |                           |      'pending_payment'      |
      |                           |                             |
      |                           |-- 4. POST /pg/orders ------>|
      |                           |      { order_id, amount }   |
      |                           |                             |
      |                           |<-- 5. Return session token -|
      |<-- 6. { paymentSessionId }|
      |
      |-- 7. Render Cashfree SDK Drop Checkout
```

### Request Payload
```json
{
  "holdId": "b1a2c3d4-e5f6-7890-abcd-ef1234567890",
  "customerPhone": "9876543210"
}
```

### Response Payload
```json
{
  "success": true,
  "bookingId": "c8d9e0f1-2345-6789-abcd-ef0123456789",
  "orderId": "order_cf_c8d9e0f1-2345-6789-abcd-ef0123456789",
  "paymentSessionId": "session_cf_sandbox_1794508923",
  "amountPaise": 150000,
  "amountInr": 1500,
  "currency": "INR"
}
```

---

## 4. Webhook Processing & Cryptographic Verification (`/api/payments/webhook`)

### HMAC-SHA256 Signature Verification
Cashfree sends two HTTP headers with every webhook:
- `x-webhook-timestamp`: Epoch timestamp in milliseconds.
- `x-webhook-signature`: Base64 encoded HMAC-SHA256 signature.

The signature is computed over:
$$\text{SignatureData} = \text{timestamp} + \text{rawBody}$$
$$\text{ExpectedSignature} = \text{Base64}\Big(\text{HMAC-SHA256}\big(\text{CASHFREE\_WEBHOOK\_SECRET}, \text{SignatureData}\big)\Big)$$

If `ExpectedSignature !== x-webhook-signature`, the request is rejected with `401 Unauthorized`.

### Idempotency Deduplication
```sql
SELECT id, payment_status, status FROM bookings WHERE id = $bookingId;
```
If `booking.payment_status === 'paid'` and the incoming event status is `SUCCESS`, the endpoint returns `200 OK` immediately with `{ received: true, message: "Already processed idempotently" }`.

---

## 5. Late Payment Auto-Refund Handling

In real-world scenarios, a student might leave checkout open, the 10-minute hold expires, and another student books that slot. If the first student then completes payment through their bank:

```
                  [ Payment Succeeded Webhook ]
                               |
                               v
                     [ Check Hold Status ]
                               |
                   +-----------+-----------+
                   |                       |
            [ Hold Active ]        [ Hold Expired ]
                   |                       |
                   |               [ Check Slot Status ]
                   |                       |
                   |             +---------+---------+
                   |             |                   |
                   |       [ Slot Free ]       [ Slot Taken! ]
                   |             |                   |
                   v             v                   v
             [ Confirm Booking & Settle ]    [ Trigger Auto-Refund ]
             - status: 'confirmed'           - paymentGateway.createRefund()
             - payment_status: 'paid'        - status: 'cancelled'
             - emit notifications            - payment_status: 'refunded'
                                             - notify student with reason
```

### Auto-Refund Response
```json
{
  "received": true,
  "status": "auto_refunded",
  "reason": "late_payment_slot_taken",
  "refundId": "refund_order_cf_1794508923_1234"
}
```

---

## 6. Manual & Policy Refunds (`/api/payments/refund`)

Administrators or policy triggers invoke `/api/payments/refund`:
- Generates refund reference with gateway.
- Updates `bookings.payment_status` to `refunded` or `partially_refunded`.
- Updates `ledger_transactions.status` and `refund_amount_inr`.
- Records `refund_processed` event in `booking_events`.
- Sends instant refund notification to student.

