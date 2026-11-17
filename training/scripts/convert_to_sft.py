#!/usr/bin/env python3
"""
MentorMaze-2B: Canonical SFT Format Conversion
Converts filtered conversational records into the canonical OpenAI / Hugging Face chat JSONL schema.
Schema: {"messages": [{"role": "system"|"user"|"assistant", "content": "..."}], "metadata": {...}}
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import sys
import json
from pathlib import Path

PROCESSED_DIR = Path("training/datasets/processed")

def convert_record(rec: dict) -> dict:
    domain = rec.get("domain", "general")
    subdomain = rec.get("subdomain", "general")
    meta = rec.get("metadata", {})

    messages = []
    # 1. System Prompt
    system_prompt = rec.get("system_prompt", "You are MentorMaze, an adaptive technical and career mentor by AI Tathastu.")
    messages.append({
        "role": "system",
        "content": system_prompt
    })

    # 2. Dialogue Turns
    for turn in rec.get("turns", []):
        messages.append({
            "role": turn.get("role", "user"),
            "content": turn.get("content", "").strip()
        })

    canonical = {
        "messages": messages,
        "metadata": {
            "domain": domain,
            "subdomain": subdomain,
            "source": meta.get("source_id", "mentormaze_curated"),
            "task_type": meta.get("task_type", "instruction_tuning"),
            "license_status": "approved",
            "quality_status": "reviewed"
        }
    }
    return canonical

def main():
    print("=" * 70)
    print("MENTORMAZE CANONICAL SFT CONVERSION ENGINE")
    print("=" * 70)

    total_converted = 0
    for filt_file in sorted(PROCESSED_DIR.glob("filtered_*.jsonl")):
        out_file = PROCESSED_DIR / f"sft_{filt_file.name[9:]}"
        written = 0

        with open(filt_file, "r", encoding="utf-8") as f_in, open(out_file, "w", encoding="utf-8") as f_out:
            for line in f_in:
                if not line.strip():
                    continue
                rec = json.loads(line)
                canon = convert_record(rec)
                f_out.write(json.dumps(canon, ensure_ascii=False) + "\n")
                written += 1
                total_converted += 1

        print(f"[CONVERTED] {filt_file.name} -> {out_file.name} ({written:,} canonical SFT examples)")

    print(f"\nTotal SFT Examples Formatted: {total_converted:,}")
    print("=" * 70)

if __name__ == "__main__":
    main()
