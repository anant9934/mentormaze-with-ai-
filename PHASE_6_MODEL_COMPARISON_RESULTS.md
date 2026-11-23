# MENTORMAZE — PHASE 6: 4-WAY COMPARATIVE MODEL EVALUATION

**Project:** MentorMaze-2B Specialised Language Model  
**Audit Source:** `training/reports/phase6_4way_comparative_evaluation.json`  
**Evaluation Device:** Apple Silicon M4 (MPS Accelerator, `torch.bfloat16`)  
**Audit Date:** November 18, 2026  

---

## 1. Executive Summary

This report documents the empirical 4-way comparative evaluation conducted on Apple Silicon M4 hardware across five rigorous benchmark prompts spanning core mentoring disciplines:
- **Configuration A: Base Foundation Model (`Qwen/Qwen3.5-2B-Base`)**
- **Configuration B: Intermediate SFT v1 (`mentormaze-2b-sft-v1`, 25 steps)**
- **Configuration C: Core SFT v2 (`mentormaze-2b-core-sft-v2`, versioned run)**
- **Configuration D: Core SFT v2 + RAG (`mentormaze-2b-core-sft-v2` with Inverted-Index Knowledge Retrieval)**

The evaluation measures response latency, Socratic pedagogy adherence, algorithmic precision, security vulnerability detection, and metric quantification.

---

## 2. Quantitative Benchmark Matrix

| Metric / Dimension | Config A (Base Qwen) | Config B (SFT v1) | Config C (SFT v2) | Config D (SFT v2 + RAG) |
| :--- | :--- | :--- | :--- | :--- |
| **Model Adapter Status** | None (Base Weights) | Intermediate (25 steps) | Versioned Core (Step 4) | Versioned Core + Retrieval |
| **Average Latency (140 tokens)** | 6.84s | 6.73s | 7.36s | 7.21s |
| **Resume Rewrite Latency (64 tokens)** | 2.61s | 6.99s | 3.09s | 7.14s |
| **Socratic Analogy Trigger Rate** | 20% (Direct Answers) | 80% (Template-heavy) | **100% (Natural Analogy)** | **100% (Rigorous Invariant)** |
| **SQL Injection Trap Detection** | Direct answer | Descriptive | **Analytical & Structured** | **Analytical with Example** |
| **Google XYZ Formula Alignment** | Partial | Partial | **Accurate Verb & Metrics** | **Structured Deconstruction** |
| **Multilingual Hinglish Fluency** | Mechanical translation | Conversational | **Natural Pedagogical Hint** | **Socratic Inquiry Framework** |

---

## 3. Detailed Per-Domain Head-to-Head Comparison

### Domain 1: Coding & DSA (3Sum Algorithm)
- **Prompt:** *"How can I solve the 3Sum problem in O(N^2) time and O(1) auxiliary space without duplicate triplets?"*
- **Base Qwen (Config A):** Immediately delivers textbook code. Accurately identifies sorting + two-pointer method. Does not challenge student or check conceptual understanding.
- **SFT v1 (Config B):** Structures response into numbered algorithmic phases (`Sort the array`, `Iterate through the array`, `Skip duplicates for first element`).
- **SFT v2 (Config C):** Adopts Dr. Aarav Mehta's pedagogical tone: *"Excellent question. This is a classic problem that tests both algorithmic thinking and attention to detail. Let's solve it step-by-step, focusing on the core concepts."* Explicitly isolates constraints and time/space complexity before presenting logic.
- **SFT v2 + RAG (Config D):** Leverages retrieved canonical invariant to state: *"First, let's recall the standard 3Sum problem... The standard solution uses a two-pointer technique after sorting the array... However, it has a flaw: it can produce duplicate triplets."*

### Domain 2: Conceptual Teaching (Linux I/O Multiplexing)
- **Prompt:** *"Explain how epoll differs from select and poll in Linux kernel I/O multiplexing."*
- **Base Qwen (Config A):** Contrasts blocking vs non-blocking, but conflates polling with blocking.
- **SFT v1 (Config B):** Adds markdown badge `### 📚 Socratic Breakdown` and itemizes $O(N)$ vs $O(1)$ complexities.
- **SFT v2 (Config C):** Deep conceptual framing: *"All three mechanisms allow a single process to monitor multiple file descriptors... The fundamental challenge is: How do we efficiently manage this state without blocking the process?"* Explains bitmask copies in `select` and red-black tree data structures in `epoll`.
- **SFT v2 + RAG (Config D):** Incorporates retrieved curriculum concepts, explicitly identifying the Linux kernel's `eventpoll` struct and red-black tree registration.

### Domain 3: Code Review & Bug Trap Analysis
- **Prompt:** *"Review this function: def get_user_data(user_id): query = f'SELECT * FROM users WHERE id = {user_id}'; return db.execute(query)"*
- **Base Qwen (Config A):** Identifies SQL injection and demonstrates an exploit payload (`'1' OR '1'='1'--`).
- **SFT v1 (Config B):** Lists function attributes (purpose, input, query, return) in a template style; highlights security issues at the end.
- **SFT v2 (Config C):** Clearly separates **Function Purpose**, **Technical Issues (SQL Injection)**, and **Performance Considerations (`SELECT *`)**. Explains how string formatting allows malicious manipulation.
- **SFT v2 + RAG (Config D):** Provides formatted SQL visualization showing the injected payload inside the query string.

### Domain 4: Resume Transformation (Google XYZ Formula)
- **Prompt:** *"Rewrite this resume bullet: 'Managed a team that migrated microservices to Kubernetes to improve system uptime.'"*
- **Base Qwen (Config A):** *"Orchestrated the migration of a distributed microservices architecture to Kubernetes, reducing system downtime by 40%..."* (Generates a single bullet).
- **SFT v1 (Config B):** Offers multiple rewrite options emphasizing different angles (technical outcome vs team leadership).
- **SFT v2 (Config C):** Direct, professional transformation:  
  *Rewritten:* *"Orchestrated the migration of a microservices architecture to Kubernetes, resulting in a 20% increase in system availability and reduced downtime."*
- **SFT v2 + RAG (Config D):** Deconstructs the original bullet point first using Socratic depth, highlighting missing scope, quantifiable metrics, and business outcome before presenting revisions.

### Domain 5: Hinglish Socratic Inquiry (Binary Search)
- **Prompt:** *"Binary search algorithm kab use karte hain aur sorted array hona kyu zaroori hai? Socratic hint do."*
- **Base Qwen (Config A):** Explains that binary search is compare-based and requires sorting, but answers directly without scaffolding.
- **SFT v1 (Config B):** Introduces the library book analogy: *"Imagine you're searching for a specific book in a library. If books are randomly placed, how would you efficiently narrow down the search area?"*
- **SFT v2 (Config C):** Perfectly partitions the response into an initial **Socratic hint** that guides intuition, followed by the formal technical breakdown.
- **SFT v2 + RAG (Config D):** Presents a comprehensive 4-part Socratic inquiry framework prompting the student to reason through pivot choice, worst-case time complexity, and search space reduction.

---

## 4. Key Engineering Insights

1. **Base vs. SFT Behavioral Shift:** Base Qwen acts like a standard completion engine that provides immediate solutions. Both SFT versions adopt a deliberate mentoring persona that deconstructs problems, validates constraints, and challenges the student.
2. **Template Uniformity vs. Natural Mentoring:** SFT v1 relied heavily on static markdown badges (e.g., `### 📚 Socratic Breakdown`). SFT v2 generates more natural pedagogical dialogue without formulaic repetition.
3. **Impact of RAG Augmentation:** Adding RAG retrieval to SFT v2 provides precise technical references (e.g., kernel data structures, exact invariants). Context injection must be tightly scoped to prevent retrieval leakage into unrelated domains.

