# MentorMaze AI Mentor — End-to-End System Architecture

**Product:** MentorMaze AI Mentor  
**Parent Brand:** AI Tathastu  
**Production Domain:** `https://mentormaze.aitathastu.com`  
**Lead AI Persona:** Dr. Aarav Mehta (Tathastu AI Principal Mentor & Career Architect)  
**Status:** Implemented & Verified in Production Build

---

## 1. System Vision & Foundational Philosophy

The MentorMaze AI Mentor is not a generic wrapper or basic chatbot integration. It is an intelligent learning, technical mentoring, and career-development system engineered specifically for computer science and engineering students. 

### Core Principles
1. **Evidence-Driven, Not Speculative**: Mastery is never assumed based on self-reported claims. Every skill rating requires verifiable evidence from code executions, multiple-choice quizzes, open explanations, human mentor evaluations, or mock interviews.
2. **Productive Struggle Over Answer Dumping**: The system measures and optimizes for the **Socratic Quotient (SQ)**. It withholds premature solutions to cultivate durable neural recall, scaffolding the student's problem-solving path through progressive hints.
3. **Dual-Pillar Mentorship Ecosystem**: Bridges seamlessly with MentorMaze's senior human mentors (FAANG Staff Engineers). When students face conceptual plateaus or high-stakes milestones, the AI orchestrates an explainable human escalation with 1-click booking and consented session briefs.
4. **Strict PII & Privacy Isolation**: No student chat history or academic records are leaked to external model providers for unapproved training. All operations respect granular consent scopes.

---

## 2. High-Level Modular Runtime Architecture

```
+-----------------------------------------------------------------------------------+
|                        Student Workspace (/ai-mentor)                             |
|  - 8 Teaching Modes (Learn, Practice, Code, Career, Resume, Interview, Project,   |
|    Study Planner)                                                                 |
|  - Trilingual Adaptation (English, Hindi, Hinglish)                               |
|  - Persistent History, Code Lab, Skill Graph & Memory Viewers                     |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                       AI Orchestration Pipeline                                   |
|                                                                                   |
|  [1. Safety Guardrails & PII Scrub] -> [2. Student Context Builder]                |
|               |                                      |                            |
|               v                                      v                            |
|  [3. Pedagogical Decision Engine]     [4. Student Skill Graph & Prereqs]          |
|               |                                      |                            |
|               v                                      v                            |
|  [5. Knowledge & RAG (5 Collections)] [6. Career & JD Intelligence (XYZ Matcher)] |
|               |                                      |                            |
|               v                                      v                            |
|  [7. Code Mentor & Sandbox Provider]  [8. Technical & Behavioral Interview Coach] |
|               |                                      |                            |
|               +-----------------------+--------------+                            |
|                                       v                                           |
|                     [9. Human Mentorship Escalation Engine]                       |
|                                       |                                           |
|                                       v                                           |
|                     [10. Multi-Provider Model Router]                             |
|        (Local Deterministic Core | Gemini | OpenAI | Anthropic | Ollama)           |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                       PostgreSQL & Drizzle Database Layer                         |
|  - ai_mentor_conversations, ai_mentor_messages, student_learning_profiles         |
|  - student_skill_nodes, student_skill_dependencies, student_skill_evidence        |
|  - student_memory, ai_mentor_roadmaps, knowledge_sources, job_descriptions        |
+-----------------------------------------------------------------------------------+
```

---

## 3. Subsystem Breakdown

| Subsystem | File Path | Core Responsibility |
| :--- | :--- | :--- |
| **Model Provider Router** | `lib/ai-mentor/model-provider-router.ts` | Multi-provider routing between local deterministic core (`tathastu-pedagogy-v1`), Gemini, OpenAI, Anthropic, and Ollama. |
| **Student Context Builder** | `lib/ai-mentor/student-context-builder.ts` | Gathers authorized academic records, verified skills, and project history across Collaborate, Avsar, and IRIS. |
| **Student Skill Graph** | `lib/ai-mentor/student-skill-graph.ts` | Hierarchical Computer Science taxonomy with prerequisite verification and 6 instructional mastery states. |
| **Pedagogy Engine** | `lib/ai-mentor/pedagogy-engine.ts` | Orchestrates 8 Teaching Modes and Strategies A–H (Socratic, Conceptual, Progressive Hints, Worked Example). |
| **Knowledge RAG Service** | `lib/ai-mentor/knowledge-rag-service.ts` | Hybrid retrieval across 5 collections (Technical, Academic, Career, Interview, Proprietary). |
| **Career Intelligence** | `lib/ai-mentor/career-intelligence.ts` | Normalized JD repository, resume-to-JD gap analysis using Google XYZ formula, dynamic 24-week roadmaps. |
| **Code Mentor & Sandbox** | `lib/ai-mentor/code-mentor.ts` | Detects hidden O(N²) traps and missing boundary edge cases; enforces isolated sandbox execution limits. |
| **Interview Coach** | `lib/ai-mentor/interview-coach.ts` | Adaptive questioning with FAANG rubrics and behavioral STAR compliance validation. |
| **Student Memory** | `lib/ai-mentor/student-memory-service.ts` | Persistent structured memory lifecycle (goals, preferences, strengths, repeated mistakes) with user deletion rights. |
| **Human Escalation** | `lib/ai-mentor/human-escalation-service.ts` | Detects conceptual struggle, matches up to 3 approved MentorMaze mentors, and drafts consented briefs. |
| **Safety & Guardrails** | `lib/ai-mentor/safety-guardrails.ts` | Prevents clinical therapy claims, routes crisis harm disclosures to Tele-MANAS, redacts PII, blocks prompt injections. |
| **Dataset Governance** | `lib/ai-mentor/dataset-governance.ts` | Registry for candidate datasets (CodeFeedback, TACO, UltraFeedback), license vetting, SFT and DPO export generators. |
| **Evaluation Benchmark** | `lib/ai-mentor/evaluation-benchmark.ts` | Measures technical accuracy, Socratic Quotient, groundedness, and baseline improvements across holdout cases. |

---

## 4. Hardware & Operating Environment

- **Server Runtime**: Node.js 20+ with Next.js 14 App Router
- **Database Engine**: Neon Serverless PostgreSQL with Drizzle ORM
- **Inference Latency**:
  - Local Pedagogical Engine: **$< 1\text{ms}$** (deterministic, zero network cost)
  - Gemini 1.5 Flash: **$\sim 450\text{ms}$** (when API key provided)
  - OpenAI GPT-4o-Mini: **$\sim 600\text{ms}$** (when API key provided)
