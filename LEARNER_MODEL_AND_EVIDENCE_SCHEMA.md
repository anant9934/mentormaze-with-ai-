# ASTRION Evidence-Backed Learner Model & Evidence Schema Specification

**Platform:** MentorMaze by AI Tathastu (`https://mentormaze.aitathastu.com`)  
**Specification Code:** `SPEC-ASTRION-LM-001`  
**Document Version:** 1.0.0 — Production Standard  

---

## 1. Canonical Learner Model Overview

The ASTRION Learner Model is the authoritative, evidence-grounded representation of a student's objectives, competencies, learning preferences, and progress. It extends MentorMaze's `StudentIntelligenceGraph`, `StudentMemoryService`, `StudentGoalService`, and `PermissionAwareContextBuilder`.

```
+---------------------------------------------------------------------------------------------------+
|                                     CANONICAL LEARNER MODEL                                       |
+---------------------------------+---------------------------------+-------------------------------+
|       STUDENT OBJECTIVES        |           SKILL GRAPH           |     LEARNING PREFERENCES      |
| - Career Target Roles           | - 0 to 5 Canonical Mastery      | - Language (en, hi, hinglish) |
| - Short-Term Learning Goals     | - 4-10 Subskills per Domain     | - Explanation Detail (1-3)    |
| - Mentorship Objectives         | - Prerequisite Graph Traversal  | - Format (socratic, visual)   |
| - Project Deliverables          | - BKT Knowledge Probability     | - Time Availability (hrs/wk)  |
| - Deadlines & Weekly Limits     | - FSRS Retrievability State     | - Active Misconceptions       |
+---------------------------------+---------------------------------+-------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 STRICT EVIDENCE PROVENANCE LEDGER                                 |
|                                                                                                   |
|  1. student_reported       [0.70 weight]  Self-stated claims, goals, preferences                 |
|  2. assessment_verified    [0.90 weight]  Structured platform quizzes, code submissions           |
|  3. independently_verified [1.00 weight]  External certs, validated contest scores, audits       |
|  4. project_demonstrated   [0.85 weight]  Verified repository commits, deployed web apps          |
|  5. mentor_recorded        [0.95 weight]  Feedback & milestone notes from 1-on-1 human mentors    |
|  6. transcript_extracted   [0.75 weight]  Extracted dialogue evidence from verified sessions      |
|  7. ai_inferred            [0.40 weight]  Heuristic observations (NEVER promoted to fact by score)|
|  8. external_ecosystem     [0.85 weight]  Synced records from AI Tathastu Central                 |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Canonical 0–5 Mastery Scale

ASTRION enforces a single canonical 0–5 mastery scale across all database tables, algorithms, and student-facing interfaces. Contradictory mastery scales are forbidden.

| Level | Designation | Operational Definition | Minimum Verification Requirements |
|---|---|---|---|
| **0** | **Unaware** | Concept is completely unencountered or unknown to the student. | Baseline unassessed state. |
| **1** | **Familiar** | Student recognizes terminology and core definitions but cannot explain mechanism. | 1 self-reported claim or diagnostic question recall. |
| **2** | **Comprehending** | Student can follow a guided conceptual explanation and identify main principles. | 1 assessment check or guided walkthrough success. |
| **3** | **Assisted Solver** | Student can solve standard exercises when provided with progressive hints or scaffolded templates. | At least 1 hint-assisted problem solve or quiz passage. |
| **4** | **Independent Solver** | Student solves novel, unassisted problems accurately within standard time bounds. | **At least 2 independent checks** (e.g. unassisted code execution + delayed retrieval check). |
| **5** | **Master & Instructor** | Student can explain edge cases, teach the concept, evaluate tradeoffs, and transfer knowledge to unfamiliar domains. | At least 2 independent checks, including a transfer challenge and edge-case defense or peer explanation. |

### Evidence-Based Promotion Rules
1. **No Conversational Agreement:** A student saying *"I know this already"* or an LLM remarking *"Student seems proficient"* does **not** advance mastery to Level 4 or 5.
2. **Dual-Check Requirement for Mastery:** Promotion to Level 4 or 5 requires at least **two independent pieces of evidence**, where at least one is:
   - An unprompted delayed recall quiz.
   - An automated test-suite verified code execution.
   - A transfer problem where the concept is embedded in an unfamiliar context.
3. **Decay & Reassessment:** If a skill's FSRS retrievability drops below 0.65 or an assessment shows regression, the skill transitions to `needs_reassessment` until reinforced.

---

## 3. Strict Evidence Provenance & Anti-Hallucination Invariants

Every piece of learner data recorded in `student_intelligence_evidence` must preserve:
- `id`: Globally unique evidence identifier.
- `studentUserId`: Authenticated student ID.
- `entityType`: `'skill' | 'project' | 'goal' | 'preference' | 'misconception' | 'fact'`.
- `entityId`: Specific identifier of the skill or goal.
- `provenance`: One of the 8 canonical provenance tiers.
- `sourceSystem`: System generating the record (`MentorMaze`, `AITathastu`, `HumanMentor`, `CodeJudge`).
- `sourceReference`: Link, commit hash, booking ID, or session reference.
- `confidence`: Numeric score between 0.0 and 1.0.
- `verificationStatus`: `'unverified' | 'student_confirmed' | 'mentor_verified' | 'independently_verified' | 'rejected'`.
- `consentPurpose`: Active purpose under which evidence was gathered (`service_personalization`).
- `observedAt`: ISO timestamp of observation.
- `expiresAt`: Optional TTL for transient evidence.

### The Invariant Promotion Rule
> **RULE:** An `ai_inferred` observation must **never** become an `independently_verified` or `confirmed` fact simply because its confidence score is high (e.g., `confidence >= 0.95`).
> 
> Confirmation requires:
> - Explicit student validation (`student_confirmed`), OR
> - Verified human mentor sign-off (`mentor_verified`), OR
> - Verified automated test execution / external certificate (`independently_verified`).

---

## 4. TypeScript Interface Definitions

```typescript
export type CanonicalMasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type LearnerEvidenceProvenance =
  | "student_reported"
  | "assessment_verified"
  | "independently_verified"
  | "project_demonstrated"
  | "mentor_recorded"
  | "transcript_extracted"
  | "ai_inferred"
  | "external_ecosystem";

export type EvidenceVerificationStatus =
  | "unverified"
  | "student_confirmed"
  | "mentor_verified"
  | "independently_verified"
  | "rejected";

export interface CanonicalSkillNode {
  skillId: string;
  skillName: string;
  category: string;
  subskills: string[];
  prerequisites: string[];
  masteryLevel: CanonicalMasteryLevel;
  masteryScore: number; // 0.0 to 10.0
  bktKnowledgeProb: number; // 0.0 to 1.0
  fsrsStability: number;
  fsrsDifficulty: number;
  fsrsRetrievability: number;
  confidence: number;
  evidenceCount: number;
  lastAssessedAt?: string;
  nextReviewAt?: string;
  knownWeaknesses: string[];
  commonMisconceptions: string[];
  verificationStatus: EvidenceVerificationStatus;
  primaryProvenance: LearnerEvidenceProvenance;
}

export interface StudentLearnerModel {
  studentUserId: string;
  displayName: string;
  email: string;
  academicProfile?: {
    institution?: string;
    degree?: string;
    graduationYear?: number;
    currentLevel?: string;
  };
  objectives: {
    targetRole?: string;
    activeGoals: string[];
    deadlines: Record<string, string>;
    availableWeeklyHours: number;
  };
  skills: Map<string, CanonicalSkillNode>;
  preferences: {
    language: "en" | "hi" | "hinglish";
    explanationDetail: "concise" | "balanced" | "in_depth";
    teachingFormat: "socratic" | "worked_example" | "guided_practice";
    learningConstraints: string[];
    studentCorrections: string[];
  };
  evidenceLedger: LearnerEvidenceRecord[];
  lastUpdatedAt: string;
}
```

---

## 5. Security & Multi-Tenant Isolation

1. **Authentication:** All learner model queries and mutations require verified session authentication via `getServerSession(req)`.
2. **Authorization:** Non-admin/non-mentor users can **only** access their own learner model. Any access where `requestingUserId !== studentUserId` throws `403_FORBIDDEN`.
3. **No Query Bypass:** Client-supplied query parameters (e.g., `?userId=xxx`) cannot override the server session.
4. **GDPR / DPDP Compliance:** Students can query, update, or purge any memory or self-reported evidence item directly through `/api/ai-mentor/memory`.
