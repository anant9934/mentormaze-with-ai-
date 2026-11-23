# ASTRION Bayesian Knowledge Tracing & Free Spaced Repetition (FSRS) Specification

**Platform:** MentorMaze by AI Tathastu (`https://mentormaze.aitathastu.com`)  
**Specification Code:** `SPEC-ASTRION-BKT-FSRS-001`  
**Reference Standard:** Tutor MCP (`ArnaudGuiovanna/tutor-mcp`), FSRS-4.5 Algorithm  
**Document Version:** 1.0.0 — Production Standard  

---

## 1. Bayesian Knowledge Tracing (BKT) Engine

ASTRION uses a deterministic Bayesian Knowledge Tracing model to maintain a calibrated estimate of a student's latent knowledge state for each assessed concept. 

BKT updates occur strictly from structured assessment events (quizzes, coding tests, Socratic responses), **never from arbitrary LLM self-reflection**.

### 1.1 Core Mathematical Formulation

For each subskill $k$, the state is defined by four parameters:
- $P(L_0)$: Initial probability that the student knows the concept prior to instruction. Default: $0.15$.
- $P(T)$: Probability that the student transitions from unlearned to learned state during a learning step. Default: $0.20$.
- $P(G)$: Guess probability — chance that an unlearned student answers correctly. Default: $0.15$.
- $P(S)$: Slip probability — chance that a learned student makes an accidental error. Default: $0.10$.

#### Update Step:
When an observation $O_t \in \{\text{correct}, \text{incorrect}\}$ occurs at turn $t$:

1. **Posterior Probability Given Observation:**
   $$\text{If } O_t = \text{correct}: \quad P(L_t | O_t) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)}$$
   
   $$\text{If } O_t = \text{incorrect}: \quad P(L_t | O_t) = \frac{P(L_{t-1}) \cdot P(S)}{P(L_{t-1}) \cdot P(S) + (1 - P(L_{t-1})) \cdot (1 - P(G))}$$

2. **Transition Update for Next Opportunity:**
   $$P(L_t) = P(L_t | O_t) + (1 - P(L_t | O_t)) \cdot P(T)$$

### 1.2 Assistance-Weighted Observations

Raw BKT assumes binary $O_t \in \{0, 1\}$. ASTRION extends BKT with **assistance weighting** to prevent unearned mastery gains from hint-assisted answers:

| Interaction Outcome | Observation Value ($O_t$) | Effective Guess $P(G)$ | Description |
|---|---|---|---|
| **Independent Success** | $1.00$ | $0.15$ | Solved without any hints or code templates. |
| **Success After Probing Hint (L1–L2)** | $0.75$ | $0.25$ | Solved after minimal conceptual nudge. |
| **Success After Property Reveal (L3–L4)** | $0.50$ | $0.40$ | Solved after core invariant was provided. |
| **Success After Worked Example (L5)** | $0.25$ | $0.65$ | Filled in code after seeing equivalent problem. |
| **Solution Explained (L6)** | $0.00$ | $0.10$ | Solution read directly; counted as learning opportunity only. |
| **Incorrect Attempt** | $0.00$ | $0.15$ | Incorrect submission or concept error. |
| **Unprompted Delayed Retrieval** | $1.00$ | $0.10$ | Correct answer after 3+ days delay ($P(G)$ reduced). |
| **Transfer Assessment** | $1.00$ | $0.05$ | Correct application in novel domain. |

### 1.3 Interpretable Mastery Bands

To avoid presenting probabilistic estimates as dogmatic certainty, ASTRION maps $P(L_t)$ to clear qualitative bands for student interfaces:

| Probability Range $P(L_t)$ | Mastery Band | Canonical Level | Pedagogical Directive |
|---|---|---|---|
| $0.00 - 0.35$ | **Novice** | Level 0–1 | Provide foundational instruction and guided discovery. |
| $0.36 - 0.65$ | **Developing** | Level 2 | Offer scaffolded practice with progressive hints. |
| $0.66 - 0.85$ | **Competent** | Level 3 | Provide independent exercises with delayed feedback. |
| $0.86 - 0.95$ | **Proficient** | Level 4 | Challenge with transfer problems and edge cases. |
| $> 0.95$ (with 2+ checks) | **Mastered** | Level 5 | Eligible to teach/peer review; enter maintenance FSRS review. |

---

## 2. Free Spaced Repetition Scheduler (FSRS) Engine

Once a concept reaches Level 3 or higher, it enters ASTRION's FSRS spaced maintenance loop to prevent decay and ensure durable long-term retention.

### 2.1 State Variables
- **Stability ($S$):** The number of days for retrievability to decrease from 100% to 90%.
- **Difficulty ($D$):** A value from 1 (easiest) to 10 (hardest) reflecting the intrinsic conceptual difficulty for this student.
- **Retrievability ($R$):** The probability of recalling the concept after $t$ days since the last review:
  $$R(t, S) = \left( 1 + \frac{t}{9 \cdot S} \right)^{-1}$$

### 2.2 Review Queue Generation
1. Each morning or at session start, ASTRION queries all student skills where $R(t, S) < R_{\text{threshold}}$ (default: $0.85$).
2. Items in the review queue are sorted by:
   - Lowest retrievability ($R$).
   - Prerequisite criticality (skills that unblock active learning goals).
3. If an item is due for review, ASTRION seamlessly interleaves a quick 1-question retrieval warmup at the start of a mentorship session before moving to new material.
