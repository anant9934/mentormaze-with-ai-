# Meeting Intelligence Consent & Retention Policy
**Ecosystem**: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)  
**Governance Framework**: Privacy, Cryptographic Consent Epochs, and Data Lifecycle  
**Subsystem**: `lib/meeting-intelligence/`  
**Date**: November 2026  
**Status**: APPROVED POLICY  

---

## 1. Principles of Meeting Data Governance

MentorMaze upholds strict privacy standards for all human mentorship interactions. Meeting intelligence is an assistive capability governed by the student's explicit, informed consent and bounded by cryptographic epochs.

1. **Explicit Opt-In**: Meeting intelligence (audio capture, speech recognition, translation, and automated notes) is disabled by default until the student actively initiates or grants permission upon entering the LiveKit session.
2. **Transparent Real-Time Notice**: When meeting intelligence is active, both student and mentor receive prominent, non-obtrusive visual indicators (`[LIVE] Meeting Intelligence Active`).
3. **No Unconsented External Synchronization**: Meeting transcripts and notes are never dispatched to external partner systems (including AI Tathastu core servers) without independent consent specifically authorizing external ecosystem sharing.

---

## 2. Granular Consent Scopes & Epoch Management

Consent is scoped using fine-grained permissions tied to the student's active **Consent Epoch**:

```typescript
export interface MeetingIntelligenceConsentScope {
  studentUserId: string;
  bookingId: string;
  consentEpoch: number;               // Active consent epoch ID
  allowLiveTranscription: boolean;     // Real-time speech-to-text
  allowLiveTranslation: boolean;       // Real-time subtitle translation
  allowAiNotesGeneration: boolean;     // Dynamic note generation during meeting
  allowAstrionMemoryInjection: boolean;// Permanent integration into AI mentor memory
  allowTathastuSync: boolean;          // External ecosystem synchronization
  transcriptRetentionDays: number;    // Retention window (default 90 days)
  grantedAt: string;                  // ISO-8601 timestamp
  grantedIp?: string;                 // Masked audit IP
}
```

### Consent Epoch Invalidation
When a student revokes consent or updates their data retention preferences:
1. The consent epoch counter is atomically incremented ($E_{k+1} = E_k + 1$).
2. All subsequent requests signed with epoch $E_k$ are immediately rejected by the rate limiter and outbox worker (`STALE_CONSENT_EPOCH`).
3. Outbox synchronization events with epoch $E \le E_k$ are suppressed and tombstoned.

---

## 3. Data Retention Lifecycle & Automated Purging

| Data Tier | Retention Window | Storage Medium | Deletion / Purge Protocol |
| :--- | :--- | :--- | :--- |
| **Raw PCM / Audio Chunks** | Ephemeral (0 hours) | In-Memory Buffer | Audio chunks are processed in-flight and immediately freed from RAM. No raw audio recordings are stored on disk. |
| **Draft Transcript Segments** | Duration of Call | Ephemeral Memory | Unfinalized partial drafts are cleared immediately upon segment finalization or session disconnect. |
| **Finalized Transcript Lines** | 90 Days (configurable) | Neon PostgreSQL | Automatically purged upon retention window expiry or within 24 hours of a student deletion request. |
| **Structured Meeting Notes** | 365 Days | Neon PostgreSQL | Retained as educational records; editable and redactable by the student and mentor at any time. |
| **ASTRION Pedagogical Context**| Active Mentorship Term | Student Skill Graph | Approved milestone badges and verified skills persist in ASTRION's knowledge graph until explicitly reset by the student. |

---

## 4. Student Redaction & Deletion Rights

1. **Pre-Finalization Redaction**: Students and mentors have the right to redact any line or topic from the transcript during the post-session review period. Redacted lines are purged from the database and marked with an audit tombstone (`[Redacted by participant]`).
2. **One-Click Deletion**: Students can delete all meeting intelligence records for any past session from their `/dashboard/mentorship` settings. Deletion cascades across `meeting_transcript_segments`, `meeting_notes_records`, and `mentorship_intelligence_reports`.
3. **Outbox Tombstone Acknowledgement**: If summary data was previously synchronized to AI Tathastu, a deletion tombstone is dispatched through the reliable outbox with key format:
   `tathastu:deletion:student:${studentId}:source:meeting_report:${reportId}:epoch:${epoch}:v1`
   New snapshots are gated until the tombstone receives verified acknowledgement from the destination.

---

## 5. Confidentiality of Mentor Private Notes

To ensure human mentors can record candid pedagogical assessments, career recommendations, and sensitive feedback:
- `mentor_private_notes` are stored in an encrypted database column accessible **only** to the verified mentor and authorized platform administrators.
- Private mentor notes are **strictly omitted** from student API responses, student dashboard views, and student ASTRION chat prompts.
- Only the `student_visible_summary`, `shared_action_items`, and agreed milestones are presented to the student.
