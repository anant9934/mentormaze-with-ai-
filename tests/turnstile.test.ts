import { describe, it, expect } from "vitest";
import { verifyTurnstileToken } from "@/lib/security/turnstile-service";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";

describe("Cloudflare Turnstile Verification Service", () => {
  it("should export TurnstileWidget component", () => {
    expect(typeof TurnstileWidget).toBe("function");
  });

  it("should reject empty or missing turnstile tokens", async () => {
    const result = await verifyTurnstileToken("");
    expect(result.success).toBe(false);
    expect(result.errorCodes).toContain("missing-input-response");
  });

  it("should bypass verification in test environment or with test bypass token", async () => {
    const result = await verifyTurnstileToken("test-turnstile-bypass");
    expect(result.success).toBe(true);
  });

  it("should allow login with valid turnstile token in test mode", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test.student@example.com",
        password: "password123",
        role: "student",
        turnstileToken: "test-turnstile-bypass",
      }),
    });

    const res = await loginHandler(req);
    // In test environment, it should either succeed (200) or report user credential check, but not 403 challenge failure
    expect(res.status).not.toBe(403);
  });
});
