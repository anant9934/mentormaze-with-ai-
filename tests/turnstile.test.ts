import { describe, it, expect } from "vitest";
import { verifyTurnstileToken } from "@/lib/security/turnstile-service";

describe("Cloudflare Turnstile Verification Service", () => {
  it("should reject empty or missing turnstile tokens", async () => {
    const result = await verifyTurnstileToken("");
    expect(result.success).toBe(false);
    expect(result.errorCodes).toContain("missing-input-response");
  });

  it("should bypass verification in test environment or with test bypass token", async () => {
    const result = await verifyTurnstileToken("test-turnstile-bypass");
    expect(result.success).toBe(true);
  });
});
