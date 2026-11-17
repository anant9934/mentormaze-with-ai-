# Adaptive Pedagogical Engine Specification

**System:** MentorMaze AI Mentor  
**Component:** Pedagogical Decision Engine & Multi-Strategy Orchestration  
**Reference File:** `lib/ai-mentor/pedagogy-engine.ts`

---

## 1. Architectural Role

The Pedagogical Engine sits as an explicit orchestration layer before prompt completion. It prevents the common failure mode of conversational bots that immediately dump full answers or robotically ask Socratic questions when a student needs a quick factual clarification.

---

## 2. The 8 Teaching Strategies

| Strategy | Directive | Best Used When |
| :--- | :--- | :--- |
| **A. Socratic Guidance** | Asks targeted questions to guide discovery without giving away the recurrence or core edge case. | Student is exploring a problem or in Practice mode. |
| **B. Conceptual Explanation** | Explains underlying principles using intuition, real-world analogies, formal proofs, and complexity bounds. | Student asks "why", or explicitly says "explain directly". |
| **C. Guided Problem Solving** | Breaks down the problem into intermediate milestones, prompting the student to execute step $N+1$. | Complex system design or algorithm formulation. |
| **D. Progressive Hints** | Delivers Hint 1 (direction), Hint 2 (invariant), or Hint 3 (formula/complement) sequentially. | Student is stuck during a coding exercise. |
| **E. Worked Example** | Shows a complete, clean, syntax-highlighted code solution with unit tests and complexity proofs. | Student explicitly requests "give me the full solution". |
| **F. Misconception Correction**| Spots the exact defect (e.g. $O(N^2)$ inside loop) and explains why it fails before suggesting a minimal fix. | Student shares code with a logic error or runtime timeout. |
| **G. Retrieval Practice** | Prompts student to actively recall a previously studied concept before teaching the next topic. | Student requests "quiz me" or after learning a module. |
| **H. Challenge Mode** | Presents a problem slightly above the student's currently demonstrated mastery score. | Student consistently succeeds and needs high-rigour prep. |

---

## 3. The 8-Stage Technical Pedagogy Sequence

For conceptual technical learning (e.g., Cache-Aside, Rate Limiting, Virtual Memory), the engine structures responses into eight pedagogical steps:
1. **Intuition**: Why does this engineering problem exist? (e.g. disk I/O bounds).
2. **Real-Life Analogy**: An accessible metaphor (e.g. library archives vs desk notepad).
3. **Formal Concept**: Precise architecture diagrams and ASCII data flows.
4. **Step-by-Step Reasoning**: Read path, write path, and invalidation sequence.
5. **Concrete Example**: Production TypeScript/Python code implementation.
6. **Non-Obvious Edge Cases**: Cache Stampede, Thundering Herd, race conditions.
7. **Active Practice**: Concrete coding challenge or parameter sizing problem.
8. **Understanding Check**: Single targeted diagnostic question.

---

## 4. Trilingual Natural Adaptation

The engine adapts dynamically to student preference across three language codes:
- **`en` (English)**: Standard professional engineering English.
- **`hi` (Hindi)**: Clean Devanagari script preserving English technical terms.
- **`hinglish` (Hinglish)**: Conversational Roman script Hindi popular in Indian tech hubs (e.g. *"Pehle hum base case likhenge..."*).
