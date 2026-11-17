#!/usr/bin/env python3
"""
MentorMaze-2B: License Validation & Governance Gate
Verifies that only APPROVED, commercially permissive datasets enter the SFT pipeline.
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import sys
import yaml
import json
from pathlib import Path

REGISTRY_PATH = Path("training/datasets/dataset_registry.yaml")
REPORT_PATH = Path("training/reports/license_audit_report.json")

PERMISSIBLE_LICENSES = {
    "apache-2.0",
    "apache 2.0",
    "mit",
    "mit license",
    "bsd",
    "bsd-3-clause",
    "cc0",
    "cc0: public domain",
    "cc-by 4.0",
    "cc-by-sa 4.0",
    "odc-by",
    "proprietary commercial",
    "proprietary curated oer / cc-by 4.0"
}

def validate_registry():
    if not REGISTRY_PATH.exists():
        print(f"[ERROR] Registry file missing: {REGISTRY_PATH}")
        sys.exit(1)

    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    datasets = data.get("datasets", [])
    print(f"Loaded {len(datasets)} dataset entries from {REGISTRY_PATH}")

    approved = []
    restricted = []
    rejected = []
    needs_review = []
    violations = []

    for ds in datasets:
        ds_id = ds["dataset_id"]
        status = ds["approval_status"]
        declared_lic = ds["declared_license"].lower()
        intended_use = ds["intended_use"]

        if status == "APPROVED":
            # Verify license is genuinely permissible
            is_valid_lic = any(perm in declared_lic for perm in PERMISSIBLE_LICENSES)
            if not is_valid_lic:
                violations.append({
                    "dataset_id": ds_id,
                    "reason": f"Marked APPROVED but declared license '{ds['declared_license']}' is not in permissible list."
                })
            else:
                approved.append(ds)
        elif status == "RESTRICTED":
            restricted.append(ds)
        elif status == "REJECTED":
            rejected.append(ds)
        elif status == "NEEDS_REVIEW":
            needs_review.append(ds)
        else:
            violations.append({
                "dataset_id": ds_id,
                "reason": f"Unknown approval status: {status}"
            })

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "total_datasets": len(datasets),
        "approved_count": len(approved),
        "restricted_count": len(restricted),
        "rejected_count": len(rejected),
        "needs_review_count": len(needs_review),
        "violations": violations,
        "is_pipeline_cleared": len(violations) == 0,
        "approved_dataset_ids": [d["dataset_id"] for d in approved],
        "restricted_dataset_ids": [d["dataset_id"] for d in restricted],
        "rejected_dataset_ids": [d["dataset_id"] for d in rejected]
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("=" * 65)
    print("MENTORMAZE DATASET LICENSE & COMPLIANCE GATE AUDIT")
    print("=" * 65)
    print(f"Total Datasets Cataloged:  {len(datasets)}")
    print(f"APPROVED for Training:     {len(approved)}")
    print(f"RESTRICTED (RAG only/NC):  {len(restricted)}")
    print(f"REJECTED (PII/Clinical):   {len(rejected)}")
    print(f"NEEDS REVIEW:              {len(needs_review)}")
    print(f"Compliance Violations:     {len(violations)}")
    print(f"Gate Report Saved:         {REPORT_PATH}")
    print("=" * 65)

    if violations:
        print("[CRITICAL] Compliance gate failed! Unresolved license issues detected.")
        sys.exit(1)
    else:
        print("[SUCCESS] All approved training datasets cleared compliance gate.")

if __name__ == "__main__":
    validate_registry()
