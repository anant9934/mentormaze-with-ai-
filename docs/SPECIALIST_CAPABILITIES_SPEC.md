# MENTORMAZE — SPECIALIST CAPABILITIES SPECIFICATION
## Input/Output Contracts, Heuristics & Deterministic Fallback Behaviors for 9 Specialist Modules

**Product:** MentorMaze by AI Tathastu  
**Domain:** `https://mentormaze.aitathastu.com`  
**Host Entity:** Dr. Aarav Mehta (Principal Mentor · AI Intelligence)  

---

## 1. Overview & Architectural Contract

Every specialist module implements the standard `ISpecialistCapability` interface defined in `lib/ai-mentor/specialists/specialist-interface.ts`:

```typescript
export interface ISpecialistCapability {
  readonly id: FocusArea;
  readonly name: string;
  readonly badge: string;
  readonly domain: string;
  readonly description: string;
  matchesIntent(message: string): boolean;
  getSystemPromptEnrichment(input: SpecialistExecutionInput): string;
  getTaskCategory(): TaskCategoryType;
  executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput;
  postProcessGenerative(content: string, input: SpecialistExecutionInput): Partial<SpecialistExecutionOutput>;
  getMetadata(): SpecialistCapabilityInfo;
}
```

---

## 2. Capability Specifications

### Capability 1: Concept Learning Specialist (`learn`)
- **Name:** Concept Learning Specialist
- **Badge:** `Using Conceptual Pedagogy`
- **Domain:** Computer Science Fundamentals & Pedagogy
- **Task Category:** `reasoning`
- **Intent Triggers:** "teach me", "explain", "what is", "how does", "concept", "theory", "intuition", "learn", "why does".
- **Generative Prompt Enrichment:** Explains concepts from first principles; mandates formal definitions followed by real-world intuition; requires step-by-step invariant proofs; concludes with an interactive understanding check.
- **Deterministic Engine:** Resolves against verified curriculum graph (e.g., Cache-Aside, 0/1 Knapsack, Two Pointers). Formats structural Markdown deep-dive with ASCII architectural diagrams.
- **Post-Interaction Check:** Enforces 4-option multiple-choice concept verification check on the core invariant.

### Capability 2: Socratic Practice Specialist (`practice`)
- **Name:** Active Practice & Socratic Specialist
- **Badge:** `Using Socratic Scaffolding`
- **Domain:** Active Problem Solving & Scaffolding
- **Task Category:** `reasoning`
- **Intent Triggers:** "practice", "quiz me", "hint", "stuck", "problem", "exercise", "solve", "challenge".
- **Scaffolding Hierarchy:**
  - **Level 1 Hint:** Invariant question (e.g., "What invariant must hold for pointer direction?"). Zero code.
  - **Level 2 Hint:** Recurrence relation or auxiliary data structure trade-off.
  - **Level 3 Hint:** Boundary conditions and loop iteration directions (e.g., backward capacity traversal in 1D 0/1 Knapsack).
- **Deterministic Engine:** Dynamic lookup matching problem taxonomy with progressive hint index matching student hint level.

### Capability 3: Coding & DSA Specialist (`coding_dsa`)
- **Name:** Coding & DSA Specialist
- **Badge:** `Using Coding & DSA Expertise`
- **Domain:** Data Structures, Algorithms & Code Optimization
- **Task Category:** `coding`
- **Intent Triggers:** "code", "review", "bug", "debug", "optimize", "complexity", "time complexity", "dsa", "leetcode", "refactor".
- **Asymptotic Analysis:** Computes exact worst-case, average-case, and auxiliary space bounds.
- **Trap Detection:** Discovers hidden $O(N^2)$ traps (e.g., `arr.includes()` or `indexOf()` nested inside loops, unindexed searches, unintended string copies).
- **Deterministic Engine:** Invokes `CodeMentorService.analyzeCode()`. Delivers refactored ES6 / TypeScript / Python snippet, complexity analysis, and 3 mandatory boundary test cases (empty array, duplicates, maximum bounds).

### Capability 4: System Design Specialist (`system_design`)
- **Name:** System Design & Architecture Specialist
- **Badge:** `Using System Design Expertise`
- **Domain:** Distributed Systems & Scalable Architecture
- **Task Category:** `reasoning`
- **Intent Triggers:** "system design", "architecture", "distributed", "scale", "microservice", "redis", "kafka", "sharding", "cap theorem", "rate limiter".
- **Framework Structure:**
  1. Functional & Non-Functional Requirements (QPS, Latency SLO, DAU).
  2. Capacity Estimation (Storage, IOPS, Network Bandwidth).
  3. High-Level Architecture Topology.
  4. Core Component Interaction & Deep Dives.
  5. Failure Modes & Bottleneck Analysis (Thundering Herd, Cache Penetration, Split-Brain).
- **Deterministic Engine:** Generates complete system specifications for Distributed Token Bucket Rate Limiter, Cache-Aside Invalidation with Redis Lua scripts, and Kafka event pipelines.

### Capability 5: Career & Placement Specialist (`career`)
- **Name:** Career & Job Market Specialist
- **Badge:** `Using Career Intelligence`
- **Domain:** Engineering Career Strategy & Level Calibration
- **Task Category:** `reasoning`
- **Intent Triggers:** "career", "job", "salary", "compensation", "naukri", "market", "jd", "job description", "sde1", "sde2", "placement", "ctc".
- **Level Calibration Matrix:**
  - **SDE-1 (L3):** Algorithmic correctness, clean modular code, unit test coverage, zero unverified assumptions.
  - **SDE-2 (L4):** End-to-end component ownership, distributed failure handling, non-functional requirements.
  - **Senior/Staff (L5+):** Cross-team technical vision, architectural trade-offs, system evolvability.
- **Deterministic Engine:** Integrates with 11,727 Naukri job records to benchmark skill gaps and market compensation bands (e.g. ₹16L-₹32L CTC for Tier-1 product SDE-1).

### Capability 6: Resume Engineering Specialist (`resume`)
- **Name:** Resume & Google XYZ Specialist
- **Badge:** `Using Resume Engineering`
- **Domain:** Resume Transformation & Factual Alignment
- **Task Category:** `resume`
- **Intent Triggers:** "resume", "cv", "bullet", "xyz formula", "ats", "rewrite", "profile review".
- **Google XYZ Formula:** "Accomplished [X] as measured by [Y], by doing [Z]".
- **Zero-Fabrication Policy:** The specialist NEVER invents fake metrics (e.g., "reduced latency by 43%"). If metrics are missing, it inserts bracketed prompts (e.g., `[insert verified metric, e.g., p99 latency reduced by X ms]`) and warns the student to check real git commits.
- **Deterministic Engine:** Invokes `CareerIntelligenceService.analyzeResumeAgainstJob()`. Evaluates ATS keyword match score, missing competencies, and bullet rewrites.

### Capability 7: Interview Simulation Specialist (`interview`)
- **Name:** Interview Simulation & Rubric Specialist
- **Badge:** `Using Interview Coaching`
- **Domain:** FAANG Technical & Behavioral Interview Rubrics
- **Task Category:** `interview`
- **Intent Triggers:** "interview", "mock", "behavioral", "star method", "faang interview", "tell me about a time".
- **Rubric Dimensions (Scored 0–10):**
  - Technical Correctness & Invariant Proof
  - Problem Solving Depth & Approach Communication
  - Complexity Justification (Time & Space)
  - Edge Case Awareness & Boundary Testing
  - Communication Clarity & Clarifying Questions
- **STAR Behavioral Probing:** Ensures Situation (15%), Task (15%), Action (60%), and Result (10%) are addressed with personal ownership.

### Capability 8: Portfolio Project Specialist (`projects`)
- **Name:** Portfolio Project & Architecture Specialist
- **Badge:** `Using Project Architecture`
- **Domain:** Production Software Engineering & Portfolio Systems
- **Task Category:** `reasoning`
- **Intent Triggers:** "project", "portfolio", "build", "tech stack", "schema", "api design", "fullstack".
- **Rejection of Tutorial Clones:** Explicitly steers students away from trivial Todo apps and clones towards non-trivial distributed architectures (CRDT collaborative tools, transactional message outbox patterns, Redis pub/sub rate limiters).
- **Deterministic Engine:** Delivers full schema definitions (PostgreSQL DDL), architectural data flows, and CI/CD deployment specifications.

### Capability 9: Study Planning Specialist (`study_planning`)
- **Name:** Study Planning & Roadmap Specialist
- **Badge:** `Using Study Architecture`
- **Domain:** Spaced Repetition & Placement Milestone Planning
- **Task Category:** `reasoning`
- **Intent Triggers:** "roadmap", "study plan", "schedule", "routine", "plan", "timeline", "calendar", "24-week".
- **Time Distribution:** 60% Problem Solving (DSA Invariants), 25% Core CS & Systems, 15% Project Engineering.
- **Spaced Retrieval Protocol:** Day 1 initial problem $\rightarrow$ Day 3 mistake review $\rightarrow$ Day 7 invariant re-test $\rightarrow$ Day 21 hardest variation re-solve.
- **Deterministic Engine:** Generates student-tailored 24-week milestone plans addressing verified weak skills from the student context.
