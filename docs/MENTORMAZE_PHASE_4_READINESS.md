# MentorMaze-2B: Phase 4 Readiness & Honest Deployment Decision

**Target Model:** `MentorMaze-2B` (Fine-Tuned `Qwen/Qwen3.5-2B-Base`)  
**Platform:** MentorMaze by AI Tathastu (`https://mentormaze.aitathastu.com`)  
**Standard:** Zero-Fabrication Mandate, Transparent Auditing & Quality Gates  
**Decision Date:** November 18, 2026  

---

## 1. Executive Summary & Deployment Decision

### Formal Verdict: **CONDITIONAL SHADOW DEPLOYMENT / NO-GO FOR STANDALONE PRODUCTION**

| Deployment Mode | Verdict | Technical Justification |
| :--- | :--- | :--- |
| **Standalone Primary Provider** | **NO-GO** | While the model executes genuine LoRA SFT on MPS with verified gradient descent and valid adapter export, training was executed on a hardware-calibrated sub-epoch budget on Apple Silicon M4 (16 GB unified memory). Standalone production requires a full 1-epoch convergence on cloud accelerators with Flash Linear Attention. |
| **Shadow / Experimental Mentor** | **CONDITIONAL GO** | The model passes adapter reload validation, adheres to Socratic prompting guidelines, and can run side-by-side in shadow mode via local HTTP server (`/v1/chat/completions`) with automatic fallback to Gemini 1.5 Flash or Groq. |
| **Production Fallback Engine** | **ACTIVE** | Google Gemini 1.5 Flash and Groq LPU remain the active high-reliability production backends, with Tathastu deterministic pedagogy as the ultimate zero-network fail-safe. |

---

## 2. Summary of Phase 4 Verified Deliverables

### 2.1 Complete Architectural Purification
1. **Mock Smoke Adapter Isolated:** Quarantined previous 4-layer toy simulation adapter to `training/adapters/mentormaze-2b-smoke-test-only/`. The router classifies it strictly as `SMOKE_TESTED`, prohibiting production traffic.
2. **Hardcoded Benchmark Decommissioned:** Purged static dictionary literals from `evaluate_model.py` and replaced them with empirical perplexity evaluation and real token generation on the 501-case test holdout.
3. **Exact Denominator Alignment:** Reconciled dataset manifests with 9,987 exact deduplicated records (34.915% Technical, 25.033% Career, 20.026% Socratic, 10.013% Behavioral, 10.013% Leveling).
4. **Router Simulation Bypass Removed:** Deleted simulated 18.2ms latency and canned Markdown responses from `ModelProviderRouter.callMentorMaze2B()`. The router now enforces genuine HTTP inference with graceful fallback.

### 2.2 Live LoRA Fine-Tuning Execution
- **Foundation Model:** `Qwen/Qwen3.5-2B-Base` (Text backbone: `Qwen3_5ForCausalLM`, 1,881,825,088 parameters).
- **LoRA Configuration:** Rank 16, Alpha 32, targeting 12 projections across linear attention (Gated DeltaNet), full attention, and SwiGLU MLP layers (16,819,200 trainable parameters, 0.886%).
- **Assistant-Only Masking:** Successfully verified that system prompts and user questions receive `labels = -100`, computing cross-entropy loss exclusively on assistant tokens.
- **Hardware Acceleration:** Executed on Apple Silicon M4 MPS in `bfloat16` precision, achieving stable loss reduction without out-of-memory crashes.

---

## 3. Hardware Bottleneck Analysis & Cloud Scaling Plan

### 3.1 Local Apple Silicon M4 Constraints
During empirical profiling on Apple Silicon M4 (16 GB Unified Memory):
1. **Kernel Fallback Overhead:** Because `flash-linear-attention` and `causal_conv1d` CUDA kernels are unavailable on macOS, PyTorch falls back to reference PyTorch implementations for `chunk_gated_delta_rule`. This increases step latency to ~1.39s per micro-step (~16–22s per accumulated step).
2. **Full Epoch Compute Requirement:** Training the complete 8,488 examples (530 steps with effective batch size 16) locally would require approximately **3.2 hours of uninterrupted GPU compute**, pushing unified memory temperature and risking memory pressure with the Next.js production server running simultaneously.
3. **MLX Memory Allocation Vulnerability:** Running `mlx_lm.lora` on the full model without gradient checkpointing triggered Metal command buffer memory exhaustion (`kIOGPUCommandBufferCallbackErrorOutOfMemory`), confirming PyTorch MPS with memory garbage collection is the only stable local framework for Qwen3.5.

### 3.2 Cloud Scale Convergence Plan (Full Production Model)
For full 1-epoch or 3-epoch convergence of MentorMaze-2B:

| Cloud Hardware | Engine | Time per Epoch | Estimated Cloud Cost |
| :--- | :--- | :--- | :--- |
| **1x NVIDIA A100 (80 GB SXM4)** | Axolotl / vLLM (Flash Linear Attention) | **1.2 hours** | **~$3.60** (Lambda / RunPod @ $3.00/hr) |
| **1x NVIDIA H100 (80 GB PCIe)** | PyTorch 2.5 + FlashAttn-3 | **38 minutes** | **~$2.50** (RunPod @ $3.89/hr) |
| **8x NVIDIA A100 Cluster** | DeepSpeed ZeRO-3 / FSDP | **14 minutes** | **~$6.50** |

---

## 4. Phase 5 Roadmap: Path to Unconditional Production Deployment

1. **Cloud Convergence Run:** Execute a full 3-epoch fine-tuning run on a rented A100 GPU using the canonical `train.jsonl` (8,488 records) with Flash Linear Attention.
2. **DPO Alignment:** Apply Direct Preference Optimization using the 1,000 paired preferences in `ds-ultrafeedback-dpo` to strictly enforce Socratic questioning over direct answers.
3. **Quantization & Edge Packaging:** Export the converged model to GGUF 4-bit (`Q4_K_M`) and MLX 4-bit formats for sub-50ms on-device inference on MacBooks and mobile edge sidecars.
4. **Automated Continuous Evals:** Integrate the 501-case test benchmark into the GitHub Actions CI/CD pipeline.

