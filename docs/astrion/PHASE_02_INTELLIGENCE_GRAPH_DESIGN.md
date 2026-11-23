# ASTRION — PHASE 2: STUDENT INTELLIGENCE GRAPH DESIGN
## MentorMaze by AI Tathastu
**System:** Student Intelligence Graph & Permission-Aware Context Layer  
**Phase:** 2 of 12 — Architecture & Domain Model Specification  
**Status:** IMPLEMENTED & VERIFIED  
**Date:** 2026-11-19  

---

## 1. Executive Overview

The **Student Intelligence Graph** is the foundational domain model powering personalized mentorship within **ASTRION CORE** and its eight specialist capabilities (SAGE, CIPHER, ATLAS, FORGE, VECTRA, PRISM, ORACLE, CHRONOS). Rather than treating student information as an unstructured bag of chat messages or flat key-value pairs, the Student Intelligence Graph maintains a strongly-typed, relational, evidence-backed representation of each student's evolving academic, technical, and professional journey.

### 1.1 Core Design Tenets
1. **Zero Hallucination of Capability**: A student's skill mastery or achievement is never elevated without concrete evidence. Asking a question never artificially increments mastery scores.
2. **Explicit Evidence Provenance**: Every attribute in the graph is anchored to an evidence record specifying its classification, origin system, confidence score, and timestamp.
3. **Deterministic Conflict Resolution**: When multiple sources provide conflicting information regarding student competency, an explicit precedence hierarchy determines the authoritative state.
4. **Student Agency & Correction Rights**: System-inferred hypotheses can be explicitly challenged, corrected, or overridden by the student, promoting transparency and trust.
5. **Multi-Tenant Privacy**: Strict ownership boundaries prevent cross-student leakage. Student B cannot view, query, or infer Student A's graph state.

---

## 2. Graph Entity Node Taxonomy

The Student Intelligence Graph unifies five foundational entity categories into a coherent schema:

```
+-------------------------------------------------------------------------+
|                        STUDENT INTELLIGENCE GRAPH                       |
+-------------------------------------------------------------------------+
       |                     |                     |               |
       v                     v                     v               v
+--------------+     +---------------+     +---------------+     +--------------+
| 1. Student   |     | 2. Skills &   |     | 3. Projects & |     | 4. Career    |
|    Identity  |     | Competencies  |     | Experience    |     | Intelligence |
+--------------+     +---------------+     +---------------+     +--------------+
       |                     |                     |               |
       |                     v                     |               |
       |             +---------------+             |               |
       +------------>| 5. Evidence & |<------------+---------------+
                     | Provenance    |
                     +---------------+
```

### 2.1 Student Identity & Academic Profile
- **`studentUserId`**: Canonical UUID referencing the platform identity.
- **`displayName` & `email`**: Sanitized student identifiers.
- **`institution`**: Formal academic institution (e.g., LPU, Thapar Institute).
- **`degree` & `graduationYear`**: Degree program (e.g., B.Tech CSE, B.Tech AI/Data Science) and expected graduation year.
- **`preferredLanguage`**: Instruction language preference (e.g., `"en"`, `"hinglish"`).

### 2.2 Skills & Competencies (`SkillNodeWithEvidence`)
- **`skillId`**: Normalized identifier (e.g., `dynamic_programming`, `distributed_systems`).
- **`skillName`**: Canonical human-readable title.
- **`category`**: Domain classification (`"Programming"`, `"DSA"`, `"System Design"`, `"AI & ML"`, `"Backend"`, `"Frontend"`).
- **`masteryState`**: Pedagogical state (`"introduced"`, `"developing"`, `"demonstrated"`, `"mastered"`).
- **`masteryScore`**: Continuous rubric score from `0.0` to `10.0`.
- **`confidence`**: Statistical confidence between `0.0` and `1.0`.
- **`knownWeaknesses`**: Specific demonstrated failure modes (e.g., 0/1 Knapsack state optimization).
- **`commonMisconceptions`**: Documented conceptual misunderstandings.
- **`prerequisites`**: Dependency DAG of prerequisite skills.
- **`evidenceType`**: Current binding evidence classification.

### 2.3 Projects & Experience (`StudentProjectRecord`)
- **`id` & `studentUserId`**: Unique project identifier and student association.
- **`title` & `description`**: Verified project title and architecture overview.
- **`role`**: Specific responsibilities (e.g., Lead Fullstack Architect, Data Science Intern).
- **`technologies`**: Array of verified technology stacks.
- **`outcomes`**: Measurable technical outcomes (e.g., p95 latency reduction, cross-validation metrics).
- **`repositoryUrl` & `liveUrl`**: Verified external repository and production URLs.
- **`sourceSystem`**: Origin ecosystem (`"MentorMaze"`, `"Collaborate"`, `"Avsar"`, `"IRIS"`).
- **`verificationStatus`**: `"self_reported"`, `"verified"`, or `"inferred"`.

### 2.4 Career Intelligence & Milestone Roadmap (`CareerIntelligenceProfile`)
- **`targetRole`**: Professional career target (e.g., SDE-1, Associate AI Engineer).
- **`currentLevel`**: Academic standing (e.g., Final Year Undergraduate).
- **`identifiedSkillGaps`**: Curated gap analysis against target role industry rubrics.
- **`targetTimelineWeeks`**: Target preparation horizon.
- **`progressPct`**: Real milestone completion percentage.
- **`activeMilestones`**: Sequential roadmap milestones (`weekNumber`, `title`, `status`).

---

## 3. Evidence and Provenance Model

Every skill assertion, strength, weakness, and project milestone is backed by an evidence classification:

### 3.1 Six Canonical Evidence Classifications

| Classification | Precedence Weight | Description | Examples |
|---|:---:|---|---|
| `independently_verified` | **1.0** | Rigorously validated by a standardized platform assessment or proctored exam. | MentorMaze Placement Exam score, FAANG Technical Audit. |
| `assessed` | **0.9** | Evaluated and graded by an authorized human mentor during a live session. | Priya Sharma Technical Mock Interview scorecard. |
| `project_demonstrated` | **0.8** | Concretely proven through inspectable, functional code in a verified repository. | Rate Limiter cluster repository with Lua scripts and test benchmarks. |
| `self_reported` | **0.7** | Directly declared by the student on their profile or during an onboarding survey. | Self-declared interest in React hooks or vector databases. |
| `extracted` | **0.6** | Programmatically extracted from an uploaded artifact (resume, transcript, certificate). | Parsed skills from uploaded PDF resume. |
| `inferred` | **0.4** | Heuristically derived by ASTRION Core through conversation pattern analysis. | Inferred gap from repeated clarification questions on DP. |

### 3.2 Precedence Hierarchy & Conflict Resolution Algorithm

When new evidence is submitted for an existing skill node:
1. **Validation Rule**: An `independently_verified` claim cannot be backed by a `system_inferred` source. Attempting this triggers an immediate `VALIDATION_ERROR`.
2. **Downgrade Defense**: Incoming evidence with a weight strictly lower than the existing evidence's weight **CANNOT overwrite** the existing evidence classification or reduce confidence.
3. **Upgrade Rule**: Incoming evidence with a weight strictly greater than the existing evidence's weight **promotes** the evidence classification, updates the evidence source, and recalibrates the mastery score.
4. **Equal Precedence**: If weights are equal, the record with higher confidence or more recent timestamp is retained.

```typescript
const incomingWeight = EVIDENCE_PRECEDENCE_WEIGHTS[evidenceType];
const existingWeight = EVIDENCE_PRECEDENCE_WEIGHTS[existingSkill.evidenceType];

if (incomingWeight > existingWeight) {
  // Promote evidence classification and update source
  existingSkill.evidenceType = evidenceType;
  existingSkill.evidenceSource = evidenceSource;
  existingSkill.isIndependentlyVerified = evidenceType === "independently_verified";
  existingSkill.confidence = Math.max(existingSkill.confidence, confidence);
} else {
  // Retain higher-precedence existing record without downgrading
}
```

### 3.3 Student Correction Overrides

Students have sovereign rights over system inferences. If ASTRION Core generates an unverified hypothesis (e.g., *"Student may struggle with greedy heuristics"*), the student can issue a direct correction via `applyStudentCorrection`:
1. The contested hypothesis is immediately removed from `systemHypotheses`.
2. The student's correction is recorded into `confirmedWeaknesses` or `confirmedStrengths` with `self_reported` provenance.
3. A persistent audit trail record is generated in `student_intelligence_evidence` with `source_system = 'Student Correction'`.

---

## 4. Database Schema & Persistence Layer

The Student Intelligence Graph is backed by PostgreSQL via Drizzle ORM and PGlite:

```sql
-- 1. Student Projects Table
CREATE TABLE IF NOT EXISTS "student_projects" (
  "id" text PRIMARY KEY NOT NULL,
  "student_user_id" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "role" text NOT NULL,
  "technologies" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "outcomes" text NOT NULL,
  "repository_url" text,
  "live_url" text,
  "source_system" text DEFAULT 'MentorMaze' NOT NULL,
  "verification_status" text DEFAULT 'self_reported' NOT NULL,
  "evidence_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Student Intelligence Evidence Table
CREATE TABLE IF NOT EXISTS "student_intelligence_evidence" (
  "id" text PRIMARY KEY NOT NULL,
  "student_user_id" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "classification" text NOT NULL,
  "source_type" text NOT NULL,
  "source_system" text NOT NULL,
  "confidence" real NOT NULL,
  "raw_evidence" jsonb,
  "verified_by" text,
  "verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Student Purpose Consents Table
CREATE TABLE IF NOT EXISTS "student_purpose_consents" (
  "id" text PRIMARY KEY NOT NULL,
  "student_user_id" text NOT NULL,
  "purpose" text NOT NULL,
  "is_granted" boolean NOT NULL,
  "consent_version" text DEFAULT '1.0' NOT NULL,
  "audit_notes" text,
  "granted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
```

### 4.1 Indexing & Query Optimizations
- `student_projects(student_user_id)`: High-performance single-student project lookups.
- `student_intelligence_evidence(student_user_id, entity_type, entity_id)`: Compound index for rapid entity provenance audits.
- `student_purpose_consents(student_user_id, purpose)`: Unique constraint and index guaranteeing fast, isolated permission checks.
