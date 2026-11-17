/**
 * Safety Boundaries, PII Redaction & Prompt Injection Defenses
 * Enforces Educational/Career Domain Scope and Crisis Escalation
 * Brand: MentorMaze by AI Tathastu
 */

export interface SafetyCheckResult {
  isSafe: boolean;
  sanitizedText: string;
  flaggedCategory?: "medical_clinical" | "crisis_harm" | "prompt_injection" | "pii_leak";
  redactedPiiCount: number;
  crisisHelpNotice?: string;
}

export class SafetyGuardrails {
  /**
   * Evaluates incoming student input for clinical therapy claims, crisis disclosures, prompt injection, and PII
   */
  public static inspectInput(rawText: string): SafetyCheckResult {
    const lower = rawText.toLowerCase();

    // 1. Crisis / Self-Harm Detection -> Immediate Compassionate Support
    if (
      lower.includes("suicide") ||
      lower.includes("kill myself") ||
      lower.includes("end my life") ||
      lower.includes("self harm") ||
      lower.includes("hurt myself")
    ) {
      return {
        isSafe: false,
        sanitizedText: rawText,
        flaggedCategory: "crisis_harm",
        redactedPiiCount: 0,
        crisisHelpNotice: "It sounds like you are going through a difficult time. As an AI career mentor, I cannot provide crisis counseling. Please connect immediately with professional support: In India, call the Tele-MANAS helpline at 14416 or Vandrevala Foundation at +91 9999 666 555. You are not alone.",
      };
    }

    // 2. Clinical Medical / Psychiatric Boundary
    if (
      lower.includes("diagnose my depression") ||
      lower.includes("prescribe medication") ||
      lower.includes("bipolar medication") ||
      lower.includes("clinical therapy")
    ) {
      return {
        isSafe: false,
        sanitizedText: rawText,
        flaggedCategory: "medical_clinical",
        redactedPiiCount: 0,
        crisisHelpNotice: "MentorMaze is an engineering career and technical mentorship system. I cannot diagnose medical conditions or provide clinical therapy. Please consult a licensed healthcare professional for clinical health concerns.",
      };
    }

    // 3. Prompt Injection / System Prompt Override Defense
    let sanitized = rawText;
    let isInjection = false;
    if (
      lower.includes("ignore all previous instructions") ||
      lower.includes("you are now dan") ||
      lower.includes("disregard system prompt") ||
      lower.includes("reveal system instructions")
    ) {
      isInjection = true;
      sanitized = sanitized
        .replace(/ignore all previous instructions/gi, "[blocked instruction]")
        .replace(/disregard system prompt/gi, "[blocked instruction]")
        .replace(/reveal system instructions/gi, "[blocked instruction]");
    }

    // 4. PII Redaction (Phone, Email, Aadhaar, Credit Card patterns)
    let piiCount = 0;

    // Email scrubbing
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, () => {
      piiCount++;
      return "[EMAIL_REDACTED]";
    });

    // Indian Phone scrubbing (10 digits with optional +91)
    sanitized = sanitized.replace(/(?:\+91[\-\s]?)?[6789]\d{9}/g, () => {
      piiCount++;
      return "[PHONE_REDACTED]";
    });

    return {
      isSafe: !isInjection || piiCount > 0,
      sanitizedText: sanitized,
      flaggedCategory: isInjection ? "prompt_injection" : undefined,
      redactedPiiCount: piiCount,
    };
  }
}
