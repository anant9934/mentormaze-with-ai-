# MENTORMAZE — PHASE 7: DOMAIN TAXONOMY & LANGUAGE DISTRIBUTION

**Project:** MentorMaze-2B Specialised Language Model  
**Platform:** MentorMaze by AI Tathastu ([mentormaze.aitathastu.com](https://mentormaze.aitathastu.com))  
**Audited Artifact:** `training/datasets/mentormaze-v2/domain_distribution.json`  
**Dataset Version:** `2.0.0-phase7` (8,483 Approved Samples)  
**Audit Date:** November 18, 2026  

---

## 1. Executive Summary

This report defines the comprehensive **15-Domain Mentoring Taxonomy** implemented for `mentormaze-v2` and evaluates the natural domain and language distributions across the cleaned corpus.

Unlike generic language models trained on undifferentiated web crawls, MentorMaze-2B requires multi-label pedagogical classification. Every record in the dataset is labeled with a primary domain, secondary domain tags, language, difficulty tier, and pedagogical teaching strategy.

---

## 2. The 15-Domain MentorMaze Taxonomy

Each example in `training/datasets/mentormaze-v2/` is classified into the following 15 specialist domains:

| # | Domain Identifier | Primary Focus & Scope | Pedagogical Strategy |
| :--- | :--- | :--- | :--- |
| **1** | `general_instruction` | Multi-turn task execution, structured markdown output, formatting constraints. | Direct Instruction & Constraint Adherence |
| **2** | `socratic_tutoring` | Progressive inquiry, 3-tier scaffolding, misconception diagnosis, checking understanding. | Socratic Scaffolding & Productive Struggle |
| **3** | `conceptual_explanations` | First-principles theoretical derivations (OS kernel, networks, memory models). | First-Principles Derivation & Analogy |
| **4** | `coding_and_debugging` | Bug localization, edge case synthesis, syntax error resolution, memory leak analysis. | Code Review & Bug Trap Analysis |
| **5** | `data_structures_algorithms` | Time/space asymptotics, invariant proofs, optimal sorting/searching, dynamic programming. | Invariant Proofs & Asymptotic Bounds |
| **6** | `system_design` | Scalability trade-offs, caching, database sharding, thundering herd mitigation, load balancing. | Trade-off Analysis & Failure Modes |
| **7** | `distributed_systems` | Raft consensus, CAP theorem, replication, event-driven queues (Kafka), outbox pattern. | Distributed Invariants & Quorum Protocols |
| **8** | `career_guidance` | Job description skill gap extraction, market role calibration, learning roadmaps. | Evidence-Driven Gap Analysis |
| **9** | `resume_and_ats` | Google XYZ bullet transformation, metric quantification, zero-fabrication audits. | Google XYZ Formula & Evidence Probing |
| **10** | `technical_interviews` | Algorithmic live coding, edge case trapping, complexity defense, interview rubrics. | Live Coding Simulation & Edge Case Traps |
| **11** | `behavioral_interviews` | Situation, Task, Action, Result (STAR) framework calibration, leadership principles. | STAR Rubric & Constructive Retrospective |
| **12** | `project_mentorship` | Production readiness audits, portfolio architecture critique, architecture reviews. | Architectural Review & Code Smells |
| **13** | `hindi` | Pure Hindi (Devanagari) technical instruction and conceptual explanations. | Natural Native Instruction |
| **14** | `hinglish` | Conversational mixed Hindi-English mentoring for Indian engineering colleges. | Culturally Grounded Socratic Dialogue |
| **15** | `study_planning` | Spaced repetition schedules, milestone calendars, weekly cognitive focus pacing. | Spaced Retrieval & Feasibility Pacing |

---

## 3. Approved Dataset Distribution (`mentormaze-v2`)

The approved `mentormaze-v2` dataset comprises **8,483 high-quality records** partitioned as follows:

```
+-----------------------------------------------------------------------------------------+
| PRIMARY DOMAIN DISTRIBUTION IN MENTORMAZE-V2 (8,483 Approved Samples)                  |
+----------------------------------------------------+------------------+-----------------+
| Primary Domain                                     | Record Count     | Percentage      |
+----------------------------------------------------+------------------+-----------------+
| `career_guidance` (JDs, ESCO & Progression)        | 2,975 records    | 35.07%          |
| `coding_and_debugging` (CodeFeedback Technical)    | 2,953 records    | 34.81%          |
| `socratic_tutoring` (De-biased Socratic Scaffolds) | 1,700 records    | 20.04%          |
| `behavioral_interviews` (STAR Interview Coaching)  | 850 records      | 10.02%          |
| `system_design` & Multi-Domain Tutoring (Gold)     | 5 records        | 0.06%           |
+----------------------------------------------------+------------------+-----------------+
| TOTAL APPROVED CORPUS                              | 8,483 records    | 100.00%         |
+----------------------------------------------------+------------------+-----------------+
```

### Secondary Domain Overlap Matrix:
Because complex mentoring tasks rarely address only one discipline, records are tagged with secondary domains:
- **`data_structures_algorithms`**: Present as a primary or secondary tag in **4,653 records (54.85%)**.
- **`conceptual_explanations`**: Present in **1,705 records (20.10%)**.
- **`technical_interviews`**: Present in **3,803 records (44.83%)**.
- **`resume_and_ats`**: Present in **2,125 records (25.05%)**.

---

## 4. Language Distribution & Culturally Grounded Mentoring

| Language | Record Count in v2 | Share (%) | Strategy & Curation Notes |
| :--- | :--- | :--- | :--- |
| **English (`en`)** | 8,480 | 99.96% | Standard global technical curriculum & international syntax. |
| **Hinglish (`hi-en`)** | 2 | 0.02% | Pristine multi-turn gold dialogues demonstrating Socratic code-mixing. |
| **Hindi (`hi`)** | 1 | 0.01% | Pure Devanagari explanation of dynamic programming & recursion. |

### Language Strategy for Full Training (Phase 8):
While English remains the dominant language of global programming syntax, Indian engineering students frequently converse in Hinglish. Rather than performing synthetic machine translations (which produce robotic, unidiomatic phrasing), the pipeline preserves natural Hinglish dialogue in the held-out benchmark and gold training splits.

---

## 5. Natural vs. Proposed Training Mixture

To prevent domain starvation while avoiding repetitive memorization, the table below compares the natural distribution against the calibrated SFT mixture:

| Domain Cluster | Natural Count | Natural % | Proposed SFT Weight | Justification |
| :--- | :--- | :--- | :--- | :--- |
| **Technical & DSA** | 2,953 | 34.81% | **35.0%** | Critical foundation for coding rounds and syntax correctness. |
| **Career & JDs** | 2,975 | 35.07% | **25.0%** | Slightly downsampled to prevent overfitting on job title schemas. |
| **Socratic Pedagogy**| 1,700 | 20.04% | **20.0%** | Core pedagogical differentiator; maintains multi-turn dialogic depth. |
| **Behavioral & STAR**| 850 | 10.02% | **10.0%** | Sized to ensure robust STAR interview coaching without dilution. |
| **Leveling & Systems**| 1,007 | 11.86% | **10.0%** | Grounds architecture and seniority calibration. |

**Oversampling Guardrail:** No domain is oversampled by more than 1.1x, preventing parameter memorization on small sub-splits.

