# AI Mentor Privacy, Safety & Guardrails Specification

**System:** MentorMaze AI Mentor  
**Component:** Boundary Enforcement, Crisis Protocol, Prompt Injection Defense & Data Isolation  
**Reference File:** `lib/ai-mentor/safety-guardrails.ts`

---

## 1. Safety Boundaries

MentorMaze AI Mentor is strictly an educational, technical, and career mentorship system. It enforces four hard boundaries:

1. **No Clinical Medical or Psychiatric Therapy**:
   - Refuses clinical diagnostic requests (e.g. *"Diagnose my clinical depression"*).
   - Directs students to licensed healthcare professionals.
2. **Crisis & Self-Harm Escalation Protocol**:
   - Immediate detection of self-harm or crisis disclosures.
   - Bypasses normal pedagogy to deliver compassionate, verified emergency helpline routing:
     - **Tele-MANAS (India)**: Dial `14416` (24/7 toll-free)
     - **Vandrevala Foundation**: `+91 9999 666 555`
3. **No Fabricated Hiring Guarantees**:
   - Never promises employment or claims to represent an employer's hiring committee.
   - All interview evaluations are marked as AI practice simulations.
4. **No Psychological Profiling**:
   - Strictly refuses sensitive-trait or personality inference.

---

## 2. Prompt Injection & Jailbreak Defenses

- All incoming messages pass through `SafetyGuardrails.inspectInput()`.
- Patterns such as `"ignore all previous instructions"`, `"you are now DAN"`, or `"reveal system prompt"` are intercepted and neutralized before reaching model prompts.
- Retrieved documents and user attachments are treated as untrusted data and strictly prevented from executing instruction overrides.

---

## 3. Data Privacy & Isolation

- **PII Scrubbing**: Automatic regex redaction of email addresses and 10-digit Indian mobile numbers (`[EMAIL_REDACTED]`, `[PHONE_REDACTED]`).
- **Student Memory Controls**: Students retain full rights to inspect, correct, and permanently delete saved memory items from their profile at any time.
- **No Third-Party Model Training**: Model provider router settings specify zero data retention for model training across all API integrations.
