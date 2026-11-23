#!/usr/bin/env python3
"""
MentorMaze-2B: Phase 7 Dataset Forensic Audit Engine
Conducts an exhaustive sample-by-sample audit of the existing training corpus:
- Exact & near-duplicate detection
- User prompt & assistant completion lengths
- Language & domain distribution
- Dialogue turn count
- Opening phrase & structural template distribution
- Code & mathematical content proportion
- Instruction-following vs multi-turn tutoring
- Empty, malformed, or truncated samples
"""

import os
import sys
import json
import hashlib
import re
from pathlib import Path
from collections import Counter, defaultdict
import numpy as np

TRAIN_PATH = Path("training/datasets/manifests/train.jsonl")
VALID_PATH = Path("training/datasets/manifests/valid.jsonl")
TEST_PATH = Path("training/datasets/manifests/test.jsonl")
REPORT_PATH = Path("training/reports/phase7_dataset_forensic_audit.json")

# Regex patterns for content analysis
CODE_BLOCK_REGEX = re.compile(r"```[\w]*\n[\s\S]*?```")
MATH_REGEX = re.compile(r"(\$[^$]+\$|O\([nNkKmM\^0-9\s\+\*\/\w\(\)]+\)|\\sum|\\frac|\\leq|\\geq)")
DEVANAGARI_REGEX = re.compile(r"[\u0900-\u097F]")
HINGLISH_KEYWORDS = {
    "kya", "hai", "hain", "kaise", "kyu", "karo", "karna", "samjhao", "batao", "hoga", "hoti", 
    "chahiye", "samajh", "aata", "nahi", "hota", "mein", "par", "ek", "aur", "toh", "ye", "yeh"
}

def compute_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def get_ngrams(text: str, n: int = 3) -> set:
    words = re.findall(r"\w+", text.lower())
    if len(words) < n:
        return set(words)
    return {" ".join(words[i:i+n]) for i in range(len(words)-n+1)}

def jaccard_similarity(s1: set, s2: set) -> float:
    if not s1 or not s2:
        return 0.0
    return len(s1 & s2) / len(s1 | s2)

def detect_language(text: str) -> str:
    devanagari_count = len(DEVANAGARI_REGEX.findall(text))
    if devanagari_count > 10:
        return "hindi"
    
    words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
    hinglish_matches = sum(1 for w in words if w in HINGLISH_KEYWORDS)
    if len(words) > 0 and (hinglish_matches / len(words) > 0.08 or hinglish_matches >= 3):
        return "hinglish"
    
    return "english"

def audit_file(file_path: Path):
    print(f"[Audit] Scanning {file_path}...")
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if not line.strip():
                continue
            records.append((idx, json.loads(line)))
    
    total_records = len(records)
    
    # Text hashes and duplicate detection
    exact_hashes = defaultdict(list)
    prompt_hashes = defaultdict(list)
    assistant_hashes = defaultdict(list)
    
    user_lens = []
    assistant_lens = []
    total_lens = []
    turn_counts = []
    
    languages = Counter()
    domains = Counter()
    subdomains = Counter()
    
    opening_phrases = Counter()
    opening_first_word = Counter()
    
    code_samples = 0
    math_samples = 0
    multi_turn_samples = 0
    single_turn_samples = 0
    empty_or_malformed = 0
    truncated_samples = 0
    
    ngrams_list = []
    near_duplicate_pairs = []
    
    for idx, rec in records:
        messages = rec.get("messages", [])
        meta = rec.get("metadata", {})
        
        domain = meta.get("domain", "unclassified")
        subdomain = meta.get("subdomain", "unclassified")
        domains[domain] += 1
        subdomains[subdomain] += 1
        
        # Check malformed
        if not messages or not isinstance(messages, list):
            empty_or_malformed += 1
            continue
            
        user_msgs = [m for m in messages if m.get("role") == "user"]
        assistant_msgs = [m for m in messages if m.get("role") == "assistant"]
        
        if not user_msgs or not assistant_msgs:
            empty_or_malformed += 1
            continue
            
        turn_count = len(messages)
        turn_counts.append(turn_count)
        if turn_count > 3: # system + user + assistant is 3
            multi_turn_samples += 1
        else:
            single_turn_samples += 1
            
        user_text = "\n".join(m.get("content", "") for m in user_msgs)
        assistant_text = "\n".join(m.get("content", "") for m in assistant_msgs)
        full_text = "\n".join(m.get("content", "") for m in messages)
        
        u_len = len(user_text)
        a_len = len(assistant_text)
        t_len = len(full_text)
        
        user_lens.append(u_len)
        assistant_lens.append(a_len)
        total_lens.append(t_len)
        
        # Check truncation (ends mid-sentence without punctuation)
        clean_asst = assistant_text.strip()
        if clean_asst and clean_asst[-1] not in ".!?\"'`:*)}\n" and len(clean_asst) > 200:
            truncated_samples += 1
            
        # Code and Math
        if CODE_BLOCK_REGEX.search(full_text) or "def " in full_text or "class " in full_text or "import " in full_text:
            code_samples += 1
        if MATH_REGEX.search(full_text):
            math_samples += 1
            
        # Language detection
        lang = detect_language(user_text + " " + assistant_text)
        languages[lang] += 1
        
        # Exact hashes
        norm_full = " ".join(full_text.lower().split())
        h_full = compute_sha256(norm_full)
        exact_hashes[h_full].append(idx)
        
        norm_prompt = " ".join(user_text.lower().split())
        h_prompt = compute_sha256(norm_prompt)
        prompt_hashes[h_prompt].append(idx)
        
        norm_asst = " ".join(assistant_text.lower().split())
        h_asst = compute_sha256(norm_asst)
        assistant_hashes[h_asst].append(idx)
        
        # Opening phrase analysis for each assistant turn
        for asst_turn in assistant_msgs:
            content = asst_turn.get("content", "").strip()
            words = content.split()
            if words:
                opening_first_word[words[0]] += 1
                op_10 = " ".join(words[:10])
                opening_phrases[op_10] += 1
                
        # Sample ngrams for near-dup detection (check against first 1,000 for tractability)
        if idx < 1500:
            ng = get_ngrams(norm_prompt, 3)
            for prev_idx, prev_ng in ngrams_list:
                sim = jaccard_similarity(ng, prev_ng)
                if sim >= 0.90:
                    near_duplicate_pairs.append((prev_idx, idx, round(sim, 3)))
                    break
            ngrams_list.append((idx, ng))
            
    # Calculate stats
    exact_duplicates = sum(len(indices) - 1 for indices in exact_hashes.values() if len(indices) > 1)
    unique_records = len(exact_hashes)
    
    prompt_duplicates = sum(len(indices) - 1 for indices in prompt_hashes.values() if len(indices) > 1)
    assistant_duplicates = sum(len(indices) - 1 for indices in assistant_hashes.values() if len(indices) > 1)
    
    stats = {
        "file": str(file_path),
        "total_records": total_records,
        "unique_records": unique_records,
        "exact_duplicates": exact_duplicates,
        "prompt_duplicates": prompt_duplicates,
        "assistant_duplicates": assistant_duplicates,
        "near_duplicate_pairs_sampled": len(near_duplicate_pairs),
        "user_length": {
            "min": int(np.min(user_lens)) if user_lens else 0,
            "mean": float(round(np.mean(user_lens), 1)) if user_lens else 0,
            "median": float(round(np.median(user_lens), 1)) if user_lens else 0,
            "max": int(np.max(user_lens)) if user_lens else 0,
            "p95": float(round(np.percentile(user_lens, 95), 1)) if user_lens else 0,
        },
        "assistant_length": {
            "min": int(np.min(assistant_lens)) if assistant_lens else 0,
            "mean": float(round(np.mean(assistant_lens), 1)) if assistant_lens else 0,
            "median": float(round(np.median(assistant_lens), 1)) if assistant_lens else 0,
            "max": int(np.max(assistant_lens)) if assistant_lens else 0,
            "p95": float(round(np.percentile(assistant_lens, 95), 1)) if assistant_lens else 0,
        },
        "total_length": {
            "min": int(np.min(total_lens)) if total_lens else 0,
            "mean": float(round(np.mean(total_lens), 1)) if total_lens else 0,
            "median": float(round(np.median(total_lens), 1)) if total_lens else 0,
            "max": int(np.max(total_lens)) if total_lens else 0,
        },
        "turn_counts": dict(Counter(turn_counts)),
        "languages": dict(languages),
        "domains": dict(domains),
        "subdomains": dict(subdomains),
        "code_content_samples": code_samples,
        "code_content_pct": round(code_samples / total_records * 100, 2) if total_records else 0,
        "math_content_samples": math_samples,
        "math_content_pct": round(math_samples / total_records * 100, 2) if total_records else 0,
        "multi_turn_samples": multi_turn_samples,
        "single_turn_samples": single_turn_samples,
        "empty_or_malformed": empty_or_malformed,
        "truncated_samples": truncated_samples,
        "top_25_opening_phrases": opening_phrases.most_common(25),
        "top_10_first_words": opening_first_word.most_common(10),
    }
    return stats

def main():
    print("=" * 80)
    print("MENTORMAZE-2B: PHASE 7 EXHAUSTIVE DATASET FORENSIC AUDIT")
    print("=" * 80)
    
    train_stats = audit_file(TRAIN_PATH)
    valid_stats = audit_file(VALID_PATH)
    test_stats = audit_file(TEST_PATH)
    
    # Cross-split leakage audit
    print("\n[Audit] Performing cross-split prompt and completion leakage audit...")
    def get_set_of_hashes(path):
        p_hashes = set()
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip(): continue
                rec = json.loads(line)
                u = " ".join([m["content"] for m in rec.get("messages", []) if m.get("role") == "user"])
                norm = " ".join(u.lower().split())
                p_hashes.add(compute_sha256(norm))
        return p_hashes
        
    train_h = get_set_of_hashes(TRAIN_PATH)
    valid_h = get_set_of_hashes(VALID_PATH)
    test_h = get_set_of_hashes(TEST_PATH)
    
    train_valid_leakage = len(train_h & valid_h)
    train_test_leakage = len(train_h & test_h)
    valid_test_leakage = len(valid_h & test_h)
    
    leakage_report = {
        "train_valid_prompt_overlap": train_valid_leakage,
        "train_test_prompt_overlap": train_test_leakage,
        "valid_test_prompt_overlap": valid_test_leakage,
        "zero_leakage_verified": (train_valid_leakage == 0 and train_test_leakage == 0 and valid_test_leakage == 0)
    }
    
    full_report = {
        "audit_timestamp": "2026-11-18T10:15:00Z",
        "train": train_stats,
        "validation": valid_stats,
        "test": test_stats,
        "leakage": leakage_report
    }
    
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(full_report, f, indent=2, ensure_ascii=False)
        
    print(f"\nAudit complete! Full JSON report serialized to: {REPORT_PATH}")
    print("=" * 80)

if __name__ == "__main__":
    main()

