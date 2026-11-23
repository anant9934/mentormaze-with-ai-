# ASTRION Phase 4.1.3 — Check-In Consent Policy & Purpose Separation

**Platform:** MentorMaze by AI Tathastu  
**AI System:** ASTRION — Adaptive Strategic Intelligence & Reasoning Network  
**Workspace:** `/ai-mentor`  
**Phase:** 4.1.3  
**Status:** **VERIFIED**  

---

## 1. Executive Summary & Consent Audit

Prior to Phase 4.1.3, check-in records contained `consentReference: "student_memory"`. This created an architectural and regulatory ambiguity:
- If a student revoked consent for `student_memory`, their curated long-term profile was correctly cleared, but their check-in reflection history remained stored in `ai_mentor_checkin_records`.
- Conversely, a student might want to maintain a temporal session reflection history without granting ASTRION permission to extract permanent diagnostic memories or profile inferences.

In Phase 4.1.3, this ambiguity has been resolved by introducing a dedicated platform purpose: **`mentorship_checkins`**, establishing strict purpose independence across all 8 platform permissions.

---

## 2. Canonical Eight-Purpose Platform Architecture

ASTRION enforces purpose separation across 8 granular, non-conflated permissions:

| # | Purpose Identifier | Default Policy | Functional Scope |
| :-: | :--- | :---: | :--- |
| **1** | `service_personalization` | **TRUE** | Real-time Socratic prompt adaptation, tone calibration, and conversational context during live mentorship sessions. |
| **2** | `student_memory` | **TRUE** | Persistent long-term storage of validated student preferences, diagnosed knowledge gaps, confirmed strengths, and explicit student-confirmed facts. |
| **3** | `mentorship_checkins` | **TRUE** (Opt-Outable) | Persistent storage and retrieval of session check-ins, reflection notes, milestone progress disclosures, and self-reported blockers. |
| **4** | `external_data_integration` | **TRUE** | Read-only synchronization with authorized external platforms (GitHub repositories, LeetCode submissions, Canvas/LMS records). |
| **5** | `external_llm_processing` | **TRUE** | Secure transit of tokenized prompts to external frontier LLM providers (Anthropic, OpenAI, Google Gemini) under zero data-retention contracts. |
| **6** | `model_training` | **FALSE** (**Strict Opt-In**) | Training, fine-tuning, or alignment dataset inclusion. Check-ins and student data are **strictly ineligible by default**. |
| **7** | `mentor_sharing` | **TRUE** (Policy) | Secure, sanitized handoff briefing transmission to human mentors. **Requires explicit per-session student authorization.** |
| **8** | `analytics_evaluation` | **TRUE** | Anonymized telemetry, platform latency tracking, and pedagogical effectiveness evaluation. |

---

## 3. Core Policy Guarantees & Enforcement Rules

### 3.1 Check-In Persistence != Long-Term Memory
- Storing a check-in reflection in `ai_mentor_checkin_records` requires `mentorship_checkins` authorization.
- It does **NOT** write to `student_memory` or update `StudentMemoryService`.
- Blockers reported during check-ins remain classified as `provenance: "student_reported"`. They are never converted into verified `confirmed_weaknesses`.

### 3.2 Memory Revocation Does Not Destroy Check-In History
- When a student revokes `student_memory`:
  - `StudentMemoryService.getMemories(studentId)` immediately returns `[]`.
  - Future long-term memory writes throw `403_FORBIDDEN`.
  - The student's independently authorized check-in progress history remains accessible to the student for session continuity.

### 3.3 Check-In Revocation Enforces Instant Write/Access Blocking
- When a student revokes `mentorship_checkins`:
  - Writing check-ins via `StudentCheckinService.recordCheckin` or `POST /api/ai-mentor/checkins` is immediately blocked with `403_FORBIDDEN: Check-in writes are blocked because mentorship_checkins authorization is revoked.`
  - Querying check-in history returns `[]`.
  - Preferences reflect `cadence: "paused"`.

### 3.4 Model Training Remains Strictly Prohibited by Default
- `StudentConsentService.getDefaultPolicy("model_training") === false`.
- Check-in reflections are completely excluded from model-training pipelines.
- Granting `service_personalization` or `mentorship_checkins` **NEVER** implies or grants `model_training` consent.

### 3.5 No Unrestricted Rights to Reuse Content
- Ordinary check-in persistence gives ASTRION **NO** unrestricted rights to publish, share, or repurpose reflection text.
- Reflection content is strictly confined to the student's personal mentorship journey. Sharing with external mentors requires independent `mentor_sharing` consent plus explicit per-session authorization.
