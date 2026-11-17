#!/usr/bin/env python3
"""
MentorMaze-2B: Exact & Near-Duplicate Detection Engine
Detects exact duplicates via SHA-256 and near-duplicates via 3-gram Jaccard similarity.
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import sys
import json
import hashlib
from pathlib import Path

PROCESSED_DIR = Path("training/datasets/processed")
REPORTS_DIR = Path("training/reports")

def compute_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def get_3grams(text: str) -> set:
    words = text.lower().split()
    if len(words) < 3:
        return set(words)
    return {" ".join(words[i:i+3]) for i in range(len(words)-2)}

def jaccard_similarity(s1: set, s2: set) -> float:
    if not s1 or not s2:
        return 0.0
    intersection = len(s1 & s2)
    union = len(s1 | s2)
    return intersection / union if union > 0 else 0.0

def deduplicate_file(in_path: Path, out_path: Path, jaccard_threshold: float = 0.92):
    seen_hashes = set()
    seen_ngrams = []
    unique_records = []
    rejected = []

    with open(in_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if not line.strip():
                continue
            rec = json.loads(line)

            # Extract representative content string
            if rec.get("description"):
                core_text = rec["description"]
            elif rec.get("prompt"):
                core_text = rec["prompt"]
            elif rec.get("turns"):
                core_text = " ".join(t.get("content", "") for t in rec["turns"] if isinstance(t, dict))
            elif rec.get("question"):
                core_text = rec["question"]
            elif rec.get("expectations"):
                core_text = rec["expectations"]
            else:
                core_text = json.dumps(rec)

            core_text = str(core_text or "")
            norm_text = " ".join(core_text.lower().split())
            h = compute_sha256(norm_text)

            # 1. Exact Duplicate Check
            if h in seen_hashes:
                rejected.append({
                    "record_index": idx,
                    "reason": "DUPLICATE_EXACT_SHA256",
                    "hash": h,
                    "snippet": norm_text[:80]
                })
                continue

            # 2. Near-Duplicate Check
            ngrams = get_3grams(norm_text)
            is_near_dup = False
            for prev_h, prev_ngrams in seen_ngrams[-200:]: # Rolling window comparison
                if jaccard_similarity(ngrams, prev_ngrams) >= jaccard_threshold:
                    is_near_dup = True
                    rejected.append({
                        "record_index": idx,
                        "reason": f"DUPLICATE_NEAR_JACCARD (>= {jaccard_threshold})",
                        "hash": h,
                        "snippet": norm_text[:80]
                    })
                    break

            if not is_near_dup:
                seen_hashes.add(h)
                seen_ngrams.append((h, ngrams))
                unique_records.append(rec)

    with open(out_path, "w", encoding="utf-8") as f_out:
        for r in unique_records:
            f_out.write(json.dumps(r, ensure_ascii=False) + "\n")

    return {
        "file": in_path.name,
        "input_count": len(unique_records) + len(rejected),
        "retained_unique": len(unique_records),
        "rejected_duplicates": len(rejected),
        "sample_rejections": rejected[:5]
    }

def main():
    print("=" * 70)
    print("MENTORMAZE DATASET DEDUPLICATION ENGINE")
    print("=" * 70)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    summary = []

    for clean_file in sorted(PROCESSED_DIR.glob("clean_*.jsonl")):
        dedup_file = PROCESSED_DIR / f"dedup_{clean_file.name[6:]}"
        res = deduplicate_file(clean_file, dedup_file)
        summary.append(res)
        print(f"[DEDUP] {res['file']}: {res['input_count']} -> {res['retained_unique']} unique (Removed {res['rejected_duplicates']} dups)")

    rep_file = REPORTS_DIR / "deduplication_report.json"
    with open(rep_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"\n[OK] Deduplication report saved to: {rep_file}")
    print("=" * 70)

if __name__ == "__main__":
    main()
