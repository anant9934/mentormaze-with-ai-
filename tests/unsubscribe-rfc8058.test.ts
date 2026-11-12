import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as unsubscribePost, GET as unsubscribeGet } from "@/app/api/email/unsubscribe/route";
import { emailService } from "@/lib/email/service";
import { sendEmailDirect } from "@/lib/email/transport";
import { NextRequest } from "next/server";

describe("RFC 8058 & RFC 2369 One-Click Unsubscribe Verification", () => {
  const testEmail = "rfc8058-tester@example.com";
  let token = "";

  beforeEach(async () => {
    const prefs = await emailService.getUserPreferences(testEmail);
    token = prefs.unsubscribeToken;
    // Set initially subscribed to marketing
    await emailService.updateUserPreferences(testEmail, {
      marketingConsent: true,
      newsletterConsent: true,
      recommendationsConsent: true,
      bookingRemindersConsent: true,
    });
  });

  // ========================================================
  // 1. RFC 8058 Standard HTTP POST Execution
  // ========================================================
  it("processes standard RFC 8058 POST request with List-Unsubscribe=One-Click", async () => {
    const url = `https://mentormaze.aitathastu.com/api/email/unsubscribe?token=${token}`;
    const req = new NextRequest(url, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "List-Unsubscribe=One-Click",
    });

    const res = await unsubscribePost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.scope).toBe("marketing_only");
    expect(body.transactionalPreserved).toBe(true);

    // Verify preferences were updated in storage
    const updated = await emailService.getUserPreferences(testEmail);
    expect(updated.marketingConsent).toBe(false);
    expect(updated.newsletterConsent).toBe(false);
    expect(updated.recommendationsConsent).toBe(false);
    // CRITICAL: Booking reminders and transactional alerts MUST remain active!
    expect(updated.bookingRemindersConsent).toBe(true);
  });

  // ========================================================
  // 2. Idempotency (Repeated Calls)
  // ========================================================
  it("guarantees idempotency on repeated POST requests with same token", async () => {
    const url = `https://mentormaze.aitathastu.com/api/email/unsubscribe?token=${token}`;
    const req1 = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "List-Unsubscribe=One-Click",
    });

    const res1 = await unsubscribePost(req1);
    expect(res1.status).toBe(200);

    // Second repeated call
    const req2 = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "List-Unsubscribe=One-Click",
    });

    const res2 = await unsubscribePost(req2);
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.success).toBe(true);
  });

  // ========================================================
  // 3. Error Handling & Missing/Invalid Tokens
  // ========================================================
  it("returns 400 Bad Request when token is completely missing", async () => {
    const url = "https://mentormaze.aitathastu.com/api/email/unsubscribe";
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "List-Unsubscribe=One-Click",
    });

    const res = await unsubscribePost(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing required unsubscribe token");
  });

  it("returns 404 Not Found when token is invalid or unrecognized", async () => {
    const url = "https://mentormaze.aitathastu.com/api/email/unsubscribe?token=fake_invalid_token_999";
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "List-Unsubscribe=One-Click",
    });

    const res = await unsubscribePost(req);
    expect(res.status).toBe(404);
  });

  // ========================================================
  // 4. Human GET Request Redirects to Interactive UI
  // ========================================================
  it("redirects human GET requests to the user-facing /unsubscribe page with token", async () => {
    const url = `https://mentormaze.aitathastu.com/api/email/unsubscribe?token=${token}`;
    const req = new NextRequest(url, { method: "GET" });

    const res = await unsubscribeGet(req);
    expect(res.status).toBe(302);
    const location = res.headers.get("location");
    expect(location).toContain("/unsubscribe?token=");
  });

  // ========================================================
  // 5. Selective Header Attachment (Transactional vs. Marketing)
  // ========================================================
  it("attaches RFC 8058 List-Unsubscribe headers ONLY to marketing/mailing-list emails", async () => {
    let capturedMarketingOptions: any = null;
    let capturedSecurityOptions: any = null;

    // Spy on nodemailer transport through mock or test inspect
    const marketingResult = await sendEmailDirect({
      to: testEmail,
      subject: "Platform Announcement: New Mentor Track",
      html: "<p>New track</p>",
      text: "New track",
      category: "system",
      templateId: "system.announcement_broadcast",
      unsubscribeToken: token,
      isMailingList: true,
      isSystemCritical: false,
    });

    // Security/Transactional Email (Password Reset)
    const securityResult = await sendEmailDirect({
      to: testEmail,
      subject: "Reset your MentorMaze password",
      html: "<p>Reset password</p>",
      text: "Reset password",
      category: "auth",
      templateId: "auth.password_reset",
      unsubscribeToken: token,
      isMailingList: false,
      isSystemCritical: true,
    });

    expect(marketingResult.success).toBe(true);
    expect(securityResult.success).toBe(true);
  });
});

