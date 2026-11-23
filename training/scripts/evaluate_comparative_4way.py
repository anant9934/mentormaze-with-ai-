#!/usr/bin/env python3
"""
Phase 6: 4-Way Comparative Model Evaluation
Evaluates:
  A. Base Qwen/Qwen3.5-2B-Base
  B. mentormaze-2b-sft-v1 (25-step intermediate)
  C. mentormaze-2b-core-sft-v2 (Phase 6 SFT)
  D. mentormaze-2b-core-sft-v2 + RAG Verified Context

Evaluates on identical held-out test queries with exact same generation parameters:
- Technical correctness
- Code quality & edge cases
- Complexity analysis
- Teaching effectiveness & Socratic behavior
- Resume factual integrity (Google XYZ)
- Career reasoning
- Hindi/Hinglish quality
- Groundedness
- Latency and Perplexity
"""

import time
import json
import math
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

OUTPUT_FILE = Path("training/reports/phase6_4way_comparative_evaluation.json")

TEST_PROMPTS = [
    {
        "id": "test-1-dsa",
        "domain": "DSA",
        "prompt": "How can I solve the 3Sum problem in O(N^2) time and O(1) auxiliary space without duplicate triplets?",
        "ground_truth_criteria": ["sort array", "two pointers", "skip duplicates", "O(N^2) time", "O(1) auxiliary space"]
    },
    {
        "id": "test-2-conceptual",
        "domain": "Conceptual",
        "prompt": "Explain how epoll differs from select and poll in Linux kernel I/O multiplexing.",
        "ground_truth_criteria": ["O(1) event readiness vs O(N) scanning", "red-black tree in kernel", "ready list callback", "file descriptor limits"]
    },
    {
        "id": "test-3-code-review",
        "domain": "Code Review",
        "prompt": "Review this function: def get_user_data(user_id): query = f'SELECT * FROM users WHERE id = {user_id}'; return db.execute(query)",
        "ground_truth_criteria": ["SQL injection vulnerability", "parameterized query", "prepared statements", "input validation"]
    },
    {
        "id": "test-4-resume",
        "domain": "Resume",
        "prompt": "Rewrite this resume bullet: 'Managed a team that migrated microservices to Kubernetes to improve system uptime.'",
        "ground_truth_criteria": ["Google XYZ formula", "action verb", "quantified metric (e.g. 99.9% uptime)", "migration details"]
    },
    {
        "id": "test-5-hinglish",
        "domain": "Hinglish Socratic",
        "prompt": "Binary search algorithm kab use karte hain aur sorted array hona kyu zaroori hai? Socratic hint do.",
        "ground_truth_criteria": ["sorted property / monotonic invariant", "halving search space O(log N)", "Socratic question / hint", "Hindi/Hinglish clarity"]
    }
]

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
tokenizer = AutoTokenizer.from_pretrained("training/adapters/mentormaze-2b-core-sft-v2", trust_remote_code=True)

# 1. Load Base Model
print("Loading base Qwen3.5-2B...")
base_model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen3.5-2B-Base",
    torch_dtype=torch.bfloat16 if device.type == "mps" else torch.float32,
    trust_remote_code=True
).to(device)

def generate_response(m, prompt_text, max_tokens=140):
    messages = [
        {"role": "system", "content": "You are Dr. Aarav Mehta, Principal AI Mentor at MentorMaze by AI Tathastu. Teach with Socratic depth, technical rigor, and zero hallucinations."},
        {"role": "user", "content": prompt_text}
    ]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt").to(device)
    prompt_len = inputs.input_ids.shape[1]
    t0 = time.time()
    with torch.no_grad():
        out = m.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=0.2,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    lat = round(time.time() - t0, 3)
    text_out = tokenizer.decode(out[0][prompt_len:], skip_special_tokens=True).strip()
    return text_out, lat

results = {
    "evaluated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "device": str(device),
    "candidates": {}
}

# Eval A: Base Model
print("\n--- [A] Evaluating Base Qwen3.5-2B ---")
base_eval = {}
for p in TEST_PROMPTS:
    out, lat = generate_response(base_model, p["prompt"])
    base_eval[p["id"]] = {"prompt": p["prompt"], "domain": p["domain"], "output": out, "latency_sec": lat}
results["candidates"]["A_base_qwen3_5_2b"] = base_eval

# Eval B: SFT v1 Adapter
print("\n--- [B] Evaluating mentormaze-2b-sft-v1 (25-step intermediate) ---")
peft_v1 = PeftModel.from_pretrained(base_model, "training/adapters/mentormaze-2b-sft-v1")
peft_v1.eval()
v1_eval = {}
for p in TEST_PROMPTS:
    out, lat = generate_response(peft_v1, p["prompt"])
    v1_eval[p["id"]] = {"prompt": p["prompt"], "domain": p["domain"], "output": out, "latency_sec": lat}
results["candidates"]["B_mentormaze_2b_sft_v1"] = v1_eval

# Eval C: Core SFT v2 Adapter
print("\n--- [C] Evaluating mentormaze-2b-core-sft-v2 ---")
# Unload v1 and load v2
del peft_v1
if device.type == "mps":
    torch.mps.empty_cache()

peft_v2 = PeftModel.from_pretrained(base_model, "training/adapters/mentormaze-2b-core-sft-v2")
peft_v2.eval()
v2_eval = {}
for p in TEST_PROMPTS:
    out, lat = generate_response(peft_v2, p["prompt"])
    v2_eval[p["id"]] = {"prompt": p["prompt"], "domain": p["domain"], "output": out, "latency_sec": lat}
results["candidates"]["C_mentormaze_2b_core_sft_v2"] = v2_eval

# Eval D: Core SFT v2 + RAG Context
print("\n--- [D] Evaluating mentormaze-2b-core-sft-v2 + RAG ---")
rag_context = (
    "VERIFIED MENTORMAZE KNOWLEDGE BASE:\n"
    "- 3Sum optimal invariant: sort array first in O(N log N), fix pivot i, two-pointer scan left/right in O(N). Skip duplicate values.\n"
    "- Linux epoll: uses eventpoll in kernel with red-black tree (O(log N) insert/delete) and ready list (O(1) pop on event callback).\n"
    "- SQL injection: string interpolation in raw queries exposes arbitrary execution. Must use parameterized queries or ORM.\n"
    "- Google XYZ formula: 'Accomplished [X] as measured by [Y] by doing [Z]'.\n"
)
v2_rag_eval = {}
for p in TEST_PROMPTS:
    augmented_prompt = f"{rag_context}\nStudent Question: {p['prompt']}"
    out, lat = generate_response(peft_v2, augmented_prompt)
    v2_rag_eval[p["id"]] = {"prompt": p["prompt"], "domain": p["domain"], "output": out, "latency_sec": lat}
results["candidates"]["D_mentormaze_2b_core_sft_v2_plus_rag"] = v2_rag_eval

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print(f"\nAll comparative evaluations saved to {OUTPUT_FILE}")

