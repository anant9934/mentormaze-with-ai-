# MentorMaze Meeting Transcript & Intelligence Schema Specification
**Ecosystem**: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)  
**Specification**: Data Models, Schema Definitions, and Database DDL  
**Subsystem**: `lib/meeting-intelligence/`  
**Date**: November 2026  
**Status**: APPROVED SPECIFICATION  

---

## 1. Domain Entities & Type Definitions

The Meeting Intelligence subsystem defines standardized, strongly typed TypeScript contracts adapting Cicada's data models while integrating MentorMaze's role hierarchy and provenance badges.

### 1.1 Transcript Segment (`TranscriptSegment`)
Represents an individual utterance recognized from a participant's audio track.

```typescript
export type ProvenanceBadge =
  | "student_reported"
  | "assessment_verified"
  | "mentor_recorded"
  | "transcript_extracted"
  | "ai_inferred"
  | "external_ecosystem";

export interface TranscriptSegment {
  id: string;                       // Unique segment ID (e.g. "seg-101-1")
  sessionId: string;                // MentorMaze booking ID (UUID)
  lineIndex: number;                // 1-based sequential line number within session ("L1", "L2")
  participantId: string;            // User ID of speaker
  speakerRole: "student" | "mentor" | "system"; // Verified role
  speakerName: string;              // Display name of participant
  startTimeSeconds: number;         // Offset from session start (seconds)
  endTimeSeconds: number;           // Offset from session start (seconds)
  src: string;                      // Original verbatim spoken text
  srcLang: string;                  // BCP-47 language tag (e.g. "en", "hi", "hi-Latn")
  dst?: string;                     // Translated text in target language (optional)
  dstLang?: string;                 // BCP-47 target language tag
  isFinal: boolean;                 // true if finalized; false if partial draft
  confidence: number;               // Speech recognition confidence [0.0 - 1.0]
  processingProvider: string;       // Cloud STT provider (e.g. "whisper-cloud", "mock-cloud-stt")
  provenance: ProvenanceBadge;      // Always "transcript_extracted"
  createdAt: string;                // ISO-8601 timestamp
}
```

### 1.2 Note Topic (`NoteTopic`)
Represents a thematic discussion segment within the session.

```typescript
export interface FishboneBranch {
  label: string;                    // Short branch label (2-6 words)
  detail: string;                   // Concise explanatory detail
  timestamp?: number;               // Seconds from session start
  supportLineCount: number;         // Number of transcript lines supporting this branch
}

export interface FishboneDiagram {
  question: string;                 // Root cause question being analyzed
  branches: FishboneBranch[];       // Categorized causal factors
}

export interface NoteTopic {
  id: string;                       // Composite key: `${startSeconds}-${slug}`
  startSeconds: number;             // Timestamp when topic commenced
  title: string;                    // Short topic title (<= 12 characters / 6 words)
  summary: string;                  // Single-sentence summary of the topic (<= 40 chars)
  points: string[];                 // Up to 4 key takeaways
  pointTimes?: (number | null)[];   // Parallel array of first-spoken timestamps for each point
  evidenceLines: string[];          // Line citations (e.g. ["L3", "L4", "L7"])
  fishbone?: FishboneDiagram | null;// Optional cause-and-effect breakdown
}
```

### 1.3 Action Items & Conclusions (`NoteItem`)
Action items, decisions, and milestones agreed upon during the meeting.

```typescript
export interface NoteItem {
  id: string;                       // Deterministic ID
  text: string;                     // Explicit commitment or conclusion
  owner?: string | null;            // "student" | "mentor" | participant name
  evidenceLines: string[];          // Line citations (e.g. ["L15"])
  timestamp?: number | null;        // Seconds when spoken
  isCompleted?: boolean;            // Completion status for action items
  deadline?: string | null;         // Explicitly stated deadline (ISO date or relative)
}
```

### 1.4 Terminology Glossary (`NoteTerm`)
Technical keywords, project names, and heard misrecognitions tracked for translation and ASTRION knowledge graph linking.

```typescript
export interface NoteTerm {
  name: string;                     // Correct canonical spelling
  note: string;                     // Definition or contextual role in session
  heardMisspellings: string[];      // Common phonetic mishearings observed
}
```

### 1.5 Meeting Notes Container (`MeetingNotes`)
The aggregate live and finalized notes state.

```typescript
export interface MeetingNotes {
  title?: string;                   // Auto-generated meeting title
  summary: string;                  // 2-3 sentence executive summary
  topics: NoteTopic[];              // Chronologically ordered topics
  conclusions: NoteItem[];          // Explicit outcomes and agreements
  todos: NoteItem[];                // Action items assigned to participants
  terms: NoteTerm[];                // Session terminology glossary
  unresolvedQuestions: string[];    // Questions left unanswered for follow-up
  coveredLineCount: number;         // Number of transcript lines covered by these notes
  updatedAt: string;                // ISO timestamp of last update
  isFinal: boolean;                 // true if post-session complete pass; false if live
}
```

---

## 2. Relational Database Schema (Neon PostgreSQL DDL)

To persist meeting transcripts, live notes, and generated reports while maintaining strict multi-tenant isolation, the following relational tables are added to `lib/db/schema.ts`:

```sql
-- 1. Meeting Intelligence Session State
CREATE TABLE IF NOT EXISTS meeting_intelligence_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'idle', -- idle, capturing, paused, processing, completed, error
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0 NOT NULL,
  active_languages JSONB DEFAULT '["en", "hi"]'::jsonb NOT NULL,
  total_segments INTEGER DEFAULT 0 NOT NULL,
  total_words INTEGER DEFAULT 0 NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Meeting Transcript Segments
CREATE TABLE IF NOT EXISTS meeting_transcript_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  line_index INTEGER NOT NULL,
  participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  speaker_role VARCHAR(32) NOT NULL, -- student, mentor, system
  speaker_name VARCHAR(160) NOT NULL,
  start_time_seconds REAL NOT NULL,
  end_time_seconds REAL NOT NULL,
  src TEXT NOT NULL,
  src_lang VARCHAR(16) NOT NULL,
  dst TEXT,
  dst_lang VARCHAR(16),
  is_final BOOLEAN DEFAULT true NOT NULL,
  confidence REAL DEFAULT 1.0 NOT NULL,
  processing_provider VARCHAR(64) DEFAULT 'cloud_stt' NOT NULL,
  provenance VARCHAR(32) DEFAULT 'transcript_extracted' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_meeting_segments_booking_line UNIQUE (booking_id, line_index)
);

CREATE INDEX IF NOT EXISTS idx_meeting_segments_booking_id ON meeting_transcript_segments(booking_id);
CREATE INDEX IF NOT EXISTS idx_meeting_segments_participant ON meeting_transcript_segments(participant_id);

-- 3. Meeting Notes & Action Items Records
CREATE TABLE IF NOT EXISTS meeting_notes_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  title VARCHAR(255),
  summary TEXT NOT NULL DEFAULT '',
  topics JSONB DEFAULT '[]'::jsonb NOT NULL,
  conclusions JSONB DEFAULT '[]'::jsonb NOT NULL,
  todos JSONB DEFAULT '[]'::jsonb NOT NULL,
  terms JSONB DEFAULT '[]'::jsonb NOT NULL,
  unresolved_questions JSONB DEFAULT '[]'::jsonb NOT NULL,
  covered_line_count INTEGER DEFAULT 0 NOT NULL,
  is_final BOOLEAN DEFAULT false NOT NULL,
  approved_by_student_at TIMESTAMPTZ,
  approved_by_mentor_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Final Mentorship Intelligence Reports
CREATE TABLE IF NOT EXISTS mentorship_intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  student_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_profile_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  report_json JSONB NOT NULL,
  report_markdown TEXT NOT NULL,
  review_status VARCHAR(32) DEFAULT 'pending_review' NOT NULL, -- pending_review, student_reviewed, mentor_reviewed, approved, contested
  student_corrections TEXT,
  mentor_corrections TEXT,
  injected_into_astrion BOOLEAN DEFAULT false NOT NULL,
  synced_to_tathastu BOOLEAN DEFAULT false NOT NULL,
  tathastu_sync_idempotency_key VARCHAR(160),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```
