#!/usr/bin/env python3
"""
MentorMaze-2B: Quality Filtering Engine
Enforces minimum information density, maximum sequence boundaries (2048 tokens),
and filters out low-signal, incomplete, or malformed conversational turns.
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import sys
import json
from pathlib import Path

PROCESSED_DIR = Path("training/datasets/processed")
REPORTS_DIR = Path("training/reports")

MIN_USER_CHARS = 15
MIN_ASSISTANT_CHARS = 40
MAX_ESTIMATED_TOKENS = 2048

def evaluate_quality(record: dict) -> tuple[bool, str]:
    turns = record.get("turns", [])
    if not turns or len(turns) < 2:
        return False, "REJECTED_EMPTY_OR_INCOMPLETE_TURNS"

    total_chars = 0
    for idx, turn in enumerate(turns):
        role = turn.get("role")
        content = turn.get("content", "").strip()
        total_chars += len(content)

        if not content:
            return False, f"REJECTED_EMPTY_CONTENT_AT_TURN_{idx}"

        if role == "user" and len(content) < MIN_USER_CHARS:
            return False, f"REJECTED_USER_PROMPT_TOO_SHORT (<{MIN_USER_CHARS} chars)"

        if role == "assistant" and len(content) < MIN_ASSISTANT_CHARS:
            return False, f"REJECTED_ASSISTANT_RESPONSE_TOO_SHORT (<{MIN_ASSISTANT_CHARS} chars)"

    # Token boundary check (~4 chars per token rule of thumb)
    estimated_tokens = total_chars / 4.0
    if estimated_tokens > MAX_ESTIMATED_TOKENS:
        return False, f"REJECTED_EXCEEDS_MAX_TOKENS (approx {int(estimated_tokens)} > {MAX_ESTIMATED_TOKENS})"

    # Disallow assistant echoing user query
    user_texts = [t["content"].lower() for t in turns if t["role"] == "user"]
    assistant_texts = [t["content"].lower() for t in turns if t["role"] == "assistant"]
    for u in user_texts:
        for a in assistant_texts:
            if u == a:
                return False, "REJECTED_ASSISTANT_ECHOED_USER"

    return True, "PASSED_QUALITY_FILTER"

def main():
    print("=" * 70)
    print("MENTORMAZE DATASET QUALITY FILTERING ENGINE")
    print("=" * 70)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    summary = []
    total_in = 0
    total_passed = 0
    total_dropped = 0

    for norm_file in sorted(PROCESSED_DIR.glob("norm_*.jsonl")):
        out_file = PROCESSED_DIR / f"filtered_{norm_file.name[5:]}"
        rejections = {}
        passed_records = []
        file_in = 0

        with open(norm_file, "r", encoding="utf-8") as f_in, open(out_file, "w", encoding="utf-8") as f_out:
            for line in f_in:
                if not line.strip():
                    continue
                file_in += 1
                rec = json.loads(line)
                is_valid, reason = evaluate_quality(rec)
                if is_valid:
                    f_out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                    passed_records.append(rec)
                else:
                    rejections[reason] = rejections.get(reason, 0) + 1

        total_in += file_in
        total_passed += len(passed_records)
        total_dropped += (file_in - len(passed_records))

        stats = {
            "file": norm_file.name,
            "input_records": file_in,
            "passed_records": len(passed_records),
            "dropped_records": file_in - len(passed_records),
            "rejection_reasons": rejections
        }
        summary.append(stats)
        print(f"[QUALITY] {norm_file.name}: {file_in} -> {len(passed_records)} passed (Dropped {file_in - len(passed_records)})")

    rep_path = REPORTS_DIR / "quality_filtering_report.json"
    with open(rep_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"\nTotal Input: {total_in:,} | Passed Quality: {total_passed:,} | Dropped: {total_dropped:,}")
    print(f"[OK] Quality report saved to: {rep_path}")
    print("=" * 70)

if __name__ == "__main__":
    main()
