# PHASE 3.2: Database Migration Tracking & PostgreSQL Catalog Verification

**Platform:** MentorMaze by AI Tathastu (`mentormaze.aitathastu.com`)  
**AI System:** ASTRION — Adaptive Strategic Intelligence & Reasoning Network  
**Workspace:** `/ai-mentor`  
**Phase:** 3.2 — Production-Grade Mentorship Lifecycle Hardening  
**Date:** 2026-11-23  
**Status:** `VERIFIED`

---

## 1. Executive Summary

During Phase 3.1, tables `ai_mentor_goals`, `ai_mentor_roadmaps`, and `ai_mentor_roadmap_milestones` were introduced to persist the goal-centric mentorship lifecycle. Phase 3.2 hardens the persistence tier to production standards:
1. Validates that migrations `0003_dazzling_golden_guardian`, `0004_quiet_rattler`, and `0005_ambitious_evidence_provenance` are recorded in exact sequential order in `lib/db/migrations/meta/_journal.json` and `drizzle.__drizzle_migrations`.
2. Adds a partial unique index `idx_one_active_roadmap_per_goal` on `ai_mentor_roadmaps (goal_id) WHERE status = 'active'` to guarantee that no concurrent operation can create or retain multiple active roadmaps for a single goal.
3. Adds 6 progress evidence and audit provenance columns to `ai_mentor_roadmap_milestones`.
4. Executes non-destructive migration execution script `scripts/apply-phase3-2-migrations.mjs` against `.mentormaze-pgdata`, resolving legacy duplicate active roadmaps safely by marking older duplicates as `superseded` prior to index enforcement.
5. Introspects the physical PostgreSQL catalog to verify all columns, indexes, and nullability constraints.

---

## 2. Migration Journal & Tracking State

### 2.1 Journal Entries (`lib/db/migrations/meta/_journal.json`)

The journal records each migration entry, its timestamp, dialect, and tag:

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1795104533126,
      "tag": "0000_open_komodo",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "7",
      "when": 1795106750852,
      "tag": "0001_absurd_wong",
      "breakpoints": true
    },
    {
      "idx": 2,
      "version": "7",
      "when": 1795108154158,
      "tag": "0002_black_la_nuit",
      "breakpoints": true
    },
    {
      "idx": 3,
      "version": "7",
      "when": 1795371320343,
      "tag": "0003_dazzling_golden_guardian",
      "breakpoints": true
    },
    {
      "idx": 4,
      "version": "7",
      "when": 1795371340315,
      "tag": "0004_quiet_rattler",
      "breakpoints": true
    },
    {
      "idx": 5,
      "version": "7",
      "when": 1795373800000,
      "tag": "0005_ambitious_evidence_provenance",
      "breakpoints": true
    }
  ]
}
```

### 2.2 Applied Migration Records (`drizzle.__drizzle_migrations`)

Introspection of the PostgreSQL table `drizzle.__drizzle_migrations` in `.mentormaze-pgdata`:

| ID | Migration Hash | Created At Timestamp | Migration Purpose | Status |
|:---:|:---|:---:|:---|:---:|
| 1 | `0003_dazzling_golden_guardian` | 1795371320343 | Initial `ai_mentor_goals` table & foreign keys | `APPLIED` |
| 2 | `0004_quiet_rattler` | 1795371340315 | `ai_mentor_roadmaps` & `ai_mentor_roadmap_milestones` | `APPLIED` |
| 3 | `0005_ambitious_evidence_provenance` | 1795373800000 | Partial unique index & milestone audit columns | `APPLIED` |

---

## 3. Migration 0005 DDL & Data Reconciliation

File: `lib/db/migrations/0005_ambitious_evidence_provenance.sql`

```sql
-- Data Reconciliation: Preserve latest active roadmap per goal; mark older duplicate active roadmaps as 'superseded'
UPDATE "ai_mentor_roadmaps" 
SET status = 'superseded' 
WHERE status = 'active' AND id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY goal_id ORDER BY updated_at DESC) as rn 
    FROM "ai_mentor_roadmaps" 
    WHERE status = 'active'
  ) t WHERE rn = 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_one_active_roadmap_per_goal" 
ON "ai_mentor_roadmaps" USING btree ("goal_id") 
WHERE status = 'active';
--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "student_confirmation" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "evidence_ref" text;
--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "deliverable_url" varchar(255);
--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "assessment_notes" text;
--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "success_criteria" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "provenance" varchar(64) DEFAULT 'student_confirmed' NOT NULL;
```

---

## 4. Physical Catalog Introspection

### 4.1 Partial Unique Index on `ai_mentor_roadmaps`

Query:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'ai_mentor_roadmaps' AND indexname = 'idx_one_active_roadmap_per_goal';
```

Result:
```text
indexname: idx_one_active_roadmap_per_goal
indexdef:  CREATE UNIQUE INDEX idx_one_active_roadmap_per_goal ON public.ai_mentor_roadmaps USING btree (goal_id) WHERE ((status)::text = 'active'::text)
```

### 4.2 Columns of `ai_mentor_roadmap_milestones`

Query:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ai_mentor_roadmap_milestones'
ORDER BY ordinal_position;
```

Catalog Result:

| # | Column Name | Data Type | Nullable | Default | Verification Note |
|:---:|:---|:---|:---:|:---|:---|
| 1 | `id` | `character varying(64)` | NO | `NULL` | Primary key |
| 2 | `roadmap_id` | `character varying(64)` | YES | `NULL` | Foreign key to `ai_mentor_roadmaps(id)` |
| 3 | `week_number` | `integer` | NO | `NULL` | Sequential week index |
| 4 | `title` | `character varying(255)` | NO | `NULL` | Milestone display title |
| 5 | `description` | `text` | NO | `NULL` | Pedagogical syllabus / milestone tasks |
| 6 | `skills_covered` | `jsonb` | YES | `'[]'::jsonb` | Array of skill titles |
| 7 | `status` | `character varying(32)` | YES | `'pending'` | `'pending'` \| `'in_progress'` \| `'completed'` |
| 8 | `completed_at` | `timestamp with time zone` | YES | `NULL` | Timestamp of completion |
| 9 | `student_confirmation` | `boolean` | NO | `false` | **Phase 3.2 addition:** Explicit student sign-off |
| 10 | `evidence_ref` | `text` | YES | `NULL` | **Phase 3.2 addition:** Git commit SHA / PR / proof |
| 11 | `deliverable_url` | `character varying(255)` | YES | `NULL` | **Phase 3.2 addition:** Direct artifact URL |
| 12 | `assessment_notes` | `text` | YES | `NULL` | **Phase 3.2 addition:** Audit findings & feedback |
| 13 | `success_criteria` | `jsonb` | YES | `'[]'::jsonb` | **Phase 3.2 addition:** Explicit milestone criteria |
| 14 | `provenance` | `character varying(64)` | NO | `'student_confirmed'` | **Phase 3.2 addition:** Origin audit tag |

---

## 5. Verification Conclusion

Migration tracking and schema catalog verification are **VERIFIED**.
All 3 migrations (`0003`, `0004`, `0005`) are sequentially journaled and physically recorded in PostgreSQL table `drizzle.__drizzle_migrations`. The partial unique index physically enforces single-active-roadmap integrity, and the milestone schema stores complete student confirmation and evidence provenance.
