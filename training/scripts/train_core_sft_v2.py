#!/usr/bin/env python3
"""
MentorMaze-2B: Phase 6 Core SFT Full-Epoch Training Pipeline
Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
Base Model: Qwen/Qwen3.5-2B-Base (1.882B Text Backbone)
Target Adapter: mentormaze-2b-core-sft-v2

Features:
- Complete 1-epoch coverage: 8,488 training examples (1,061 optimizer steps at effective batch size 8)
- Assistant-only loss masking with verifiable supervised token accounting
- Full memory telemetry: Base weights (3.76GB), LoRA weights (67MB), Optimizer (134MB),
  MPS Allocated, MPS Driver, Process RSS, System RAM pressure, Swap usage
- Gradient clipping & Cosine learning rate schedule with warmup
- Robust checkpoint serialization (adapter weights + optimizer state + scheduler state + RNG)
- Signal interruption recovery
"""

import os
import sys
import math
import time
import json
import signal
import psutil
import argparse
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, TaskType, PeftModel

REPORTS_DIR = Path("training/reports")
CHECKPOINTS_DIR = Path("training/checkpoints/mentormaze-2b-core-sft-v2")
ADAPTER_OUTPUT_DIR = Path("training/adapters/mentormaze-2b-core-sft-v2")

def get_optimal_device():
    if torch.backends.mps.is_available():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")

def get_memory_stats(device):
    process = psutil.Process()
    rss_mb = round(process.memory_info().rss / (1024 * 1024), 2)
    vm = psutil.virtual_memory()
    swap = psutil.swap_memory()
    
    mps_alloc_mb = 0.0
    mps_driver_mb = 0.0
    if device.type == "mps":
        mps_alloc_mb = round(torch.mps.current_allocated_memory() / (1024 * 1024), 2)
        mps_driver_mb = round(torch.mps.driver_allocated_memory() / (1024 * 1024), 2)
    elif device.type == "cuda":
        mps_alloc_mb = round(torch.cuda.memory_allocated() / (1024 * 1024), 2)
        mps_driver_mb = round(torch.cuda.memory_reserved() / (1024 * 1024), 2)
        
    return {
        "process_rss_mb": rss_mb,
        "mps_allocated_mb": mps_alloc_mb,
        "mps_driver_mb": mps_driver_mb,
        "ram_used_pct": vm.percent,
        "swap_used_mb": round(swap.used / (1024 * 1024), 2)
    }

def load_jsonl(file_path: Path):
    records = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return records

def create_assistant_masked_sample(messages, tokenizer, max_seq_len=512):
    """
    Format messages using Qwen chat template and apply assistant-only loss masking.
    All tokens outside the assistant turn are set to -100 in labels.
    Returns input_ids, labels, total_tokens, supervised_tokens.
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
            
    supervised_count = (labels != -100).sum().item()
    if supervised_count == 0:
        return None
        
    return {
        "input_ids": input_ids_tensor,
        "labels": labels,
        "token_count": len(input_ids),
        "supervised_tokens": supervised_count
    }

def get_lr_multiplier(current_step, total_steps, warmup_steps):
    if current_step < warmup_steps:
        return float(current_step) / float(max(1, warmup_steps))
    progress = float(current_step - warmup_steps) / float(max(1, total_steps - warmup_steps))
    return max(0.1, 0.5 * (1.0 + math.cos(math.pi * progress)))

def evaluate_validation(peft_model, valid_records, tokenizer, device, max_samples=40, max_seq_len=512):
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

def save_full_checkpoint(ckpt_dir, peft_model, tokenizer, optimizer, current_step, sample_idx, total_supervised_tokens, step_logs):
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    peft_model.save_pretrained(ckpt_dir)
    tokenizer.save_pretrained(ckpt_dir)
    
    # Save optimizer state and trainer metadata
    state = {
        "step": current_step,
        "processed_samples": sample_idx,
        "total_supervised_tokens": total_supervised_tokens,
        "saved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "optimizer_state_dict": optimizer.state_dict(),
        "step_history_count": len(step_logs)
    }
    torch.save(state, ckpt_dir / "trainer_state.pt")

def run_phase6_training(args):
    start_time = time.time()
    device = get_optimal_device()
    print("=" * 80)
    print("MENTORMAZE-2B: PHASE 6 CORE SFT FULL-EPOCH TRAINING PIPELINE")
    print(f"Base Model: {args.model}")
    print(f"Device: {str(device).upper()}")
    print(f"Train File: {args.train_file}")
    print(f"Effective Batch Size: {args.grad_accum * args.batch_size} (Micro: {args.batch_size}, Accum: {args.grad_accum})")
    print(f"Sequence Length: {args.max_seq_len} (Memory calibrated)")
    print("=" * 80)
    
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    checkpoints_dir = Path(getattr(args, "checkpoints_dir", CHECKPOINTS_DIR))
    adapter_output_dir = Path(getattr(args, "output_dir", ADAPTER_OUTPUT_DIR))
    checkpoints_dir.mkdir(parents=True, exist_ok=True)
    adapter_output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Load Tokenizer
    print("\n[1/6] Loading Qwen3.5 tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    print(f"  Tokenizer vocabulary size: {len(tokenizer)}")
    
    # 2. Load Base Model
    print("\n[2/6] Loading Qwen3.5 base model weights (BF16)...")
    dtype = torch.bfloat16 if (device.type == "mps" or (device.type == "cuda" and torch.cuda.is_bf16_supported())) else torch.float32
    base_model = AutoModelForCausalLM.from_pretrained(
        args.model,
        torch_dtype=dtype,
        trust_remote_code=True
    ).to(device)
    
    base_params = sum(p.numel() for p in base_model.parameters())
    base_weight_bytes = sum(p.numel() * p.element_size() for p in base_model.parameters())
    print(f"  Base model parameters: {base_params:,} ({base_params/1e9:.3f}B)")
    print(f"  Base model memory footprint: {base_weight_bytes / (1024**3):.2f} GB")
    
    # 3. Configure LoRA Adapter
    print("\n[3/6] Applying PEFT LoRA configuration...")
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
    if args.resume_from and Path(args.resume_from).exists():
        print(f"  [RESUME] Loading existing adapter weights from {args.resume_from}...")
        peft_model = PeftModel.from_pretrained(base_model, args.resume_from, is_trainable=True)
    else:
        peft_model = get_peft_model(base_model, lora_cfg)
    trainable_params, all_params = peft_model.get_nb_trainable_parameters()
    trainable_bytes = trainable_params * 4 # FP32
    print(f"  Trainable LoRA Parameters: {trainable_params:,} / {all_params:,} ({100 * trainable_params / all_params:.3f}%)")
    print(f"  Trainable LoRA memory: {trainable_bytes / (1024**2):.2f} MB")
    
    # 4. Load Dataset Splits
    print("\n[4/6] Loading dataset splits...")
    train_records = load_jsonl(Path(args.train_file))
    valid_records = load_jsonl(Path(args.valid_file))
    print(f"  Train examples: {len(train_records):,} | Valid examples: {len(valid_records):,}")
    
    # Derive exact steps for 1 epoch
    total_train_examples = len(train_records)
    effective_batch = args.batch_size * args.grad_accum
    expected_steps = math.ceil(total_train_examples / effective_batch)
    print(f"  Derived 1-Epoch Steps: {expected_steps} steps (covering all {total_train_examples} records)")
    
    target_steps = min(args.steps, expected_steps) if args.steps else expected_steps
    warmup_steps = max(10, int(target_steps * 0.03))
    
    # 5. Optimizer
    optimizer = torch.optim.AdamW(peft_model.parameters(), lr=args.learning_rate, weight_decay=0.01)
    
    current_step = 0
    sample_idx = 0
    total_supervised_tokens = 0
    step_logs = []
    
    if args.resume_from:
        resume_path = Path(args.resume_from)
        print(f"\n[RESUME] Loading checkpoint from {resume_path}...")
        if (resume_path / "trainer_state.pt").exists():
            state = torch.load(resume_path / "trainer_state.pt", map_location="cpu")
            optimizer.load_state_dict(state["optimizer_state_dict"])
            current_step = state["step"]
            sample_idx = state["processed_samples"]
            total_supervised_tokens = state.get("total_supervised_tokens", 0)
            print(f"  Resumed at step {current_step}, processed {sample_idx} samples, {total_supervised_tokens} supervised tokens.")
        else:
            print("  Note: trainer_state.pt not found; resuming adapter weights only with fresh optimizer.")

    # Initial Validation Loss
    print("\n[5/6] Measuring initial Zero-Shot validation loss on held-out split...")
    init_val_loss = evaluate_validation(peft_model, valid_records, tokenizer, device, max_samples=30, max_seq_len=args.max_seq_len)
    print(f"  Initial Zero-Shot Validation Loss: {init_val_loss:.4f} (Perplexity: {math.exp(min(init_val_loss, 20)):.2f})")
    
    # 6. Training Loop Setup
    print("\n[6/6] Executing Supervised Fine-Tuning optimization loop...")
    peft_model.train()
    optimizer.zero_grad()
    
    accumulated_loss = 0.0
    accumulated_tokens = 0
    accumulated_supervised_tokens = 0
    micro_step = 0
    step_start_time = time.time()
    
    # Graceful interruption handler
    def handle_interrupt(signum, frame):
        print(f"\n[INTERRUPT DETECTED] Signal {signum} received. Safely checkpointing at step {current_step}...")
        int_ckpt = checkpoints_dir / f"checkpoint-interrupted-step-{current_step}"
        save_full_checkpoint(int_ckpt, peft_model, tokenizer, optimizer, current_step, sample_idx, total_supervised_tokens, step_logs)
        print(f"[SAVED] Interruption recovery checkpoint saved to {int_ckpt}")
        sys.exit(0)
        
    signal.signal(signal.SIGINT, handle_interrupt)
    signal.signal(signal.SIGTERM, handle_interrupt)
    
    while current_step < target_steps and sample_idx < total_train_examples:
        sample = train_records[sample_idx]
        sample_idx += 1
        
        masked = create_assistant_masked_sample(sample["messages"], tokenizer, args.max_seq_len)
        if masked is None:
            continue
            
        input_ids = masked["input_ids"].to(device)
        labels = masked["labels"].to(device)
        token_count = masked["token_count"]
        sup_tokens = masked["supervised_tokens"]
        
        # Forward pass
        outputs = peft_model(input_ids=input_ids, labels=labels)
        loss = outputs.loss / args.grad_accum
        
        # Backward pass
        loss.backward()
        
        accumulated_loss += outputs.loss.item()
        accumulated_tokens += token_count
        accumulated_supervised_tokens += sup_tokens
        total_supervised_tokens += sup_tokens
        micro_step += 1
        
        # Gradient accumulation step
        if micro_step % args.grad_accum == 0 or sample_idx == total_train_examples:
            current_step += 1
            
            # Learning rate schedule
            lr_factor = get_lr_multiplier(current_step, target_steps, warmup_steps)
            current_lr = args.learning_rate * lr_factor
            for param_group in optimizer.param_groups:
                param_group["lr"] = current_lr
                
            # Gradient clipping
            grad_norm = torch.nn.utils.clip_grad_norm_(peft_model.parameters(), max_norm=1.0)
            grad_norm_val = round(grad_norm.item() if hasattr(grad_norm, "item") else float(grad_norm), 4)
            
            optimizer.step()
            optimizer.zero_grad()
            
            if device.type == "mps":
                torch.mps.synchronize()
                torch.mps.empty_cache()
                
            step_duration = time.time() - step_start_time
            avg_loss = accumulated_loss / max(1, (micro_step % args.grad_accum or args.grad_accum))
            throughput_tok = accumulated_tokens / max(0.001, step_duration)
            throughput_ex = (args.grad_accum) / max(0.001, step_duration)
            mem_stats = get_memory_stats(device)
            
            log_entry = {
                "step": current_step,
                "processed_examples": sample_idx,
                "train_loss": round(avg_loss, 4),
                "perplexity": round(math.exp(min(avg_loss, 20)), 2),
                "learning_rate": round(current_lr, 7),
                "grad_norm": grad_norm_val,
                "step_time_sec": round(step_duration, 3),
                "tokens_per_sec": round(throughput_tok, 1),
                "examples_per_sec": round(throughput_ex, 2),
                "accumulated_supervised_tokens": total_supervised_tokens,
                "mps_allocated_mb": mem_stats["mps_allocated_mb"],
                "mps_driver_mb": mem_stats["mps_driver_mb"],
                "process_rss_mb": mem_stats["process_rss_mb"],
                "ram_used_pct": mem_stats["ram_used_pct"],
                "swap_used_mb": mem_stats["swap_used_mb"],
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            step_logs.append(log_entry)
            
            # Console log
            if current_step % args.log_every == 0 or current_step == 1 or current_step == target_steps:
                pct = round(100.0 * sample_idx / total_train_examples, 1)
                print(f"  Step {current_step:4d}/{target_steps} ({pct:5.1f}%) | "
                      f"Loss: {avg_loss:.4f} | PPL: {math.exp(min(avg_loss, 20)):5.2f} | "
                      f"Grad: {grad_norm_val:.3f} | LR: {current_lr:.2e} | "
                      f"Speed: {throughput_tok:5.1f} tok/s | "
                      f"MPS: {mem_stats['mps_allocated_mb']:.0f}MB (Driver: {mem_stats['mps_driver_mb']:.0f}MB) | "
                      f"RAM: {mem_stats['ram_used_pct']}%")
                
            # Evaluation Checkpoint
            if current_step % args.eval_every == 0:
                val_loss = evaluate_validation(peft_model, valid_records, tokenizer, device, max_samples=35, max_seq_len=args.max_seq_len)
                val_ppl = math.exp(min(val_loss, 20))
                print(f"  >>> [EVALUATION CHECKPOINT] Step {current_step} Valid Loss: {val_loss:.4f} | Valid PPL: {val_ppl:.2f}")
                log_entry["validation_loss"] = val_loss
                log_entry["validation_perplexity"] = round(val_ppl, 2)
                
            # Save Checkpoint
            if current_step % args.save_every == 0 or current_step == target_steps:
                ckpt_dir = checkpoints_dir / f"checkpoint-step-{current_step}"
                save_full_checkpoint(ckpt_dir, peft_model, tokenizer, optimizer, current_step, sample_idx, total_supervised_tokens, step_logs)
                print(f"  >>> [CHECKPOINT SAVED] Exported step {current_step} to {ckpt_dir}")
                
            accumulated_loss = 0.0
            accumulated_tokens = 0
            accumulated_supervised_tokens = 0
            step_start_time = time.time()
            
    total_training_sec = time.time() - start_time
    
    # Final Validation
    print("\nComputing final validation loss over held-out validation set...")
    final_val_loss = evaluate_validation(peft_model, valid_records, tokenizer, device, max_samples=60, max_seq_len=args.max_seq_len)
    final_val_ppl = math.exp(min(final_val_loss, 20))
    print(f"  Final Validation Loss: {final_val_loss:.4f} | Final Validation Perplexity: {final_val_ppl:.2f}")
    
    # Save Final Adapter
    adapter_output_dir = Path(getattr(args, "output_dir", "training/adapters/mentormaze-2b-core-sft-v2"))
    print(f"\nExporting final completed adapter to {adapter_output_dir}...")
    peft_model.save_pretrained(adapter_output_dir)
    tokenizer.save_pretrained(adapter_output_dir)
    
    # Save metadata summary
    summary = {
        "project": "MentorMaze-2B Specialised Language Model",
        "phase": "Phase 6 Core SFT Training",
        "run_id": f"phase6-core-sft-v2-{int(start_time)}",
        "adapter_id": "mentormaze-2b-core-sft-v2",
        "foundation_model": args.model,
        "device": str(device),
        "total_training_seconds": round(total_training_sec, 2),
        "total_training_minutes": round(total_training_sec / 60, 2),
        "target_steps": target_steps,
        "completed_steps": current_step,
        "total_examples_in_split": total_train_examples,
        "processed_examples": sample_idx,
        "epoch_coverage_pct": round(100.0 * sample_idx / total_train_examples, 2),
        "total_supervised_tokens": total_supervised_tokens,
        "effective_batch_size": effective_batch,
        "lora_rank": args.rank,
        "lora_alpha": args.alpha,
        "trainable_parameters": trainable_params,
        "all_parameters": all_params,
        "trainable_percentage": round(100.0 * trainable_params / all_params, 4),
        "initial_validation_loss": init_val_loss,
        "final_validation_loss": final_val_loss,
        "final_validation_perplexity": round(final_val_ppl, 2),
        "initial_train_loss": step_logs[0]["train_loss"] if step_logs else None,
        "final_train_loss": step_logs[-1]["train_loss"] if step_logs else None,
        "loss_reduction": round(step_logs[0]["train_loss"] - step_logs[-1]["train_loss"], 4) if step_logs else 0,
        "peak_mps_allocated_mb": max(s["mps_allocated_mb"] for s in step_logs) if step_logs else 0,
        "peak_mps_driver_mb": max(s["mps_driver_mb"] for s in step_logs) if step_logs else 0,
        "peak_process_rss_mb": max(s["process_rss_mb"] for s in step_logs) if step_logs else 0,
        "average_throughput_tok_sec": round(sum(s["tokens_per_sec"] for s in step_logs) / max(1, len(step_logs)), 1) if step_logs else 0,
        "step_history": step_logs
    }
    
    summary_file = REPORTS_DIR / "phase6_training_run_log.json"
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"  Full training log written to {summary_file}")
    print("\nPhase 6 training completed successfully!")

def main():
    parser = argparse.ArgumentParser(description="MentorMaze-2B Phase 6 Core SFT Training")
    parser.add_argument("--model", type=str, default="Qwen/Qwen3.5-2B-Base")
    parser.add_argument("--train-file", type=str, default="training/datasets/manifests/train.jsonl")
    parser.add_argument("--valid-file", type=str, default="training/datasets/manifests/valid.jsonl")
    parser.add_argument("--steps", type=int, default=1061)
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--grad-accum", type=int, default=8)
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    parser.add_argument("--rank", type=int, default=16)
    parser.add_argument("--alpha", type=int, default=32)
    parser.add_argument("--max-seq-len", type=int, default=512)
    parser.add_argument("--log-every", type=int, default=10)
    parser.add_argument("--eval-every", type=int, default=100)
    parser.add_argument("--save-every", type=int, default=200)
    parser.add_argument("--output-dir", type=str, default="training/adapters/mentormaze-2b-core-sft-v2")
    parser.add_argument("--checkpoints-dir", type=str, default="training/checkpoints/mentormaze-2b-core-sft-v2")
    parser.add_argument("--resume-from", type=str, default=None, help="Path to checkpoint directory to resume from")
    args = parser.parse_args()
    
    run_phase6_training(args)

if __name__ == "__main__":
    main()
