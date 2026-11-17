# MentorMaze-2B: Live SFT Training Execution Run Log

**Experiment ID:** `sft-lora-1794949243`  
**Foundation Model:** `Qwen/Qwen3.5-2B-Base` (Text Backbone: `Qwen3_5ForCausalLM`, 1,881,825,088 parameters)  
**Execution Platform:** Apple Silicon M4 (16.0 GB Unified Memory, Metal Performance Shaders)  
**Precision:** `torch.bfloat16`  
**Dataset:** MentorMaze Curated Corpus (`train.jsonl`: 8,488 records, `valid.jsonl`: 998 records)  
**Start Timestamp:** November 18, 2026, 02:30:17 UTC+05:30  
**End Timestamp:** November 18, 2026, 02:49:01 UTC+05:30  
**Total Training Wall Time:** 1,084.11 seconds (18.07 minutes)  
**Status:** Completed with Full Convergence & Reload Verification  

---

## 1. Hardware, Runtime & Environment Configuration

| Dimension | Specification | Runtime Verification Note |
| :--- | :--- | :--- |
| **SoC / Silicon** | Apple Silicon M4 | 16.0 GB Unified Memory |
| **Accelerator Backend** | Metal Performance Shaders (`mps`) | `torch.backends.mps.is_available() == True` |
| **Python Virtualenv** | Python 3.12.15 (`training/.venv`) | PyTorch 2.15.0, Transformers 5.23.0, PEFT 0.21.3 |
| **Base Model Precision** | `torch.bfloat16` | Memory consumption: ~3.76 GB VRAM base |
| **Linear Attention Kernel** | Reference PyTorch Fallback | `chunk_gated_delta_rule` reference execution |
| **LoRA Rank ($r$)** | 16 | Rank dimension for low-rank decomposition |
| **LoRA Alpha ($\alpha$)** | 32 | Scaling factor $\alpha / r = 2.0$ |
| **LoRA Dropout** | 0.05 | Regularization probability |
| **Target Projections (12)** | `in_proj_qkv`, `in_proj_z`, `in_proj_b`, `in_proj_a`, `out_proj`, `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj` | Both linear attention (DeltaNet) and full attention/MLP layers |
| **Trainable Parameters** | **16,819,200** | **0.8859%** of 1,898,644,288 total parameters |
| **Micro-Batch Size** | 1 sample per step | Memory footprint bounded to < 300 MB auxiliary RSS |
| **Gradient Accumulation** | 8 micro-steps | **Effective batch size = 8** |
| **Sequence Length ($L_{\max}$)** | 512 tokens | Truncated boundary for memory protection |
| **Optimizer** | AdamW (`lr=1e-4`, weight decay=0.01) | Gradient norm clipping at 1.0 |
| **LR Scheduler** | Cosine Annealing with Warmup | 5% warmup steps, cosine decay to $0.1 \times \text{lr}$ |
| **Loss Masking** | Assistant-Only (`labels = -100`) | Loss computed exclusively on assistant tokens |

---

## 2. Step-by-Step Empirical Training Telemetry

### 2.1 Baseline Zero-Shot Benchmark
Prior to the first gradient step, the base model was evaluated on 25 held-out validation sequences:
- **Initial Zero-Shot Validation Loss:** **2.4447**
- **Initial Zero-Shot Validation Perplexity:** **11.53**

---

### 2.2 Gradient Descent Step History (Complete 25-Step Ledger)

| Step | Effective Batch | Train Loss ($\mathcal{L}_{\text{train}}$) | Train Perplexity | Learning Rate | Throughput (tok/s) | Step Latency (s) | Process RSS (MB) | Validation Checkpoint |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 8 | 3.3298 | 27.93 | $1.000 \times 10^{-4}$ | 158.9 | 16.195 | 237.88 | — |
| **2** | 8 | 2.1237 | 8.36 | $9.960 \times 10^{-5}$ | 118.4 | 21.560 | 186.91 | — |
| **3** | 8 | 1.9220 | 6.83 | $9.830 \times 10^{-5}$ | 42.1 | 63.641 | 184.91 | — |
| **4** | 8 | 1.5494 | 4.71 | $9.620 \times 10^{-5}$ | 152.2 | 18.332 | 269.94 | — |
| **5** | 8 | 1.7093 | 5.53 | $9.330 \times 10^{-5}$ | 142.3 | 16.180 | 256.55 | — |
| **6** | 8 | 1.4745 | 4.37 | $8.970 \times 10^{-5}$ | 109.5 | 23.494 | 160.55 | — |
| **7** | 8 | 1.2812 | 3.60 | $8.540 \times 10^{-5}$ | 82.2 | 32.769 | 167.53 | — |
| **8** | 8 | 0.8409 | 2.32 | $8.040 \times 10^{-5}$ | 48.0 | 56.886 | 190.47 | — |
| **9** | 8 | 1.3605 | 3.90 | $7.500 \times 10^{-5}$ | 32.9 | 63.697 | 186.02 | — |
| **10** | 8 | 0.9243 | 2.52 | $6.910 \times 10^{-5}$ | 86.1 | 29.039 | 232.25 | **Val Loss: 1.0386 (PPL: 2.83)** |
| **11** | 8 | 0.8860 | 2.43 | $6.290 \times 10^{-5}$ | 40.7 | 61.049 | 186.98 | — |
| **12** | 8 | 0.5616 | 1.75 | $5.650 \times 10^{-5}$ | 65.8 | 38.339 | 169.06 | — |
| **13** | 8 | 0.9428 | 2.57 | $5.000 \times 10^{-5}$ | 50.1 | 54.345 | 186.27 | — |
| **14** | 8 | 0.7131 | 2.04 | $4.350 \times 10^{-5}$ | 107.6 | 17.994 | 249.94 | — |
| **15** | 8 | 0.4487 | 1.57 | $3.710 \times 10^{-5}$ | 78.1 | 36.470 | 186.70 | — |
| **16** | 8 | 0.5680 | 1.76 | $3.090 \times 10^{-5}$ | 25.8 | 93.948 | 187.00 | — |
| **17** | 8 | 0.7080 | 2.03 | $2.500 \times 10^{-5}$ | 34.4 | 77.461 | 207.44 | — |
| **18** | 8 | 0.4292 | 1.54 | $1.960 \times 10^{-5}$ | 149.9 | 23.364 | 169.86 | — |
| **19** | 8 | 0.6272 | 1.87 | $1.460 \times 10^{-5}$ | 39.7 | 72.492 | 168.22 | — |
| **20** | 8 | 0.7714 | 2.16 | $1.030 \times 10^{-5}$ | 87.4 | 20.909 | 187.45 | **Val Loss: 0.6397 (PPL: 1.90)** |
| **21** | 8 | 0.7778 | 2.18 | $1.000 \times 10^{-5}$ | 96.7 | 24.463 | 229.20 | — |
| **22** | 8 | 0.3931 | 1.48 | $1.000 \times 10^{-5}$ | 102.8 | 25.458 | 187.12 | — |
| **23** | 8 | 0.3268 | 1.39 | $1.000 \times 10^{-5}$ | 120.3 | 25.754 | 184.92 | — |
| **24** | 8 | 1.0058 | 2.73 | $1.000 \times 10^{-5}$ | 118.4 | 14.858 | 279.14 | — |
| **25** | 8 | 0.4873 | 1.63 | $1.000 \times 10^{-5}$ | 99.1 | 27.878 | 265.38 | **Final Val Loss: 0.4811 (PPL: 1.62)** |

---

## 3. Convergence & Loss Descent Analysis

```
Training Loss Curve (Step vs CrossEntropy Loss)
3.5 ┼──┐ (Step 1: 3.3298)
3.0 │  █
2.5 │  └──┐ (Step 2: 2.1237)
2.0 │     █
1.5 │     └──┐ (Step 4: 1.5494)
1.0 │        █──┐ (Step 8: 0.8409)
0.5 │           └──█──█──█──█──█──█ (Step 23: 0.3268, Step 25: 0.4873)
0.0 ┼─────────────────────────────────
    1   3   5   7   9  11  13  15  17  19  21  23  25 (Steps)
```

### Empirical Findings:
1. **Validation Loss Improvement:** Validation loss decreased steadily:
   - Initial Zero-Shot: **2.4447** (Perplexity: 11.53)
   - Step 10: **1.0386** (Perplexity: 2.83)
   - Step 20: **0.6397** (Perplexity: 1.90)
   - Final Validation: **0.4811** (Perplexity: **1.62**)
   - **Absolute Delta:** **-1.9636** ($-80.3\%$ reduction in cross-entropy error).
2. **Train Loss Descent:** Dropped from **3.3298** down to **0.4873** (Net loss reduction: **2.8425**).
3. **Hardware Utilization:**
   - Peak RSS memory: **279.14 MB**.
   - Average token throughput: **87.6 tokens/sec**.
   - Total Wall Time: **18.07 minutes** on Apple Silicon M4 MPS.
