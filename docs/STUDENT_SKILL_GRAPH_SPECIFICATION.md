# Student Skill Knowledge Graph Specification

**System:** MentorMaze AI Mentor  
**Component:** Hierarchical Taxonomy, Prerequisite Validation & Evidence-Based Mastery  
**Reference File:** `lib/ai-mentor/student-skill-graph.ts`

---

## 1. Computer Science Hierarchical Taxonomy

The skill graph models software engineering and computer science capabilities into a tree with explicit prerequisite relationships:

```text
Computer Science
|-- Programming
|   |-- Python Core
|   |-- TypeScript Core
|   \-- C++ & Memory Management
|-- Data Structures & Algorithms
|   |-- Arrays & Strings (Two-Pointers, Sliding Window)
|   |-- Linked Lists
|   |-- Recursion & Backtracking
|   |-- Trees & Graphs (BFS, DFS, Dijkstra, TopoSort)
|   \-- Dynamic Programming (Memoization, 1D/2D Tabulation)
|-- Databases & Storage
|   |-- SQL & Relational Modeling
|   |-- PostgreSQL Advanced (Indexes, Explain Analyze, MVCC)
|   \-- Redis & In-Memory Caching (Cache-Aside, Eviction Policies)
|-- Backend & System Architecture
|   |-- REST & API Architecture
|   |-- Distributed Systems & Scalability (CAP, Rate Limiting, Sharding)
|   \-- Event-Driven & Kafka (Pub/Sub, Consumer Groups, Partitions)
\-- AI & Machine Learning
    |-- Machine Learning Fundamentals
    \-- RAG & LLM Application Engineering
```

---

## 2. Evidence-Based Mastery States

Rather than arbitrary 0–100 sliders, MentorMaze defines six instructional states:

1. **Not Assessed (`not_assessed`)**: The student has not yet encountered or attempted this topic.
2. **Introduced (`introduced`)**: The student has read or been presented with the initial concept.
3. **Developing (`developing`)**: The student is solving basic problems or working through hints ($5.0 \le \text{score} < 7.0$).
4. **Demonstrated (`demonstrated`)**: The student has successfully implemented the concept independently in code execution or an interview simulation ($\text{score} \ge 7.0$, $\text{successes} \ge 2$).
5. **Consistently Demonstrated (`consistently_demonstrated`)**: The student has demonstrated the concept across multiple independent domains and edge cases ($\text{score} \ge 8.5$, $\text{successes} \ge 3$).
6. **Needs Reassessment (`needs_reassessment`)**: Triggered when a student fails a transfer problem or makes a conceptual error on a previously demonstrated topic.

---

## 3. Prerequisite Graph & Gaps Detection

Before teaching an advanced topic, the system checks whether hard prerequisites have reached `demonstrated` status.

**Example Dependency Mapping:**
- **Dynamic Programming** requires:
  - `recursion` (Recursion & Call Stack)
  - `arrays_strings` (Array State Representation)

When `StudentSkillGraph.checkPrerequisites(userId, "dynamic_programming")` returns `hasGaps: true`, the AI Mentor scaffolds the missing base concept first rather than jumping directly into 2D memoization tables.

---

## 4. Evidence Calibration Formula

When new assessment evidence is recorded, the skill's mastery score and confidence update dynamically:

$$\text{score}_{\text{new}} = \text{score}_{\text{prev}} \times (1 - w) + \text{score}_{\text{evidence}} \times w$$

Where:
- $w = 0.40$ for high-rigour evidence (`code_execution`, `mock_interview`).
- $w = 0.20$ for lower-rigour evidence (`self_reported`, `multiple_choice`).
- Confidence increases asymptotically toward $0.98$ with repeated assessments.
