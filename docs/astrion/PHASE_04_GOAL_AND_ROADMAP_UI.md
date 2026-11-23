# MentorMaze — Phase 4: Goal Management & Personalized Roadmap UI
## Goal Operations, 5-Tier Assessment Transparency, and Roadmap Execution

**Platform:** MentorMaze by AI Tathastu  
**AI Mentor:** ASTRION (Adaptive Strategic Intelligence & Reasoning Network)  
**Workspace:** `/ai-mentor`  
**Components:**
- `components/ai-mentor/ai-mentor-goals-manager.tsx`
- `components/ai-mentor/ai-mentor-assessment-view.tsx`
- `components/ai-mentor/ai-mentor-roadmap-workspace.tsx`  
**Phase:** 4 — Personal AI Mentorship Experience & Continuous Student Guidance  
**Status:** `VERIFIED`

---

## 1. Goal Management Experience (`AIMentorGoalsManager`)

The Goal Management interface provides students with complete autonomy over their personal mentorship objectives. It connects to the hardened `/api/ai-mentor/goals` route.

### Key Capabilities & Invariants
1. **Guided Goal Creation Dialog:**
   - Prompts for Goal Title, Category (`career`, `skill`, `project`, `academic`, `certification`), Target Outcome, Target Timeline, and Importance (`primary`, `secondary`, `exploratory`).
2. **Atomic Priority Switching:**
   - When a student promotes a secondary or exploratory goal to `primary`, the system atomically demotes the previous primary goal in a single database transaction. At no point can a student have multiple active primary goals.
3. **Workload Capacity Guard:**
   - Evaluates active goals against the student's declared weekly availability. When commitments exceed capacity, ASTRION displays an advisory warning:
     > *"You have 3 active goals requiring an estimated 28 hrs/week, exceeding your declared 20 hrs/week availability. Consider pausing secondary goals."*
4. **Full Lifecycle Transitions:**
   - Supports pausing, resuming, completing, abandoning, and restoring goals with full state persistence surviving page refresh.

---

## 2. 5-Tier Transparent Assessment View (`AIMentorAssessmentView`)

ASTRION rejects opaque AI evaluations and fabricated readiness scores. The Assessment View surfaces the exact classification of evidence used by the reasoning engine across 5 distinct tiers:

| Tier | Category | Provenance Source | Student Controls |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Confirmed Evidence** | Independently verified skills via assessments, project code verification, validated test suites. | Read-only; badges show proof source and verified date. |
| **Tier 2** | **Structured Deliverables** | Concrete GitHub PRs, commits, architecture documents, submitted milestone proofs. | Clickable external links directly to proof URLs. |
| **Tier 3** | **Student-Reported Profile** | Self-reported education, career interests, declared strengths and experience levels. | **Inline correction controls:** students can edit and correct any entry immediately. |
| **Tier 4** | **System Inferences & Gaps** | Inferred knowledge gaps, weak prerequisite areas, diagnostic hypotheses. | **Practice Hooks:** "Practice" button triggers a targeted first-principles exercise in chat. |
| **Tier 5** | **Clarifying Information Requested** | Explicit missing data points where ASTRION refused to guess. | Interactive prompts inviting student clarification without assumptions. |

---

## 3. Personalized Roadmap Workspace (`AIMentorRoadmapWorkspace`)

The Roadmap Workspace transforms high-level goals into week-by-week executable milestones backed by persistent PostgreSQL records (`ai_mentor_roadmaps` and `ai_mentor_roadmap_milestones`).

### Functional Interaction Layers
1. **Goal Switcher:**
   - Students can seamlessly switch roadmaps between different active personal goals.
2. **Milestone Progress Cards:**
   - Displays milestone week number, title, phase, objectives, required skills, practical deliverables, and success criteria.
   - Status indicators: `pending`, `in_progress`, `completed`.
3. **Verified Deliverable Submission Modal:**
   - When submitting milestone progress, students provide:
     - Deliverable URL (e.g. GitHub PR, deploy link, architecture doc)
     - Evidence Reference (e.g. commit SHA, test run ID)
     - Reflection notes
   - Once submitted, the milestone is recorded with `provenance: student_confirmed` and `completedAt` timestamp.
   - The subsequent pending milestone automatically advances to `in_progress`.
4. **Resilient Schedule Adaptation Modal:**
   - When students experience life changes (e.g. exam periods, internships, reduced hours), they adjust their weekly effort slider.
   - ASTRION re-paces remaining milestones while strictly preserving completed milestones and their verified evidence.
   - Every adaptation is recorded in the roadmap's `adaptationHistory` ledger.
5. **Direct Mentorship Hook ("Ask ASTRION"):**
   - Clicking "Ask ASTRION" on any milestone immediately opens a dedicated mentorship turn focused on completing that specific milestone.
