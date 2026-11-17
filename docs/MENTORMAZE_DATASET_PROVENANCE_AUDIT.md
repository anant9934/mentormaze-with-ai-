# MentorMaze-2B: Comprehensive Dataset Provenance & Governance Audit

**Project:** `MentorMaze-2B Specialised Language Model`  
**Platform:** MentorMaze by AI Tathastu (`https://mentormaze.aitathastu.com`)  
**Audit Standard:** Zero-Fabrication Mandate, Legal Permissiveness & Ethical AI  
**Audit Date:** November 18, 2026  
**Total Canonical Dataset:** 9,987 Examples (8,488 Train / 998 Valid / 501 Test)  

---

## 1. Provenance Architecture Overview

The MentorMaze-2B fine-tuning corpus was engineered to produce a specialized technical and career mentor, deliberately avoiding generic web conversational data. The complete dataset consists of exactly **9,987 verified instruction-response pairs** spanning five pedagogical and domain-specific verticals.

```
Total Curated Pool: 9,987 Examples
├── 1. Technical / DSA (3,487 examples | 34.915%)
├── 2. Career & Job Intelligence (2,500 examples | 25.033%)
├── 3. Socratic Pedagogy (2,000 examples | 20.026%)
├── 4. STAR Behavioral Coaching (1,000 examples | 10.013%)
└── 5. Engineering Career Leveling (1,000 examples | 10.013%)
```

---

## 2. Deep Provenance Tracing by Domain

### 2.1 Domain 1: Technical & DSA (3,487 Examples | 34.915%)
- **Primary Source Catalog:** `ds-map-codefeedback` (m-a-p/CodeFeedback-Filtered-Instruction) & `ds-baai-taco` (BAAI/TACO).
- **Upstream License:** Apache 2.0 / MIT.
- **Content Description:** Multi-turn code review, algorithmic edge-case debugging, asymptotic complexity proofs, and concurrency invariants in TypeScript, Python, Rust, Go, and SQL.
- **Curation Pipeline:**
  - Removed single-line trivial solutions and non-English comments.
  - Retained problems with explicit time/space complexity proofs.
  - Verified syntax validity and test case coverage.
  - Final deduplicated volume: 3,487 examples (after removing 13 near-duplicate problem variations).

### 2.2 Domain 2: Career Intelligence & Indian Tech Market (2,500 Examples | 25.033%)
- **Primary Source Catalog:** `ds-naukri-jds` (MentorMaze Curated Indian Tech JDs) & `ds-esco-taxonomy` (European Skills Competences Taxonomy).
- **Upstream License:** Curated OER / CC-BY 4.0 / Public Sector Open Data.
- **Content Description:** Tech job descriptions from Bengaluru, Hyderabad, Pune, Gurgaon, and Noida, normalized into mandatory vs. preferred skills, experience bands, and role progression paths.
- **Curation Pipeline:**
  - Scrubbed employer contact details, recruiter emails, and company phone numbers.
  - Integrated Randstad 2025–26 salary benchmark bands (treated as market reference only, never contractual guarantees).
  - Mapped raw job skills to ESCO software engineering taxonomies.

### 2.3 Domain 3: Socratic Pedagogy & Scaffolding (2,000 Examples | 20.026%)
- **Primary Source Catalog:** `ds-mentormaze-socratic` & `ds-allenai-tutormoments`.
- **Upstream License:** Apache 2.0 / CC-BY 4.0.
- **Synthesis & Curation Method:**
  - **Teacher Models:** High-capability foundation models (Llama-3-70B-Instruct & Gemini 1.5 Pro) steered by MentorMaze pedagogical system prompts.
  - **Core Pedagogy Rule:** The assistant must *never* output a complete code solution on the first or second turn when a student expresses confusion. Instead, it must formulate targeted inquiries probing invariant conditions, boundary cases, and state transitions.
  - **Quality Gates & Filter Rules:**
    1. Multi-turn dialogue structure (`system` $\rightarrow$ `user` $\rightarrow$ `assistant` $\rightarrow$ `user` $\rightarrow$ `assistant`).
    2. Length sanity: Minimum 120 characters, maximum 1,500 tokens.
    3. Heuristic Socratic Check: Assistant responses must contain at least one question mark (`?`) directing student inquiry and zero complete runnable functions on initial turns.
  - **Rejection Statistics:** Out of 2,342 candidate synthesized pairs, 342 (14.6%) were rejected for premature code dumping or rhetorical passivity, yielding exactly 2,000 high-adherence Socratic pairs.

### 2.4 Domain 4: STAR Behavioral Coaching (1,000 Examples | 10.013%)
- **Primary Source Catalog:** `ds-interview-star` & `ds-amazon-lp`.
- **Upstream License:** CC-BY-SA 4.0 / MIT.
- **Content Description:** Critique and structuring of engineering interview answers using the STAR framework (Situation, Task, Action, Result).
- **Zero-Fabrication Enforcement:**
  - Evaluates candidate statements for unverified metrics (e.g. "reduced latency by 10,000%").
  - Teaches candidates to defend only mathematically verified or personally benchmarked metrics.
  - Enforces ethical framing of system outages and technical conflicts.

### 2.5 Domain 5: Engineering Career Leveling (1,000 Examples | 10.013%)
- **Primary Source Catalog:** `ds-progression-fyi`.
- **Upstream License:** CC0 / MIT.
- **Content Description:** Engineering leveling matrices mapping competencies across:
  - **L3 (SDE-1 / Junior):** Task execution, unit testing, seeking guidance on boundaries.
  - **L4 (SDE-2 / Mid-Level):** End-to-end feature ownership, operational excellence, self-directed debugging.
  - **L5 (Senior SDE):** System architecture, cross-service contracts, incident command, mentoring junior peers.
  - **L6 (Staff / Principal):** Multi-quarter technical strategy, RFC authorship, cross-organizational influence.

---

## 3. Comprehensive License Registry Audit (20 Sources)

The MentorMaze dataset registry (`training/datasets/dataset_registry.yaml`) was audited across all 20 cataloged sources:

| # | Dataset ID | Declared License | Status | Compliance Verdict & Usage |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `ds-naukri-jds` | Curated OER / CC-BY 4.0 | **APPROVED** | Scrubbed Indian tech JDs; skill gap roadmaps. |
| 2 | `ds-dice-tech-jobs` | CC0: Public Domain | **APPROVED** | US tech job postings; role standardization. |
| 3 | `ds-arun-tech-jds` | MIT License | **APPROVED** | Structured tech JD skill pairings. |
| 4 | `ds-esco-taxonomy` | Public Sector OER (EU) | **APPROVED** | Standard software engineering skill taxonomy. |
| 5 | `ds-map-codefeedback` | Apache 2.0 | **APPROVED** | Multi-turn code feedback and debugging. |
| 6 | `ds-baai-taco` | Apache 2.0 | **APPROVED** | Algorithmic code problems with test cases. |
| 7 | `ds-open-orca` | MIT License | **APPROVED** | Step-by-step reasoning demonstrations. |
| 8 | `ds-allenai-tutormoments` | CC-BY 4.0 | **APPROVED** | Socratic pedagogical tutoring dialogs. |
| 9 | `ds-mentormaze-socratic` | Proprietary CC-BY 4.0 | **APPROVED** | Synthesized Socratic invariant dialogues. |
| 10 | `ds-interview-star` | CC-BY-SA 4.0 | **APPROVED** | Behavioral STAR critique conversations. |
| 11 | `ds-amazon-lp` | MIT License | **APPROVED** | Leadership principle situational evaluations. |
| 12 | `ds-progression-fyi` | CC0: Public Domain | **APPROVED** | Engineering career ladder competency matrices. |
| 13 | `ds-ultrafeedback-dpo` | MIT License | **APPROVED** | Preference pairs reserved for DPO alignment. |
| 14 | `ds-system-design-primer` | CC-BY-NC-SA 4.0 | **RESTRICTED** | **EXCLUDED.** Non-commercial restriction violates training policy. |
| 15 | `ds-developer-roadmap` | CC-BY-NC-SA 4.0 | **RESTRICTED** | **EXCLUDED.** Non-commercial restriction violates training policy. |
| 16 | `ds-empathetic-dialogues` | CC-BY-NC 4.0 | **RESTRICTED** | **EXCLUDED.** Non-commercial restriction violates training policy. |
| 17 | `ds-resume-corpus` | Unverified Scraping | **REJECTED** | **EXCLUDED.** Contains personal candidate PII. |
| 18 | `ds-counsel-chat` | Clinical therapy data | **REJECTED** | **EXCLUDED.** Clinical mental health data violates scope. |
| 19 | `ds-unconsented-transcripts`| Proprietary raw logs | **REJECTED** | **EXCLUDED.** Unconsented student audio/chat data rejected. |
| 20 | `ds-bigcode-commitpackft` | Permissive Repo Filtered| **NEEDS_REVIEW** | **EXCLUDED FROM PILOT.** Pending individual commit license check. |

**Summary Metrics:**
- **Approved Datasets:** 13 (65%)
- **Restricted Datasets:** 3 (15%)
- **Rejected Datasets:** 3 (15%)
- **Needs Review:** 1 (5%)
- **Total Cataloged:** 20 (100%)

---

## 4. Privacy, Anonymization & PII Scrubbing

Prior to tokenization and ingestion, all approved datasets were processed through the multi-stage privacy scrubber (`clean_datasets.py`):
1. **Email Scrubbing:** All pattern-matching regexes for emails (`[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+`) replaced with `[REDACTED_EMAIL]`.
2. **Phone Number Masking:** Indian (+91) and international telephone patterns masked with `[REDACTED_PHONE]`.
3. **Identity & Social Profile Masking:** LinkedIn, GitHub usernames, and personal portfolios stripped or replaced with generic placeholders (`[CANDIDATE_NAME]`, `[COMPANY_NAME]`).
4. **Zero Live Student Chat Leakage:** No unconsented production user transcripts were permitted into the training mixture.

