# MentorMaze-2B: Model Router Architecture & Lifecycle Safety Verification

**Component:** `lib/ai-mentor/model-provider-router.ts`  
**Endpoint:** `app/api/admin/ai-mentor/route.ts`  
**Platform:** MentorMaze by AI Tathastu (`https://mentormaze.aitathastu.com`)  
**Standard:** Zero-Fabrication Mandate & Fail-Safe Routing Architecture  
**Verification Date:** November 18, 2026  

---

## 1. Architectural Overview & Problem Statement

Prior to this audit, `model-provider-router.ts` contained a critical vulnerability under the Zero-Fabrication standard:
1. **False Readiness Claim:** The router reported `mentormaze_2b` as `"ready"` whenever a placeholder smoke adapter existed on disk (`training/adapters/mentormaze-2b-smoke-adapter`).
2. **Simulation Bypass:** When invoked, `callMentorMaze2B()` bypassed real model inference and executed `generateSpecialized2BOutput()`, returning hardcoded Markdown strings while simulating an artificial 18.2ms execution timer.

This implementation has been decommissioned. In its place, a formal **7-stage finite state machine (FSM)** for model lifecycle tracking and fail-safe routing has been implemented.

---

## 2. Model Lifecycle State Machine (`ModelLifecycleState`)

The provider router tracks the real status of self-hosted model weights through seven mutually exclusive states:

```
               [No Adapter on Disk]
                        │
                        ▼
                 ┌─────────────┐
                 │ NOT_TRAINED │
                 └──────┬──────┘
                        │ (Runs backward smoke test)
                        ▼
                ┌──────────────┐
                │ SMOKE_TESTED │  ◄── "training/adapters/mentormaze-2b-smoke-test-only"
                └──────┬───────┘      (Cannot be deployed)
                        │ (Initiates real LoRA SFT)
                        ▼
                  ┌──────────┐
                  │ TRAINING │
                  └────┬─────┘
                       │ (Weights exported to "mentormaze-2b-sft-v1")
                       ▼
                  ┌─────────┐
                  │ TRAINED │
                  └────┬────┘
                       │ (Executes 501-case test benchmark)
                       ▼
                 ┌───────────┐
                 │ EVALUATED │
                 └─────┬─────┘
                       │
       ┌───────────────┴───────────────┐
       ▼ (Passes quality gates)        ▼ (Fails quality gates)
┌────────────┐                  ┌──────────────┐
│ DEPLOYABLE │                  │ NON_ELIGIBLE │
└──────┬─────┘                  └──────────────┘
       │ (Admin enables flag)
       ▼
 ┌──────────┐
 │ DEPLOYED │
 └──────────┘
```

### TypeScript Definition
```typescript
export type ModelLifecycleState =
  | "NOT_TRAINED"      // No model or adapter exists
  | "SMOKE_TESTED"     // Passed functional smoke test only (cannot be deployed)
  | "TRAINING"         // Training in progress
  | "TRAINED"          // Training complete, checkpoint saved, not yet evaluated
  | "EVALUATED"        // Benchmark complete, scores recorded
  | "DEPLOYABLE"       // Passed all quality gates, ready for production use
  | "DEPLOYED";        // Actively serving requests
```

---

## 3. Physical State Detection Logic

`ModelProviderRouter.getModelLifecycleState()` performs runtime filesystem inspection:

1. **Check SFT Production Directory:**
   Inspects `training/adapters/mentormaze-2b-sft-v1/adapter_model.safetensors`.
   - If present, checks `training/reports/evaluation_results.json`:
     - If evaluated: reads empirical test perplexity, Socratic compliance, and technical accuracy. If compliance $\ge 60\%$, marks as `DEPLOYABLE` (or `DEPLOYED` if `MENTORMAZE_DEPLOY_2B === "true"`).
     - If not evaluated: returns `TRAINED`.
2. **Check Smoke Test Directory:**
   Inspects `training/adapters/mentormaze-2b-smoke-test-only/adapter_model.safetensors`.
   - If present without the SFT adapter: returns `SMOKE_TESTED`.
   - Eligibility: `{ eligible: false, reason: "Passed functional smoke test on mock architecture only; cannot be deployed in production." }`.
3. **Default / Absent Weights:**
   Returns `NOT_TRAINED` with status `"unconfigured"`.

---

## 4. Fail-Safe Production Routing

In `ModelProviderRouter.complete()`:

```typescript
// 0. Check MentorMaze-2B Specialized Fine-Tuned Model (If requested or preferred)
if (payload.preferredProvider === "mentormaze_2b" || process.env.MENTORMAZE_PREFER_LOCAL === "true") {
  const lifecycle = this.getModelLifecycleState();
  const fallbackProvider = process.env.GEMINI_API_KEY
    ? "gemini"
    : process.env.GROQ_API_KEY
    ? "groq"
    : "local_pedagogical";

  if (lifecycle.state !== "DEPLOYABLE" && lifecycle.state !== "DEPLOYED") {
    const warnMsg =
      lifecycle.state === "NOT_TRAINED"
        ? `[ModelRouter] MentorMaze-2B has not been trained. Falling back to ${fallbackProvider}.`
        : `[ModelRouter] MentorMaze-2B adapter exists but is not deployable (status: ${lifecycle.state}). Falling back to ${fallbackProvider}.`;
    console.warn(warnMsg);
    fallbackReason = `MENTORMAZE_2B_${lifecycle.state}`;
  } else {
    try {
      const result = await this.callMentorMaze2B(payload, requestId);
      ...
      return result;
    } catch (err: any) {
      fallbackReason = `MENTORMAZE_2B_FAILED: ${err.message}`;
      console.warn("[ModelRouter] MentorMaze-2B invocation failed:", err.message);
    }
  }
}
```

### Safety Guarantees:
1. **Never Routes to a Smoke Adapter:** If only the smoke adapter exists (`SMOKE_TESTED`), the router immediately rejects request dispatch and logs:
   `[ModelRouter] MentorMaze-2B adapter exists but is not deployable (status: SMOKE_TESTED). Falling back to gemini.`
2. **Never Invents Latency or Tokens:** Simulated latency numbers (`Math.max(..., 18.2)`) and hardcoded canned responses (`generateSpecialized2BOutput`) have been deleted from `callMentorMaze2B`.
3. **Transparent Fallback Telemetry:** If local HTTP inference is unavailable, the router marks `isFallback: true`, records `fallbackReason: MENTORMAZE_2B_SMOKE_TESTED` or `MENTORMAZE_2B_FAILED`, and routes to Google Gemini or Groq without disruption to the user experience.

---

## 5. Cost Accounting & Provider Health API

- **Self-Hosted Pricing:** Token calculation for `mentormaze_2b` returns `$0.000000` because the model is self-hosted on local silicon or dedicated instances with zero per-token API charges.
- **Admin Provider Health:** Querying `/api/admin/ai-mentor` returns:
  ```json
  {
    "provider": "mentormaze_2b",
    "modelName": "mentormaze/mentormaze-2b-sft-v1",
    "isAvailable": false,
    "isConfigured": true,
    "status": "degraded",
    "lifecycleState": "SMOKE_TESTED",
    "adapterPath": "training/adapters/mentormaze-2b-smoke-test-only",
    "deploymentEligibility": {
      "eligible": false,
      "reason": "Passed functional smoke test on mock architecture only; cannot be deployed in production."
    },
    "message": "MentorMaze-2B status: SMOKE_TESTED. Passed functional smoke test on mock architecture only; cannot be deployed in production."
  }
  ```

