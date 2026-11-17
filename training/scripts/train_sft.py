#!/usr/bin/env python3
"""
MentorMaze-2B: Supervised Fine-Tuning (SFT) Pipeline
Fine-tunes Qwen/Qwen3.5-2B-Base (Qwen3_5ForCausalLM, 1.882B) on Apple Silicon MPS / CUDA / CPU.
Features:
- LoRA Rank 16 / Alpha 32 targeting all linear_attn (DeltaNet) and full attention/MLP projections
- Assistant-only loss masking (ignores system and user prompts)
- Memory-safe gradient accumulation (effective batch size 16)
- Checkpoint persistence and adapter reload validation
- Empirical logging (loss, lr, tokens/s, memory, latency)
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
"""

import os
import sys
import math
import time
import json
import yaml
import psutil
import argparse
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoConfig
from peft import LoraConfig, get_peft_model, TaskType, PeftModel

CONFIG_PATH = Path("training/configs/sft_config.yaml")
REPORTS_DIR = Path("training/reports")
CHECKPOINTS_DIR = Path("training/checkpoints/mentormaze-2b-sft-v1")
ADAPTER_OUTPUT_DIR = Path("training/adapters/mentormaze-2b-sft-v1")

def get_optimal_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")

def get_memory_usage_mb():
    process = psutil.Process()
    mem_info = process.memory_info()
    return round(mem_info.rss / (1024 * 1024), 2)

def load_jsonl(file_path: Path):
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return records

def create_assistant_masked_sample(messages, tokenizer, max_seq_len=1024):
    """
    Format messages using Qwen chat template and apply assistant-only loss masking.
    All tokens outside the assistant turn are set to -100 in labels.
    """
    text = tokenizer.apply_chat_template(messages, tokenize=False)
    input_ids = tokenizer.encode(text, truncation=True, max_length=max_seq_len)
    
    input_ids_tensor = torch.tensor([input_ids], dtype=torch.long)
    labels = torch.full_like(input_ids_tensor, -100)
    
    im_start_id = tokenizer.convert_tokens_to_ids("<|im_start|>")
    im_end_id = tokenizer.convert_tokens_to_ids("<|im_end|>")
    assist_tok_id = tokenizer.convert_tokens_to_ids("assistant")
    
    seq = input_ids
    i = 0
    while i < len(seq):
        if seq[i] == im_start_id and i + 1 < len(seq) and seq[i + 1] == assist_tok_id:
            start_idx = i + 2
            while start_idx < len(seq) and seq[start_idx] == 198: # newline
                start_idx += 1
            end_idx = start_idx
            while end_idx < len(seq) and seq[end_idx] != im_end_id:
                end_idx += 1
            if end_idx < len(seq):
                end_idx += 1 # include im_end
            labels[0, start_idx:end_idx] = input_ids_tensor[0, start_idx:end_idx]
            i = end_idx
        else:
            i += 1
            
    # If no assistant tokens were found, return None
    if (labels != -100).sum().item() == 0:
        return None
        
    return {
        "input_ids": input_ids_tensor,
        "labels": labels,
        "token_count": len(input_ids)
    }

def get_lr_multiplier(current_step, total_steps, warmup_steps):
    if current_step < warmup_steps:
        return float(current_step) / float(max(1, warmup_steps))
    progress = float(current_step - warmup_steps) / float(max(1, total_steps - warmup_steps))
    return max(0.1, 0.5 * (1.0 + math.cos(math.pi * progress)))

def evaluate_validation(peft_model, valid_records, tokenizer, device, max_samples=50, max_seq_len=1024):
    peft_model.eval()
    total_val_loss = 0.0
    val_count = 0
    with torch.no_grad():
        for sample in valid_records[:max_samples]:
            masked = create_assistant_masked_sample(sample["messages"], tokenizer, max_seq_len)
            if masked is None:
                continue
            input_ids = masked["input_ids"].to(device)
            labels = masked["labels"].to(device)
            out = peft_model(input_ids=input_ids, labels=labels)
            total_val_loss += out.loss.item()
            val_count += 1
            if device.type == "mps":
                torch.mps.empty_cache()
    peft_model.train()
    return round(total_val_loss / max(1, val_count), 4)

def run_sft_training(args):
    print("=" * 80)
    print("MENTORMAZE-2B: SUPERVISED FINE-TUNING (SFT) WITH LORA")
    print(f"Target Model: {args.model}")
    print(f"Dataset Path: {args.train_file}")
    print(f"Target Steps: {args.steps} (Accumulation: {args.grad_accum}, Effective Batch: {args.grad_accum * args.batch_size})")
    print("=" * 80)
    
    device = get_optimal_device()
    print(f"[DEVICE]: Hardware accelerator detected: {str(device).upper()}")
    
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
    ADAPTER_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Load Tokenizer
    print("[1/6] Loading Qwen3.5 tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    print(f"  Tokenizer vocabulary size: {len(tokenizer)}")
    
    # 2. Load Base Model
    print("[2/6] Loading Qwen3.5 base model weights into memory...")
    dtype = torch.bfloat16 if (device.type == "mps" or (device.type == "cuda" and torch.cuda.is_bf16_supported())) else torch.float16
    base_model = AutoModelForCausalLM.from_pretrained(
        args.model,
        dtype=dtype,
        trust_remote_code=True
    ).to(device)
    total_params = sum(p.numel() for p in base_model.parameters())
    print(f"  Base model parameters: {total_params:,} ({total_params/1e9:.3f}B)")
    
    # 3. Configure LoRA for Gated DeltaNet + Softmax Attention + SwiGLU MLP
    print("[3/6] Applying PEFT LoRA configuration...")
    target_modules = [
        "in_proj_qkv", "in_proj_z", "in_proj_b", "in_proj_a", "out_proj",
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ]
    lora_cfg = LoraConfig(
        r=args.rank,
        lora_alpha=args.alpha,
        target_modules=target_modules,
        lora_dropout=0.05,
        bias="none",
        task_type=TaskType.CAUSAL_LM
    )
    peft_model = get_peft_model(base_model, lora_cfg)
    trainable_params, all_params = peft_model.get_nb_trainable_parameters()
    print(f"  Trainable LoRA Parameters: {trainable_params:,} / {all_params:,} ({100 * trainable_params / all_params:.3f}%)")
    
    # 4. Load Datasets
    print("[4/6] Loading curated training and validation splits...")
    train_records = load_jsonl(Path(args.train_file))
    valid_records = load_jsonl(Path(args.valid_file))
    print(f"  Loaded {len(train_records):,} train examples and {len(valid_records):,} validation examples.")
    
    # 5. Optimizer and Schedulers
    optimizer = torch.optim.AdamW(peft_model.parameters(), lr=args.learning_rate, weight_decay=0.01)
    warmup_steps = int(args.steps * 0.05)
    
    # Initial Validation Loss Benchmark
    print("  Calculating initial zero-shot validation loss...")
    init_val_loss = evaluate_validation(peft_model, valid_records, tokenizer, device, max_samples=25, max_seq_len=args.max_seq_len)
    print(f"  Initial Zero-Shot Validation Loss: {init_val_loss:.4f} (Perplexity: {math.exp(min(init_val_loss, 20)):.2f})")
    
    # 6. Training Execution Loop
    print("\n[5/6] Starting gradient descent optimization loop...")
    peft_model.train()
    optimizer.zero_grad()
    
    step_logs = []
    accumulated_loss = 0.0
    accumulated_tokens = 0
    step_start_time = time.time()
    train_start_time = time.time()
    
    sample_idx = 0
    current_step = 0
    micro_step = 0
    
    while current_step < args.steps:
        sample = train_records[sample_idx % len(train_records)]
        sample_idx += 1
        
        masked = create_assistant_masked_sample(sample["messages"], tokenizer, args.max_seq_len)
        if masked is None:
            continue
            
        input_ids = masked["input_ids"].to(device)
        labels = masked["labels"].to(device)
        token_count = masked["token_count"]
        
        # Forward pass
        outputs = peft_model(input_ids=input_ids, labels=labels)
        loss = outputs.loss / args.grad_accum
        
        # Backward pass
        loss.backward()
        
        accumulated_loss += outputs.loss.item()
        accumulated_tokens += token_count
        micro_step += 1
        
        # Optimizer Step upon full gradient accumulation
        if micro_step % args.grad_accum == 0:
            current_step += 1
            
            # Apply cosine learning rate schedule with warmup
            lr_factor = get_lr_multiplier(current_step, args.steps, warmup_steps)
            for param_group in optimizer.param_groups:
                param_group["lr"] = args.learning_rate * lr_factor
                
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(peft_model.parameters(), max_norm=1.0)
            optimizer.step()
            optimizer.zero_grad()
            
            if device.type == "mps":
                torch.mps.synchronize()
                torch.mps.empty_cache()
                
            step_duration = time.time() - step_start_time
            avg_loss = accumulated_loss / args.grad_accum
            throughput = accumulated_tokens / max(0.001, step_duration)
            current_lr = optimizer.param_groups[0]["lr"]
            mem_mb = get_memory_usage_mb()
            
            log_entry = {
                "step": current_step,
                "train_loss": round(avg_loss, 4),
                "perplexity": round(math.exp(min(avg_loss, 20)), 2),
                "learning_rate": round(current_lr, 7),
                "step_time_seconds": round(step_duration, 3),
                "tokens_per_sec": round(throughput, 1),
                "memory_mb": mem_mb,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            step_logs.append(log_entry)
            
            # Console Logging
            if current_step % args.log_every == 0 or current_step == 1 or current_step == args.steps:
                print(f"  Step {current_step:4d}/{args.steps} | Loss: {avg_loss:.4f} | PPL: {math.exp(min(avg_loss, 20)):6.2f} | "
                      f"LR: {current_lr:.2e} | Speed: {throughput:5.1f} tok/s | Latency: {step_duration:.2f}s | RAM: {mem_mb:.0f} MB")
                
            # Periodic Validation Checkpoint
            if current_step % args.eval_every == 0:
                val_loss = evaluate_validation(peft_model, valid_records, tokenizer, device, max_samples=30, max_seq_len=args.max_seq_len)
                print(f"  >>> [EVALUATION CHECKPOINT] Step {current_step} Validation Loss: {val_loss:.4f} (Perplexity: {math.exp(min(val_loss, 20)):.2f})")
                log_entry["validation_loss"] = val_loss
                
            # Periodic Checkpoint Save
            if current_step % args.save_every == 0 or current_step == args.steps:
                ckpt_dir = CHECKPOINTS_DIR / f"checkpoint-step-{current_step}"
                ckpt_dir.mkdir(parents=True, exist_ok=True)
                peft_model.save_pretrained(ckpt_dir)
                print(f"  >>> [SAVED CHECKPOINT] Exported weights to: {ckpt_dir}")
                
            accumulated_loss = 0.0
            accumulated_tokens = 0
            step_start_time = time.time()
            
    total_train_time = time.time() - train_start_time
    
    # 7. Final Validation & Weight Export
    print("\n[6/6] Computing final validation loss and exporting adapter weights...")
    final_val_loss = evaluate_validation(peft_model, valid_records, tokenizer, device, max_samples=50, max_seq_len=args.max_seq_len)
    val_ppl = math.exp(min(final_val_loss, 20))
    print(f"  Final Validation Loss: {final_val_loss:.4f} (Perplexity: {val_ppl:.2f})")
    print(f"  Validation Loss Improvement: {init_val_loss:.4f} -> {final_val_loss:.4f} (Delta: {init_val_loss - final_val_loss:.4f})")
    
    # Save final adapter
    peft_model.save_pretrained(ADAPTER_OUTPUT_DIR)
    tokenizer.save_pretrained(ADAPTER_OUTPUT_DIR)
    print(f"  >>> Final production adapter exported to: {ADAPTER_OUTPUT_DIR}")
    
    # Compile Run Report
    run_report = {
        "project": "MentorMaze-2B Specialised Language Model",
        "run_id": f"sft-lora-{int(train_start_time)}",
        "foundation_model": args.model,
        "device": str(device),
        "total_training_time_seconds": round(total_train_time, 2),
        "total_training_time_minutes": round(total_train_time / 60, 2),
        "total_steps": args.steps,
        "effective_batch_size": args.grad_accum * args.batch_size,
        "lora_rank": args.rank,
        "lora_alpha": args.alpha,
        "trainable_parameters": trainable_params,
        "all_parameters": all_params,
        "trainable_percentage": round(100 * trainable_params / all_params, 4),
        "initial_validation_loss": init_val_loss,
        "final_validation_loss": final_val_loss,
        "final_validation_perplexity": round(val_ppl, 2),
        "initial_train_loss": step_logs[0]["train_loss"] if step_logs else None,
        "final_train_loss": step_logs[-1]["train_loss"] if step_logs else None,
        "loss_reduction": round(step_logs[0]["train_loss"] - step_logs[-1]["train_loss"], 4) if step_logs else None,
        "peak_memory_mb": max(s["memory_mb"] for s in step_logs) if step_logs else 0,
        "average_throughput_tok_sec": round(sum(s["tokens_per_sec"] for s in step_logs) / max(1, len(step_logs)), 1) if step_logs else 0,
        "adapter_output_dir": str(ADAPTER_OUTPUT_DIR),
        "step_history": step_logs
    }
    
    report_file = REPORTS_DIR / "training_run_log.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(run_report, f, indent=2)
    print(f"  Training run log written to: {report_file}")
    
    # 8. Post-Training Adapter Reload Verification
    print("\n" + "=" * 80)
    print("POST-TRAINING VERIFICATION: RELOADING SAVED ADAPTER")
    print("=" * 80)
    try:
        del peft_model
        del base_model
        if device.type == "mps":
            torch.mps.empty_cache()
            
        print("Loading fresh base model...")
        reloaded_base = AutoModelForCausalLM.from_pretrained(args.model, dtype=dtype).to(device)
        print("Attaching trained LoRA adapter from disk...")
        reloaded_peft = PeftModel.from_pretrained(reloaded_base, ADAPTER_OUTPUT_DIR).to(device)
        reloaded_peft.eval()
        
        test_prompt = "<|im_start|>system\nYou are MentorMaze, an adaptive technical mentor by AI Tathastu.<|im_end|>\n<|im_start|>user\nWhat is the monotonic invariant in Two Pointers?<|im_end|>\n<|im_start|>assistant\n"
        test_inputs = tokenizer(test_prompt, return_tensors="pt").to(device)
        
        with torch.no_grad():
            gen_out = reloaded_peft.generate(
                **test_inputs,
                max_new_tokens=60,
                do_sample=False,
                pad_token_id=tokenizer.eos_token_id
            )
        gen_text = tokenizer.decode(gen_out[0][test_inputs["input_ids"].shape[1]:], skip_special_tokens=True)
        print("\n[VERIFICATION GENERATION SAMPLE]:")
        print(f"Prompt: What is the monotonic invariant in Two Pointers?")
        print(f"Model Output: {gen_text.strip()}")
        print("\n[OK] Adapter reload test passed successfully!")
    except Exception as e:
        print(f"[RELOAD ERROR]: Failed to reload adapter: {e}")
        
    print("=" * 80)

def main():
    parser = argparse.ArgumentParser(description="MentorMaze-2B SFT Training")
    parser.add_argument("--model", type=str, default="Qwen/Qwen3.5-2B-Base", help="Base model identifier")
    parser.add_argument("--train-file", type=str, default="training/datasets/manifests/train.jsonl")
    parser.add_argument("--valid-file", type=str, default="training/datasets/manifests/valid.jsonl")
    parser.add_argument("--steps", type=int, default=500, help="Training step budget")
    parser.add_argument("--batch-size", type=int, default=1, help="Micro-batch size")
    parser.add_argument("--grad-accum", type=int, default=16, help="Gradient accumulation steps")
    parser.add_argument("--learning-rate", type=float, default=1e-4, help="Peak learning rate")
    parser.add_argument("--rank", type=int, default=16, help="LoRA rank")
    parser.add_argument("--alpha", type=int, default=32, help="LoRA alpha")
    parser.add_argument("--max-seq-len", type=int, default=512, help="Max sequence length")
    parser.add_argument("--log-every", type=int, default=10, help="Log to console every N steps")
    parser.add_argument("--eval-every", type=int, default=100, help="Evaluate validation loss every N steps")
    parser.add_argument("--save-every", type=int, default=250, help="Save checkpoint every N steps")
    args = parser.parse_args()
    
    run_sft_training(args)

if __name__ == "__main__":
    main()
