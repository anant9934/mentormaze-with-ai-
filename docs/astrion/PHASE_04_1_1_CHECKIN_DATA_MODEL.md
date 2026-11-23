# ASTRION Phase 4.1.1 — Check-In Data Model & Taxonomy Decoupling

**Platform:** MentorMaze by AI Tathastu  
**AI System:** ASTRION — Adaptive Strategic Intelligence & Reasoning Network  
**Workspace:** `/ai-mentor`  
**Phase:** 4.1.1  
**Status:** VERIFIED  

---

## 1. Executive Summary & Defect Remediation

In Phase 4.1, an architectural defect was flagged in check-in data modeling:
1. Student-reported blockers during sessions were directly saved into the canonical `student_memory` table under `confirmed_weaknesses`.
2. General milestone progress updates were stored into `interview_prep_progress`.

This violated core pedagogical and privacy principles:
- **Unverified Disclosures Must Not Pollute Diagnosis:** A student's self-reported blocker (e.g., *"Struggling with log replication consistency under simulated partition"*) represents an unverified perception, not an empirically diagnosed or mentor-verified deficiency.
- **Progress Disclosures Do Not Equal Skill Mastery:** A self-reported achievement during check-in cannot automatically increment skill graph proficiency.
- **Context Isolation & Provenance:** Check-ins are temporal, interactive session reflections that require structured linkage to specific goals, roadmaps, and milestones.

In Phase 4.1.1, check-in data modeling has been **completely decoupled** from the general memory system and migrated to dedicated persistent PostgreSQL tables with explicit provenance tracking (`"student_reported"`).

---

## 2. Dedicated Check-In Schema Architecture

### 2.1 Database Tables

Two dedicated tables were added in PostgreSQL (`lib/db/ai-mentor-schema.ts`, migration `0006_flawless_checkin_lifecycle.sql`):

#### 1. `ai_mentor_checkin_preferences`
Stores student schedule preferences and quiet hours without promising background daemon delivery:
```sql
CREATE TABLE IF NOT EXISTS "ai_mentor_checkin_preferences" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "student_user_id" varchar(64) NOT NULL UNIQUE,
  "cadence" varchar(32) NOT NULL DEFAULT 'weekly', -- 'daily' | 'weekly' | 'paused'
  "preferred_hour" integer NOT NULL DEFAULT 18,     -- 0-23 in student timezone
  "timezone" varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
  "quiet_hours_enabled" boolean NOT NULL DEFAULT true,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 2. `ai_mentor_checkin_records`
Stores every check-in occurrence with immutable provenance, structured goal/milestone linkage, and consent tagging:
```sql
CREATE TABLE IF NOT EXISTS "ai_mentor_checkin_records" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "student_user_id" varchar(64) NOT NULL,
  "checkin_type" varchar(32) NOT NULL DEFAULT 'session_checkin', -- 'daily' | 'weekly' | 'milestone_reflection' | 'session_checkin'
  "goal_id" varchar(64),
  "roadmap_id" varchar(64),
  "milestone_id" varchar(64),
  "student_response" text,
  "progress_summary" text,
  "blockers" text,
  "notes" text,
  "provenance" varchar(32) NOT NULL DEFAULT 'student_reported',
  "consent_reference" varchar(64) NOT NULL DEFAULT 'student_memory',
  "observed_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
```

### 2.2 Indexes for Performance & Isolation
- `ai_mentor_checkin_preferences_student_idx` on `student_user_id`
- `ai_mentor_checkin_records_student_idx` on `student_user_id`
- `ai_mentor_checkin_records_goal_idx` on `goal_id`
- `ai_mentor_checkin_records_observed_idx` on `observed_at`

---

## 3. Data Flow & Decoupling Implementation

### 3.1 `StudentCheckinService` (`lib/ai-mentor/checkins/student-checkin-service.ts`)
The `StudentCheckinService` encapsulates all check-in CRUD operations:
- Validates user identity (`studentUserId === requestingUserId`).
- Persists to SQL with automatic disk snapshot backup.
- Prevents check-in data from writing to `StudentMemoryService`.
- Tags all records with provenance `"student_reported"` and consent reference `"student_memory"`.

### 3.2 Check-In API Route (`app/api/ai-mentor/checkins/route.ts`)
- **GET**: Retrieves student preferences and check-in history. Returns `backgroundRemindersEnabled: false` with the explicit delivery statement:
  > *"Check-ins are available during your mentorship sessions. Automatic scheduled reminders are not currently enabled."*
- **POST**: Validates input, saves cadence preferences, records check-in to `ai_mentor_checkin_records`, and optionally records an in-app notification under category `"mentorship"`.
- **Zero Pollution Guarantee**: Completely eliminated calls to `StudentMemoryService.saveMemory(studentId, "confirmed_weaknesses", ...)`. Blockers and progress remain strictly within `ai_mentor_checkin_records`.

---

## 4. Verification Evidence

In `tests/ai-mentor-phase4-1-1-integrity.test.ts`:
- **Test 1.1**: Verifies check-ins persist to dedicated records. Explicitly asserts that no record in `confirmed_weaknesses` or `interview_prep_progress` is created from check-in text.
- **Test 1.2**: Verifies that check-in records are accurately associated with `goalId`, `roadmapId`, and `milestoneId`.
- **Status:** **PASS** (100%).
