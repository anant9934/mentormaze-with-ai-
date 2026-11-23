# MENTORMAZE — PHASE 6: MODEL DEPLOYMENT DECISION & HYBRID INFERENCE ARCHITECTURE

**Platform:** MentorMaze by AI Tathastu ([mentormaze.aitathastu.com](https://mentormaze.aitathastu.com))  
**Model Family:** MentorMaze-2B  
**Primary Candidate:** `mentormaze-2b-core-sft-v2`  
**Baseline Candidate:** `mentormaze-2b-sft-v1`  
**Unified Mentor:** Dr. Aarav Mehta (Principal Mentor · AI Intelligence)  
**Decision Date:** November 18, 2026  

---

## 1. Formal Deployment Decision

### Verdict: **CONDITIONAL TIER-1 HYBRID DEPLOYMENT APPROVED**

The `mentormaze-2b-core-sft-v2` adapter is approved for deployment as **Tier-1 Local Intelligence** within the MentorMaze hybrid routing architecture, operating alongside cloud frontier models (Google Gemini / Groq) and the deterministic pedagogical fallback.

```
+---------------------------------------------------------------------------------------+
| STUDENT REQUEST (Prompt Composer / Specialist Workflow)                               |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
                     +-------------------------------------------+
                     | MODEL PROVIDER ROUTER                     |
                     | (lib/ai-mentor/model-provider-router.ts)  |
                     +-------------------------------------------+
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
                   v                                               v
+-------------------------------------+         +-------------------------------------+
| TIER 1: LOCAL MENTORMAZE-2B         |         | TIER 2: CLOUD FRONTIER ADAPTERS     |
| (Qwen3.5-2B + core-sft-v2 on MPS)   |         | (Google Gemini / Groq Llama-3.3)    |
| Status: ACTIVE on :8000             |         | Status: ACTIVE (Fallback & Deep)    |
| Cost: $0.00 / zero marginal         |         | Context: Up to 1M tokens            |
| Scope:                              |         | Scope:                              |
|  - Socratic Hints & Invariants      |         |  - Full ATS Resume PDF Parsing      |
|  - Coding & DSA Walkthroughs        |         |  - 24-Week Career Roadmaps          |
|  - Code Review & Bug Traps          |         |  - High-Volume Admin Evaluations    |
|  - Multilingual Hindi/Hinglish      |         +-------------------------------------+
+-------------------------------------+                            |
                   |                                               |
                   +-----------------------+-----------------------+
                                           |
                                           v
                        +-------------------------------------+
                        | TIER 3: DETERMINISTIC ENGINE        |
                        | (Pedagogical Rule-Based Fallback)   |
                        | Status: ALWAYS READY (Offline Safe) |
                        +-------------------------------------+
```

---

## 2. Decision Matrix & Comparative Trade-offs

| Dimension | Option A: Base Qwen3.5-2B | Option B: SFT v1 (25-step) | Option C: SFT v2 (Step 4) | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Socratic Persona** | Weak (Direct textbook answers) | Moderate (Template-heavy badges) | **Strong (Natural pedagogical scaffolding)** | **Option C** |
| **State Tracking** | N/A | Missing optimizer state | **Complete (`trainer_state.pt` saved)** | **Option C** |
| **Inference Latency** | 6.84s | 6.73s | 7.36s (3.32s short responses) | **Option C** |
| **Token Cost** | $0.00 | $0.00 | **$0.00** | **Option C** |
| **Vulnerability Detection** | Basic | Good | **Structured & Actionable** | **Option C** |
| **Rollback Safety** | N/A | Available as manual fallback | **Instant via `MENTORMAZE_ADAPTER_PATH`** | **Option C** |

---

## 3. Operational Deployment Guidelines

### 1. Workload Partitioning:
- **Route to Local MentorMaze-2B (`v2`):**
  - Daily Socratic concept inquiries ("Explain DP", "How does epoll work?").
  - Rapid code review snippets (<50 lines).
  - Algorithmic invariants and complexity proofs.
  - Conversational Hindi and Hinglish mentoring.
- **Escalate to Cloud Tier (Gemini / Groq):**
  - Prompts exceeding 512 tokens.
  - Multi-file repository audits.
  - Comprehensive 24-week career milestone roadmaps.

### 2. Failure Recovery & High Availability:
- The Next.js provider router tests `GET /v1/health` with a 2.5-second timeout.
- If the local daemon restarts or the device enters sleep mode, the router automatically reroutes the active request to Tier-2 without displaying an error to the student.

---

## 4. Roadmap for Next SFT Training Cycle (Phase 7)

Before launching a full-epoch training run across all 8,488 training examples:
1. **De-duplicate Synthetic Templates:** Clean `train.jsonl` using a script that removes the repetitive `"Spot on! Exactly right."` prefixes (1,700 samples) and markdown headers, ensuring the model trains on diverse conversational phrasing.
2. **Dynamic Sequence Padding:** Implement dynamic batch-level padding rather than fixed 512-token sequence lengths to further accelerate training throughput.
3. **Automated Checkpoint Pruning:** Maintain the top 3 checkpoints by validation perplexity, persisting `trainer_state.pt` at every 50 optimizer steps.

