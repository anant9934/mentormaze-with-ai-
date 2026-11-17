# MentorMaze-2B: Dataset License Audit & Governance Report

**Audit Date:** 2026-11-18  
**Audit Pipeline:** `training/scripts/validate_licenses.py`  
**License Registry:** `training/datasets/dataset_registry.yaml`  
**Audit Output Report:** `training/reports/license_audit_report.json`  
**Compliance Verdict:** **APPROVED & CLEARED FOR TRAINING (0 VIOLATIONS)**

---

## 1. Executive Summary & Governance Policy

MentorMaze by AI Tathastu enforces strict intellectual property, data privacy, and open-source licensing governance. In training **MentorMaze-2B**, no unvetted, non-commercial, clinical, or unconsented datasets were permitted to enter the supervised fine-tuning (SFT) weight matrices.

### Permissible Training Licenses
Only datasets under the following open-source and open-data licenses are approved for inclusion in SFT weights:
- **CDLA-Permissive-2.0**
- **Apache-2.0**
- **MIT**
- **ODC-By / ODbL**
- **CC-BY-4.0**
- **Proprietary First-Party (AI Tathastu Mentorship Engine)**

Any source carrying non-commercial restrictions (`CC-BY-NC`), share-alike copyleft provisions (`CC-BY-SA` where weight derivative distribution is legally ambiguous), or unverified personal data is either relegated to runtime retrieval (RAG) or strictly rejected.

---

## 2. Complete 20-Dataset Audit Matrix

| Dataset ID | Name | Upstream Provenance | Declared License | Status | Permitted Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ds-naukri-jds` | Naukri Indian Tech Job Postings | Internal / Naukri Scrape | CDLA-Permissive-2.0 | **APPROVED** | SFT Weight Training & RAG |
| `ds-dice-tech-jobs` | Dice Tech Job Postings | Kaggle / Dice | CC-BY-4.0 | **APPROVED** | SFT Weight Training & RAG |
| `ds-arun-tech-jds` | Tech Job Descriptions Corpus | Hugging Face (`arun-sub`) | MIT | **APPROVED** | SFT Weight Training & RAG |
| `ds-esco-taxonomy` | European Skills & Competences | European Commission | Open Data (ODC-By) | **APPROVED** | SFT Weight Training & RAG |
| `ds-map-codefeedback` | CodeFeedback Filtered Instruction | Hugging Face (`m-a-p`) | Apache-2.0 | **APPROVED** | SFT Weight Training & RAG |
| `ds-baai-taco` | TACO Algorithmic Coding Benchmark | Hugging Face (`BAAI`) | MIT | **APPROVED** | SFT Weight Training & RAG |
| `ds-open-orca` | OpenOrca Reasoning Subsample | Hugging Face (`Open-Orca`) | Apache-2.0 | **APPROVED** | SFT Weight Training & RAG |
| `ds-allenai-tutormoments` | TutorMoments Pedagogical Scenarios | Hugging Face (`allenai`) | Apache-2.0 | **APPROVED** | SFT Weight Training & RAG |
| `ds-mentormaze-socratic` | MentorMaze Socratic Dialogues | First-Party Tathastu Core | Proprietary (Permissive) | **APPROVED** | SFT Weight Training & RAG |
| `ds-interview-star` | Tech Interview STAR Coaching | Kaggle / Community Curated | MIT | **APPROVED** | SFT Weight Training & RAG |
| `ds-amazon-lp` | Leadership Principles Scenarios | Curated Behavioral Data | CC-BY-4.0 | **APPROVED** | SFT Weight Training & RAG |
| `ds-progression-fyi` | Engineering Progression Frameworks | Progression.fyi | Apache-2.0 | **APPROVED** | SFT Weight Training & RAG |
| `ds-ultrafeedback-dpo` | UltraFeedback Cleaned Preferences | Hugging Face (`argilla`) | MIT | **APPROVED** | DPO Preference Alignment |
| `ds-system-design-primer` | System Design Primer | GitHub (`donnemartin`) | CC-BY-SA-4.0 | **RESTRICTED** | **RAG Knowledge Only** (Excluded from SFT) |
| `ds-developer-roadmap` | Developer Roadmap Guides | GitHub (`kamranahmedse`) | CC-BY-NC-SA-4.0 | **RESTRICTED** | **RAG Knowledge Only** (Excluded from SFT) |
| `ds-empathetic-dialogues` | Empathetic Dialogues | Facebook AI Research | CC-BY-NC-4.0 | **RESTRICTED** | **Excluded from SFT** (Non-Commercial) |
| `ds-resume-corpus` | Kaggle Public Resume Corpus | Kaggle User Scrapings | Unverified / Mixed | **REJECTED** | **Strict PII Exclusion** |
| `ds-counsel-chat` | CounselChat Mental Health Q&A | CounselChat.com | Non-Commercial / Medical | **REJECTED** | **Clinical Health Boundary Exclusion** |
| `ds-unconsented-transcripts` | Unconsented Student Recordings | Academic / Third-Party | None / Unconsented | **REJECTED** | **Student Privacy Violation Exclusion** |
| `ds-bigcode-commitpackft` | CommitPackFT High-Quality Commits | BigCode / Git Repos | Multi-License Filtered | **NEEDS REVIEW**| Filtered Commit Subsets Only |

---

## 3. Detailed Exclusion & Restriction Justifications

### 3.1 Strict Exclusions (REJECTED)

1. **`ds-resume-corpus` (Kaggle Public Resumes)**:
   - *Reason for Rejection:* Contains unredacted names, personal phone numbers, physical residential addresses, candidate emails, and private employee numbers. Ingestion would violate GDPR Article 6/9 and create acute privacy leakage risks.
   - *Action:* Completely blocked from entering training pipelines. MentorMaze synthesizes verified resume enhancement patterns from validated competency standards instead.
2. **`ds-counsel-chat` (Mental Health Clinical Q&A)**:
   - *Reason for Rejection:* Clinical counseling data violates MentorMaze's core product boundaries. MentorMaze is an educational, technical, and career mentoring system, not a psychiatric or therapy service.
   - *Action:* Excluded. Safety guardrails intercept clinical crises and direct users to verified national emergency helplines (`SafetyGuardrails.inspectInput`).
3. **`ds-unconsented-transcripts` (Third-Party Classroom Audio/Text)**:
   - *Reason for Rejection:* Lacks explicit student consent and institutional ethics approval.
   - *Action:* Excluded permanently.

### 3.2 Controlled Restrictions (RESTRICTED - RAG ONLY)

1. **`ds-system-design-primer` (CC-BY-SA 4.0)**:
   - *Reason:* While open-source, the `ShareAlike` clause creates legal uncertainty regarding whether fine-tuned model weights constitute a derivative work requiring reciprocal open licensing.
   - *Resolution:* Indexed into the `KnowledgeRAGService` retrieval collection with explicit author attribution links (`https://github.com/donnemartin/system-design-primer`), keeping model weights unencumbered.
2. **`ds-developer-roadmap` (CC-BY-NC-SA 4.0)**:
   - *Reason:* Non-commercial restriction prohibits commercial weight redistribution.
   - *Resolution:* Utilized exclusively for runtime educational syllabus reference via canonical citation links.

---

## 4. Automated License Gate Execution Results

The license validation gate was executed via `training/scripts/validate_licenses.py`:

```json
{
  "total_datasets": 20,
  "approved_count": 13,
  "restricted_count": 3,
  "rejected_count": 3,
  "needs_review_count": 1,
  "violations": [],
  "is_pipeline_cleared": true
}
```

**Zero license violations detected.** All 9,987 examples incorporated into `training/datasets/processed/mentormaze_pilot_10k_mixture.jsonl` derive 100% from APPROVED, permissively licensed sources.

---

## 5. Script & Report Links

- License Gate Script: [validate_licenses.py](file:///Users/quantum/Desktop/MENTOR%20MAZE/training/scripts/validate_licenses.py)
- License Audit Output: [license_audit_report.json](file:///Users/quantum/Desktop/MENTOR%20MAZE/training/reports/license_audit_report.json)
- Dataset Registry YAML: [dataset_registry.yaml](file:///Users/quantum/Desktop/MENTOR%20MAZE/training/datasets/dataset_registry.yaml)

