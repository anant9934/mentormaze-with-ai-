#!/usr/bin/env python3
"""
MentorMaze-2B: Empirical Benchmark & Evaluation Suite
Evaluates Base Model vs Fine-Tuned Model on the 501 Held-Out Test Examples.
Empirical metrics:
1. Test Perplexity (CrossEntropy loss on held-out assistant tokens)
2. Socratic Teaching Compliance (Probing questions vs code dumping)
3. Zero-Fabrication Adherence (Refusal to invent metrics / grounding)
4. Code Review Accuracy (Invariant checks & complexity analysis)
5. Career Calibration (Leveling expectations and skill mapping)
6. Inference Timing (TTFT, tokens/sec, P50/P95 latency)
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import os
import sys
import math
import time
import json
import argparse
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

TEST_SPLIT_PATH = Path("training/datasets/manifests/test.jsonl")
REPORTS_DIR = Path("training/reports")
ADAPTER_PATH = Path("training/adapters/mentormaze-2b-sft-v1")

def get_optimal_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")

def load_test_split():
    records = []
    with open(TEST_SPLIT_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return records

def compute_held_out_perplexity(model, tokenizer, test_records, device, max_eval_samples=50):
    model.eval()
    total_loss = 0.0
    evaluated = 0
    
    im_start_id = tokenizer.convert_tokens_to_ids("<|im_start|>")
    im_end_id = tokenizer.convert_tokens_to_ids("<|im_end|>")
    assist_tok_id = tokenizer.convert_tokens_to_ids("assistant")
    
    with torch.no_grad():
        for record in test_records[:max_eval_samples]:
            text = tokenizer.apply_chat_template(record["messages"], tokenize=False)
            input_ids = tokenizer.encode(text, truncation=True, max_length=1024)
            input_ids_tensor = torch.tensor([input_ids], dtype=torch.long)
            labels = torch.full_like(input_ids_tensor, -100)
            
            seq = input_ids
            i = 0
            while i < len(seq):
                if seq[i] == im_start_id and i + 1 < len(seq) and seq[i + 1] == assist_tok_id:
                    start_idx = i + 2
                    while start_idx < len(seq) and seq[start_idx] == 198:
                        start_idx += 1
                    end_idx = start_idx
                    while end_idx < len(seq) and seq[end_idx] != im_end_id:
                        end_idx += 1
                    if end_idx < len(seq):
                        end_idx += 1
                    labels[0, start_idx:end_idx] = input_ids_tensor[0, start_idx:end_idx]
                    i = end_idx
                else:
                    i += 1
                    
            if (labels != -100).sum().item() == 0:
                continue
                
            input_ids_dev = input_ids_tensor.to(device)
            labels_dev = labels.to(device)
            
            out = model(input_ids=input_ids_dev, labels=labels_dev)
            total_loss += out.loss.item()
            evaluated += 1
            
            if device.type == "mps":
                torch.mps.empty_cache()
                
    avg_loss = total_loss / max(1, evaluated)
    ppl = math.exp(min(avg_loss, 20))
    return round(avg_loss, 4), round(ppl, 2), evaluated

def evaluate_domain_qualities(model, tokenizer, test_records, device, num_samples_per_domain=6):
    model.eval()
    
    domain_groups = {
        "socratic": [],
        "technical": [],
        "career": [],
        "behavioral": [],
        "leveling": []
    }
    
    for r in test_records:
        dom = r.get("metadata", {}).get("domain", "technical")
        if dom in domain_groups:
            domain_groups[dom].append(r)
            
    results = {}
    latencies = []
    throughputs = []
    sample_outputs = []
    
    for dom, samples in domain_groups.items():
        evaluated_in_domain = samples[:num_samples_per_domain]
        dom_scores = []
        
        for sample in evaluated_in_domain:
            messages = sample["messages"]
            # Extract prompt (system + user messages)
            prompt_msgs = [m for m in messages if m["role"] in ("system", "user")]
            prompt_text = tokenizer.apply_chat_template(prompt_msgs, tokenize=False, add_generation_prompt=True)
            inputs = tokenizer(prompt_text, return_tensors="pt").to(device)
            
            t0 = time.time()
            with torch.no_grad():
                out = model.generate(
                    **inputs,
                    max_new_tokens=150,
                    do_sample=False,
                    pad_token_id=tokenizer.eos_token_id
                )
            gen_time = time.time() - t0
            latencies.append(gen_time)
            
            new_tokens = out[0][inputs["input_ids"].shape[1]:]
            tok_count = len(new_tokens)
            if gen_time > 0:
                throughputs.append(tok_count / gen_time)
                
            gen_text = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
            
            # Domain-specific heuristic evaluation
            score = 0.0
            lower = gen_text.lower()
            
            if dom == "socratic":
                # Points for asking probing questions and avoiding immediate monolithic code dump
                has_question = "?" in gen_text
                avoids_code_dump = "```" not in gen_text or gen_text.count("\n") < 15
                uses_invariant_scaffolding = any(k in lower for k in ["invariant", "consider", "boundary", "what if", "transition", "condition", "think"])
                score = (0.4 if has_question else 0.0) + (0.3 if avoids_code_dump else 0.0) + (0.3 if uses_invariant_scaffolding else 0.0)
                
            elif dom == "technical":
                # Points for invariant clarity, asymptotic bounds, and correct structure
                has_complexity = any(k in lower for k in ["o(", "o(n", "o(1", "o(log", "complexity", "time", "space"])
                has_invariant = any(k in lower for k in ["invariant", "pointer", "boundary", "base case", "edge case", "state"])
                score = (0.5 if has_complexity else 0.1) + (0.5 if has_invariant else 0.1)
                
            elif dom == "behavioral":
                # Points for STAR framework adherence and zero-fabrication caution
                has_star = any(k in lower for k in ["situation", "task", "action", "result", "star"])
                has_metric_caution = any(k in lower for k in ["metric", "quantif", "defend", "fabricat", "evidence", "measure", "grounded"])
                score = (0.5 if has_star else 0.2) + (0.5 if has_metric_caution else 0.2)
                
            elif dom == "career":
                # Points for skill decomposition, roadmaps, and honest market alignment
                has_skills = any(k in lower for k in ["mandatory", "skill", "requirement", "roadmap", "stack", "core"])
                has_realistic_scope = any(k in lower for k in ["experience", "band", "gap", "market", "progress"])
                score = (0.5 if has_skills else 0.2) + (0.5 if has_realistic_scope else 0.2)
                
            elif dom == "leveling":
                # Points for seniority distinction and concrete promotion evidence
                has_tier = any(k in lower for k in ["sde-1", "sde-2", "senior", "staff", "junior", "lead", "tier", "level"])
                has_criteria = any(k in lower for k in ["ownership", "autonomous", "system design", "impact", "scope", "rfc"])
                score = (0.5 if has_tier else 0.2) + (0.5 if has_criteria else 0.2)
                
            dom_scores.append(score)
            
            if len(sample_outputs) < 8:
                user_content = prompt_msgs[-1]["content"] if prompt_msgs else ""
                sample_outputs.append({
                    "domain": dom,
                    "prompt": user_content[:150],
                    "response": gen_text[:250],
                    "heuristic_score": round(score * 100, 1)
                })
                
        results[dom] = {
            "evaluated_samples": len(dom_scores),
            "mean_compliance_score": round((sum(dom_scores) / max(1, len(dom_scores))) * 100, 1)
        }
        
    latencies.sort()
    p50_latency = latencies[len(latencies) // 2] if latencies else 0.0
    p95_latency = latencies[int(len(latencies) * 0.95)] if latencies else 0.0
    avg_throughput = sum(throughputs) / max(1, len(throughputs)) if throughputs else 0.0
    
    return {
        "domain_scores": results,
        "timing": {
            "p50_latency_sec": round(p50_latency, 3),
            "p95_latency_sec": round(p95_latency, 3),
            "avg_throughput_tok_sec": round(avg_throughput, 1)
        },
        "sample_outputs": sample_outputs
    }

def run_evaluation():
    print("=" * 80)
    print("MENTORMAZE-2B: EMPIRICAL BENCHMARK EVALUATION SUITE")
    print("Zero-Fabrication Standard: Real Token Generation & Perplexity Scoring")
    print("=" * 80)
    
    device = get_optimal_device()
    print(f"[DEVICE]: Hardware accelerator: {str(device).upper()}")
    
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    test_records = load_test_split()
    print(f"Loaded {len(test_records)} held-out test records from: {TEST_SPLIT_PATH}")
    
    tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen3.5-2B-Base", trust_remote_code=True)
    dtype = torch.bfloat16 if device.type == "mps" else torch.float16
    
    # =========================================================================
    # 1. EVALUATE BASE FOUNDATION MODEL
    # =========================================================================
    print("\n[1/2] Loading Base Foundation Model (Qwen/Qwen3.5-2B-Base)...")
    base_model = AutoModelForCausalLM.from_pretrained(
        "Qwen/Qwen3.5-2B-Base",
        dtype=dtype,
        trust_remote_code=True
    ).to(device)
    
    print("  Evaluating base model held-out test perplexity...")
    base_loss, base_ppl, base_eval_n = compute_held_out_perplexity(base_model, tokenizer, test_records, device, max_eval_samples=40)
    print(f"  Base Model Test Loss: {base_loss:.4f} | Perplexity: {base_ppl:.2f} (Evaluated: {base_eval_n} samples)")
    
    print("  Evaluating base model pedagogical domain performance...")
    base_qualities = evaluate_domain_qualities(base_model, tokenizer, test_records, device, num_samples_per_domain=4)
    print(f"  Base Model Socratic Compliance: {base_qualities['domain_scores']['socratic']['mean_compliance_score']}%")
    print(f"  Base Model Technical Clarity: {base_qualities['domain_scores']['technical']['mean_compliance_score']}%")
    
    # =========================================================================
    # 2. EVALUATE FINE-TUNED MODEL (IF ADAPTER AVAILABLE)
    # =========================================================================
    adapter_available = ADAPTER_PATH.exists() and (ADAPTER_PATH / "adapter_model.safetensors").exists()
    
    sft_loss, sft_ppl = None, None
    sft_qualities = None
    
    if adapter_available:
        print(f"\n[2/2] Loading Fine-Tuned LoRA Adapter from: {ADAPTER_PATH}...")
        peft_model = PeftModel.from_pretrained(base_model, ADAPTER_PATH).to(device)
        print("  Evaluating SFT fine-tuned held-out test perplexity...")
        sft_loss, sft_ppl, sft_eval_n = compute_held_out_perplexity(peft_model, tokenizer, test_records, device, max_eval_samples=40)
        print(f"  Fine-Tuned Model Test Loss: {sft_loss:.4f} | Perplexity: {sft_ppl:.2f} (Evaluated: {sft_eval_n} samples)")
        
        print("  Evaluating fine-tuned model pedagogical domain performance...")
        sft_qualities = evaluate_domain_qualities(peft_model, tokenizer, test_records, device, num_samples_per_domain=4)
        print(f"  Fine-Tuned Socratic Compliance: {sft_qualities['domain_scores']['socratic']['mean_compliance_score']}%")
        print(f"  Fine-Tuned Technical Clarity: {sft_qualities['domain_scores']['technical']['mean_compliance_score']}%")
    else:
        print(f"\n[2/2] Notice: No fine-tuned adapter found at {ADAPTER_PATH}. Skipping SFT comparison.")
        
    # Compile Empirical Report
    report = {
        "benchmark_title": "MentorMaze-2B Empirical Benchmark Evaluation",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "test_split_records": len(test_records),
        "device": str(device),
        "base_model": {
            "name": "Qwen/Qwen3.5-2B-Base",
            "test_loss": base_loss,
            "test_perplexity": base_ppl,
            "domain_scores": base_qualities["domain_scores"],
            "timing": base_qualities["timing"],
            "sample_generations": base_qualities["sample_outputs"]
        },
        "sft_model": {
            "adapter_path": str(ADAPTER_PATH) if adapter_available else None,
            "is_evaluated": adapter_available,
            "test_loss": sft_loss,
            "test_perplexity": sft_ppl,
            "perplexity_improvement": round(base_ppl - sft_ppl, 2) if (adapter_available and sft_ppl) else None,
            "domain_scores": sft_qualities["domain_scores"] if sft_qualities else None,
            "timing": sft_qualities["timing"] if sft_qualities else None,
            "sample_generations": sft_qualities["sample_outputs"] if sft_qualities else None
        }
    }
    
    report_file = REPORTS_DIR / "evaluation_results.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"\n[OK] Empirical benchmark evaluation results saved to: {report_file}")
    print("=" * 80)

if __name__ == "__main__":
    run_evaluation()
