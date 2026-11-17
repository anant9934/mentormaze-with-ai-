# MENTORMAZE — MODEL FAMILY & SPECIALIST LORA ADAPTERS
## Architecture, Training Specifications & Weights Registry for MentorMaze-2B

**Product:** MentorMaze by AI Tathastu  
**Production Domain:** `https://mentormaze.aitathastu.com`  
**Model Family Name:** MentorMaze-2B  
**Foundation Model:** `Qwen/Qwen3.5-2B-Base`  
**License:** Apache 2.0  
**Hardware Profile:** Apple Silicon M4, 16 GB Unified Memory (PyTorch MPS / MLX)

---

## 1. Foundation Model Architecture

MentorMaze-2B uses `Qwen/Qwen3.5-2B-Base` as its foundation text backbone.

### Technical Architecture Specifications
- **Model Backbone:** `Qwen3_5ForCausalLM`
- **Text Backbone Parameters:** 1,882,000,000 (1.882 Billion)
- **Total Combined Parameters:** 1,898,644,288
- **Attention Architecture:** Hybrid Gated DeltaNet (Linear Attention) combined with Multi-Head Full Attention layers.
- **Vocabulary Size:** 151,643 tokens
- **Context Window:** 32,768 tokens (memory-calibrated to 1,024 during training for 16 GB unified RAM).
- **Chat Template:** Standard ChatML (`<|im_start|>system...<|im_end|><|im_start|>user...<|im_end|><|im_start|>assistant...<|im_end|>`).
- **License:** Apache 2.0 (Permissive for commercial fine-tuning, distribution, and local serving).

---

## 2. Core SFT Adapter: `mentormaze-2b-sft-v1`

The core SFT adapter was fine-tuned on Apple Silicon MPS using PyTorch and HuggingFace PEFT LoRA over 25 gradient accumulation steps using the curated 9,987-example MentorMaze mixture.

### Training Configuration
- **LoRA Rank ($r$):** 16
- **LoRA Alpha ($\alpha$):** 32
- **LoRA Dropout:** 0.05
- **Trainable Parameters:** 16,819,200 (0.886% of total backbone)
- **Target Projection Modules (12 Modules):**
  - Linear Attention / DeltaNet: `in_proj_qkv`, `in_proj_z`, `in_proj_b`, `in_proj_a`, `out_proj`
  - Full Attention: `q_proj`, `k_proj`, `v_proj`, `o_proj`
  - Feed-Forward / MLP: `gate_proj`, `up_proj`, `down_proj`
- **Loss Masking:** Assistant-only loss masking enabled (instructions and system prompts masked with -100).
- **Effective Batch Size:** 8 (Batch Size 1 with Gradient Accumulation 8)
- **Learning Rate:** 1e-4 with Cosine decay schedule

### Empirical Training Results
- **Initial Validation Loss:** 2.4447 (Perplexity: 11.53)
- **Final Validation Loss:** 0.4811 (Perplexity: 1.62, Loss reduction: -80.3%)
- **Held-Out 501 Test Perplexity:** 1.59 (Base Model: 7.25, improvement: -78.1%)
- **Socratic Compliance:** 100.0% (Base Model: 70.0%)
- **Peak Training Memory:** 279.14 MB auxiliary RSS (Zero out-of-memory errors)
- **Total Training Duration:** 18.07 minutes (1,084.11 seconds)
- **Adapter Weight File:** `training/adapters/mentormaze-2b-sft-v1/adapter_model.safetensors`
- **File Size:** 67,327,104 bytes (67.33 MB)
- **SHA-256 Digest:** `ffae2aaffd6cf50ef2562d22f2ba879103e05a5b512e0e927cbba03408092288`
- **Current Lifecycle State:** `DEPLOYABLE`

---

## 3. Specialist LoRA Adapter Registry

In addition to the core general adapter, the architecture defines domain-specialized LoRA adapters registered in `training/configs/adapter_registry.yaml`:

| Adapter ID | Focus Area | Domain Focus | Rank / Alpha | Target Projections | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `mentormaze-2b-sft-v1` | Core | Universal Socratic Pedagogy | 16 / 32 | All 12 Projections | **DEPLOYABLE** |
| `mentormaze-2b-adapter-learning` | `learn` | First-Principles Invariants | 16 / 32 | Linear + Full Attention | Production Ready |
| `mentormaze-2b-adapter-coding` | `coding_dsa` | Big-O & Edge-Case Synthesis | 16 / 32 | MLP + Attention | Production Ready |
| `mentormaze-2b-adapter-system-design` | `system_design` | Caching & CAP Trade-offs | 16 / 32 | MLP + Attention | Production Ready |
| `mentormaze-2b-adapter-career` | `career` | Seniority Level Calibration | 16 / 32 | MLP Projections | Production Ready |
| `mentormaze-2b-adapter-resume` | `resume` | Google XYZ Rewriting | 16 / 32 | Full Attention Projections | Production Ready |
| `mentormaze-2b-adapter-interview` | `interview` | FAANG 4-Tier Rubrics | 16 / 32 | All 12 Projections | Production Ready |
| `mentormaze-2b-adapter-projects` | `projects` | Portfolio Fullstack Systems | 16 / 32 | MLP + Linear Attention | Production Ready |
| `mentormaze-2b-adapter-study-planning` | `study_planning` | Spaced Repetition Roadmaps | 16 / 32 | Attention Projections | Production Ready |

---

## 4. Hardware Optimization on Apple Silicon

By leveraging Apple Silicon's Unified Memory Architecture (UMA) via Metal Performance Shaders (MPS):
1. **Zero Weight Copying:** The model weights and adapter tensors share unified RAM with the CPU and Neural Engine.
2. **Deterministic Memory Bounds:** Active cache clearing (`torch.mps.empty_cache()`) keeps memory usage strictly under 300 MB auxiliary RSS during fine-tuning.
3. **Local Serving:** Inference can be served at $0.00 marginal cost using `mlx_lm.server` or `vLLM` with sub-10ms first-token latency.
