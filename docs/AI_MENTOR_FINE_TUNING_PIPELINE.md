# AI Mentor Fine-Tuning Pipeline & Preparation Specification

**System:** MentorMaze AI Mentor  
**Component:** SFT Instruction Synthesis, DPO Preference Pairs, and Training Readiness  
**Reference File:** `lib/ai-mentor/dataset-governance.ts`

---

## 1. Fine-Tuning Execution Policy

MentorMaze follows a strict **"Runtime First, Fine-Tuning Second"** strategy:
- The production AI Mentor runs immediately on our local deterministic pedagogical engine and hybrid RAG retrieval with zero external dependencies.
- Fine-tuning (e.g. on Llama-3-8B or Qwen-2.5-Coder) is recommended only after:
  1. The dataset has verified commercial rights.
  2. PII is scrubbed and de-identified.
  3. The base model has been measured on our holdout benchmark.
  4. The fine-tuning budget and GPU infrastructure (H100/A100) are formally allocated.

---

## 2. Supervised Fine-Tuning (SFT) Format

SFT examples enforce the 8-Stage Pedagogical Sequence and eliminate premature answer dumping:

```json
{
  "id": "sft-dsa-twosum-01",
  "student_prompt": "Can I use Two Pointers on an unsorted array to find target sum?",
  "student_context": "Target: SDE-1 | Weakness: Invariant proofs",
  "teaching_strategy": "socratic_guidance",
  "ideal_response": "Consider what happens when you greedily move the left pointer inward on an unsorted array like `[3, 1, 4]`. Does moving inward guarantee that the sum increases? Why or why not?",
  "quality_score": 9.5,
  "topic": "Arrays & Two Pointers",
  "difficulty": "beginner",
  "license_metadata": "MentorMaze Proprietary Consented v2026"
}
```

---

## 3. Direct Preference Optimization (DPO) Preference Pairs

DPO pairs teach the model to prefer productive struggle and progressive hints over lazy code dumping:

- **Prompt**: *"I don't know how to start 0/1 Knapsack. Give me the code."*
- **Chosen Response ($\mathcal{Y}_w$)**: Breaks the problem into the binary decision choice: *"For any given item $i$, what are the two mutually exclusive choices you can make with your remaining weight capacity $W$? Let's write the recurrence for both cases."*
- **Rejected Response ($\mathcal{Y}_l$)**: Dumps 30 lines of full Python code without explaining the state transition table or verifying whether the student understands $O(N \cdot W)$ time complexity.
- **Preference Rationale**: Enforces productive struggle, higher Socratic Quotient, and active learning recall.

---

## 4. Train/Test Contamination Defenses

All evaluation cases in `EvaluationBenchmarkSuite` are quarantined from training corpora. No benchmark holdout scenario may ever be converted into an SFT or DPO training token.

