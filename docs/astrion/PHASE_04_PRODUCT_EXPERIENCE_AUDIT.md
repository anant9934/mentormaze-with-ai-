# PHASE 4: Mandatory System & Product Experience Audit

**Platform:** MentorMaze by AI Tathastu (`mentormaze.aitathastu.com`)  
**AI System:** ASTRION — Adaptive Strategic Intelligence & Reasoning Network  
**Workspace:** `/ai-mentor`  
**Phase:** 4 — Personal AI Mentorship Experience & Continuous Student Guidance  
**Date:** 2026-11-23  
**Status:** `AUDIT COMPLETE`

---

## 1. Runtime Environment & Dependency Verification

As mandated, dependencies were inspected directly from `package.json`, the lockfile, and the active runtime environment:

| Package | `package.json` Specification | Resolved Lockfile Version | Runtime Log Reported Version | Verification Verdict |
|:---|:---:|:---:|:---:|:---:|
| `next` | `^14.2.18` | `14.2.35` | `14.2.35` (Ready in 2.4s) | **VERIFIED: Exact match; no upgrade permitted** |
| `react` | `^18.3.1` | `18.3.1` | `18.3.1` | **VERIFIED** |
| `react-dom` | `^18.3.1` | `18.3.1` | `18.3.1` | **VERIFIED** |
| `drizzle-orm` | `^0.36.4` | `0.36.4` | `0.36.4` | **VERIFIED** |
| `@electric-sql/pglite` | `^0.5.16` | `0.5.16` | `0.5.16` | **VERIFIED** |
| `tailwindcss` | `^3.4.15` | `3.4.15` | `3.4.15` | **VERIFIED** |
| `vitest` | `^2.1.5` | `2.1.9` | `2.1.9` | **VERIFIED** |

*Policy adherence note:* Dependencies remain locked to their exact specified versions. No package upgrades or breaking changes are introduced.

---

## 2. Existing System Inventory & Component Mapping

### 2.1 Backend Services & Data Repositories

| Subsystem | Core File | Key Responsibilities | Phase 4 Readiness |
|:---|:---|:---|:---:|
| **Orchestrator** | `lib/ai-mentor/orchestrator.ts` | Central orchestrator `AIMentorOrchestrator.processTurn`; routes specialist intents, synthesizes assessment, binds active goal & roadmap, handles streaming SSE | **Ready** |
| **Goal Service** | `lib/ai-mentor/goals/student-goal-service.ts` | CRUD, atomic primary prioritization, state machine (active, paused, completed, abandoned, restored), personalized workload conflict detection | **Ready** |
| **Roadmap Planner** | `lib/ai-mentor/roadmap/personalized-roadmap-service.ts` | Milestone generation, milestone progression (`markMilestoneProgress`), timeline adaptation (`adaptRoadmap`), idempotency, evidence retention | **Ready** |
| **Assessment Engine** | `lib/ai-mentor/assessment/personalized-assessment-service.ts` | 5-tier evidence grading (T1 Confirmed, T2 Verified, T3 Self-reported, T4 Inferred, T5 Unknown), gap remediation, zero fabrication | **Ready** |
| **Permission Context** | `lib/ai-mentor/permission-aware-context-builder.ts` | Builds scoped, consent-checked context (memory, personalization, goal tracking, mentor sharing) | **Ready** |
| **Student Consent** | `lib/ai-mentor/student-consent-service.ts` | Purpose-based consent registry (`service_personalization`, `student_memory`, `mentor_sharing`, `analytics`) | **Ready** |
| **Model Router** | `lib/ai-mentor/model-provider-router.ts` | Local 2B inference daemon vs Gemini 2.0 Flash vs deterministic pedagogical fallback | **Ready** |
| **PostgreSQL Schema** | `lib/db/ai-mentor-schema.ts` | `ai_mentor_goals`, `ai_mentor_roadmaps` (with partial unique index `idx_one_active_roadmap_per_goal`), `ai_mentor_roadmap_milestones` (14 columns) | **Ready** |

### 2.2 API Route Inventory

| Route | Method(s) | Auth Boundary | Status |
|:---|:---:|:---:|:---:|
| `/api/ai-mentor` | GET, POST | `resolveAuthenticatedUser` (Strict 401 if unauthenticated) | **Hardened (Phase 3.2)** |
| `/api/ai-mentor/goals` | GET, POST | `resolveAuthenticatedUser` (Strict 401 unauth, 403 cross-tenant) | **Hardened (Phase 3.2)** |
| `/api/ai-mentor/roadmaps` | GET, POST | `resolveAuthenticatedUser` (Strict 401 unauth, 403 cross-tenant) | **Hardened (Phase 3.2)** |
| `/api/ai-mentor/memory` | GET, POST, DELETE | `resolveAuthenticatedUser` (Strict session check) | **Hardened (Phase 3.2)** |
| `/api/ai-mentor/conversations` | GET, POST | `resolveAuthenticatedUser` (Strict session check) | **Hardened (Phase 3.2)** |
| `/api/ai-mentor/conversations/[id]` | GET, PATCH, DELETE | `resolveAuthenticatedUser` (Strict session check) | **Hardened (Phase 3.2)** |
| `/api/ai-mentor/skills` | GET | `resolveAuthenticatedUser` (Strict session check) | **Hardened (Phase 3.2)** |

### 2.3 Existing UI Components & Gap Analysis

| Component | Current State | Phase 4 Gap & Required Enhancement |
|:---|:---|:---|
| `components/ai-mentor/ai-mentor-shell.tsx` | Main workspace shell; manages navigation sections, conversation history, model status modal | Add direct state bindings for active goal, roadmap, check-in dialog, and human mentor handoff |
| `components/ai-mentor/ai-mentor-home.tsx` | Shows generic "What should we build or learn today?" and chips | **Major Gap:** Needs complete transformation into the Student Mentorship Home: (A) Context-aware Welcome, (B) Current Primary Goal, (C) Real Progress Overview, (D) "Your next step" primary action, (E) Direct conversational prompt |
| `components/ai-mentor/ai-mentor-conversation.tsx` | Chat stream with milestone progress, assessment cards, and confirmation trigger | Add seamless execution hooks for milestone actions and check-in dialogues |
| `components/ai-mentor/ai-mentor-progress.tsx` | Contains static, hardcoded mock milestones and dummy metrics | **Major Gap:** Replace with dynamic `AIMentorRoadmapWorkspace` bound to `/api/ai-mentor/roadmaps` and real milestone progression |
| `components/ai-mentor/ai-mentor-personalization.tsx` | Contains local dummy forms for experience level and role | **Major Gap:** Connect to real `/api/ai-mentor/goals` CRUD, priority switching, and check-in preferences |
| `components/ai-mentor/ai-mentor-sidebar.tsx` | Sidebar with conversation grouping and navigation items | Ensure all Phase 4 navigation targets (Home, Roadmaps, Goals, Assessment) route seamlessly |

---

## 3. Experience Mapping Table

| Required Student Experience | Backend Service / Method | API Route | Frontend Component / View |
|:---|:---|:---|:---|
| **1. Mentorship Home & State at a Glance** | `StudentGoalService.getActivePrimaryGoal`<br>`PersonalizedRoadmapService.getRoadmapByGoalId` | `GET /api/ai-mentor/goals`<br>`GET /api/ai-mentor/roadmaps` | `AIMentorHome`<br>(Context greeting, active goal, real progress, next step) |
| **2. Goal Management (Create/Edit/Prioritize/Pause/Complete)** | `StudentGoalService.createGoal`<br>`setGoalPriority`<br>`pauseGoal`<br>`resumeGoal`<br>`completeGoal` | `POST /api/ai-mentor/goals`<br>(actions: create, update, set_priority, pause, resume, complete) | `AIMentorGoalsManager`<br>(Conversational goal creator, priority switcher, state tabs) |
| **3. Evidence-Backed 5-Tier Assessment** | `PersonalizedAssessmentService.assessCurrentState` | `POST /api/ai-mentor`<br>`GET /api/ai-mentor/goals?conflicts=true` | `AIMentorAssessmentView`<br>(5 evidence tiers, gaps, uncertainty, student corrections) |
| **4. Structured Roadmap & Milestone Workflow** | `PersonalizedRoadmapService.getRoadmapByGoalId`<br>`markMilestoneProgress`<br>`adaptRoadmap` | `GET /api/ai-mentor/roadmaps`<br>`POST /api/ai-mentor/roadmaps`<br>(actions: mark_progress, adapt) | `AIMentorRoadmapWorkspace`<br>(Milestone cards, deliverable submission, review, adaptation) |
| **5. Persistent Conversation & Continuity** | `PermissionAwareContextBuilder.buildContext`<br>`ConversationStore` | `POST /api/ai-mentor`<br>`GET /api/ai-mentor/conversations/[id]` | `AIMentorConversation`<br>(Maintains active goal context, milestone updates, SSE streaming) |
| **6. Daily Mentorship & In-Session Check-Ins** | `StudentMemoryService`<br>`StudentGoalService.detectGoalConflicts` | `POST /api/ai-mentor/memory`<br>`POST /api/ai-mentor` | `AIMentorCheckInModal`<br>(In-session progress prompt, time adjustment, opt-in preferences) |
| **7. Human Mentor Consultation Handoff** | `HumanEscalationService`<br>`StudentConsentService` | `POST /api/ai-mentor`<br>`/api/mentors` | `AIMentorHandoffCard`<br>(Transparent pre-handoff context preview and explicit consent) |

---

## 4. Architectural Rules for Phase 4 Implementation

1. **Zero Split Personas:** ASTRION remains the sole unified mentor. No public specialist chatbots are created.
2. **Deterministic Calculation vs. LLM Mentorship:** Milestone progress counts, goal ownership, and roadmap constraints are executed strictly by deterministic TypeScript/SQL code. LLM is reserved for mentorship dialogue and explanations.
3. **No Phantom State:** Every milestone progress check, goal priority change, and check-in preference must be persisted to the PostgreSQL database or authorized session store. Refreshing the browser must accurately restore state.
4. **Transparent 5-Tier Evidence:** Inferred skills must never be reported as verified; unconfirmed claims are labeled clearly with clarifying questions.
5. **No Model Fine-Tuning:** All inference uses either existing fine-tuned 2B checkpoint, Gemini 2.0 Flash, or deterministic fallback. `task-8048` remains untouched.

---

## 5. Audit Conclusion

The system audit is **COMPLETE**. All prerequisite schemas, migrations, services, and APIs are present and hardened. Phase 4 will now build the complete, continuous student mentorship experience on top of these verified foundations.
