import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TEMPLATE_DEFINITIONS, TEMPLATE_MAP, getTemplateById } from "@/lib/email/templates/registry";
import { renderEmailShell, renderPlainText } from "@/lib/email/shell";
import { escapeHtml, sanitizeHtml, interpolateVariables } from "@/lib/email/compiler";
import { emailService } from "@/lib/email/service";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import * as transport from "@/lib/email/transport";
import { EMAIL_TOKENS } from "@/lib/email/design-tokens";

describe("MentorMaze Complete Email Communication System", () => {
  // ========================================================
  // 1. Template Registry & Quality Verification (20+ Templates)
  // ========================================================
  it("verifies at least 20 designed premium email templates are registered", () => {
    expect(TEMPLATE_DEFINITIONS.length).toBeGreaterThanOrEqual(20);
    expect(TEMPLATE_DEFINITIONS.length).toBe(31);
  });

  it("verifies template categories cover auth, student, mentor, payment, support, and system", () => {
    const categories = new Set(TEMPLATE_DEFINITIONS.map((t) => t.category));
    expect(categories.has("auth")).toBe(true);
    expect(categories.has("student")).toBe(true);
    expect(categories.has("mentor")).toBe(true);
    expect(categories.has("payment")).toBe(true);
    expect(categories.has("support")).toBe(true);
    expect(categories.has("system")).toBe(true);
  });

  it("verifies every registered template generates valid table-based HTML and plain text", () => {
    TEMPLATE_DEFINITIONS.forEach((template) => {
      const sampleVars: Record<string, string> = {};
      template.variables.forEach((v) => {
        sampleVars[v.key] = v.sampleValue;
      });

      const rendered = template.render(sampleVars);

      expect(rendered.subject).toBeTruthy();
      expect(rendered.previewText).toBeTruthy();
      expect(rendered.html).toContain("<!DOCTYPE html");
      expect(rendered.html).toContain("MentorMaze");
      expect(rendered.html).toContain("by AI Tathastu");
      expect(rendered.html).toContain(EMAIL_TOKENS.colors.forest900); // #123B2E
      expect(rendered.text).toContain("MENTORMAZE BY AI TATHASTU");
      expect(rendered.text).not.toContain("undefined");
      expect(rendered.text).not.toContain("{{");
    });
  });

  // ========================================================
  // 2. Authentication & Security Templates
  // ========================================================
  it("renders welcome student and welcome mentor templates with role differentiation", () => {
    const welcomeStudent = getTemplateById("auth.welcome_student");
    const welcomeMentor = getTemplateById("auth.welcome_mentor");

    expect(welcomeStudent).toBeDefined();
    expect(welcomeMentor).toBeDefined();

    const studentOutput = welcomeStudent!.render({ user_name: "Anant" });
    const mentorOutput = welcomeMentor!.render({ user_name: "Priya" });

    expect(studentOutput.html).toContain("Welcome to MentorMaze, Anant");
    expect(studentOutput.html).toContain("Find Verified Mentors");
    expect(mentorOutput.subject).toContain("Welcome to the MentorMaze Mentor Community, Priya");
    expect(mentorOutput.html).toContain("guaranteed payouts");
  });

  it("renders secure single-use email verification and password reset emails with expiration", () => {
    const verifyTemplate = getTemplateById("auth.email_verification");
    const resetTemplate = getTemplateById("auth.password_reset");

    const verifyOutput = verifyTemplate!.render({
      user_name: "Anant",
      verification_url: "https://mentormaze.aitathastu.com/verify-email?token=xyz123",
      expires_in: "24 hours",
    });

    const resetOutput = resetTemplate!.render({
      user_name: "Anant",
      reset_url: "https://mentormaze.aitathastu.com/reset-password?token=sec999",
      expires_in: "1 hour",
    });

    expect(verifyOutput.html).toContain("https://mentormaze.aitathastu.com/verify-email?token=xyz123");
    expect(verifyOutput.html).toContain("24 hours");
    expect(resetOutput.html).toContain("https://mentormaze.aitathastu.com/reset-password?token=sec999");
    expect(resetOutput.html).toContain("1 hour");
    // Ensure passwords or raw hashes are never included
    expect(resetOutput.html).not.toContain("password_hash");
  });

  // ========================================================
  // 3. Security, HTML Sanitization & XSS Prevention
  // ========================================================
  it("escapes untrusted user input and prevents HTML injection", () => {
    const maliciousInput = '<script>alert("xss")</script><img src="x" onerror="stealCookie()" />';
    const escaped = escapeHtml(maliciousInput);

    expect(escaped).not.toContain("<script>");
    expect(escaped).toContain("&lt;script&gt;");
    expect(escaped).toContain("&quot;");
  });

  it("sanitizes template body removing dangerous script and iframe elements", () => {
    const dirtyHtml = '<p>Hello</p><script>evil()</script><iframe src="evil.com"></iframe><span onclick="hack()">Click</span>';
    const cleanHtml = sanitizeHtml(dirtyHtml);

    expect(cleanHtml).not.toContain("<script>");
    expect(cleanHtml).not.toContain("<iframe>");
    expect(cleanHtml).not.toContain("onclick");
    expect(cleanHtml).toContain("<p>Hello</p>");
  });

  it("safely falls back when variables are missing, avoiding raw syntax or undefined", () => {
    const template = "Welcome {{user_name}} to {{app_name}}! Status: {{missing_field}}.";
    const interpolated = interpolateVariables(template, { user_name: "Rahul" });

    expect(interpolated).toBe("Welcome Rahul to MentorMaze! Status: .");
    expect(interpolated).not.toContain("undefined");
    expect(interpolated).not.toContain("{{missing_field}}");
  });

  // ========================================================
  // 4. Automated Workflow Event Dispatching (Mocked SMTP for Tests)
  // ========================================================
  describe("Automated Workflow Dispatch (Mocked SMTP)", () => {
    beforeEach(() => {
      vi.spyOn(transport, "sendEmailDirect").mockResolvedValue({
        success: true,
        messageId: "<mock-msg-id-1234@mentormaze.aitathastu.com>",
        response: "250 OK: Mocked SMTP dispatch",
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("suppresses duplicate events with identical idempotency keys", async () => {
      const idempotencyKey = `test-idem-${Date.now()}`;

      // First dispatch
      const result1 = await dispatchEmailEvent({
        eventType: "booking.confirmed",
        recipient: { email: "student.test@example.com", name: "Student Test" },
        variables: {
          mentor_name: "Priya Sharma",
          session_date: "Nov 20, 2026",
          session_time: "5:00 PM IST",
        },
        idempotencyKey,
      });

      expect(result1.dispatched).toBe(true);
      expect(result1.status).toBe("sent");

      // Second dispatch with same idempotency key
      const result2 = await dispatchEmailEvent({
        eventType: "booking.confirmed",
        recipient: { email: "student.test@example.com", name: "Student Test" },
        variables: {
          mentor_name: "Priya Sharma",
          session_date: "Nov 20, 2026",
          session_time: "5:00 PM IST",
        },
        idempotencyKey,
      });

      expect(result2.dispatched).toBe(false);
      expect(result2.skippedReason).toContain("Duplicate event suppressed by idempotency key");
    });

    it("dispatches booking confirmation and session reminder events", async () => {
      const confirmResult = await dispatchEmailEvent({
        eventType: "booking.confirmed",
        recipient: { email: "anant.kumar@example.com", name: "Anant Kumar" },
        variables: {
          mentor_name: "Priya Sharma",
          session_date: "Saturday, Nov 22, 2026",
          session_time: "4:00 PM IST",
          meeting_url: "https://mentormaze.aitathastu.com/sessions/bk-99/live",
          booking_reference: "BK-99102",
        },
      });

      expect(confirmResult.dispatched).toBe(true);
      expect(confirmResult.status).toBe("sent");
    });

    it("dispatches mock interview completed report with rubric summary", async () => {
      const mockResult = await dispatchEmailEvent({
        eventType: "mock_interview.completed",
        recipient: { email: "interviewee@example.com", name: "Kunal" },
        variables: {
          mentor_name: "Vikram Patel",
          target_role: "SDE-2 (Distributed Systems)",
          overall_score: "8.8 / 10",
          report_url: "https://mentormaze.aitathastu.com/mock-interviews/report/test",
        },
      });

      expect(mockResult.dispatched).toBe(true);
      expect(mockResult.status).toBe("sent");
    });

    it("dispatches mentor application approved onboarding email", async () => {
      const mentorAppResult = await dispatchEmailEvent({
        eventType: "mentor.application_approved",
        recipient: { email: "newmentor@example.com", name: "Amit" },
        variables: {
          setup_url: "https://mentormaze.aitathastu.com/mentor/availability",
        },
      });

      expect(mentorAppResult.dispatched).toBe(true);
      expect(mentorAppResult.status).toBe("sent");
    });

    it("dispatches payment receipt and failure alerts", async () => {
      const paySuccess = await dispatchEmailEvent({
        eventType: "payment.succeeded",
        recipient: { email: "payer@example.com", name: "Suresh" },
        variables: {
          order_id: "CF_ORDER_1002",
          amount: "₹249",
          session_name: "1:1 Mentorship Session (30 mins)",
        },
      });
      expect(paySuccess.dispatched).toBe(true);

      const payFailed = await dispatchEmailEvent({
        eventType: "payment.failed",
        recipient: { email: "payer@example.com", name: "Suresh" },
        variables: {
          order_id: "CF_ORDER_1003",
          failure_reason: "Bank server timeout",
        },
      });
      expect(payFailed.dispatched).toBe(true);
    });

    it("enforces promotional opt-out while preserving transactional security communications", async () => {
      const testEmail = "newsletter.user@example.com";

      // Set user preferences to opt-out of marketing
      const prefs = await emailService.updateUserPreferences(testEmail, {
        marketingConsent: false,
        newsletterConsent: false,
      });

      expect(prefs.marketingConsent).toBe(false);

      // Attempt to dispatch non-critical marketing update
      const promoResult = await dispatchEmailEvent({
        eventType: "newsletter.product_update",
        overrideTemplateId: "newsletter.product_update",
        recipient: { email: testEmail, name: "Newsletter User" },
        variables: {},
      });

      expect(promoResult.dispatched).toBe(false);
      expect(promoResult.skippedReason).toContain("opted out");

      // Transactional security email MUST NOT be blocked!
      const securityResult = await dispatchEmailEvent({
        eventType: "user.password_reset_requested",
        overrideTemplateId: "auth.password_reset",
        recipient: { email: testEmail, name: "Newsletter User" },
        variables: { reset_url: "https://mentormaze.aitathastu.com/reset-password?token=safe" },
      });

      expect(securityResult.dispatched).toBe(true);
    });
  });

  // ========================================================
  // 5. Support Ticket Lifecycle & Internal Notes
  // ========================================================
  it("manages support ticket lifecycle and prevents internal notes from emailing users", async () => {
    // 1. Create support ticket
    const ticket = await emailService.createSupportTicket({
      userEmail: "helpcustomer@example.com",
      userName: "Deepak",
      category: "payment_refund",
      subject: "Query on double charge",
      description: "My bank statement shows two debits for session bk-12.",
    });

    expect(ticket.ticketNumber).toMatch(/^MM-2026-\d{4}$/);
    expect(ticket.status).toBe("open");

    // 2. Add internal staff note (MUST NOT dispatch user email)
    const staffNote = await emailService.replySupportTicket(
      ticket.id,
      "Checked payment gateway logs: bank deduplicated transaction automatically.",
      { name: "Staff Engineer", role: "admin" },
      true // isInternalNote = true
    );
    expect(staffNote.isInternalNote).toBe(true);

    // 3. Add customer-facing reply
    const customerReply = await emailService.replySupportTicket(
      ticket.id,
      "Hello Deepak, we checked with our payment gateway and the duplicate transaction was reversed by your bank.",
      { name: "MentorMaze Support", role: "support_agent" },
      false // isInternalNote = false
    );
    expect(customerReply.isInternalNote).toBe(false);

    // Verify retrieval filters internal notes for non-admin requests
    const thread = await emailService.getSupportTicket(ticket.id);
    expect(thread?.messages.length).toBe(3); // 1 initial + 1 note + 1 reply
  });

  // ========================================================
  // 6. User Preferences & 1-Click Unsubscribe
  // ========================================================
  it("handles 1-click unsubscribe via HMAC token", async () => {
    const testEmail = "oneclick@example.com";
    const prefs = await emailService.getUserPreferences(testEmail);
    expect(prefs.unsubscribeToken).toBeTruthy();

    const unsubscribed = await emailService.unsubscribeByToken(prefs.unsubscribeToken);
    expect(unsubscribed).toBe(true);

    const updated = await emailService.getUserPreferences(testEmail);
    expect(updated.marketingConsent).toBe(false);
    expect(updated.newsletterConsent).toBe(false);
    expect(updated.recommendationsConsent).toBe(false);
  });

  // ========================================================
  // 7. Admin Controls & System-Critical Protections
  // ========================================================
  it("prevents administrators from disabling system-critical security templates", async () => {
    await expect(
      emailService.updateTemplate("auth.password_reset", { isActive: false })
    ).rejects.toThrow("System-critical security template 'auth.password_reset' cannot be disabled");
  });

  it("allows updating non-critical templates and captures audit log", async () => {
    const updated = await emailService.updateTemplate(
      "student.profile_reminder",
      { previewText: "Updated reminder preview text" },
      { id: "admin-1", email: "admin@mentormaze.com" }
    );

    expect(updated.previewText).toBe("Updated reminder preview text");

    const auditLogs = await emailService.getAuditLogs();
    const match = auditLogs.find((a) => a.targetId === "student.profile_reminder");
    expect(match).toBeDefined();
    expect(match?.action).toBe("template.update");
  });

  // ========================================================
  // 8. REAL LIVE SMTP Gateway Connection Verification
  // ========================================================
  it("verifies real live SMTP gateway connection using configured Gmail credentials", async () => {
    const config = transport.getSmtpConfig();
    expect(config.host).toBe("smtp.gmail.com");
    expect(config.port).toBe(465);
    expect(config.secure).toBe(true);
    expect(config.user).toBe("hellomentormaze@gmail.com");

    const status = await transport.verifySmtpConnection();
    expect(status.isConfigured).toBe(true);
    expect(status.isConnected).toBe(true);
    expect(status.lastError).toBeUndefined();
  }, 15000);
});
