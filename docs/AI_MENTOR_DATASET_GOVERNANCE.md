# Dataset Governance & Licensing Registry

**System:** MentorMaze AI Mentor  
**Component:** Dataset Vetting, Commercial Licensing, PII Scrubbing, and Usage Classification  
**Reference File:** `lib/ai-mentor/dataset-governance.ts`

---

## 1. Candidate Dataset Evaluation Matrix

Before any dataset is accepted into MentorMaze's retrieval, evaluation, or training pipelines, it undergoes legal and ethical vetting.

| Dataset Name | Publisher | License | Commercial Allowed | PII Status | Intended Use | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`m-a-p/CodeFeedback-Filtered-Instruction`** | M-A-P | Apache 2.0 | **Yes** | Scrubbed | SFT Training | **Approved** |
| **`BAAI/TACO`** | BAAI | MIT | **Yes** | Synthetic | Evaluation Holdout | **Approved** |
| **`argilla/ultrafeedback-binarized-preferences-cleaned`** | Argilla | MIT | **Yes** | Scrubbed | DPO Training | **Approved** |
| **`facebook/empathetic_dialogues`** | Meta AI | CC-BY-NC 4.0 | **No** | Scrubbed | Academic Benchmark | **Restricted** (No commercial model training) |
| **`nbertagnolli/counsel-chat`** | Community | MIT | N/A | Unverified | Excluded | **Rejected** (Clinical therapy risks) |
| **`allenai/tutormoments-preview`** | AI2 | ODC-BY | **Yes** | Scrubbed | Retrieval & Scaffolding | **Approved** |
| **MentorMaze Consented Mentorship Corpus** | AI Tathastu | Proprietary | **Yes** | Scrubbed | SFT & DPO | **Approved** (Explicit student consent only) |

---

## 2. PII Scrubbing & Personal Data De-Identification

MentorMaze employs regex and structural token analyzers for all ingested corpora:
- **Email Addresses**: Replaced with `[EMAIL_REDACTED]`.
- **Indian Phone Numbers**: 10-digit mobile numbers with optional `+91` replaced with `[PHONE_REDACTED]`.
- **Registration / Student IDs**: Strip institutional identifiers.
- **Human Mentorship Sessions**: Private 1:1 chat logs are strictly excluded by default; only explicitly student-approved summary takeaways are permitted into the corpus.

---

## 3. Strict Boundary Rules

1. **No Counseling Datasets**: Datasets originating from licensed clinical counseling or psychiatric interactions (such as `counsel-chat`) are categorically rejected. MentorMaze provides technical, academic, and career mentorship; it is not a healthcare or therapy system.
2. **Attribution Preservation**: All open-source datasets (Apache 2.0, MIT, ODC-BY) preserve upstream copyright notices and licenses in `dataset_registry`.

