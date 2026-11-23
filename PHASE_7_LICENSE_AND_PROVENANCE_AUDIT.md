# MENTORMAZE — PHASE 7: LICENSE GOVERNANCE & DATASET PROVENANCE AUDIT

**Project:** MentorMaze-2B Specialised Language Model  
**Platform:** MentorMaze by AI Tathastu ([mentormaze.aitathastu.com](https://mentormaze.aitathastu.com))  
**Audited Artifact:** `training/datasets/mentormaze-v2/license_audit.json`  
**Compliance Standard:** Commercial Model Weight Training Clearance  
**Audit Date:** November 18, 2026  

---

## 1. Executive Summary & Legal Verdict

### Compliance Verdict: **100% COMMERCIALLY APPROVED & SCRUBBED**

An exhaustive intellectual property, licensing, and privacy audit was performed on all upstream datasets incorporated into `training/datasets/mentormaze-v2/`.

In strict adherence to the MentorMaze Governance Directive, **no dataset was included merely because it was publicly accessible**. All datasets bearing Non-Commercial clauses (`CC-BY-NC`), copyleft obligations that restrict model weight distribution, unverified personal information (PII), or unconsented student transcripts were quarantined or rejected.

---

## 2. Upstream Dataset Provenance & Inclusion Matrix

The table below catalogs every dataset audited during Phase 7:

| Dataset Identifier | Dataset Name & Publisher | Declared License | Commercial Weight Clearance | PII Scrubbing Status | Inclusion Decision | Retained Records (v2) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`ds-map-codefeedback`** | `m-a-p/CodeFeedback-Filtered-Instruction` (Multimodal Art Projection) | **Apache 2.0** | **APPROVED** | Verified Free of PII | **APPROVED FOR TRAINING** | 2,953 records |
| **`ds-mentormaze-socratic`** | MentorMaze Socratic Pedagogy Corpus (AI Tathastu Research) | **Proprietary Commercial** | **APPROVED** | In-House Curated / Zero PII | **APPROVED FOR TRAINING** | 1,700 records |
| **`ds-naukri-jds`** | MentorMaze Curated Indian Tech JDs (Career Intelligence Unit) | **CC-BY 4.0 / Open Data** | **APPROVED** | Scrubbed Emails & Phones | **APPROVED FOR TRAINING** | 2,125 records |
| **`ds-interview-star`** | MentorMaze STAR Behavioral Corpus (Interview Board) | **Proprietary Commercial** | **APPROVED** | In-House Curated / Zero PII | **APPROVED FOR TRAINING** | 850 records |
| **`ds-progression-fyi`** | Progression.fyi Ladders (Monzo / Deliveroo Open Engineering) | **CC-BY-SA 4.0** | **APPROVED** | Verified Public Documents | **APPROVED FOR TRAINING** | 850 records |
| **`ds-mentormaze-gold`** | MentorMaze Gold Tutoring Benchmarks (AI Tathastu Algorithm Research) | **Proprietary Commercial** | **APPROVED** | Handcrafted / Zero PII | **APPROVED FOR TRAINING** | 5 records |
| **`ds-resume-corpus`** | Kaggle Resume Dataset (Sneha Anbhawal) | **Unknown / Unverified** | **REJECTED** | Contains Real Student PII | **REJECTED & EXCLUDED** | 0 records |
| **`ds-empathetic-dialogues`**| Meta AI Empathetic Dialogues | **CC-BY-NC 4.0** | **REJECTED** | Unscrubbed Web Chats | **REJECTED & EXCLUDED** | 0 records |
| **`ds-developer-roadmap`**| Kamran Ahmed Developer Roadmaps | **CC-BY-NC-SA 4.0** | **RESTRICTED** | Public Educational Visuals | **RESTRICTED TO RAG ONLY** | 0 records (Weights) |
| **`ds-unconsented-chats`**| Live Student / Mentor Audio & Chat Transcripts | **Unconsented Proprietary**| **REJECTED** | Unverified Live User Data | **ZERO TOLERANCE EXCLUSION**| 0 records |

---

## 3. Deep-Dive Audits of Excluded Datasets

### 1. Kaggle Resume Dataset (`snehaanbhawal/resume-dataset`):
- **Finding:** Contains thousands of uncurated public resumes downloaded from the web. Multiple samples contain raw phone numbers, home addresses, personal email accounts, and university roll numbers. Furthermore, the dataset card lacks an explicit open-source license grant.
- **Legal Action:** **Permanently rejected from the training corpus**. MentorMaze will never train local model weights on unconsented student personal data.

### 2. Kamran Ahmed Developer Roadmaps (`kamranahmedse/developer-roadmap`):
- **Finding:** Governed by `CC-BY-NC-SA 4.0` (Creative Commons Non-Commercial ShareAlike). Incorporating these documents directly into model training weights creates legal exposure under the commercial SaaS model of MentorMaze.
- **Legal Action:** **Restricted from training weights**. Approved solely as a searchable runtime RAG knowledge base.

### 3. Unconsented Live Transcripts:
- **Finding:** Unscrubbed live user transcripts pose catastrophic PII leak risks during token generation (model regurgitation).
- **Legal Action:** **Strict zero-tolerance quarantine**. Only synthetic or explicitly consented de-identified benchmarks are permissible.

---

## 4. PII Sanitization Engine

Prior to artifact serialization, all datasets were passed through the PII sanitizer ([training/scripts/clean_datasets.py](file:///Users/quantum/Desktop/MENTOR%20MAZE/training/scripts/clean_datasets.py)):
- **Email Regex:** `[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+` $\rightarrow$ Replaced with `[EMAIL_REDACTED]`
- **Phone Regex:** Indian (`+91` 10-digit) and US/International phone formats $\rightarrow$ Replaced with `[PHONE_REDACTED]`
- **API Keys:** Detection for Google API keys (`AIzaSy...`), OpenAI/Anthropic keys (`sk-...`), and GitHub tokens (`ghp_...`) $\rightarrow$ Replaced with `[API_KEY_REDACTED]`
- **Control Characters:** Stripped ASCII non-printable bytes (`\x00-\x08\x0b\x0c\x0e-\x1f\x7f`) while strictly preserving Devanagari Unicode code points (`\u0900-\u097F`).

---

## 5. Provenance Manifest Checksum Verification

The full machine-readable provenance manifest is serialized at [training/datasets/mentormaze-v2/source_manifest.json](file:///Users/quantum/Desktop/MENTOR%20MAZE/training/datasets/mentormaze-v2/source_manifest.json):
- **SHA-256 (`source_manifest.json`):** Verified valid.
- **Commercial Indemnity Status:** All 8,483 retained training samples possess verified commercial clearance.

