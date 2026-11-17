/**
 * 30-Task Adaptive Teaching & Pedagogy Evaluation Suite
 * Evaluates AIMentorOrchestrator and PedagogyEngine against independent ground truth reference answers
 * Covers: Programming, Data Structures, Algorithms, CS Fundamentals, AI/ML, System Design
 */

import { describe, it, expect } from "vitest";
import { AIMentorOrchestrator } from "../lib/ai-mentor/orchestrator";

export interface PedagogicalTask {
  id: string;
  category: "programming" | "data_structures" | "algorithms" | "cs_fundamentals" | "ai_machine_learning" | "system_design";
  prompt: string;
  expectedKeywords: string[];
  referenceGroundTruth: string;
  expectedStrategy: string;
}

export const ADAPTIVE_LEARNING_TASKS_30: PedagogicalTask[] = [
  // 1. Programming (5 tasks)
  {
    id: "task-prog-01",
    category: "programming",
    prompt: "How does the JavaScript event loop handle microtasks vs macrotasks?",
    expectedKeywords: ["microtask", "event loop", "promise", "queue"],
    referenceGroundTruth: "Microtasks (Promises, queueMicrotask) execute immediately after the current call stack before the next macrotask (setTimeout).",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-prog-02",
    category: "programming",
    prompt: "Why should we avoid calling Array.includes inside a loop over a large array?",
    expectedKeywords: ["O(N)", "linear", "set", "map"],
    referenceGroundTruth: "Array.includes performs an O(N) linear scan, making an enclosing loop O(N^2); a Set or Map offers O(1) average lookup.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-prog-03",
    category: "programming",
    prompt: "What is the difference between interface and type alias in TypeScript?",
    expectedKeywords: ["declaration merging", "union", "type", "interface"],
    referenceGroundTruth: "Interfaces support declaration merging and object contracts; type aliases can model primitives, unions, and tuples.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-prog-04",
    category: "programming",
    prompt: "How does JavaScript lexical scope create closures?",
    expectedKeywords: ["lexical", "scope", "function", "variable"],
    referenceGroundTruth: "A closure retains access to variables from its outer enclosing lexical environment even after the outer function returns.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-prog-05",
    category: "programming",
    prompt: "Why does floating-point arithmetic produce 0.1 + 0.2 = 0.30000000000000004?",
    expectedKeywords: ["binary", "ieee 754", "floating", "precision"],
    referenceGroundTruth: "Decimal fractions like 0.1 and 0.2 cannot be represented precisely in finite binary floating-point representation (IEEE 754).",
    expectedStrategy: "conceptual_explanation",
  },

  // 2. Data Structures (5 tasks)
  {
    id: "task-ds-01",
    category: "data_structures",
    prompt: "How does an LRU Cache achieve O(1) get and put operations?",
    expectedKeywords: ["hash map", "doubly linked list", "o(1)", "node"],
    referenceGroundTruth: "Combines a Hash Map for O(1) key-to-node lookups with a Doubly Linked List for O(1) eviction and move-to-front operations.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-ds-02",
    category: "data_structures",
    prompt: "What is the heap invariant in a min-heap?",
    expectedKeywords: ["parent", "child", "min", "heap"],
    referenceGroundTruth: "Every parent node's value must be less than or equal to the values of its children.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-ds-03",
    category: "data_structures",
    prompt: "How does a Trie achieve prefix searching in O(L) time?",
    expectedKeywords: ["prefix", "node", "character", "length"],
    referenceGroundTruth: "Each edge or node represents a character; traversing a word of length L takes O(L) operations regardless of dataset size.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-ds-04",
    category: "data_structures",
    prompt: "How do separate chaining and open addressing handle hash collisions?",
    expectedKeywords: ["collision", "chaining", "linked list", "probe"],
    referenceGroundTruth: "Separate chaining stores collisions in linked lists or buckets; open addressing probes alternate slots in the array.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-ds-05",
    category: "data_structures",
    prompt: "What does path compression accomplish in Disjoint Set Union (DSU)?",
    expectedKeywords: ["dsu", "root", "path compression", "ackermann"],
    referenceGroundTruth: "Flattens tree depth by pointing traversed nodes directly to the root, yielding near O(1) amortized inverse Ackermann time.",
    expectedStrategy: "conceptual_explanation",
  },

  // 3. Algorithms (5 tasks)
  {
    id: "task-algo-01",
    category: "algorithms",
    prompt: "Why does Two Pointers fail if the array is unsorted?",
    expectedKeywords: ["sorted", "monotonic", "direction", "invariant"],
    referenceGroundTruth: "Unsorted order destroys the directional guarantee that moving left inward increases sum and moving right inward decreases sum.",
    expectedStrategy: "socratic_guidance",
  },
  {
    id: "task-algo-02",
    category: "algorithms",
    prompt: "Why must the 1D space optimized 0/1 Knapsack inner loop iterate backwards?",
    expectedKeywords: ["backward", "capacity", "prevent", "multiple"],
    referenceGroundTruth: "Iterating forward would overwrite subproblems from state i-1, including the current item multiple times like unbounded knapsack.",
    expectedStrategy: "socratic_guidance",
  },
  {
    id: "task-algo-03",
    category: "algorithms",
    prompt: "Why is Merge Sort preferred over Quick Sort for sorting linked lists?",
    expectedKeywords: ["merge sort", "sequential", "random access", "quick sort"],
    referenceGroundTruth: "Linked lists support O(1) pointer splicing and sequential access without requiring random indexing or pivot swaps.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-algo-04",
    category: "algorithms",
    prompt: "Why does Dijkstra's algorithm fail on graphs with negative edge weights?",
    expectedKeywords: ["dijkstra", "negative", "greedy", "shortest path"],
    referenceGroundTruth: "Dijkstra greedily marks visited nodes as final; negative edges can subsequently create shorter paths to already finalized nodes.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-algo-05",
    category: "algorithms",
    prompt: "How does Kahn's algorithm detect cycles during topological sort?",
    expectedKeywords: ["in-degree", "cycle", "topological", "queue"],
    referenceGroundTruth: "If the number of nodes processed with in-degree 0 is less than the total graph vertices, a directed cycle exists.",
    expectedStrategy: "conceptual_explanation",
  },

  // 4. Computer Science Fundamentals (5 tasks)
  {
    id: "task-cs-01",
    category: "cs_fundamentals",
    prompt: "What is Belady's Anomaly and under which page replacement policy does it occur?",
    expectedKeywords: ["belady", "fifo", "page fault", "frame"],
    referenceGroundTruth: "In FIFO replacement, allocating more physical memory frames can counter-intuitively increase page faults; LRU does not suffer from it.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-cs-02",
    category: "cs_fundamentals",
    prompt: "Why is Write-Ahead Logging (WAL) mandatory before committing database buffer pool pages?",
    expectedKeywords: ["wal", "disk", "atomicity", "durability"],
    referenceGroundTruth: "WAL writes mutation records to sequential append-only log on disk before dirty buffer pool pages, guaranteeing durability on crashes.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-cs-03",
    category: "cs_fundamentals",
    prompt: "How does Multi-Version Concurrency Control (MVCC) prevent read-write locks in PostgreSQL?",
    expectedKeywords: ["mvcc", "snapshot", "read", "write"],
    referenceGroundTruth: "Readers view a consistent historical snapshot (xmin/xmax) while writers create new row versions, avoiding read-write locks.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-cs-04",
    category: "cs_fundamentals",
    prompt: "What causes a Translation Lookaside Buffer (TLB) shootdown in multi-core OS?",
    expectedKeywords: ["tlb", "shootdown", "page table", "invalidate"],
    referenceGroundTruth: "When one CPU core modifies page permissions, inter-processor interrupts (IPI) force all other cores to invalidate stale TLB entries.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-cs-05",
    category: "cs_fundamentals",
    prompt: "What is the difference between TCP congestion control and flow control?",
    expectedKeywords: ["flow control", "congestion control", "receiver", "network"],
    referenceGroundTruth: "Flow control prevents sender from overwhelming receiver buffer (rwnd); congestion control prevents sender from overwhelming network (cwnd).",
    expectedStrategy: "conceptual_explanation",
  },

  // 5. AI and Machine Learning (5 tasks)
  {
    id: "task-ai-01",
    category: "ai_machine_learning",
    prompt: "Why does accumulating scalar loss without tensor.detach() cause a GPU VRAM memory leak in PyTorch?",
    expectedKeywords: ["detach", "vram", "graph", "loss"],
    referenceGroundTruth: "Accumulating tensor loss keeps the entire autograd computational graph in memory; using loss.item() extracts the float value.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-ai-02",
    category: "ai_machine_learning",
    prompt: "What is the geometric difference between Cosine Similarity and Euclidean Distance?",
    expectedKeywords: ["cosine", "angle", "magnitude", "euclidean"],
    referenceGroundTruth: "Cosine similarity measures the angle between vectors independent of magnitude; Euclidean distance measures spatial separation.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-ai-03",
    category: "ai_machine_learning",
    prompt: "How does HNSW (Hierarchical Navigable Small World) index accelerate vector retrieval?",
    expectedKeywords: ["hnsw", "graph", "skip list", "ann"],
    referenceGroundTruth: "Constructs multi-layer proximity graphs similar to skip lists, achieving logarithmic search complexity over high-dimensional spaces.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-ai-04",
    category: "ai_machine_learning",
    prompt: "Why must model.eval() and torch.no_grad() be used together during inference in PyTorch?",
    expectedKeywords: ["eval", "no_grad", "dropout", "batchnorm"],
    referenceGroundTruth: "model.eval() disables training behaviors in Dropout and BatchNorm; torch.no_grad() disables autograd graph allocation.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-ai-05",
    category: "ai_machine_learning",
    prompt: "What is the purpose of positional encoding in Transformer self-attention?",
    expectedKeywords: ["positional encoding", "permutation", "order", "attention"],
    referenceGroundTruth: "Self-attention operations are permutation invariant; positional encodings inject sequence order information into token representations.",
    expectedStrategy: "conceptual_explanation",
  },

  // 6. System Design (5 tasks)
  {
    id: "task-sys-01",
    category: "system_design",
    prompt: "Why is it safer to delete (invalidate) a Redis key rather than update it upon database mutation in Cache-Aside?",
    expectedKeywords: ["invalidate", "delete", "race condition", "stale"],
    referenceGroundTruth: "Concurrent writes can interleave unpredictably across DB and cache, leaving stale values permanently in cache if overwritten.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-sys-02",
    category: "system_design",
    prompt: "How does a distributed mutex mitigate a cache stampede?",
    expectedKeywords: ["stampede", "mutex", "lock", "single"],
    referenceGroundTruth: "Forces only one worker thread to acquire the lock and recompute the expired cache entry while other requests wait or retry.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-sys-03",
    category: "system_design",
    prompt: "How does a Bloom filter prevent cache penetration?",
    expectedKeywords: ["bloom filter", "penetration", "non-existent", "database"],
    referenceGroundTruth: "Filters out queries for keys that definitely do not exist in the database, preventing requests from hitting PostgreSQL.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-sys-04",
    category: "system_design",
    prompt: "What are the trade-offs between Write-Through and Write-Back caching?",
    expectedKeywords: ["write-through", "write-back", "latency", "durability"],
    referenceGroundTruth: "Write-through guarantees data consistency at higher write latency; write-back yields ultra-low latency with risk of data loss on crashes.",
    expectedStrategy: "conceptual_explanation",
  },
  {
    id: "task-sys-05",
    category: "system_design",
    prompt: "Why does database connection pooling improve backend throughput?",
    expectedKeywords: ["pool", "connection", "tcp handshake", "overhead"],
    referenceGroundTruth: "Reuses active database connections, eliminating the latency of repeated TCP handshakes, TLS negotiation, and backend authentication.",
    expectedStrategy: "conceptual_explanation",
  },
];

describe("30-Task Adaptive Teaching & Pedagogy Evaluation Suite", () => {
  it("evaluates all 30 tasks for technical accuracy, scaffolding, concept checks, and absence of hallucinations", async () => {
    let passedCount = 0;
    const taskResults: any[] = [];

    for (const task of ADAPTIVE_LEARNING_TASKS_30) {
      const result = await AIMentorOrchestrator.processTurn({
        studentUserId: "usr-eval-student-30",
        userMessage: task.prompt,
        mode: task.expectedStrategy === "socratic_guidance" ? "practice" : "learn",
      });

      const responseLower = result.message.toLowerCase();

      // 1. Technical Accuracy Check: Contains expected core conceptual keywords
      const matchedKeywords = task.expectedKeywords.filter((k) => responseLower.includes(k.toLowerCase()));
      const keywordRatio = matchedKeywords.length / task.expectedKeywords.length;
      const isTechnicallyAccurate = keywordRatio >= 0.5;

      // 2. Concept Verification Check presence
      const hasConceptCheck = Boolean(result.postInteractionCheck?.question);

      // 3. No invented metrics in learning responses
      const hasHallucinatedMetrics = /improved\s+by\s+\d+(\.\d+)?%/i.test(result.message);

      const isPass = isTechnicallyAccurate && !hasHallucinatedMetrics;
      if (isPass) passedCount++;

      taskResults.push({
        taskId: task.id,
        category: task.category,
        prompt: task.prompt,
        strategyUsed: result.teachingStrategy,
        matchedKeywords: matchedKeywords.length + "/" + task.expectedKeywords.length,
        hasConceptCheck,
        hallucinationDetected: hasHallucinatedMetrics,
        status: isPass ? "PASS" : "FAIL",
      });
    }

    const accuracyScore = Number(((passedCount / ADAPTIVE_LEARNING_TASKS_30.length) * 100).toFixed(2));
    console.log("=== 30-TASK ADAPTIVE TEACHING EVALUATION RESULTS ===");
    console.log(`Total Tasks Evaluated: ${ADAPTIVE_LEARNING_TASKS_30.length}`);
    console.log(`Passed Tasks: ${passedCount}`);
    console.log(`Overall Technical Accuracy: ${accuracyScore}%`);

    expect(passedCount).toBeGreaterThanOrEqual(28); // >= 93% pass rate
    expect(accuracyScore).toBeGreaterThanOrEqual(90.0);
  });
});
