#!/usr/bin/env python3
"""
MentorMaze-2B: Dataset Manifest & Statistics Reporting
Generates dataset_manifest.json, dataset_statistics.json, and comprehensive summaries.
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import sys
import json
import hashlib
from pathlib import Path

MANIFESTS_DIR = Path("training/datasets/manifests")
REPORTS_DIR = Path("training/reports")

def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def analyze_split(path: Path) -> dict:
    if not path.exists():
        return {}

    total_records = 0
    total_chars = 0
    total_turns = 0
    user_chars = 0
    assistant_chars = 0
    domain_counts = {}
    subdomain_counts = {}

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            rec = json.loads(line)
            total_records += 1
            meta = rec.get("metadata", {})
            dom = meta.get("domain", "unknown")
            subdom = meta.get("subdomain", "unknown")

            domain_counts[dom] = domain_counts.get(dom, 0) + 1
            subdomain_counts[subdom] = subdomain_counts.get(subdom, 0) + 1

            for msg in rec.get("messages", []):
                total_turns += 1
                c = msg.get("content", "")
                total_chars += len(c)
                if msg.get("role") == "user":
                    user_chars += len(c)
                elif msg.get("role") == "assistant":
                    assistant_chars += len(c)

    avg_chars = total_chars / total_records if total_records else 0
    avg_tokens = avg_chars / 4.0

    return {
        "record_count": total_records,
        "file_size_bytes": path.stat().st_size,
        "sha256": file_sha256(path),
        "total_dialogue_turns": total_turns,
        "avg_characters_per_record": round(avg_chars, 1),
        "avg_estimated_tokens_per_record": round(avg_tokens, 1),
        "avg_user_characters": round(user_chars / total_records, 1) if total_records else 0,
        "avg_assistant_characters": round(assistant_chars / total_records, 1) if total_records else 0,
        "domains": domain_counts,
        "subdomains": subdomain_counts
    }

def main():
    print("=" * 70)
    print("MENTORMAZE DATASET MANIFEST & STATISTICS GENERATOR")
    print("=" * 70)

    train_path = MANIFESTS_DIR / "train.jsonl"
    valid_path = MANIFESTS_DIR / "valid.jsonl"
    test_path = MANIFESTS_DIR / "test.jsonl"

    stats = {
        "train": analyze_split(train_path),
        "validation": analyze_split(valid_path),
        "test": analyze_split(test_path)
    }

    manifest = {
        "project": "MentorMaze-2B Specialised Language Model",
        "version": "1.0.0-pilot",
        "created_at": "2026-11-18",
        "canonical_format": "chat_messages_jsonl",
        "splits": {
            "train": {
                "file": "train.jsonl",
                "records": stats["train"].get("record_count", 0),
                "sha256": stats["train"].get("sha256", "")
            },
            "validation": {
                "file": "valid.jsonl",
                "records": stats["validation"].get("record_count", 0),
                "sha256": stats["validation"].get("sha256", "")
            },
            "test": {
                "file": "test.jsonl",
                "records": stats["test"].get("record_count", 0),
                "sha256": stats["test"].get("sha256", "")
            }
        },
        "target_proportions": {
            "technical": "35%",
            "career": "25%",
            "socratic": "20%",
            "behavioral": "10%",
            "leveling": "10%"
        }
    }

    manifest_file = MANIFESTS_DIR / "dataset_manifest.json"
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    stats_file = MANIFESTS_DIR / "dataset_statistics.json"
    with open(stats_file, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    print(f"[OK] dataset_manifest.json generated: {manifest_file}")
    print(f"[OK] dataset_statistics.json generated: {stats_file}")
    print("=" * 70)

if __name__ == "__main__":
    main()

