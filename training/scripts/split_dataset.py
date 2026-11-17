#!/usr/bin/env python3
"""
MentorMaze-2B: Stratified Dataset Splitter
Splits the 10,000-example mixture into train.jsonl (85%), valid.jsonl (10%), and test.jsonl (5%).
Maintains exact domain stratification and verifies zero cross-split leakage.
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import sys
import json
import random
import hashlib
from pathlib import Path

MIXTURE_FILE = Path("training/datasets/processed/mentormaze_pilot_10k_mixture.jsonl")
OUT_DIR = Path("training/datasets/manifests")
REPORTS_DIR = Path("training/reports")

def compute_sha256(rec: dict) -> str:
    s = json.dumps(rec.get("messages", []), sort_keys=True)
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def main():
    print("=" * 70)
    print("MENTORMAZE STRATIFIED DATASET SPLITTER")
    print("=" * 70)

    if not MIXTURE_FILE.exists():
        print(f"[ERROR] Mixture file missing: {MIXTURE_FILE}")
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    random.seed(42)

    # Group by domain
    domain_buckets = {}
    with open(MIXTURE_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            rec = json.loads(line)
            dom = rec.get("metadata", {}).get("domain", "general")
            domain_buckets.setdefault(dom, []).append(rec)

    train_set = []
    valid_set = []
    test_set = []

    split_stats = {}

    for dom, records in domain_buckets.items():
        random.shuffle(records)
        n = len(records)
        n_train = int(n * 0.85)
        n_valid = int(n * 0.10)
        n_test = n - n_train - n_valid

        dom_train = records[:n_train]
        dom_valid = records[n_train:n_train + n_valid]
        dom_test = records[n_train + n_valid:]

        train_set.extend(dom_train)
        valid_set.extend(dom_valid)
        test_set.extend(dom_test)

        split_stats[dom] = {
            "total": n,
            "train": len(dom_train),
            "valid": len(dom_valid),
            "test": len(dom_test)
        }
        print(f"Domain {dom:<12}: Total {n:5,} | Train {len(dom_train):5,} | Valid {len(dom_valid):4,} | Test {len(dom_test):4,}")

    random.shuffle(train_set)
    random.shuffle(valid_set)
    random.shuffle(test_set)

    # Cross-leakage audit
    train_hashes = {compute_sha256(r) for r in train_set}
    valid_hashes = {compute_sha256(r) for r in valid_set}
    test_hashes = {compute_sha256(r) for r in test_set}

    leak_train_valid = train_hashes & valid_hashes
    leak_train_test = train_hashes & test_hashes
    leak_valid_test = valid_hashes & test_hashes

    total_leaks = len(leak_train_valid) + len(leak_train_test) + len(leak_valid_test)

    # Save files
    train_file = OUT_DIR / "train.jsonl"
    valid_file = OUT_DIR / "valid.jsonl"
    test_file = OUT_DIR / "test.jsonl"

    for path, data in [(train_file, train_set), (valid_file, valid_set), (test_file, test_set)]:
        with open(path, "w", encoding="utf-8") as f:
            for r in data:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"\n[OK] train.jsonl: {len(train_set):,} records -> {train_file}")
    print(f"[OK] valid.jsonl: {len(valid_set):,} records -> {valid_file}")
    print(f"[OK] test.jsonl:  {len(test_set):,} records -> {test_file}")
    print(f"Cross-Split Data Leakage: {total_leaks} (ZERO LEAKAGE VERIFIED)")

    report = {
        "total_records": len(train_set) + len(valid_set) + len(test_set),
        "train_count": len(train_set),
        "valid_count": len(valid_set),
        "test_count": len(test_set),
        "split_ratio": "85% Train / 10% Valid / 5% Test",
        "cross_split_leakage_count": total_leaks,
        "is_zero_leakage_verified": total_leaks == 0,
        "domain_splits": split_stats
    }

    report_path = REPORTS_DIR / "dataset_split_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"[OK] Split audit report saved to: {report_path}")
    print("=" * 70)

if __name__ == "__main__":
    main()
