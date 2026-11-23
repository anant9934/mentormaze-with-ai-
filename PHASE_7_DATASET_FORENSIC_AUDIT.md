# MENTORMAZE — PHASE 7: DATASET FORENSIC AUDIT & STATISTICAL PROFILE

**Project:** MentorMaze-2B Specialised Language Model  
**Platform:** MentorMaze by AI Tathastu ([mentormaze.aitathastu.com](https://mentormaze.aitathastu.com))  
**Audited Datasets:** `train.jsonl` (8,488 records), `valid.jsonl` (998 records), `test.jsonl` (501 records)  
**Audit Source File:** `training/reports/phase7_dataset_forensic_audit.json`  
**Execution Environment:** Apple Silicon M4 (Darwin 24.3.0, Python 3.12.8)  
**Audit Date:** November 18, 2026  

---

## 1. Executive Summary

A forensic sample-by-sample audit was conducted across all 9,987 examples in the original MentorMaze dataset splits. The primary mandate was empirical verification: evaluating whether 8,488 training JSONL lines represent 8,488 independent, high-quality learning examples or whether systemic construction patterns, synthetic template uniformity, and data duplication compromised training efficacy.

### Major Forensic Findings:
1. **Zero Exact Duplicates across Splits:** All 8,488 training records possess unique normalized SHA-256 hashes ($0$ exact text duplicates).
2. **Cross-Split Leakage Confirmed at 0.00%:** Prompt and completion overlap across Train $\cap$ Valid, Train $\cap$ Test, and Valid $\cap$ Test is strictly **0 samples**.
3. **Severe Assistant Output Duplication (1,627 Duplicate Completions):** While full records were unique due to varying prompt IDs, **1,627 assistant completions (19.17% of training split)** were exact duplicates of other completions in the corpus.
4. **Synthetic Template Monoculture (54.22% Skew):** Over half of all assistant responses in the training split were dictated by 5 hardcoded synthetic prefix templates:
   - Socratic Tutoring: **1,700 samples (100% of socratic dialogues)** began with `"Spot on! Exactly right."`
   - ESCO Competencies: **1,007 samples** cycled through only 5 distinct skill concepts ~200 times each.
   - STAR Behavioral Coaching: **850 samples** opened with identical header `### 🎙️ STAR Interview Coach Feedback`.
   - Engineering Career Progression: **850 samples** opened with `### 📈 Engineering Career Calibration:`.
   - Career Architecture / JDs: **1,118 samples** opened with `### 📋 Career Architecture:`.
5. **Extreme Language Imbalance:** The training set contained **8,487 English records (99.99%)**, 1 Hindi record, and 0 Hinglish records.
6. **Turn-Count Bimodality:** Exactly 6,788 records (79.97%) were single-turn (system + user + assistant), and 1,700 records (20.03%) were 4-turn dialogues. Zero intermediate or extended dialogues existed.
7. **Truncation Vulnerabilities:** **319 records (3.76%)** ended abruptly mid-sentence without closing punctuation, indicating premature generation cutoffs during upstream scraping or synthesis.

---

## 2. Statistical Profile Matrix (Training Split: 8,488 Samples)

| Metric / Dimension | Value | Audit Notes |
| :--- | :--- | :--- |
| **Total Records** | **8,488** | Manifest line count verified |
| **Unique Record Hashes (SHA-256)** | **8,488** | 100% unique full-dialogue strings |
| **Exact Duplicate Records** | **0** | No identical whole-dialogue lines |
| **Exact Prompt Duplicates** | **0** | No identical prompts across samples |
| **Exact Assistant Duplicates** | **1,627** | High duplication in ESCO and leveling completions |
| **Sampled Near-Duplicates (>90% Sim)** | **230 pairs** | Sampled across first 1,500 prompts |
| **User Prompt Length (Mean / Median / Max)** | 464.7 / 327.0 / 4,134 chars | 95th percentile: 1,366.3 chars |
| **Assistant Length (Mean / Median / Max)** | 916.1 / 502.0 / 7,224 chars | 95th percentile: 2,612.3 chars |
| **Total Sample Length (Mean / Median / Max)** | 1,615.9 / 1,247.0 / 8,445 chars | Average token footprint: ~404 tokens |
| **Turn Count Distribution** | 3 turns: 6,788 (80.0%)<br>5 turns: 1,700 (20.0%) | Bimodal; zero natural conversational variation |
| **Code-Content Proportion** | **2,425 samples (28.57%)** | Contains markdown code fences or keywords |
| **Math-Content Proportion** | **1,180 samples (13.90%)** | Contains LaTeX `$`, $O(N)$, or summation tokens |
| **Empty or Malformed Records** | **0** | All records parsed into valid JSON with roles |
| **Truncated Samples** | **319 samples (3.76%)** | Records ending mid-sentence without punctuation |
| **Multi-Turn Tutoring vs Single-Turn** | 1,700 Multi / 6,788 Single | Multi-turn restricted entirely to Socratic split |

---

## 3. Analysis of Assistant Opening Phrase Distributions

An analysis of the leading 10 words across all 10,188 assistant turns in `train.jsonl` demonstrates extreme synthetic clustering:

```
+-----------------------------------------------------------------------------------------+
| TOP 10 ASSISTANT OPENING TOKENS IN TRAINING SPLIT (10,188 Total Turns)                 |
+----------------------------------------------------+------------------+-----------------+
| Opening Phrase (Leading Words)                     | Turn Count       | Percentage      |
+----------------------------------------------------+------------------+-----------------+
| "### 🎙️ STAR Interview Coach Feedback..."          | 850 turns        | 8.34%           |
| "### 🎯 ESCO & Industry Competency Standard:..."    | 1,007 turns      | 9.88%           |
| "### 📈 Engineering Career Calibration:..."        | 850 turns        | 8.34%           |
| "### 📋 Career Architecture:..."                   | 1,118 turns      | 10.97%          |
| "Let's break down [Topic] methodically..."         | 1,700 turns      | 16.69%          |
| "Spot on! Exactly right. In [Topic]..."            | 1,700 turns      | 16.69%          |
| Generic Markdown Headers ("### ...")               | 3,825 turns      | 37.54%          |
| Direct Code Blocks ("def ...", "import ...")       | 274 turns        | 2.69%           |
| Conversational Openers ("Here is...", "To...")     | 1,320 turns      | 12.96%          |
+----------------------------------------------------+------------------+-----------------+
| CUMULATIVE TOP 5 SYNTHETIC FORMULAS                | 5,525 turns      | 54.22%          |
+----------------------------------------------------+------------------+-----------------+
```

### Forensic Root Cause of Synthetic Clustering:
1. **`sft_mentormaze_socratic_pedagogy.jsonl` (1,700 samples):**
   Every dialogue followed an identical 4-turn state machine:
   - Turn 0 (User): *"I am debugging my implementation of [Topic]..."*
   - Turn 1 (Assistant): *"Let's break down [Topic] methodically. Consider the invariant..."*
   - Turn 2 (User): *"For problem case #1, I believe If the invariant holds, edge case terminates safely."*
   - Turn 3 (Assistant): *"Spot on! Exactly right. In [Topic], explicitly maintain..."*
   **Impact:** The optimizer learned that Turn 3 *always* begins with `"Spot on! Exactly right."`, driving down loss without learning contextual validation.
2. **`sft_naukri_jds.jsonl` (1,118 samples):**
   `normalize_schema.py` injected an unvarying template starting with `"### 📋 Career Architecture: {title} Competency Breakdown"`.
3. **`build_mixture.py` ESCO Shortfall Loop (1,007 samples):**
   To hit an arbitrary 2,500 career target, the script ran a cyclic modulus loop over only 5 hardcoded tuples (Distributed Caching, Database Indexing, Asynchronous I/O, Container Orchestration, High-Dimensional Search), creating ~200 near-identical copies of each topic.

---

## 4. Cross-Split Leakage & Isolation Audit

A cryptographic hash comparison was performed across the user prompts and assistant completions:

| Split Comparison | Prompt Overlap | Completion Overlap | Leakage Verdict |
| :--- | :--- | :--- | :--- |
| **Train $\cap$ Validation** | **0 / 998 (0.00%)** | **0 / 998 (0.00%)** | **CLEAN (Zero Leakage)** |
| **Train $\cap$ Test** | **0 / 501 (0.00%)** | **0 / 501 (0.00%)** | **CLEAN (Zero Leakage)** |
| **Validation $\cap$ Test** | **0 / 501 (0.00%)** | **0 / 501 (0.00%)** | **CLEAN (Zero Leakage)** |

**Conclusion:** The dataset split boundaries were preserved without direct string leakage. However, because both validation and test sets shared the same synthetic template prefixes, validation loss reflected template memorization rather than pure out-of-distribution reasoning.

---

## 5. Truncation and Malformed Sample Audit

- **Empty / Malformed JSON Lines:** **0 lines** (100% compliant JSON Lines schema).
- **Truncated Mid-Sentence Completions:** **319 records (3.76%)** were identified where the assistant's final sentence was cut off without closing punctuation (e.g., ending with words like *"because the", "when the pointer is", "in order to"*).
- **Unclosed Code Fences:** **10 records** contained unbalanced triple-backticks (` ``` `), which break frontend markdown parsers.
- **Action Taken:** All 10 unclosed code fence records and corrupted samples were segregated into `training/datasets/mentormaze-v2/quarantine.jsonl`.

