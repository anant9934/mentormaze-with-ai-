# MENTORMAZE — PHASE 7: NEW DATASET MANIFEST & ARTIFACT INVENTORY

**Project:** MentorMaze-2B Specialised Language Model  
**Platform:** MentorMaze by AI Tathastu ([mentormaze.aitathastu.com](https://mentormaze.aitathastu.com))  
**Artifact Directory:** `training/datasets/mentormaze-v2/`  
**Dataset Version:** `2.0.0-phase7`  
**Release Date:** November 18, 2026  

---

## 1. Executive Summary

This manifest documents the versioned, cryptographic inventory of **`mentormaze-v2`**, the new gold-standard training and evaluation corpus for the MentorMaze-2B language model family.

In accordance with strict reproducibility directives, **no source data was overwritten**. The original datasets in `training/datasets/manifests/` and `training/datasets/raw/` remain preserved and unmodified. All newly cleaned, de-biased, deduplicated, and scored records reside exclusively in `training/datasets/mentormaze-v2/`.

---

## 2. Dataset Artifact Inventory & Cryptographic Checksums

The table below lists every artifact in `training/datasets/mentormaze-v2/` along with exact file sizes, line counts, and SHA-256 checksums:

| File Name | File Size (Bytes) | Record Count | SHA-256 Cryptographic Checksum | Purpose & Description |
| :--- | :--- | :--- | :--- | :--- |
| **`train.jsonl`** | 16,571,610 | **7,211** | `164c3dc69e82d19e3cfa4f4570669a6743872564c6e0bd155ab3cdefb979eff1` | De-biased primary training partition (85.0% split). |
| **`validation.jsonl`**| 2,000,795 | **848** | `f7bc8722be52b383c4be33b653ac0b63e7c0cc6aaea3a2e8aeedfd3e051a8e8b` | Held-out validation split for checkpoint monitoring (10.0% split). |
| **`test.jsonl`** | 973,203 | **424** | `685cb487bacd8b3b732debe9e4ebe6ffa913a5ebd37a1d8be708e1f1382d623c` | Independent test evaluation split (5.0% split). |
| **`quarantine.jsonl`**| 35,677 | **10** | `7b9e49f388e899c9839d323075c6c1ac0a42dbedcd93c5657c54115070ac2bf4` | Segregated records failing quality checks (<7.0 pts). |
| **`dataset_manifest.json`**| 1,161 | — | `e612803b9f365d91e6b36a71bbdc2ea8540dbef07f7bce6e71958b4dbd7120ae` | Machine-readable split definitions and checksum ledger. |
| **`source_manifest.json`** | 2,366 | — | `9bc16954a1795ad1c4f526eb6808779b5cbeec1563f82cb34ae9286ebc59fa20` | Detailed provenance records for all upstream sources. |
| **`quality_report.json`** | 187 | — | `2d4090b34336c2ef6476b772e259e8647cbb6cf561f77d3aa05047aebe0b439c` | Statistical distribution of 10-point quality scores. |
| **`deduplication_report.json`**| 128 | — | `9beaaae1540cb84a6c867258457eec07797825b0da9df43d4c6792348cb92b87` | Exact and near-duplicate filtering report. |
| **`template_bias_report.json`**| 951 | — | `e2a44e6dcf9f5d34208a9db0b8093e75355a1d74a62174360e263cbb982d1fbc` | Before-and-after template frequency comparison. |
| **`domain_distribution.json`** | 283 | — | `63604f329971a80e15998df991a029db0058b8f2bf12cf8b07ff30fa90e1f74a` | Primary and secondary 15-domain breakdown. |
| **`license_audit.json`** | 3,019 | — | `8dc238f9b90c0ef53f0985223ab8d3fb8f48030ae0259b042949646f8aa54a1d` | Legal clearance audit and commercial permissions. |
| **`evaluation_benchmark.json`**| 14,366 | 15 tasks | `6f32e92c2a0d182585fbc9a8d9a46320a2334f59ea0c4df1cb55f528bfce7449` | 15-domain held-out evaluation tasks and rubrics. |

---

## 3. Split Isolation & Non-Leakage Proof

Cross-split prompt and completion leakage was evaluated across the newly partitioned sets:
- **`train.jsonl` $\cap$ `validation.jsonl` Prompt Overlap:** **0 samples (0.00%)**
- **`train.jsonl` $\cap$ `test.jsonl` Prompt Overlap:** **0 samples (0.00%)**
- **`validation.jsonl` $\cap$ `test.jsonl` Prompt Overlap:** **0 samples (0.00%)**

Every partition represents an isolated group of records, guaranteeing that validation loss tracks true generalization across unseen student interactions.

---

## 4. Preservation of Source Datasets

To ensure non-destructive engineering, the source datasets remain intact at their original paths:
- `training/datasets/manifests/train.jsonl` (8,488 lines, SHA-256: `5cddceb3...`) — **UNMODIFIED**
- `training/datasets/manifests/valid.jsonl` (998 lines, SHA-256: `336a8ce6...`) — **UNMODIFIED**
- `training/datasets/manifests/test.jsonl` (501 lines, SHA-256: `198ad249...`) — **UNMODIFIED**
- `training/datasets/raw/` (9,000 raw lines across 5 files) — **UNMODIFIED**

