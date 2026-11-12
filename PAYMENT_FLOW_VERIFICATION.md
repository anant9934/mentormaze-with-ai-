# MENTORMAZE — CASHFREE PAYMENT FLOW & MARKETPLACE LEDGER VERIFICATION

**Platform:** MentorMaze (under AI Tathastu)  
**Evaluation Date:** November 2026  
**Module:** `lib/payments/adapter.ts`, `app/api/payments/webhook/route.ts`, `tests/payment.test.ts`  
**Author:** Principal Software Architect, FinTech Engineer & Security Lead  
**Verification Status:** Verified in Sandbox & Unit/Integration Tests; Live Charges Blocked by Merchant KYC

---

## 1. Executive Summary

MentorMaze incorporates a complete end-to-end payment workflow tailored for the Indian higher education and professional mentorship market. The payment integration is engineered around **Cashfree Payments**, supporting credit cards, debit cards, netbanking, and UPI.

This report verifies:
1. The Cashfree sandbox payment order creation and session generation.
2. Webhook HMAC-SHA256 signature verification and tamper protection.
3. Duplicate webhook idempotency handling.
4. Double-entry marketplace ledger balancing across all 6 pilot pricing tiers.
5. Refund processing and ledger reconciliation.
6. The regulatory and business controls safeguarding live payments prior to merchant KYC.

---

## 2. Cashfree Integration Architecture

```
Student Client           MentorMaze Server          Cashfree PG          PostgreSQL DB
      │                          │                       │                     │
      │── 1. Book & Checkout ───>│                       │                     │
      │                          │── 2. Create Order ───>│                     │
      │                          │<── 3. Session ID ─────│                     │
      │<── 4. Return Session ────│                       │                     │
      │                          │                       │                     │
      │── 5. Complete Pay (UPI) ────────────────────────>│                     │
      │                          │                       │                     │
      │                          │<── 6. Webhook Post ───│                     │
      │                          │   (HMAC Signature)    │                     │
      │                          │── 7. Verify HMAC ─────│                     │
      │                          │── 8. Idempotency ──────────────────────────>│
      │                          │── 9. Update Ledger & Booking ──────────────>│
      │                          │── 10. Enqueue Outbox Event ────────────────>│
      │                          │── 11. Return HTTP 200>│                     │
```

---

## 3. Webhook Security: HMAC-SHA256 Signature Verification

### 3.1 Verification Algorithm
Cashfree webhooks include two critical security headers:
- `x-webhook-timestamp`: Epoch timestamp string of the webhook dispatch.
- `x-webhook-signature`: Base64-encoded HMAC-SHA256 signature computed over `${timestamp}${rawBody}` using the merchant webhook secret.

In `lib/payments/adapter.ts`:
```typescript
verifyWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
  try {
    const computedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(`${timestamp}${rawBody}`)
      .digest("base64");
    return crypto.timingSafeEqual(
      Buffer.from(signature, "base64"),
      Buffer.from(computedSignature, "base64")
    );
  } catch (err) {
    return false;
  }
}
```

### 3.2 Automated Test Verification (`tests/payment.test.ts`)
- **Legitimate Payload:** Computed signature matches `timingSafeEqual()`, returning `true`.
- **Tampered Payload:** Mutating any byte (e.g. changing `"SUCCESS"` to `"FAILED"`) results in signature mismatch and returns `false`.

---

## 4. Duplicate Webhook Handling & Idempotency

Network retries frequently cause payment gateways to deliver the same webhook multiple times. If not handled idempotently, a single customer payment could create duplicate ledger entries or trigger redundant confirmation emails.

In `app/api/payments/webhook/route.ts`:
```typescript
// 1. Fetch current booking state
const booking = bookingQuery.rows?.[0];

// 2. Check for duplicate webhook delivery
if (booking.payment_status === "paid") {
  console.log(`[Webhook Idempotency] Booking ${bookingId} is already marked as paid. Ignoring duplicate webhook.`);
  return NextResponse.json({ received: true, duplicate: true });
}
```
If a duplicate webhook is received, the handler exits early with HTTP 200 without executing secondary ledger writes or enqueueing outbox notifications.

---

## 5. Double-Entry Ledger Balancing Across Pilot Pricing Tiers

The marketplace business model specifies a default **15.00% platform commission**, with the remaining **85.00% payable to the mentor**.

Every confirmed session transaction generates a double-entry record in `ledger_transactions` satisfying the invariant:

$$\text{Gross Amount} = \text{Platform Fee} + \text{Mentor Payable}$$

### Pilot Tiers Mathematical Verification

| Service Type | Duration / Tier | Gross Price (₹) | Platform Fee (15%) | Mentor Payable (85%) | Balanced? |
|---|---|---|---|---|---|
| **1-on-1 Mentorship** | 15 Minutes | ₹149 | ₹22 | ₹127 | **YES** (₹22 + ₹127 = ₹149) |
| **1-on-1 Mentorship** | 30 Minutes | ₹249 | ₹37 | ₹212 | **YES** (₹37 + ₹212 = ₹249) |
| **1-on-1 Mentorship** | 60 Minutes | ₹449 | ₹67 | ₹382 | **YES** (₹67 + ₹382 = ₹449) |
| **Human Mock Interview** | Starter (30m) | ₹299 | ₹45 | ₹254 | **YES** (₹45 + ₹254 = ₹299) |
| **Human Mock Interview** | Standard (45m) | ₹399 | ₹60 | ₹339 | **YES** (₹60 + ₹339 = ₹399) |
| **Human Mock Interview** | Detailed (60m) | ₹499 | ₹75 | ₹424 | **YES** (₹75 + ₹424 = ₹499) |

*All 6 tiers were tested and verified in `tests/payment.test.ts` with 100% mathematical balance.*

---

## 6. Refund Processing Workflow

When a session is cancelled due to mentor unavailability or student schedule conflict:
1. The application invokes `paymentGateway.createRefund({ orderId, refundAmount, refundReason })`.
2. The Cashfree Refund API executes the reverse transaction back to the student's original payment method (VPA / Card).
3. The database updates `ledger_transactions.status = 'refunded'` and `bookings.status = 'cancelled'`.
4. An outbox event `'booking.cancelled'` is enqueued to notify both parties.

---

## 7. Compliance & Production Safety Safeguards

> [!IMPORTANT]
> **Live Payments & Payouts Warning**  
> In accordance with RBI guidelines, marketplace aggregator regulations, and platform compliance:
> 1. Real credit/debit card debiting and UPI collection are strictly disabled until Cashfree Merchant KYC is completed by the AI Tathastu legal entity.
> 2. Automated bank payouts (`Cashfree Payouts`) to mentors require valid PAN/GSTIN verification and beneficiary bank account penny-drop validation.
> 3. Production configuration requires setting `CASHFREE_ENVIRONMENT="PRODUCTION"` and populating production API keys in the hosting provider's secure secret store.

---

## 8. Verification Matrix

| Capability | Classification | Verification Method |
|---|---|---|
| Cashfree Sandbox Order Creation | **Verified Locally** | Automated test in `tests/payment.test.ts` |
| Webhook HMAC-SHA256 Verification | **Unit-Tested & Verified** | Crypto test with valid & tampered signatures |
| Duplicate Webhook Idempotency | **Code-Verified** | State guard in `/api/payments/webhook` |
| Pilot Pricing Ledger Balancing (6 tiers)| **Unit-Tested & Verified** | Automated test in `tests/payment.test.ts` |
| Refund Status Reversal | **Unit-Tested & Verified** | Verified in `tests/payment.test.ts` |
| Live Payment Processing | **Blocked by Credentials** | Awaiting Cashfree merchant KYC approval |
| Automated Mentor Bank Payouts | **Blocked by Credentials** | Awaiting Cashfree Payouts API credentials |

