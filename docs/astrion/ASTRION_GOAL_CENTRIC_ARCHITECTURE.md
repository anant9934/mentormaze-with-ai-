# ASTRION Goal-Centric Technical Architecture
**Platform:** MentorMaze by AI Tathastu (`mentormaze.aitathastu.com`)  
**AI Mentorship Engine:** ASTRION (Adaptive Strategic Intelligence & Reasoning Network)  
**Workspace:** `/ai-mentor`  
**Status:** `VERIFIED`

---

## 1. Executive Architectural Overview

ASTRION is the single unified personal AI mentorship intelligence powering MentorMaze. Unlike fragmented chatbots or isolated specialist personas, ASTRION operates as one cohesive mentor with central governance, dynamic internal multi-agent coordination, and a closed-loop goal-centric mentorship lifecycle.

The system places the student's authentic goals and evidence-backed growth at the core of all operations:

```
                            +-----------------------------------------------+
                            |                 STUDENT / USER                |
                            +-----------------------------------------------+
                                                    |
                                                    v
                            +-----------------------------------------------+
                            |         AUTHORIZED STUDENT CONTEXT            |
                            |  - Academic Profile & Verified Skills         |
                            |  - 5-Tier Classified Evidence                 |
                            |  - Purpose-Specific Consent (GDPR/DPDP)        |
                            |  - Active Goals & Roadmap State               |
                            +-----------------------------------------------+
                                                    |
                                                    v
====================================================================================================
                                      ASTRION CORE ORCHESTRATOR
====================================================================================================
 [1. Safety Guardrails]   --> [2. Specialist Router]  --> [3. Goal Context Planning]
 [4. Pedagogical Engine]  --> [5. RAG Retrieval]      --> [6. Dual Model Router (Gemini/Local 2B)]
                                                    |
         +------------------------------------------+------------------------------------------+
         |                                          |                                          |
         v                                          v                                          v
+-----------------------+              +-----------------------+              +-----------------------+
|   STUDENT GOALS       |              |  5-TIER ASSESSMENT    |              |  PERSONALIZED ROADMAP |
| - Active Primary Goal |              | - Verified Strengths  |              | - 4-12 Wk Milestones  |
| - Secondary / Explore |              | - Confirmed Gaps      |              | - Deliverables & SLA  |
| - Conflict Detection  |              | - Clarifying Question |              | - Student Confirmation|
+-----------------------+              +-----------------------+              +-----------------------+
         |                                          |                                          |
         +------------------------------------------+------------------------------------------+
                                                    |
                                                    v
                            +-----------------------------------------------+
                            |       INTERNAL MULTI-AGENT SPECIALISTS        |
                            | - SAGE (Learning)     - CIPHER (Coding/DSA)   |
                            | - ATLAS (Systems)     - FORGE (Projects)      |
                            | - VECTRA (Career)     - PRISM (Resume)        |
                            | - ORACLE (Interviews) - CHRONOS (Study Plan)  |
                            +-----------------------------------------------+
                                                    |
                                                    v
                            +-----------------------------------------------+
                            |   RESPONSE SYNTHESIS & QUALITY GATE (EVAL)    |
                            | - Unified ASTRION Voice & Persona             |
                            | - Concrete Next Action Card                   |
                            | - Progress & Skill Updates                    |
                            +-----------------------------------------------+
                                                    |
                                                    v
                            +-----------------------------------------------+
                            |       PERSISTENT POSTGRESQL & UI STREAM       |
                            | - ai_mentor_goals & ai_mentor_roadmaps        |
                            | - SSE Stream (Metadata, Action, Assessment)   |
                            +-----------------------------------------------+
```

---

## 2. Component Directory & Responsibilities

| Subsystem | Module Path | Primary Responsibility |
|---|---|---|
| **ASTRION CORE Orchestrator** | `lib/ai-mentor/orchestrator.ts` | Central orchestration entry point, safety inspection, goal-intent extraction, context assembly, capability dispatch, quality gating, and structured turn synthesis. |
| **Student Goal Service** | `lib/ai-mentor/goals/student-goal-service.ts` | CRUD and lifecycle management of student goals (`active`, `paused`, `completed`), importance weighting (`primary`, `secondary`, `exploratory`), multi-goal conflict detection, and SQL synchronization. |
| **Personalized Assessment Engine** | `lib/ai-mentor/assessment/personalized-assessment-service.ts` | 5-tier evidence categorization, readiness score evaluation against canonical domain benchmarks, prerequisite gap detection, and clarifying question formulation (zero hallucination). |
| **Personalized Roadmap Service** | `lib/ai-mentor/roadmap/personalized-roadmap-service.ts` | Dynamic multi-week roadmap generation, prerequisite gating, learning activities, practical projects, milestone progress recording upon student confirmation, and adaptive schedule recalculation. |
| **Permission-Aware Context Builder** | `lib/ai-mentor/permission-aware-context-builder.ts` | Enforces purpose-specific consent (`service_personalization`, `student_memory`), fetches active goals, classified evidence, and graph mastery nodes, and formats sanitized briefings. |
| **Specialist Registry & Contracts** | `lib/ai-mentor/specialists/specialist-registry.ts` | Manages the 8 canonical domain specialists (SAGE, CIPHER, ATLAS, FORGE, VECTRA, PRISM, ORACLE, CHRONOS) and dynamic secondary specialist consultation. |
| **Model Provider Router** | `lib/ai-mentor/model-provider-router.ts` | Secure multi-provider LLM routing between Gemini Pro, fine-tuned MentorMaze-2B, and deterministic local pedagogical engines with zero credential leakage. |
| **PostgreSQL Persistence Layer** | `lib/db/ai-mentor-schema.ts` | Drizzle ORM schemas for `ai_mentor_goals`, `ai_mentor_roadmaps`, `ai_mentor_roadmap_milestones`, and `student_purpose_consents`. |

---

## 3. Data Flow & State Transitions

### A. Goal Initialization & Declaration
1. Student inputs: *"I want to become a machine learning engineer."*
2. Orchestrator regex and semantic intent classifiers detect a goal declaration.
3. `StudentGoalService.createGoal` creates a persistent record with `status: "active"` and `importance: "primary"`.
4. `PersonalizedAssessmentService.assessCurrentState` compares authorized student skills against canonical benchmark competencies (Python, Linear Algebra, PyTorch, Model Serving).
5. `PersonalizedRoadmapService.generatePersonalizedRoadmap` generates a 4–12 week structured roadmap.
6. The turn response returns:
   - `goalReference`: Active goal metadata.
   - `assessment`: 5-tier evidence summary, readiness score, verified strengths, confirmed gaps, and clarifying questions.
   - `studyPlan`: Milestones, deliverables, and estimated effort hours.
   - `recommendedNextAction`: Concrete first step (e.g., Week 1 implementation deliverable).

### B. Milestone Progression & Verified Adaptation
1. Student reports: *"I completed week 1 milestone deliverable with my numpy tensor implementation."*
2. Orchestrator parses milestone completion intent and extracts confirmation tokens.
3. `PersonalizedRoadmapService.markMilestoneProgress` transitions Week 1 from `in_progress` to `completed` and activates Week 2.
4. If the student demonstrates accelerated mastery or reports reduced weekly study hours, `PersonalizedRoadmapService.adaptRoadmap` updates remaining milestones and logs the adaptation reason in `adaptationHistory`.

---

## 4. Privacy, Safety, and Consent Boundaries

1. **Purpose-Specific Consent Enforcement**:
   - `service_personalization`: Required to tailor pedagogical hints and difficulty.
   - `student_memory`: Required to store and retrieve personal academic history and past mistakes.
   - When consent is revoked, `PermissionAwareContextBuilder` redacts private memory, falling back to clean in-session mentorship without breaking continuity.
2. **Zero Fabrication Policy**:
   - Unverified skills are strictly categorized under Tier 5 (`unknown_missing`). The engine formulates clarifying questions rather than guessing mastery scores.
3. **Safety & Crisis Interception**:
   - `SafetyGuardrails.inspectInput` scans for distress, self-harm, medical inquiries, and prompt injections before executing any agent or LLM call, routing immediately to certified helplines (e.g. Tele-MANAS).
