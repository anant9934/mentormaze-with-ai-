# MentorMaze-2B: Supervised Fine-Tuning (SFT) Training Guide

**Target Model:** `MentorMaze-2B` (`Qwen/Qwen3.5-2B-Base`)  
**PEFT Methodology:** LoRA (Rank 32, Alpha 64, Dropout 0.05)  
**Supported Execution Environments:** Apple Silicon MPS (`torch.backends.mps`) & NVIDIA CUDA (Float16 / QLoRA 4-bit)  
**Loss Formulation:** Assistant-Only Cross-Entropy Token Masking (`labels = -100` on prompt tokens)  

---

## 1. Environment Setup & Toolchain Prerequisites

Training requires Python 3.10+ (Python 3.12 recommended) and the official ML dependencies managed via `uv`:

```bash
# 1. Create dedicated virtual environment
uv venv training/.venv --python 3.12

# 2. Activate virtual environment
source training/.venv/bin/activate

# 3. Install PyTorch and Hugging Face training libraries
uv pip install \
  torch \
  transformers \
  peft \
  datasets \
  accelerate \
  trl \
  pyyaml \
  requests \
  tqdm
```

Verify that PyTorch recognizes your local accelerator:
```bash
python -c "import torch; print('MPS available:', torch.backends.mps.is_available()); print('CUDA available:', torch.cuda.is_available())"
```

---

## 2. Training Hyperparameters

All training parameters are configured in `training/configs/sft_config.yaml`:

| Parameter | Recommended Value | Description |
| :--- | :--- | :--- |
| `base_model` | `Qwen/Qwen3.5-2B-Base` | Primary foundation candidate |
| `learning_rate` | `2.0e-4` | Peak learning rate for LoRA weights |
| `lr_scheduler_type` | `cosine` | Cosine annealing schedule with decay to 10% |
| `warmup_ratio` | `0.03` | 3% linear warmup |
| `per_device_train_batch_size` | `2` (MPS) / `4` (CUDA) | Micro-batch size per physical device |
| `gradient_accumulation_steps` | `8` (MPS) / `4` (CUDA) | Effective batch size = $2 \times 8 = 16$ |
| `max_seq_length` | `2048` | Sequence length boundary |
| `num_train_epochs` | `3` | Full passes through the training corpus |
| `weight_decay` | `0.01` | L2 weight regularization |
| `lora_r` | `32` | Rank of low-rank matrices |
| `lora_alpha` | `64` | Alpha scaling factor |
| `lora_dropout` | `0.05` | LoRA layer dropout |
| `lora_target_modules` | `[q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj]` | All linear projections |
| `logging_steps` | `10` | Frequency of telemetry emission |
| `save_steps` | `250` | Intermediate checkpoint frequency |
| `eval_steps` | `200` | Held-out validation frequency |

---

## 3. Running the Smoke Test

Before launching a multi-hour training run, execute the automated smoke test to verify tensor device placement, forward pass, gradient backpropagation, loss computation, and adapter saving:

```bash
source training/.venv/bin/activate
python training/scripts/train_sft.py --smoke-test
```

### Smoke Test Validation Output
```text
=== EXECUTING SFT SMOKE TEST ===
Target Device: mps
Step 1/5 - Loss: 10.8232 - Grad Norm: 0.0412
Step 2/5 - Loss: 10.8232 - Grad Norm: 0.0398
...
Saving smoke adapter to: training/adapters/mentormaze-2b-smoke-adapter
[PASSED] Smoke test succeeded in 6.19 seconds.
```

Verified artifact: [adapter_model.safetensors](file:///Users/quantum/Desktop/MENTOR%20MAZE/training/adapters/mentormaze-2b-smoke-adapter/adapter_model.safetensors).

---

## 4. Full Training Commands

### 4.1 Local Training on Apple Silicon (MPS Unified Memory)

```bash
source training/.venv/bin/activate
python training/scripts/train_sft.py \
  --config training/configs/sft_config.yaml \
  --device mps \
  --train-file training/datasets/manifests/train.jsonl \
  --valid-file training/datasets/manifests/valid.jsonl \
  --output-dir training/checkpoints/mentormaze-2b-sft-mps
```

### 4.2 Scaled Cloud Training on NVIDIA CUDA (QLoRA 4-bit)

For remote cloud training (e.g. RunPod, AWS EC2 g5.xlarge, or Lambda Labs):

```bash
source training/.venv/bin/activate
python training/scripts/train_sft.py \
  --config training/configs/sft_config.yaml \
  --device cuda \
  --qlora \
  --train-file training/datasets/manifests/train.jsonl \
  --valid-file training/datasets/manifests/valid.jsonl \
  --output-dir training/checkpoints/mentormaze-2b-sft-cuda
```

---

## 5. Assistant-Only Loss Masking Implementation

Loss masking ensures that prompt tokens do not penalize the model. In `training/scripts/train_sft.py`, tokens are tokenized as:

```python
# Format input sequence
full_prompt = format_chat(messages)
prompt_ids = tokenizer.encode(format_prompt_only(messages))
full_ids = tokenizer.encode(full_prompt)

# Construct labels: mask prompt with -100
labels = [-100] * len(prompt_ids) + full_ids[len(prompt_ids):]
```

This guarantees that gradients flow **only through the assistant's pedagogical reasoning steps**.

---

## 6. Training Pipeline References

- SFT Training Script: [train_sft.py](file:///Users/quantum/Desktop/MENTOR%20MAZE/training/scripts/train_sft.py)
- Training Configuration YAML: [sft_config.yaml](file:///Users/quantum/Desktop/MENTOR%20MAZE/training/configs/sft_config.yaml)
- Smoke Test Report: [training_smoke_test_report.json](file:///Users/quantum/Desktop/MENTOR%20MAZE/training/reports/training_smoke_test_report.json)

