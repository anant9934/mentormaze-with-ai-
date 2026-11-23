# ASTRION Zone of Proximal Development & Adaptive Activity Orchestrator

**Platform:** MentorMaze by AI Tathastu (`https://mentormaze.aitathastu.com`)  
**Specification Code:** `SPEC-ASTRION-ZPD-001`  
**Document Version:** 1.0.0 — Production Standard  

---

## 1. Deterministic Decision Engine Architecture

ASTRION's Adaptive Activity Orchestrator executes a deterministic decision algorithm to choose the exact next learning activity for a student. The selection algorithm evaluates the student's Zone of Proximal Development (ZPD) without relying on arbitrary LLM prompts.

```
+---------------------------------------------------------------------------------------------------+
|                                  ORCHESTRATOR INPUT VECTOR                                        |
|  - Active Student Goals & Deadlines                                                               |
|  - Canonical Skill Graph with 0-5 Mastery Levels                                                  |
|  - BKT Knowledge Probabilities & Misconceptions                                                    |
|  - Prerequisite Eligibility Graph                                                                 |
|  - FSRS Spaced Review Queue (Retrievability < 0.85)                                               |
|  - Student Declared Time Availability (hours/week)                                                |
|  - Preferred Pacing & Feedback from Previous Activity                                            |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                            7-PHASE ADAPTIVE PEDAGOGICAL POLICY                                    |
|                                                                                                   |
|  Phase 1: Diagnostic Placement      (New topic -> 4-10 subskills, 3-5 questions)                 |
|  Phase 2: Initial Instruction       (Prereqs met, Mastery = 0 -> Socratic intro / intuition)      |
|  Phase 3: Guided Practice           (Mastery = 1-2 -> Scaffolded exercise with 6-level ladder)    |
|  Phase 4: Independent Practice      (Mastery = 3 -> Unassisted problem without auto-hints)        |
|  Phase 5: Transfer Challenge        (Mastery = 4 -> Novel domain application / edge cases)       |
|  Phase 6: Mastery Verification      (Dual-check verification for Level 5 promotion)              |
|  Phase 7: Maintenance & Spaced Rev  (FSRS queue -> Interleaved 1-question warmup)                |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                      DECISION OUTPUT RECORD                                       |
|  - Recommended Next Skill: ID & Subskill Title                                                    |
|  - Recommended Activity: Type, Exercise ID, Problem Statement                                    |
|  - Difficulty Tier: foundational | intermediate | advanced                                        |
|  - Teaching Strategy: socratic | progressive_hint | worked_example | quiz                         |
|  - Objective: Clear statement of the learning goal for this activity                              |
|  - Deterministic Reason: Human-readable explanation of why this activity was chosen               |
|  - Supporting Evidence: Specific prerequisite mastery scores and review urgency cited             |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Selection Policy & Threshold Rules

1. **Rule 1 (Review Precedence):** If any active prerequisite has an FSRS retrievability $R < 0.70$ or is flagged with an unresolved misconception, ASTRION schedules a **forgotten concept recovery / misconception review** before introducing new topics.
2. **Rule 2 (Prerequisite Gate):** A student is eligible to begin a new skill only when **all hard prerequisites have achieved Mastery Level $\ge 3$**. If any prerequisite is below Level 3, the orchestrator directs the student to the missing prerequisite first.
3. **Rule 3 (ZPD Entry):** Among eligible skills, ASTRION prioritizes the skill that most directly unblocks the student's active primary goal, targeting the concept with the lowest mastery score $\ge 1$.
4. **Rule 4 (No Question Repetition):** ASTRION records all delivered questions in `ai_mentor_messages` and guarantees that the student will never receive an identical diagnostic or practice question within a 30-day window.
5. **Rule 5 (Controlled Escalation):** Difficulty cannot jump by more than 1 tier in a single session. Independent practice must be passed before transfer challenges are offered.
