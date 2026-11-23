# MENTORSHIP INTELLIGENCE BRIDGE SPECIFICATION

**Product:** MentorMaze by AI Tathastu  
**Domain:** https://mentormaze.aitathastu.com  
**Subsystem:** Mentorship Intelligence Bridge  
**Status:** Implemented & Verified  

---

## 1. Subsystem Mission & Architectural Concept

The **Mentorship Intelligence Bridge** is the connective tissue between continuous AI mentoring through ASTRION and high-impact human mentorship. 

Rather than treating AI and human mentoring as disconnected silos, the bridge creates a **permission-controlled, bi-directional intelligence loop**:
1. Ongoing student interactions with ASTRION are synthesized into high-signal intake briefings.
2. Students maintain complete agency: reviewing, editing questions, and granting explicit consent before any data reaches a mentor.
3. Mentors receive context-rich briefings before and during sessions.
4. Mentor feedback is fed back into ASTRION's continuous context to enrich future AI sessions.

```text
                      THE 6-STEP CLOSED LOOP
                      
   Step 1: Timeframe Selection (Session / 7 Days / 30 Days)
                      │
                      ▼
   Step 2: AI Synthesis with Strict Provenance Badges
                      │
                      ▼
   Step 3: Student Review, Question Authoring & Editing
                      │
                      ▼
   Step 4: Explicit Purpose-Specific Consent & Selective Share
                      │
                      ▼
   Step 5: Mentor Intake Briefing (Pre-Session & In-Call Drawer)
                      │
                      ▼
   Step 6: Post-Session Mentor Feedback ──► Returns to ASTRION
```

---

## 2. The 6-Step Operational Lifecycle

### Step 1: Timeframe & Scope Selection
The student triggers bridge generation from `/dashboard/mentorship` or `/dashboard`. They choose the evidence window:
- `session`: Current/last ASTRION conversation.
- `7_days`: Trajectory and hurdles across the past week.
- `30_days`: Comprehensive monthly progress report.
- `custom`: Specific selected conversation IDs.

### Step 2: Evidence-Backed Synthesis & Provenance Tagging
`MentorshipBridgeService.generateSummary()` scans the student's conversation store, intelligence graph, and goals. Every data point is tagged with an immutable provenance badge:

| Provenance Badge | Criteria |
|---|---|
| `student_reported` | Directly stated by the student in chat (e.g., "I know Python basics"). |
| `project_demonstrated` | Demonstrated in GitHub repo or code sandbox submission. |
| `assessment_verified` | Verified by algorithmic code evaluation or rubric scoring. |
| `mentor_recorded` | Assessed and recorded by an approved human mentor. |
| `ai_inferred` | System hypothesis derived from conversation patterns. |
| `external_ecosystem` | Ingested from AI Tathastu core directory. |

### Step 3: Student Review & Question Formulation
Before sharing, the student views the interactive **Mentorship Bridge Modal**:
- Can edit the generated mentoring objectives.
- Can author specific questions for the mentor (e.g., *"How should I approach database partitioning in high-throughput services?"*).
- Can attach a personal note explaining their current situation.
- Can remove any bullet points they wish to keep private.

### Step 4: Explicit Consent & Targeted Sharing
The summary is never automatically blasted to all mentors. The student selects:
- Target verified mentor profile or specific booking ID.
- Explicit confirmation of consent under purpose `share_with_mentors`.
- Creates a record in `mentorship_bridge_shares` with status `active`.

### Step 5: Mentor Intake Briefing (Pre-Session & Live Call)
The authorized mentor accesses the briefing via:
1. **Mentor Dashboard (`/mentor/dashboard`)**: `View Student Briefing` button on upcoming session cards and booking requests.
2. **Live Room (`/sessions/[id]/live`)**: The `Briefing` sidebar tab embedded directly in the WebRTC/LiveKit call interface.
- Mentor views: Student background, objectives, questions prepared for them, confirmed technical evidence, and notes.
- Mentor does *not* see: Unshared private student chat logs or unrelated history.
- **Audit Logging**: Every view records `{ actorUserId: mentorId, action: "bridge_share.viewed", timestamp }`.

### Step 6: Post-Session Return-Intelligence Loop
Following the session, the mentor records structured feedback:
- `observedStrengths`: Concrete validated proficiencies.
- `developmentGaps`: Specific areas requiring improvement.
- `recommendedActions`: 1–3 clear action items.
- `agreedMilestones`: Upcoming deadlines.
- **Return to ASTRION**: Ingested by `PermissionAwareContextBuilder`, ensuring ASTRION opens the student's next session by following up on the human mentor's recommendations.

---

## 3. Database Schema & Persistence

### 3.1 `mentorship_bridge_shares` Table
```sql
CREATE TABLE IF NOT EXISTS mentorship_bridge_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_profile_id VARCHAR(120),
  booking_id VARCHAR(120),
  timeframe VARCHAR(32) NOT NULL DEFAULT '7_days',
  selected_conversation_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
  student_background JSONB NOT NULL,
  mentoring_history JSONB DEFAULT '[]'::jsonb NOT NULL,
  current_challenges JSONB DEFAULT '[]'::jsonb NOT NULL,
  progress_and_evidence JSONB DEFAULT '[]'::jsonb NOT NULL,
  development_areas JSONB DEFAULT '[]'::jsonb NOT NULL,
  mentoring_objectives JSONB DEFAULT '[]'::jsonb NOT NULL,
  questions_for_mentor JSONB DEFAULT '[]'::jsonb NOT NULL,
  student_note TEXT,
  status VARCHAR(32) DEFAULT 'active' NOT NULL, -- draft, active, revoked, expired
  share_purpose VARCHAR(64) DEFAULT 'human_mentorship_intake' NOT NULL,
  consent_reference VARCHAR(64) DEFAULT 'share_with_mentors' NOT NULL,
  access_audit_logs JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  revoked_at TIMESTAMPTZ
);
```

### 3.2 Enhanced `session_notes` Columns
```sql
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS observed_strengths JSONB DEFAULT '[]'::jsonb;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS development_gaps JSONB DEFAULT '[]'::jsonb;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS recommended_actions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS agreed_milestones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMPTZ;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS next_session_focus TEXT;
```

---

## 4. Security, Isolation & Consent Controls

1. **Cross-Tenant Isolation**: A mentor can only view bridge shares where `mentor_profile_id` or `booking_id` matches their own assigned bookings. Querying other students' shares returns `403 Forbidden`.
2. **Instant Revocation**: Students can revoke any share at any time with one click from `/dashboard/mentorship`. Once revoked, status changes to `revoked`, `revoked_at` is stamped, and all subsequent mentor requests are rejected.
3. **Immutability of Provenance**: Provenance badges cannot be manually forged by the frontend. The backend verifies evidence types against the internal `StudentIntelligenceGraph` and database records.
4. **Data Minimization**: The bridge shares only the synthesized briefing. Raw transcripts of student conversations with ASTRION are never transmitted to mentors.
