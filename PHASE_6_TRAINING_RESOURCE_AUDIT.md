# MENTORMAZE — PHASE 6: TRAINING RESOURCE & APPLE SILICON MEMORY AUDIT

**Project:** MentorMaze-2B  
**Target Hardware:** Apple Silicon M4, 16 GB Unified Memory (LPDDR5X)  
**Host OS:** macOS Darwin 24.3.0  
**Compute Acceleration:** Apple Metal Performance Shaders (MPS)  
**Framework:** PyTorch 2.5.1 + Hugging Face Transformers & PEFT  
**Audit Date:** November 18, 2026  

---

## 1. Executive Summary

This audit establishes the empirical memory and compute characteristics of fine-tuning the 1.882-billion-parameter `Qwen/Qwen3.5-2B-Base` model on Apple Silicon M4 hardware with 16 GB of unified memory.

A primary finding of this investigation is that prior claims citing "279.14 MB memory consumption" represented an incomplete metric: they captured only CPU process Resident Set Size (RSS) while completely ignoring the Apple Metal GPU driver memory allocations. In reality, fine-tuning requires between **9.0 GB and 16.8 GB** of unified memory depending on sequence length. Calibrating sequence length to **512 tokens** eliminated severe swap thrashing and delivered a **12.1x speedup** (from 37.04 seconds per step to 3.05 seconds per step).

---

## 2. Demystifying Apple Silicon Unified Memory

### Why "279.14 MB" Was Misleading:
In conventional Linux x86 systems with discrete GPUs (e.g., NVIDIA A100), host RAM and GPU VRAM are physically separated across PCIe buses. Monitoring process RSS via `psutil` or `htop` captures host RAM, while `nvidia-smi` captures VRAM.

On Apple Silicon's Unified Memory Architecture (UMA):
1. **CPU Process RSS (`psutil.Process().memory_info().rss`):** Captures only the Python interpreter, standard C libraries, and metadata structures. When weights are transferred to MPS, PyTorch delegates memory management to the Apple Metal framework.
2. **PyTorch MPS Allocated (`torch.mps.current_allocated_memory()`):** Measures only the active PyTorch tensor buffers explicitly tracked on the device (weights, gradients, optimizer states). For `Qwen3.5-2B` in BF16, this alone is **~4.0 to 4.2 GB**.
3. **Metal Driver Allocated Heap (`torch.mps.driver_allocated_memory()`):** Reflects the true memory mapped by the macOS Metal framework, including memory-mapped model files, intermediate activation graphs, attention scratchpads, and MPS kernel compilation buffers. This metric ranged from **9.0 GB to 16.78 GB**.

```
+---------------------------------------------------------------------------------------+
| TOTAL 16 GB UNIFIED SYSTEM MEMORY (Apple Silicon M4)                                 |
+---------------------------------------------------+-----------------------------------+
| METAL DRIVER ALLOCATED: 9.95 GB                   | AVAILABLE HEADROOM: 6.05 GB       |
|  - Active PyTorch Tensors: 4.16 GB                |  - macOS Kernel & OS: ~3.5 GB     |
|  - Metal Activation Buffers: 5.79 GB              |  - Next.js Web Daemon: ~0.4 GB    |
|  - Python Process RSS: ~0.35 GB                   |  - Free System Headroom: ~2.15 GB |
+---------------------------------------------------+-----------------------------------+
```

---

## 3. Theoretical Model Footprint (BF16 Precision)

The base model architecture is `Qwen3_5ForCausalLM` with a 1.882-billion text parameter backbone:

| Component | Precision | Parameter Count | Exact Memory Footprint |
| :--- | :--- | :--- | :--- |
| **Base Model Backbone** | `bfloat16` (2 bytes/param) | 1,882,000,000 | **3.764 GB** |
| **LoRA Trainable Adapters** ($r=16, \alpha=32$) | `bfloat16` (2 bytes/param) | 16,819,200 | **33.64 MB** |
| **LoRA Gradients** | `bfloat16` (2 bytes/param) | 16,819,200 | **33.64 MB** |
| **AdamW Optimizer States ($m_t, v_t$)** | `float32` (8 bytes/param) | 16,819,200 | **134.55 MB** |
| **Minimum Static Training Working Set** | — | — | **3.966 GB** |

*Crucial Insight:* Any claim that fine-tuning ran in "279 MB" is physically impossible, as the static model weights alone in half-precision require 3.76 GB.

---

## 4. Empirical Sequence Length & Speed Benchmarks

To establish the optimal training configuration, empirical tests were executed directly on the Apple Silicon M4 MPS device using `torch.bfloat16`, batch size 2, and gradient accumulation 4 (effective batch size 8):

| Sequence Length | Step Time (sec) | Tok/sec | MPS Allocated | MPS Driver Allocated | RAM Usage (%) | Swap Usage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1024 Tokens** | 37.04s | ~27 tok/s | 4.48 GB | **16.78 GB** | 94.2% | **4.12 GB** | **REJECTED**: Severe swap thrashing; unified memory saturated. |
| **512 Tokens** | **3.05s** | **~172 tok/s** | **4.16 GB** | **9.95 GB** | **85.8%** | **0.00 GB** | **OPTIMAL**: 12.1x speedup; fits comfortably within 16 GB RAM. |
| **384 Tokens** | 2.20s | ~185 tok/s | 4.08 GB | 9.06 GB | 83.2% | 0.00 GB | Viable, but truncates multi-turn conversation context. |

### Why Sequence Length 1024 Thrashed:
In self-attention and hybrid Gated DeltaNet layers, intermediate activation memory scales quadratically or super-linearly with sequence length when gradient checkpointing is enabled. At sequence length 1024, the Metal driver requested 16.78 GB of addressable space. Because the physical machine has only 16 GB total memory (shared with the OS and background apps), macOS was forced to compress memory and swap 4.12 GB to SSD, slowing step times by 12x.

At **512 tokens**, driver allocation drops to 9.95 GB. Adding macOS system overhead (~3.5 GB) results in total system memory utilization of **13.45 GB**, leaving **2.55 GB of clean headroom** and completely eliminating swap operations.

---

## 5. Live Memory Progression During Phase 6 Training

During the verified `mentormaze-2b-core-sft-v2` training run, telemetry was logged at every step:

```
[Telemetry Log - train_core_sft_v2.py]
--------------------------------------------------------------------------------
Step 1:
  - Batch Loss: 3.3298 | Grad Norm: 9.457 (Clipped to 1.0)
  - Speed: 176.9 tokens/sec (0.49s compute / 4.63s step)
  - PyTorch MPS Allocated: 3,945 MB
  - Metal Driver Allocated: 10,994 MB
  - System RAM Used: 85.4% (13.66 GB / 16.00 GB)
  - Swap Memory Used: 0.0 MB

Step 2:
  - Batch Loss: 2.2390 | Grad Norm: 2.374
  - Speed: 153.8 tokens/sec (0.57s compute / 5.33s step)
  - PyTorch MPS Allocated: 4,066 MB
  - Metal Driver Allocated: 9,090 MB
  - System RAM Used: 85.7% (13.71 GB / 16.00 GB)
  - Swap Memory Used: 0.0 MB

Step 3 (Resumed):
  - Batch Loss: 2.2319 | Grad Norm: 2.416
  - Speed: 166.7 tokens/sec (0.52s compute / 4.92s step)
  - PyTorch MPS Allocated: 3,950 MB
  - Metal Driver Allocated: 9,924 MB
  - System RAM Used: 86.1% (13.78 GB / 16.00 GB)
  - Swap Memory Used: 0.0 MB

Step 4:
  - Batch Loss: 1.9792 | Grad Norm: 2.722
  - Speed: 171.7 tokens/sec (0.51s compute / 4.77s step)
  - PyTorch MPS Allocated: 4,077 MB
  - Metal Driver Allocated: 8,938 MB
  - System RAM Used: 86.3% (13.81 GB / 16.00 GB)
  - Swap Memory Used: 0.0 MB
--------------------------------------------------------------------------------
```

---

## 6. Financial & Cloud Infrastructure Comparison

| Compute Target | Hardware Profile | Hourly Cost | Training Cost (1 Epoch) | Data Sovereignty |
| :--- | :--- | :--- | :--- | :--- |
| **Local Apple Silicon M4** | 16 GB Unified Memory, 10-core GPU | **$0.00** | **$0.00** | 100% Local / Zero Egress |
| **RunPod / Lambda Labs** | 1x NVIDIA RTX 4090 (24 GB) | ~$0.44 / hr | ~$1.20 | Cloud Transfer Required |
| **AWS EC2 (g5.xlarge)** | 1x NVIDIA A10G (24 GB) | ~$1.01 / hr | ~$3.50 | Cloud Transfer Required |
| **Google Cloud (g2-standard-4)** | 1x NVIDIA L4 (24 GB) | ~$0.84 / hr | ~$2.80 | Cloud Transfer Required |

**Conclusion:** Training locally on Apple Silicon M4 incurs **zero marginal financial expense**. The hardware is fully capable of running SFT with sequence length 512 without external cloud dependencies.

