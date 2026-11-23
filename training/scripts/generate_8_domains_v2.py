#!/usr/bin/env python3
"""
Phase 6: Independent Generation Verification for mentormaze-2b-core-sft-v2
Generates actual model responses across 8 mandated domains:
1. DSA
2. Conceptual teaching
3. Code review
4. Resume improvement
5. Behavioral interview
6. System design
7. Hindi
8. Hinglish
"""

import time
import json
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

ADAPTER_PATH = "training/adapters/mentormaze-2b-core-sft-v2"
OUTPUT_FILE = Path("training/reports/phase6_core_v2_generation_outputs.json")

DOMAINS = [
    {
        "id": "domain-1-dsa",
        "domain": "DSA",
        "prompt": "How should I find the longest palindromic substring in O(N^2) time and O(1) space?"
    },
    {
        "id": "domain-2-conceptual",
        "domain": "Conceptual Teaching",
        "prompt": "Explain the CAP theorem from first principles and why CA systems cannot exist over partitions."
    },
    {
        "id": "domain-3-code-review",
        "domain": "Code Review",
        "prompt": "Review this Python snippet for edge cases and time complexity: def merge_intervals(intervals): intervals.sort(); res = [intervals[0]]; for i in intervals[1:]: if i[0] <= res[-1][1]: res[-1][1] = max(res[-1][1], i[1]) else: res.append(i); return res"
    },
    {
        "id": "domain-4-resume",
        "domain": "Resume Improvement",
        "prompt": "Rewrite this resume bullet using the Google XYZ formula: 'Helped reduce database query latency by adding indexing and caching.'"
    },
    {
        "id": "domain-5-behavioral",
        "domain": "Behavioral Interview",
        "prompt": "Tell me about a time you had a technical disagreement with a senior engineer and how you resolved it."
    },
    {
        "id": "domain-6-system-design",
        "domain": "System Design",
        "prompt": "How would you design an idempotent payment processing pipeline using Kafka and PostgreSQL?"
    },
    {
        "id": "domain-7-hindi",
        "domain": "Hindi",
        "prompt": "Dynamic Programming kya hai aur iska use kab karna chahiye?"
    },
    {
        "id": "domain-8-hinglish",
        "domain": "Hinglish",
        "prompt": "Call stack overflow error kyu hota hai recursion me? Ek simple analogy ke sath explain karo."
    }
]

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Loading tokenizer from {ADAPTER_PATH}...")
tokenizer = AutoTokenizer.from_pretrained(ADAPTER_PATH, trust_remote_code=True)

print("Loading base Qwen3.5-2B model...")
base_model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen3.5-2B-Base",
    torch_dtype=torch.bfloat16 if device.type == "mps" else torch.float32,
    trust_remote_code=True
).to(device)

print(f"Attaching LoRA adapter from {ADAPTER_PATH}...")
model = PeftModel.from_pretrained(base_model, ADAPTER_PATH).to(device)
model.eval()

results = {
    "evaluated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "adapter": ADAPTER_PATH,
    "device": str(device),
    "generations": {}
}

print("\nGenerating responses for 8 domains...")
for item in DOMAINS:
    messages = [
        {"role": "system", "content": "You are Dr. Aarav Mehta, Principal AI Mentor at MentorMaze by AI Tathastu. Guide with precise Socratic rigor, clear structure, and zero hallucinations."},
        {"role": "user", "content": item["prompt"]}
    ]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt").to(device)
    prompt_len = inputs.input_ids.shape[1]
    
    t0 = time.time()
    with torch.no_grad():
        out = model.generate(
            **inputs,
            max_new_tokens=140,
            temperature=0.2,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    gen_time = round(time.time() - t0, 3)
    gen_tokens = out[0].shape[0] - prompt_len
    completion_text = tokenizer.decode(out[0][prompt_len:], skip_special_tokens=True).strip()
    
    print(f"\n--- [{item['domain']}] ({gen_time}s, {gen_tokens} tokens) ---")
    print(completion_text[:160] + "..." if len(completion_text) > 160 else completion_text)
    
    results["generations"][item["id"]] = {
        "domain": item["domain"],
        "prompt": item["prompt"],
        "output": completion_text,
        "tokens_generated": gen_tokens,
        "latency_sec": gen_time,
        "tokens_per_sec": round(gen_tokens / max(0.001, gen_time), 1)
    }

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print(f"\nSaved all 8 domain outputs to {OUTPUT_FILE}")

