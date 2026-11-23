# ASTRION Phase 4.1.3 — Check-In Retention, Deletion & Student Correction Specification

**Platform:** MentorMaze by AI Tathastu  
**AI System:** ASTRION — Adaptive Strategic Intelligence & Reasoning Network  
**Workspace:** `/ai-mentor`  
**Phase:** 4.1.3  
**Status:** **VERIFIED**  

---

## 1. Retention & Legal Basis Specification

### 1.1 Purpose of Processing
Check-in records are collected and processed exclusively to support the student's interactive mentorship journey:
- Providing session-to-session continuity across goal milestones.
- Helping ASTRION tailor questions and practice recommendations to the student's pace.
- Maintaining an auditable learning journal visible only to the student.

### 1.2 Storage Basis & Transparency
Check-in persistence is grounded in the student's active enrollment and consent for the dedicated `mentorship_checkins` purpose:
- **Tenant Isolation:** All records are indexed by `student_user_id` and guarded by strict server-side ownership checks (`requestingUserId === studentUserId`).
- **No Unrestricted Rights:** Storing a check-in gives MentorMaze and ASTRION **zero** rights to sell, publicize, train foundational models on, or transfer student reflection text.

---

## 2. Transparent Student Controls & Deletion APIs

In compliance with data minimization and GDPR/CCPA storage limitation principles, students are provided with self-service controls to correct, delete, or clear their check-in history.

### 2.1 Single Check-In Record Deletion
A student may delete any specific historical check-in reflection:
- **API Endpoint:** `DELETE /api/ai-mentor/checkins?checkinId=<id>`
- **Service Method:** `StudentCheckinService.deleteCheckinRecord(studentUserId, checkinId, requestingUserId)`
- **Behavior:** Permanently deletes the record from `ai_mentor_checkin_records` in PostgreSQL and purges it from in-memory session caches.

### 2.2 Complete Check-In History Erasure (Right to Be Forgotten)
A student may erase their entire check-in history at any time:
- **API Endpoint:** `DELETE /api/ai-mentor/checkins?all=true`
- **Service Method:** `StudentCheckinService.clearAllCheckinHistory(studentUserId, requestingUserId)`
- **Behavior:** Deletes all rows associated with `student_user_id` from `ai_mentor_checkin_records`.

### 2.3 Student Reflection Corrections (Provenance Preservation)
A student may update or correct an earlier reflection (e.g., clarifying progress or correcting an inaccurate self-assessment):
- **API Endpoint:** `PATCH /api/ai-mentor/checkins`
  ```json
  {
    "checkinId": "chk-12345",
    "progressSummary": "Corrected: Passed 14/15 integration tests.",
    "blockers": "Minor timeout on final edge case."
  }
  ```
- **Service Method:** `StudentCheckinService.updateCheckinRecord(studentUserId, checkinId, updates, requestingUserId)`
- **Provenance Integrity:** The updated record strictly retains `provenance: "student_reported"`. A correction cannot convert self-reported progress into mentor-verified evidence or confirmed diagnostic weaknesses.

---

## 3. Empirical Test Verification

Verified in `tests/ai-mentor-phase4-1-3-checkin-consent-drizzle.test.ts`:
1. **Single Deletion Test:** Created a test check-in, issued `DELETE ?checkinId=...`, verified record was removed from PostgreSQL and subsequent queries return `false` for that ID.
2. **Clear All History Test:** Created multiple test records, issued `DELETE ?all=true`, verified `getCheckinHistory` returned an empty array (`length: 0`).
3. **Correction Test:** Issued `PATCH /api/ai-mentor/checkins` with updated progress text, confirmed fields updated in database while `provenance` remained strictly `"student_reported"`.
