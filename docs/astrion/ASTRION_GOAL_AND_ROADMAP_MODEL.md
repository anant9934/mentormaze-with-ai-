# ASTRION Goal and Roadmap Data Models
**Platform:** MentorMaze by AI Tathastu (`mentormaze.aitathastu.com`)  
**AI Mentorship Engine:** ASTRION  
**Document:** Goal, Roadmap, Milestone & Evidence Data Specification  
**Status:** `VERIFIED`

---

## 1. Relational Database Schema (`PostgreSQL`)

The ASTRION persistence layer uses PostgreSQL via Drizzle ORM to ensure durability, strict relational integrity, and auditability.

```
+------------------------------------+
|          ai_mentor_goals           |
+------------------------------------+
| id (PK, text)                      |
| student_user_id (FK -> users.id)   |
| title (text, not null)             |
| description (text)                 |
| category (career|academic|project) |
| importance (primary|secondary|exp) |
| status (active|paused|completed)   |
| target_outcome (text)              |
| target_date (text)                 |
| current_state (in_progress|etc)    |
| success_criteria (jsonb)           |
| associated_skills (jsonb)          |
| associated_projects (jsonb)        |
| roadmap_id (text)                  |
| created_at / updated_at (timestamp)|
+------------------------------------+
                  | 1
                  |
                  | 0..1
                  v
+------------------------------------+
|        ai_mentor_roadmaps          |
+------------------------------------+
| id (PK, text)                      |
| student_user_id (text, not null)   |
| goal_id (FK -> ai_mentor_goals.id) |
| target_role (text, not null)       |
| total_weeks (integer, not null)    |
| progress_pct (integer, default 0)  |
| current_milestone_week (integer)   |
| status (active|paused|completed)   |
| adapted_reason (text)              |
| created_at / updated_at (timestamp)|
+------------------------------------+
                  | 1
                  |
                  | 1..N
                  v
+------------------------------------+
|    ai_mentor_roadmap_milestones    |
+------------------------------------+
| id (PK, text)                      |
| roadmap_id (FK -> roadmaps.id)     |
| week_number (integer, not null)    |
| title (text, not null)             |
| description (text)                 |
| skills_covered (jsonb)             |
| status (pending|in_prog|completed) |
| completed_at (timestamp)           |
| created_at (timestamp)             |
+------------------------------------+
```

---

## 2. TypeScript Domain Models

### A. Student Goal Entity (`StudentGoalRecord`)
```typescript
export type GoalCategory = "career" | "academic" | "technical" | "project" | "personal_learning";
export type GoalImportance = "primary" | "secondary" | "exploratory";
export type GoalStatus = "active" | "completed" | "paused" | "abandoned";
export type GoalCurrentState = "not_started" | "in_progress" | "blocked" | "achieved";

export interface StudentGoalRecord {
  id: string;
  studentUserId: string;
  title: string;
  description: string;
  category: GoalCategory;
  importance: GoalImportance;
  status: GoalStatus;
  targetOutcome: string;
  targetDate?: string;
  currentState: GoalCurrentState;
  successCriteria: string[];
  associatedSkills: string[];
  associatedProjects: string[];
  roadmapId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### B. Personalized Roadmap Entity (`PersonalizedRoadmapRecord`)
```typescript
export interface PersonalizedMilestone {
  id: string;
  roadmapId: string;
  weekNumber: number;
  phase: string;
  title: string;
  description: string;
  requiredSkills: string[];
  prerequisites: string[];
  learningActivities: string[];
  practicalProjects: string[];
  estimatedEffortHours: number;
  successCriteria: string[];
  dependencies: number[]; // Prior week numbers
  status: "pending" | "in_progress" | "completed";
  completedAt?: string;
  reviewPoints: string[];
}

export interface PersonalizedRoadmapRecord {
  id: string;
  studentUserId: string;
  goalId?: string;
  targetRole: string;
  startingReadinessScore: number;
  totalWeeks: number;
  totalEffortHours: number;
  currentMilestoneWeek: number;
  milestones: PersonalizedMilestone[];
  status: "active" | "paused" | "completed";
  adaptedReason?: string;
  adaptationHistory?: { timestamp: string; reason: string; changes?: any }[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. Five-Tier Evidence Classification Model

ASTRION strictly prohibits LLM hallucination of student skills. Evidence is evaluated across five deterministic confidence tiers:

| Tier | Classification | Evidence Source | Confidence Weight | Action upon Assessment |
|---|---|---|---|---|
| **Tier 1** | `confirmed_evidence` | Code review verification, timed DSA quiz, verified repo commit | 1.00 | Mark as Verified Strength. Skip elementary tutorials. |
| **Tier 2** | `student_reported` | Profile claim, verbal declaration in chat, self-rating | 0.60 | Note as self-reported; formulate lightweight check before advancing. |
| **Tier 3** | `extracted` | Resume extraction, LinkedIn parse, uploaded transcript | 0.75 | Cross-reference with technical interview or code sample. |
| **Tier 4** | `system_inferred` | Inferred from related mastered competencies (e.g. C++ implies memory awareness) | 0.40 | Verify with targeted conceptual question. |
| **Tier 5** | `unknown_missing` | Zero data in intelligence graph | 0.00 | **Do not guess**. Formulate focused clarifying questions. |

---

## 4. State Machines and Validation Rules

### A. Goal Lifecycle State Machine
```
   [ not_started ]
          |
          | Student sets target / initiates session
          v
   [  in_progress  ] <-------------------+
     |           |                       |
     |           | Student pauses        | Student resumes
     |           v                       |
     |     [   paused   ] ---------------+
     |
     | All roadmap deliverables confirmed
     v
   [   achieved   ] (status: completed)
```

### B. Multi-Goal Priority Invariant
- A student can have multiple goals in parallel, but **only ONE active goal may be designated as `primary`**.
- When `StudentGoalService.setGoalPriority(userId, goalId, "primary")` is executed, any existing active primary goal is automatically demoted to `secondary` to maintain cognitive focus and avoid divided capacity.
- `StudentGoalService.detectGoalConflicts(userId)` continuously scans for divergent skill trees (e.g., Deep Learning vs Low-Level Systems) and surfaces explicit trade-off explanations to guide the student's study allocation.
