#!/usr/bin/env python3
"""
MentorMaze-2B: Dataset Inspection Tool
Inspects record schemas, field types, sample content, and token lengths across raw and processed datasets.
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import sys
import json
import argparse
from pathlib import Path

def inspect_file(filepath: Path, num_samples: int = 2):
    print(f"\n{'='*70}")
    print(f"INSPECTING: {filepath}")
    print(f"{'='*70}")
    if not filepath.exists():
        print(f"[ERROR] File not found: {filepath}")
        return

    total_lines = 0
    total_chars = 0
    sample_records = []
    keys_found = set()

    with open(filepath, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            total_lines += 1
            total_chars += len(line)
            try:
                rec = json.loads(line)
                if idx < num_samples:
                    sample_records.append(rec)
                if isinstance(rec, dict):
                    keys_found.update(rec.keys())
            except Exception as e:
                print(f"[PARSE ERROR at line {idx+1}]: {e}")

    avg_chars = total_chars / total_lines if total_lines else 0
    approx_tokens_per_record = avg_chars / 4.0

    print(f"Total Records: {total_lines:,}")
    print(f"Top-Level Keys: {sorted(list(keys_found))}")
    print(f"Average Record Size: {avg_chars:.1f} characters (~{approx_tokens_per_record:.1f} tokens)")
    print(f"\n--- Sample Record 1 Preview ---")
    if sample_records:
        print(json.dumps(sample_records[0], indent=2, ensure_ascii=False)[:800] + "\n...")
    print(f"{'='*70}\n")

def main():
    parser = argparse.ArgumentParser(description="Inspect MentorMaze training datasets")
    parser.add_argument("file", nargs="?", default=None, help="Path to jsonl file to inspect")
    parser.add_argument("--samples", type=int, default=1, help="Number of samples to preview")
    args = parser.parse_args()

    if args.file:
        inspect_file(Path(args.file), args.samples)
    else:
        raw_files = list(Path("training/datasets/raw").glob("*.jsonl"))
        proc_files = list(Path("training/datasets/processed").glob("*.jsonl"))
        all_files = raw_files + proc_files
        if not all_files:
            print("No datasets found in training/datasets/raw or training/datasets/processed")
            return
        for f in all_files:
            inspect_file(f, args.samples)

if __name__ == "__main__":
    main()
