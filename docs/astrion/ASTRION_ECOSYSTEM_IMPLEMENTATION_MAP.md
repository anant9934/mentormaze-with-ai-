# ASTRION — Ecosystem Implementation & Architecture Mapping

**Product:** MentorMaze by AI Tathastu (`mentormaze.aitathastu.com`)  
**AI System:** ASTRION — Adaptive Strategic Intelligence & Reasoning Network (`astrion-core`)  
**Status:** Canonical Implementation Map  
**Timestamp:** 2026-11-22  

---

## 1. Architectural Alignment Overview

ASTRION is architected as **one unified AI mentor with one central orchestrator, shared permission-aware student context, and dynamically activated specialist capabilities**.

This mapping translates the target conceptual architecture into concrete application services, database tables, and runtime interfaces:

```text
Student / User
    │
    ▼
Student & Authorized Data Sources
    │
    ▼
Ingestion & Governance Layer
    ├── Consent & Permissions (StudentConsentService)
    ├── Data Ingestion & Normalization (ExternalConnectorContract)
    ├── Privacy & Safety (SafetyGuardrails, PermissionAwareContextBuilder)
    └── Evidence & Provenance (StudentIntelligenceGraph)
    │
    ▼
ASTRION CORE — Lead Mentor Orchestrator (AIMentorOrchestrator)
    ├── Intent Understanding (SpecialistRegistry)
    ├── Context Planning (PermissionAwareContextBuilder)
    ├── Agent Routing & Bounded Execution (ModelProviderRouter, Multi-Specialist Dispatch)
    ├── Response Synthesis (ASTRION CORE Multi-Specialist Synthesizer)
    └── Safety & Quality Control (EvaluatorCriticAgent, SafetyGuardrailAgent)
    │
    ▼
Multi-Agent Intelligence Ecosystem
    ├── Agent Layer A: Domain Specialists (SAGE, CIPHER, ATLAS, FORGE, VECTRA, PRISM, ORACLE, CHRONOS)
    ├── Agent Layer B: Student Intelligence (Adaptive Learning, Profiler, Gap Detector, Roadmap, Accountability, Engagement)
    └── Agent Layer C: Supporting Intelligence (Safety, Evaluator/Critic, Resource Retriever, Communication, Mentor Collaboration)
    │
    ▼
Permission-Aware Student Intelligence Graph (StudentIntelligenceGraph + PostgreSQL Schema)
    │
    ▼
Personalized Response & Actions (StructuredTurnResponse + UI Action Cards)
    ├── Mentorship Response
    ├── Study Plan / Roadmap
    ├── Progress & Skill-Gap Insights
    ├── Resources & Opportunities
    ├── Reminders & Follow-Ups
    └── Optional Human Mentor Handoff
```

---

## 2. Component Mapping Matrix

| Architectural Layer | Target Capability | Implementation Service / File | Underlying Database / Source | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Ingestion & Governance** | Consent & Permissions | `lib/ai-mentor/student-consent-service.ts` | `student_purpose_consents` (PostgreSQL) | **VERIFIED** |
| | External Connectors | `lib/ai-mentor/integrations/external-connector.contract.ts` | GitHub, LinkedIn, LeetCode contracts | **VERIFIED (Contract)** |
| | Privacy & Safety | `lib/ai-mentor/safety-guardrails.ts` | In-memory policy rules & regex sanitizers | **VERIFIED** |
| | Evidence & Provenance | `lib/ai-mentor/student-intelligence-graph.ts` | `student_intelligence_evidence` (PostgreSQL) | **VERIFIED** |
| **ASTRION CORE** | Lead Mentor Orchestrator | `lib/ai-mentor/orchestrator.ts` | Core runtime orchestration pipeline | **ENHANCED (Phase 3)** |
| | Intent Understanding | `lib/ai-mentor/specialists/specialist-registry.ts` | Multi-intent classifier & domain mapper | **VERIFIED** |
| | Context Planning | `lib/ai-mentor/permission-aware-context-builder.ts` | Purpose-filtered context minimization | **VERIFIED** |
| | Response Synthesis | `lib/ai-mentor/orchestrator.ts` | Coherent single-persona ASTRION synthesis | **ENHANCED (Phase 3)** |
| **Layer A: Domain Specialists** | SAGE (`sage-learning`) | `lib/ai-mentor/specialists/learning-specialist.ts` | First-principles scaffolding, Socratic logic | **VERIFIED** |
| | CIPHER (`cipher-engineering`) | `lib/ai-mentor/specialists/coding-specialist.ts` | Asymptotic Big-O, code syntax review | **VERIFIED** |
| | ATLAS (`atlas-systems`) | `lib/ai-mentor/specialists/system-design-specialist.ts` | Distributed architecture, CAP, databases | **VERIFIED** |
| | FORGE (`forge-projects`) | `lib/ai-mentor/specialists/project-specialist.ts` | Architecture audits, portfolio milestones | **VERIFIED** |
| | VECTRA (`vectra-career`) | `lib/ai-mentor/specialists/career-specialist.ts` | Job intelligence, role ladders, compensation | **VERIFIED** |
| | PRISM (`prism-resume`) | `lib/ai-mentor/specialists/resume-specialist.ts` | Google XYZ formula, ATS compliance | **VERIFIED** |
| | ORACLE (`oracle-interviews`) | `lib/ai-mentor/specialists/interview-specialist.ts` | STAR method calibration, behavioral rubrics | **VERIFIED** |
| | CHRONOS (`chronos-planning`) | `lib/ai-mentor/specialists/study-planning-specialist.ts` | Spaced retrieval, 12/24-week milestones | **VERIFIED** |
| **Layer B: Student Intelligence** | Adaptive Learning Agent | `lib/ai-mentor/agents/adaptive-learning-agent.ts` | `student_skill_nodes`, dependency DAG | **IMPLEMENTED** |
| | Student Profiler Agent | `lib/ai-mentor/agents/student-profiler-agent.ts` | `student_memory`, `student_learning_profiles` | **IMPLEMENTED** |
| | Learning-Gap Detector | `lib/ai-mentor/agents/learning-gap-agent.ts` | Competency matrix, evidence comparison | **IMPLEMENTED** |
| | Goal & Roadmap Planner | `lib/ai-mentor/agents/goal-roadmap-agent.ts` | `ai_mentor_roadmaps`, `roadmap_milestones` | **IMPLEMENTED** |
| | Accountability & Check-In | `lib/ai-mentor/agents/accountability-agent.ts` | Scheduled milestones, consent preferences | **IMPLEMENTED** |
| | Engagement Intelligence | `lib/ai-mentor/agents/engagement-agent.ts` | Authorized interaction volume & signals | **IMPLEMENTED** |
| **Layer C: Supporting Intelligence** | Safety & Guardrails Agent | `lib/ai-mentor/agents/safety-guardrail-agent.ts` | Boundary inspection, PII, prompt defense | **IMPLEMENTED** |
| | Evaluator / Critic Agent | `lib/ai-mentor/agents/evaluator-critic-agent.ts` | Correctness, contradictions, evidence claims | **IMPLEMENTED** |
| | Resource Retriever Agent | `lib/ai-mentor/agents/resource-retriever-agent.ts` | `knowledge_documents`, verified index | **IMPLEMENTED** |
| | Communication-Gap Agent | `lib/ai-mentor/agents/communication-gap-agent.ts` | Writing clarity, presentation, conciseness | **IMPLEMENTED** |
| | Mentor Collaboration Agent | `lib/ai-mentor/agents/mentor-collaboration-agent.ts` | Human mentor handoff, session escalation | **IMPLEMENTED** |
| **Response & Action Layer** | Mentorship Response | `lib/ai-mentor/contracts/mentor-response.contract.ts` | Standardized turn response contract | **ENHANCED** |
| | Study Plan / Roadmap Actions | `components/ai-mentor/ai-mentor-conversation.tsx` | Interactive Roadmap Card | **ENHANCED** |
| | Progress & Skill Gap Card | `components/ai-mentor/ai-mentor-conversation.tsx` | Interactive Progress Insights Card | **ENHANCED** |
| | Resources & Opportunities | `components/ai-mentor/ai-mentor-conversation.tsx` | Verified Opportunity Cards | **ENHANCED** |
| | Human Mentor Handoff | `components/ai-mentor/ai-mentor-conversation.tsx` | Mentor Booking Handoff Card | **ENHANCED** |

---

## 3. Specialist Canonical ID Verification

To ensure zero naming confusion, all 8 domain specialists are canonically identified as follows:

| Specialist Name | Internal ID | Canonical FocusArea ID | Responsibility |
|---|---|---|---|
| **SAGE** | `sage-learning` | `learn` | Learning, subject tutoring, concept explanation |
| **CIPHER** | `cipher-engineering` | `coding_dsa` | Programming, coding, DSA |
| **ATLAS** | `atlas-systems` | `system_design` | System design, architecture, engineering systems |
| **FORGE** | `forge-projects` | `projects` | Project planning, implementation, debugging |
| **VECTRA** | `vectra-career` | `career` | Career strategy, roles, opportunities |
| **PRISM** | `prism-resume` | `resume` | Resume analysis and profile optimization |
| **ORACLE** | `oracle-interviews` | `interview` | Interview preparation and evaluation |
| **CHRONOS** | `chronos-planning` | `study_planning` | Study schedules, time management, progress plans |

**CRITICAL POLICY ENFORCED:** System design is mapped to **ATLAS**; career strategy is mapped to **VECTRA**. All specialists run under the unified persona of **ASTRION**.
