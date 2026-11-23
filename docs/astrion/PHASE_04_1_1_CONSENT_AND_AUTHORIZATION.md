# ASTRION Phase 4.1.1 — Consent & Authorization Governance

**Platform:** MentorMaze by AI Tathastu  
**AI System:** ASTRION — Adaptive Strategic Intelligence & Reasoning Network  
**Workspace:** `/ai-mentor`  
**Phase:** 4.1.1  
**Status:** VERIFIED  

---

## 1. Purpose-Specific Consent Architecture

MentorMaze enforces granular, purpose-separated consent across 7 platform purposes:

1. `service_personalization` (Default: `true`) — Core mentorship interaction and prompt adaptation.
2. `student_memory` (Default: `true`) — Persistent storage of student preferences and diagnosed gaps.
3. `external_data_integration` (Default: `true`) — GitHub, LeetCode, and LMS synchronization.
4. `external_llm_processing` (Default: `true`) — Routing to OpenAI, Anthropic, or Gemini providers.
5. `model_training` (Default: `false` — **STRICT OPT-IN ONLY**) — Fine-tuning or dataset inclusion.
6. `mentor_sharing` (Default: `true` policy, but **requires explicit handoff authorization for each session briefing**).
7. `analytics_evaluation` (Default: `true`) — Platform aggregate telemetry and error tracking.

---

## 2. Check-In & Handoff Consent Separation

### 2.1 Check-In Memory Reference
Check-in responses are collected under the `student_memory` purpose reference:
- If a student revokes consent for `student_memory`, check-in history cannot be retrieved or used in future sessions.
- Check-ins do not require `mentor_sharing` consent; they are private student-ASTRION session reflections.

### 2.2 Human Mentor Sharing (`mentor_sharing`)
Sharing any diagnostic summary, roadmap progress, or architectural briefing with a human mentor requires:
1. **Active `mentor_sharing` Consent:** Verified server-side via `StudentConsentService.hasConsent(studentId, "mentor_sharing", callerId)`.
2. **Explicit Per-Handoff Student Authorization:** A handoff record must have been created or authorized by the student (`state: "inquiry_created"` or `"student_authorized"`).
3. **Data Minimization:** Raw chat transcripts, emotional venting, and personal reflection logs are strictly stripped by `HumanEscalationService.generateConsentBrief()`. Only technical topics, unresolved architecture questions, and suggested session agendas are shared.

---

## 3. Server-Side Revocation & Immediate Enforcement

When a student revokes consent via `DELETE /api/ai-mentor/handoff`:
1. `StudentConsentService.revokeConsent(studentId, "mentor_sharing", ...)` is called immediately.
2. The active handoff briefing cache is cleared.
3. The handoff state transitions to `"inquiry_or_booking_cancelled"`.
4. An immutable audit record is logged:
   ```json
   {
     "action": "CONSENT_REVOKED",
     "actorUserId": "student-1",
     "state": "inquiry_or_booking_cancelled",
     "notes": "Student revoked mentor_sharing consent. All subsequent mentor reads are blocked."
   }
   ```
5. **Immediate Blocking (Zero Window):** Any subsequent read by a human mentor immediately returns `403 Forbidden` (`403_FORBIDDEN: Student has revoked or not granted consent to share mentorship briefing.`).

---

## 4. Multi-Tenant Authorization Rules

- Unauthenticated requests to `/api/ai-mentor/checkins` or `/api/ai-mentor/handoff` return `401 Unauthorized`.
- Student A cannot view or modify Student B's check-in preferences or history (returns `403 Forbidden`).
- Student A cannot view or modify Student B's handoff briefing or revoke their consent (returns `403 Forbidden`).
- Mentors can only read authorized briefings when explicit consent is active, and can never modify student preferences or revoke student consent.
