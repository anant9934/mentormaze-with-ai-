#!/usr/bin/env python3
"""
MentorMaze-2B: Dataset Cleaning & PII Sanitization
Removes malformed records, non-printable control characters, and scrubs PII.
Preserves valid Hindi / Devanagari UTF-8 characters.
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import re
import sys
import json
from pathlib import Path

RAW_DIR = Path("training/datasets/raw")
PROCESSED_DIR = Path("training/datasets/processed")

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"(\+91[\-\s]?)?[6-9]\d{9}|\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b")
API_KEY_REGEX = re.compile(r"\b(AIzaSy[A-Za-z0-9_-]{33}|sk-[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36})\b")
CONTROL_CHARS_REGEX = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

def sanitize_text(text: str) -> tuple[str, int]:
    if not isinstance(text, str):
        return "", 0

    pii_count = 0
    # Strip control chars
    clean = CONTROL_CHARS_REGEX.sub("", text)

    # Scrub API keys
    clean, n_keys = API_KEY_REGEX.subn("[API_KEY_REDACTED]", clean)
    pii_count += n_keys

    # Scrub Emails
    clean, n_emails = EMAIL_REGEX.subn("[EMAIL_REDACTED]", clean)
    pii_count += n_emails

    # Scrub Phones
    clean, n_phones = PHONE_REGEX.subn("[PHONE_REDACTED]", clean)
    pii_count += n_phones

    return clean.strip(), pii_count

def clean_record(record: dict) -> tuple[dict, int]:
    pii_total = 0
    cleaned = {}
    for k, v in record.items():
        if isinstance(v, str):
            c_val, p = sanitize_text(v)
            cleaned[k] = c_val
            pii_total += p
        elif isinstance(v, list):
            c_list = []
            for item in v:
                if isinstance(item, str):
                    c_item, p = sanitize_text(item)
                    c_list.append(c_item)
                    pii_total += p
                elif isinstance(item, dict):
                    c_item, p = clean_record(item)
                    c_list.append(c_item)
                    pii_total += p
                else:
                    c_list.append(item)
            cleaned[k] = c_list
        elif isinstance(v, dict):
            c_dict, p = clean_record(v)
            cleaned[k] = c_dict
            pii_total += p
        else:
            cleaned[k] = v
    return cleaned, pii_total

def process_file(in_path: Path, out_path: Path):
    total = 0
    pii_scrubbed = 0
    dropped = 0
    valid = 0

    with open(in_path, "r", encoding="utf-8") as f_in, open(out_path, "w", encoding="utf-8") as f_out:
        for idx, line in enumerate(f_in):
            total += 1
            line = line.strip()
            if not line:
                dropped += 1
                continue
            try:
                rec = json.loads(line)
            except Exception:
                dropped += 1
                continue

            c_rec, pii_count = clean_record(rec)
            pii_scrubbed += pii_count
            f_out.write(json.dumps(c_rec, ensure_ascii=False) + "\n")
            valid += 1

    return {
        "file": in_path.name,
        "input_records": total,
        "output_records": valid,
        "dropped_records": dropped,
        "pii_instances_scrubbed": pii_scrubbed
    }

def main():
    print("=" * 70)
    print("MENTORMAZE DATASET CLEANING & PII SANITIZATION")
    print("=" * 70)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    report = []

    for raw_file in sorted(RAW_DIR.glob("*.jsonl")):
        out_file = PROCESSED_DIR / f"clean_{raw_file.name}"
        stats = process_file(raw_file, out_file)
        report.append(stats)
        print(f"[CLEANED] {stats['file']}: {stats['input_records']} -> {stats['output_records']} records (PII scrubbed: {stats['pii_instances_scrubbed']})")

    report_path = Path("training/reports/dataset_cleaning_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"\n[OK] Cleaning report saved to: {report_path}")
    print("=" * 70)

if __name__ == "__main__":
    main()

