import { describe, it, expect } from "vitest";
import { paymentGateway } from "../lib/payments/adapter";
import crypto from "crypto";

describe("Cashfree Payment Sandbox & Ledger Verification", () => {

  it("creates a Cashfree sandbox order and returns valid checkout session", async () => {
    const orderParams = {
      orderId: `order_test_${Date.now()}`,
      orderAmount: 249,
      orderCurrency: "INR",
      customerEmail: "student@example.com",
      customerName: "Anant Kumar",
      bookingId: "test-booking-payment-1",
    };

    const session = await paymentGateway.createOrder(orderParams);

    expect(session.orderId).toBe(orderParams.orderId);
    expect(session.paymentSessionId).toBeDefined();
    expect(session.paymentSessionId).toContain("session_cf_");
    expect(session.cfOrderId).toBeDefined();
  });

  it("verifies webhook HMAC-SHA256 signature correctly", () => {
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || "TEST_WEBHOOK_SECRET";
    const rawBody = JSON.stringify({
      data: {
        order: { order_id: "order_cf_12345" },
        payment: { payment_status: "SUCCESS", cf_payment_id: "pay_98765" },
      },
      event_time: "2026-11-12T12:00:00Z",
      type: "PAYMENT_SUCCESS_WEBHOOK",
    });
    const timestamp = "1762948800";

    // Compute legitimate signature
    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestamp}${rawBody}`)
      .digest("base64");

    const isValid = paymentGateway.verifyWebhookSignature(rawBody, timestamp, signature);
    expect(isValid).toBe(true);

    // Tampered payload must fail verification
    const tamperedBody = rawBody.replace("SUCCESS", "FAILED");
    const isTamperedValid = paymentGateway.verifyWebhookSignature(tamperedBody, timestamp, signature);
    expect(isTamperedValid).toBe(false);
  });

  it("validates double-entry ledger balancing across all pilot pricing tiers", () => {
    const pilotTiers = [
      { name: "15min Mentorship", price: 149 },
      { name: "30min Mentorship", price: 249 },
      { name: "60min Mentorship", price: 449 },
      { name: "Starter Mock Interview", price: 299 },
      { name: "Standard Mock Interview", price: 399 },
      { name: "Detailed Mock Interview", price: 499 },
    ];

    for (const tier of pilotTiers) {
      const split = paymentGateway.calculateSplit(tier.price, 15.0);
      expect(split.balanced).toBe(true);
      expect(split.platformFee + split.mentorPayable).toBe(tier.price);
      expect(split.platformFee).toBe(Math.round(tier.price * 0.15));
      expect(split.mentorPayable).toBeGreaterThan(0);
    }
  });

  it("processes refund issuance correctly", async () => {
    const refund = await paymentGateway.createRefund({
      orderId: "order_test_999",
      refundAmount: 249,
      refundReason: "Mentor unavailable",
    });

    expect(refund.status).toBe("SUCCESS");
    expect(refund.refundId).toContain("refund_");
  });
});
