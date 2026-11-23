# ASTRION — PHASE 2: PURPOSE-SPECIFIC CONSENT & AUTHORIZATION
## MentorMaze by AI Tathastu
**System:** Consent Management & Multi-Tenant Authorization Engine  
**Phase:** 2 of 12 — Permission-Aware Context Layer  
**Status:** IMPLEMENTED & VERIFIED  
**Date:** 2026-11-19  

---

## 1. Architectural Mandate

ASTRION is built on the strict principle that **student data ownership is sovereign**. Contextual intelligence must never be gathered, aggregated, or consumed without explicit, purpose-bound authorization. Under no circumstances may data collected for real-time mentorship be co-opted for unauthorized tasks such as base model training or cross-student leakage.

---

## 2. Seven Canonical Consent Purposes

The `StudentConsentService` manages seven discrete, non-overlapping consent purposes:

| Purpose Key | Default Policy | Purpose Description | Behavioral Impact When Denied |
|---|:---:|---|---|
| `service_personalization` | **TRUE** | Allows ASTRION to tailor advice, coding tasks, and explanations to student background and demonstrated mastery. | ASTRION reverts to a generic, un-personalized tutoring mode. No student skills, weaknesses, or projects are injected into the system prompt. |
| `student_memory` | **TRUE** | Allows saving and recalling cross-session episodic preferences, goals, and conceptual milestones. | No memories are recalled or saved. Each conversation starts tabula rasa. |
| `external_data_integration` | **TRUE** | Permits syncing verified progress from connected ecosystem platforms (AI Tathastu, Collaborate, Avsar, IRIS). | Ecosystem data is omitted from context builds. |
| `external_llm_processing` | **TRUE** | Authorizes routing sanitized prompts to third-party commercial LLM providers (e.g. Anthropic, Google Gemini, OpenAI). | Router restricts turn processing exclusively to local inference engines (ASTRION Core 2B). |
| `model_training` | **FALSE** | **STRICTLY FALSE BY DEFAULT**. Authorizes including student interactions or artifacts in fine-tuning datasets (e.g. LoRA/SFT). | Interactions are strictly excluded from dataset curation and training exports. Zero student data leakage into weights. |
| `mentor_sharing` | **TRUE** | Authorizes sharing progress notes, mock interview scores, and code reviews with human mentors during 1:1 sessions. | Human mentors see only session-specific inputs, not long-term student graph history. |
| `analytics_evaluation` | **TRUE** | Authorizes aggregating anonymized telemetry for pedagogical benchmarking and system optimization. | Turn telemetry is stripped of all student-identifying tokens. |

---

## 3. Strict Default Policies & Independent Lifecycle

### 3.1 Mandatory Default Setting for Model Training
In compliance with ethical AI principles and privacy regulations:
- `model_training` **defaults to `false`** for all students across the platform.
- It requires an explicit, informed opt-in action with recorded audit notes before any student sample can enter fine-tuning pipelines.

### 3.2 Granular Non-Cascading Isolation
Granting or revoking consent for one purpose operates in strict isolation:
- Revoking `mentor_sharing` **does NOT revoke** `service_personalization`.
- Granting `model_training` **does NOT alter** settings for `external_llm_processing`.
- Revoking `service_personalization` immediately prevents graph context from reaching system prompts, but preserves stored historical records in SQL for future re-activation if requested.

```typescript
// Explicit isolated grant
await StudentConsentService.grantConsent(
  studentA,
  "model_training",
  "Consented for Phase 6 LoRA audit"
);
// Revoking mentor_sharing leaves model_training and service_personalization untouched
await StudentConsentService.revokeConsent(
  studentA,
  "mentor_sharing",
  "Revoked mentor sharing"
);

expect(await StudentConsentService.hasConsent(studentA, "mentor_sharing")).toBe(false);
expect(await StudentConsentService.hasConsent(studentA, "service_personalization")).toBe(true);
expect(await StudentConsentService.hasConsent(studentA, "model_training")).toBe(true);
```

---

## 4. Cross-Tenant Authorization & Attack Defense

### 4.1 Tenant Isolation Invariants
A student identifier (`studentUserId`) is a hard boundary across all service APIs:
1. **Context Isolation**: When Student B attempts to query `StudentIntelligenceGraph.getGraph(studentA, requestingUserId: studentB)`, the service immediately rejects the call with `403_FORBIDDEN`.
2. **Consent Tampering Defense**: When Student B attempts to inspect or revoke Student A's consent settings via `StudentConsentService.hasConsent` or `revokeConsent`, the request is immediately rejected with `403_FORBIDDEN`.
3. **Memory Isolation**: Student B cannot view, modify, or delete memories belonging to Student A.

### 4.2 Administrative & Mentor Role Scoping
- Only the student themselves or authenticated users with authorized role prefixes (e.g., `mentor-*` or `admin`) may request student context.
- When a human mentor requests context, the system verifies that `mentor_sharing` consent is active before returning personalized data.

---

## 5. Performance Caching & Synchronization

To prevent database bottlenecking during high-frequency AI Mentor conversation turns:
1. **L1 In-Memory Cache**: `StudentConsentService` maintains a per-student in-memory cache of active consents.
2. **Synchronous Fast Path**: `hasConsentSync` allows synchronous middleware to evaluate permissions in sub-millisecond execution times.
3. **Durable Persistence**: All consent modifications write through to the PostgreSQL `student_purpose_consents` table.
4. **Cache Invalidation**: Calling `grantConsent` or `revokeConsent` updates both the database record and the L1 cache simultaneously.
