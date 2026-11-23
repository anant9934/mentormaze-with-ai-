# ASTRION PHASE 2.1 — GRAPH PERSISTENCE & EVIDENCE PRECEDENCE AUDIT
## Durable SQL Storage, DAG Prerequisites & Immutable Audit Provenance

**Product:** MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)  
**System:** ASTRION CORE  
**Phase:** 2.1 Gap Closure & Verification  
**Auditor:** Principal AI Architect & Data Systems Engineer  
**Status:** FULLY VERIFIED — GENUINE SQL PERSISTENCE & AUDIT TRAIL CONFIRMED

---

## 1. Executive Summary

Phase 2.1 conducted an audit of the Student Intelligence Graph and Student Skill Graph to ensure genuine SQL persistence rather than in-memory mocks. The audit revealed that while Phase 2 created database table definitions, `StudentIntelligenceGraph.buildGraphFromPersistence` and `StudentSkillGraph` were relying primarily on hardcoded JavaScript seed objects and in-memory Maps.

In Phase 2.1, full database integration was completed and verified:
1. All graph entities (`student_learning_profiles`, `student_skill_nodes`, `student_projects`, `ai_mentor_roadmaps`, `ai_mentor_roadmap_milestones`, `student_skill_dependencies`, `student_intelligence_evidence`) are actively read from and written to SQL.
2. Ten non-destructive column additions were executed and captured in migration `0002_black_la_nuit.sql`.
3. Precedence hierarchy was enforced: `independently_verified (1.0) > assessed (0.9) > project_demonstrated (0.8) > self_reported (0.7) > extracted (0.6) > inferred (0.4)`.
4. Immutable audit trail preservation was established: contradictory and historical evidence records are never deleted from SQL table `student_intelligence_evidence`.
5. Cache clearing tests proved that resetting in-memory caches re-queries SQL and reconstructs identical student intelligence graphs.

---

## 2. Database Schema Reconciliation & Migration Artifacts

The following schema updates were applied to `lib/db/ai-mentor-schema.ts` and generated in Drizzle migration `lib/db/migrations/0002_black_la_nuit.sql`:

### 1. `student_learning_profiles` Enhancements
- `institution`: varchar(255)
- `degree`: varchar(255)
- `confirmed_strengths`: jsonb default `[]`
- `confirmed_weaknesses`: jsonb default `[]`
- `system_hypotheses`: jsonb default `[]`
- `learning_goals`: jsonb default `[]`

### 2. `student_skill_nodes` Enhancements
- `evidence_type`: varchar(32) default `'self_reported'`
- `is_independently_verified`: boolean default `false`
- `evidence_source`: text
- `evidence_id`: varchar(64)

### Idempotent Database Initialization (`lib/db/index.ts`)
`initializeDatabaseSchema()` was updated with idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements to ensure compatibility across local PGlite and cloud PostgreSQL instances without failing on repeated migrations.

---

## 3. SQL-Persistent Architecture

### 3.1 `StudentIntelligenceGraph` Implementation
- `buildGraphFromPersistence(studentUserId)`:
  - Queries `student_learning_profiles` from SQL; if absent, seeds the baseline row into SQL.
  - Queries `student_skill_nodes` from SQL; if absent, seeds default skills into SQL.
  - Queries `student_projects` from SQL; if absent, seeds verified projects into SQL.
  - Queries `ai_mentor_roadmaps` and `ai_mentor_roadmap_milestones` from SQL; if absent, seeds roadmaps into SQL.
  - Queries `student_intelligence_evidence` to evaluate active evidence and filter revoked/expired entries.
- `recordEvidence(studentUserId, entityType, entityId, evidenceType, ...)`:
  - Writes a durable audit record into `student_intelligence_evidence` (never overwriting previous rows).
  - Evaluates precedence weight against current skill state.
  - If incoming evidence qualifies, updates `student_skill_nodes` in SQL with updated `evidenceType`, `confidence`, `isIndependentlyVerified`, and timestamps.
- `revokeEvidence(studentUserId, evidenceId)`:
  - Sets `revoked_at = NOW()` on the target evidence row in SQL.
  - Invalidates in-memory graph cache, causing subsequent queries to recalculate active evidence.
- `applyStudentCorrection(studentUserId, category, targetItem, correctionText)`:
  - Writes an explicit correction audit row into `student_intelligence_evidence` (`sourceType = 'student_reported'`, `confidence = 1.0`).
  - Updates `confirmed_weaknesses`, `confirmed_strengths`, and `system_hypotheses` in `student_learning_profiles` in SQL.

### 3.2 `StudentSkillGraph` Implementation
- `seedPrerequisitesToSql()`: Seeds the complete canonical DAG prerequisite relationships into SQL table `student_skill_dependencies`.
- `getStudentSkillsAsync(studentUserId)`: Queries `student_skill_nodes` directly from SQL.
- `checkPrerequisitesAsync(studentUserId, targetSkillId)`: Queries `student_skill_dependencies` and cross-references student mastery states from SQL to report prerequisites and unfulfilled gaps.
- `recordEvidence(...)`: Asynchronously writes skill updates to `student_skill_nodes` and evaluation records to `student_skill_evidence`.

---

## 4. Evidence Precedence & Audit Trail Integrity

### 4.1 Canonical Precedence Weights

| Evidence Classification | Weight | Description | Can Be Marked `isIndependentlyVerified`? |
|---|---|---|---|
| `independently_verified` | **1.0** | Proctored exam, formal certification, external benchmark | **Yes** (Strictly requires proctored assessment) |
| `assessed` | **0.9** | Mentor evaluation, code execution assessment, mock interview | No |
| `project_demonstrated` | **0.8** | Production repository, deployed application, verified commit | No |
| `self_reported` | **0.7** | Student survey, profile declaration, sovereign correction | No |
| `extracted` | **0.6** | Parsed from resume, transcript, external platform scrape | No |
| `inferred` | **0.4** | Heuristic observer, chat question pattern, unverified hypothesis | No |

### 4.2 Precedence Resolution Rules
1. **Higher Overrides Lower:** When incoming evidence has a strictly higher weight (or equal weight with higher confidence), the projected skill state on `student_skill_nodes` is updated.
2. **Lower Does Not Overwrite Higher:** When incoming evidence has a lower weight, the projected state remains unchanged.
3. **Audit Trail Preservation (Append-Only):** Under no circumstances is historical or contradictory evidence deleted from `student_intelligence_evidence`. All submissions are permanently recorded with timestamps, source systems, confidence, and metadata.
4. **Revocation & Expiration Filtering:** Active graph queries strictly filter out evidence where `revoked_at IS NOT NULL` or `expires_at < NOW()`.

---

## 5. Persistence Verification Across Cache Clearing

Verification was executed via automated tests in `tests/ai-mentor-phase2-1-verification.test.ts`:

1. **Step 1 (Seed & Persist):** `studentAlice` graph was initialized, writing baseline rows to SQL tables.
2. **Step 2 (Direct SQL Audit):** Direct SQL `SELECT` queries confirmed the presence of rows in `student_learning_profiles`, `student_skill_nodes`, `student_projects`, `ai_mentor_roadmaps`, and `student_skill_dependencies`.
3. **Step 3 (Cache Purge):** `StudentIntelligenceGraph.resetCache()` and `StudentSkillGraph.resetCache()` were executed, deleting all in-memory Map entries.
4. **Step 4 (Reload from SQL):** `StudentIntelligenceGraph.getGraph(studentAlice)` was called. The graph was re-materialized from database rows, confirming identical profile data, skills, and projects.
5. **Step 5 (Precedence & Contradictions):**
   - Initial skill state: `assessed` (weight 0.9).
   - Inferred evidence (0.4) submitted: Skill remained `assessed`.
   - Independently verified evidence (1.0) submitted: Skill upgraded to `independently_verified`.
   - Self-reported evidence (0.7) submitted: Skill remained `independently_verified`.
   - Direct SQL query of `student_intelligence_evidence`: All 3 evidence submissions were found in the database.

---

## 6. Audit Verdict

**VERDICT: VERIFIED — FULL SQL PERSISTENCE CONFIRMED**
No mock in-memory substitutes. Graph data is durably stored in PostgreSQL with mathematical precedence and complete provenance retention.
