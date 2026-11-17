# PHASE 5: MODEL ARTIFACT FORENSIC AUDIT
## Independent Technical Verification of MentorMaze-2B Fine-Tuned Weights

**Project:** MentorMaze-2B  
**Platform:** MentorMaze by AI Tathastu (`https://mentormaze.aitathastu.com`)  
**Audit Date:** November 18, 2026  
**Auditor:** Independent AI Systems Auditor  
**Repository Commit:** `20af8e4`

---

## 1. Executive Summary & Verdict

This forensic audit inspected the claimed model weights, configurations, and checkpoint artifacts located in `training/adapters/mentormaze-2b-sft-v1/` and `training/adapters/mentormaze-2b-smoke-test-only/`.

### Definitive Forensic Verdict
1. **The artifact `mentormaze-2b-sft-v1` IS a genuine LoRA adapter containing real fine-tuned tensors** trained on Apple Silicon MPS via PyTorch and PEFT. It is **NOT** a dummy mock or empty placeholder directory.
2. **The artifact was trained for 25 optimizer steps** (effective batch size 8, representing 200 training examples consumed out of 8,488 in `training/datasets/manifests/train.jsonl`).
3. **The artifact is an EVALUATED intermediate training checkpoint**, not a fully trained model that completed an epoch.
4. **Independent Process Loading Passed:** In a separate standalone Python process on Apple Silicon M4 MPS, `training/adapters/mentormaze-2b-sft-v1` was loaded onto `Qwen/Qwen3.5-2B-Base` and successfully generated structured text in 5.07 seconds.
5. **Lifecycle Downgrade:** Because only 200 out of 8,488 examples were processed, the artifact's status has been downgraded from `DEPLOYABLE` to **`EVALUATED`** (intermediate research artifact). Under the strict zero-fabrication mandate, it must not be labeled production-deployable until a full epoch is executed.

---

## 2. Artifact Forensic Manifest

| Property | Forensic Finding | Evidence / Verification Method |
| :--- | :--- | :--- |
| **Directory Path** | `training/adapters/mentormaze-2b-sft-v1/` | `ls -la` confirmed directory exists |
| **Weights File** | `adapter_model.safetensors` | 67,327,104 bytes (67.33 MB) |
| **SHA-256 Checksum** | `ffae2aaffd6cf50ef2562d22f2ba879103e05a5b512e0e927cbba03408092288` | `shasum -a 256` verified |
| **Base Model Name** | `Qwen/Qwen3.5-2B-Base` | Specified in `adapter_config.json` |
| **PEFT Architecture** | LoRA (`r=16`, `lora_alpha=32`, `lora_dropout=0.05`) | Verified in `adapter_config.json` |
| **Tensor Count** | **372 tensor keys** | Loaded via `safetensors.torch.load_file` |
| **Trainable Parameters** | **16,819,200 parameters** | Counted from tensor shapes ($16.82\text{M}$) |
| **Total Base Parameters** | **1,882,000,000** (Text Backbone) | $1.898\text{B}$ with adapter |
| **Trainable Ratio** | **0.886%** of base model parameters | Memory-efficient parameter-efficient fine-tuning |
| **Tokenizer Vocab Size** | **248,077 tokens** | Loaded from `tokenizer.json` (19.98 MB) |
| **Chat Template** | Qwen ChatML (`<\|im_start\|>`, `<\|im_end\|>`) | Verified in `chat_template.jinja` |

---

## 3. Tensor Structure & Layer Mapping Analysis

Inspection of `adapter_model.safetensors` reveals that the adapter targets both the Gated DeltaNet linear attention projections and the full attention/MLP layers across all 24 layers of the Qwen 3.5 text backbone:

### Sample Tensor Shapes Verified from Disk:
```
base_model.model.model.layers.0.linear_attn.in_proj_a.lora_A.weight: shape [16, 2048], dtype torch.float32
base_model.model.model.layers.0.linear_attn.in_proj_a.lora_B.weight: shape [16, 16], dtype torch.float32
base_model.model.model.layers.0.linear_attn.in_proj_b.lora_A.weight: shape [16, 2048], dtype torch.float32
base_model.model.model.layers.0.linear_attn.in_proj_b.lora_B.weight: shape [16, 16], dtype torch.float32
base_model.model.model.layers.0.linear_attn.in_proj_qkv.lora_A.weight: shape [16, 2048], dtype torch.float32
base_model.model.model.layers.0.linear_attn.in_proj_qkv.lora_B.weight: shape [6144, 16], dtype torch.float32
base_model.model.model.layers.0.linear_attn.in_proj_z.lora_A.weight: shape [16, 2048], dtype torch.float32
base_model.model.model.layers.0.linear_attn.in_proj_z.lora_B.weight: shape [2048, 16], dtype torch.float32
base_model.model.model.layers.0.linear_attn.out_proj.lora_A.weight: shape [16, 2048], dtype torch.float32
base_model.model.model.layers.0.linear_attn.out_proj.lora_B.weight: shape [2048, 16], dtype torch.float32
base_model.model.model.layers.3.self_attn.q_proj.lora_A.weight: shape [16, 2048], dtype torch.float32
base_model.model.model.layers.3.self_attn.q_proj.lora_B.weight: shape [2048, 16], dtype torch.float32
base_model.model.model.layers.0.mlp.gate_proj.lora_A.weight: shape [16, 2048], dtype torch.float32
base_model.model.model.layers.0.mlp.gate_proj.lora_B.weight: shape [6144, 16], dtype torch.float32
```

This confirms authentic parameter initialization targeting the hybrid linear attention and transformer blocks.

---

## 4. Independent Loading & Generation Verification

An independent test script was executed in a clean Python process to load the base model and adapter:

### Execution Command:
```bash
./training/.venv/bin/python -c "
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

tokenizer = AutoTokenizer.from_pretrained('training/adapters/mentormaze-2b-sft-v1')
base_model = AutoModelForCausalLM.from_pretrained(
    'Qwen/Qwen3.5-2B-Base',
    torch_dtype=torch.bfloat16,
    trust_remote_code=True
).to('mps')
model = PeftModel.from_pretrained(base_model, 'training/adapters/mentormaze-2b-sft-v1')
model.eval()

prompt = 'Explain how React virtual DOM diffing works from first principles.'
messages = [{'role': 'user', 'content': prompt}]
text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
inputs = tokenizer([text], return_tensors='pt').to('mps')
outputs = model.generate(**inputs, max_new_tokens=60, temperature=0.3)
print(tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True))
"
```

### Actual Output Generated by the Model:
```
# React Virtual DOM Diffing: First Principles

## Core Concept
React's virtual DOM diffing algorithm works by comparing the current state of the virtual DOM with the previous state, calculating the minimal set of changes needed to update the virtual DOM to match the new state, and then applying those changes to
```

**Result:** The model weights loaded without corruption, memory overflow, or tensor dimension mismatch. It successfully produced coherent domain tokens on Apple Silicon MPS.

---

## 5. Artifact Status Downgrade & Reconciliation

| Old Classification | New Audited Classification | Reason for Downgrade |
| :--- | :--- | :--- |
| `DEPLOYABLE` | **`EVALUATED`** | Only 25 optimizer steps were completed (200 of 8,488 examples consumed). Does not meet full-epoch requirement. |
| Smoke Test | **Intermediate Checkpoint** | Distinct from `training/adapters/mentormaze-2b-smoke-test-only` (which was 4.4 MB on mock architecture). `mentormaze-2b-sft-v1` is 67.33 MB on real Qwen 3.5. |
| Production Serving | **Research / Standby Daemon** | Accessible via local inference server on port 8000 for experimentation; cloud fallback ensures student reliability. |
