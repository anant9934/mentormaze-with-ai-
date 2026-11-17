/**
 * Curriculum Knowledge Engine for MentorMaze AI Mentor
 * Provides verified, deterministic pedagogical instruction across Computer Science, DSA,
 * Systems, and AI/ML when external LLM APIs are unconfigured or unavailable.
 * Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
 */

export interface CurriculumTopic {
  id: string;
  category: "programming" | "data_structures" | "algorithms" | "cs_fundamentals" | "ai_machine_learning" | "system_design";
  title: string;
  keywords: string[];
  triggers: RegExp[];
  conceptExplanation: string;
  socraticHints: [string, string, string]; // Hint 1, Hint 2, Hint 3
  conceptCheck: {
    question: string;
    expectedKeyPoints: string[];
  };
}

export const CURRICULUM_TOPICS: CurriculumTopic[] = [
  // 1. Programming (5 topics)
  {
    id: "prog-event-loop",
    category: "programming",
    title: "JavaScript Event Loop: Microtasks vs Macrotasks",
    keywords: ["microtask", "event loop", "promise", "queue"],
    triggers: [/event loop/i, /microtask/i, /macrotask/i, /settimeout.*promise/i],
    conceptExplanation: `### 📚 Deep-Dive: JavaScript Event Loop & Microtask Queue Priorities

#### **1. Intuition (Why This Matters)**
In JavaScript's single-threaded runtime, asynchronous coordination depends entirely on the event loop. Misunderstanding how promises and timers queue can lead to subtle race conditions, starvation of UI rendering, and out-of-order execution bugs.

#### **2. The Execution Hierarchy**
1. **Call Stack**: Executes synchronous JavaScript instructions until empty.
2. **Microtask Queue**: Promises (\`.then\`, \`.catch\`, \`await\`), \`queueMicrotask()\`, and Node.js \`process.nextTick()\`.
3. **Macrotask (Task) Queue**: \`setTimeout\`, \`setInterval\`, \`setImmediate\`, and I/O callbacks.

> 🔑 **The Golden Rule**: The event loop *drains the entire microtask queue* immediately after the current synchronous frame finishes, before processing even a single macrotask or performing browser rendering.

#### **3. Step-by-Step Execution Sequence**
1. Synchronous frame finishes; call stack reaches 0 frames.
2. Event loop inspects the microtask queue.
3. If a microtask schedules another microtask, it is enqueued into the current drain cycle, potentially starving macrotasks.
4. Once the microtask queue is completely empty, the event loop picks exactly *one* task from the macrotask queue.

#### **4. Non-Obvious Edge Case**
Calling \`queueMicrotask()\` recursively will completely freeze browser DOM rendering and timer execution because the engine never yields back to the macrotask/render phase.`,
    socraticHints: [
      "Before looking at setTimeout, ask: where do resolved Promise callbacks land in the queue hierarchy?",
      "Microtasks execute immediately after the active stack frame empties, before the event loop advances to the next macrotask.",
      "Because the microtask queue must be completely drained first, a Promise chain will execute before any setTimeout callback."
    ],
    conceptCheck: {
      question: "What happens if a microtask enqueues another microtask continuously?",
      expectedKeyPoints: ["microtask queue starvation", "macrotasks blocked", "rendering blocked"]
    }
  },
  {
    id: "prog-array-includes-loop",
    category: "programming",
    title: "Hidden Complexity: Array.includes Inside Loops",
    keywords: ["o(n)", "linear", "set", "map"],
    triggers: [/array\.includes/i, /includes.*loop/i, /linear scan/i],
    conceptExplanation: `### 📚 Deep-Dive: Hidden Asymptotic Complexity of Array.includes Inside Loops

#### **1. Intuition (Why This Matters)**
A clean, readable line of code can secretly destroy production server throughput. Calling \`array.includes()\` looks like a single operation, but behind the scenes it executes a linear O(N) scan.

#### **2. The Quadratic Trap**
\`\`\`javascript
// ⚠️ Anti-pattern: O(N * M) Quadratic Complexity
for (const item of largeArrayA) {
  if (largeArrayB.includes(item)) { // O(N) linear scan on every iteration!
    common.push(item);
  }
}
\`\`\`
If both arrays have 100,000 items, this loops $10^{10}$ operations, taking minutes and freezing the thread.

#### **3. The O(1) Solution: Set or Map Lookup**
By pre-indexing the second collection into an ES6 \`Set\` or \`Map\`, lookups drop to amortized **O(1)** constant time:
\`\`\`javascript
// ✅ Idiomatic High-Performance Pattern: O(N + M) Linear Time
const lookupSet = new Set(largeArrayB); // O(M) time, O(M) space
for (const item of largeArrayA) {
  if (lookupSet.has(item)) { // O(1) amortized
    common.push(item);
  }
}
\`\`\``,
    socraticHints: [
      "What is the internal time complexity of Array.prototype.includes across N elements?",
      "Because includes traverses elements sequentially, an enclosing loop of size M multiplies the bounds into O(N * M).",
      "Which hash-based data structure provides amortized O(1) containment checks?"
    ],
    conceptCheck: {
      question: "Why does a Set provide O(1) average lookup compared to Array's O(N) scan?",
      expectedKeyPoints: ["hash table indexing", "constant time bucketing", "linear scan elimination"]
    }
  },
  {
    id: "prog-interface-vs-type",
    category: "programming",
    title: "TypeScript Architecture: Interface vs Type Alias",
    keywords: ["declaration merging", "union", "type", "interface"],
    triggers: [/interface.*type/i, /type alias/i, /declaration merging/i],
    conceptExplanation: `### 📚 Deep-Dive: TypeScript Interface vs Type Alias

#### **1. Intuition (Why This Matters)**
TypeScript developers frequently debate \`interface\` vs \`type\`. Understanding their precise mechanical differences allows you to design extensible library APIs and robust domain models.

#### **2. Core Distinctions**
1. **Declaration Merging**: Multiple \`interface\` declarations with the same name in the same scope automatically merge their fields. \`type\` aliases throw a duplicate identifier compiler error.
2. **Union and Primitive Types**: A \`type\` alias can model primitives, unions (\`type Status = "pending" | "resolved"\`), and tuples directly. An \`interface\` cannot directly represent a union without wrapping an object.
3. **Performance**: In large codebases, the TypeScript compiler caches \`interface\` shapes more efficiently during type-checking than complex recursive type alias intersections.`,
    socraticHints: [
      "What happens if you declare two interfaces with the exact same name in the same file?",
      "Interfaces support declaration merging, which makes them ideal for public library extension.",
      "How would you declare a union of string literals? Can an interface do that directly?"
    ],
    conceptCheck: {
      question: "When must you use a type alias instead of an interface?",
      expectedKeyPoints: ["unions", "primitives", "mapped types", "tuples"]
    }
  },
  {
    id: "prog-lexical-scope-closures",
    category: "programming",
    title: "JavaScript Lexical Scope & Closures",
    keywords: ["lexical", "scope", "function", "variable"],
    triggers: [/closure/i, /lexical scope/i, /outer function/i],
    conceptExplanation: `### 📚 Deep-Dive: JavaScript Lexical Environment & Closures

#### **1. Intuition (Why This Matters)**
A closure is not a special syntax or method—it is the natural consequence of JavaScript's lexical scoping rules. Functions remember where they were born.

#### **2. The Formal Mechanics**
Whenever a function is defined, it retains an internal reference (\`[[Environment]]\`) to the lexical scope in which it was authored. Even if the outer function finishes execution and leaves the call stack, any enclosed variable referenced by the inner function is preserved on the heap and protected from garbage collection.`,
    socraticHints: [
      "When an outer function returns, does its execution context disappear from the call stack?",
      "Yes, but if an inner function references outer variables, does garbage collection reclaim them?",
      "The inner function holds a lexical closure over outer variables, keeping them alive on the heap."
    ],
    conceptCheck: {
      question: "Why does a closure prevent outer local variables from being garbage collected?",
      expectedKeyPoints: ["active reference chain", "heap retention", "lexical environment reference"]
    }
  },
  {
    id: "prog-floating-point-math",
    category: "programming",
    title: "IEEE 754 Floating-Point Representation (0.1 + 0.2)",
    keywords: ["binary", "ieee 754", "floating", "precision"],
    triggers: [/0\.1\s*\+\s*0\.2/i, /floating-point/i, /ieee\s*754/i, /0\.30000000000000004/i],
    conceptExplanation: `### 📚 Deep-Dive: IEEE 754 Floating-Point Precision (0.1 + 0.2)

#### **1. Intuition (Why This Matters)**
In JavaScript, Python, and C++, \`0.1 + 0.2 === 0.30000000000000004\`. This is not a bug in the language runtime; it is a fundamental property of binary floating-point arithmetic.

#### **2. Binary Fractions**
Computers store numbers in base-2 (binary). Fractions like $1/2$ ($0.1_2$) or $1/4$ ($0.01_2$) terminate cleanly. However, base-10 fractions like $0.1$ ($1/10$) and $0.2$ ($1/5$) result in infinitely repeating binary fractions:
$$0.1_{10} = 0.00011001100110011..._2$$
Under the IEEE 754 double-precision standard (64-bit), mantissa bits are truncated at 53 bits of precision, creating minor rounding residuals.`,
    socraticHints: [
      "How do we write 1/3 in base-10 decimal notation? Does it ever terminate?",
      "In binary (base-2), which fractions terminate? Only powers of 2 in the denominator.",
      "Because 0.1 cannot be represented finitely in binary, IEEE 754 truncates it to 53 bits."
    ],
    conceptCheck: {
      question: "How do financial applications avoid IEEE 754 floating-point rounding errors?",
      expectedKeyPoints: ["integer cents", "arbitrary precision decimals", "BigInt/Decimal libraries"]
    }
  },

  // 2. Data Structures (5 topics)
  {
    id: "ds-lru-cache",
    category: "data_structures",
    title: "LRU Cache Architecture: Hash Map + Doubly Linked List",
    keywords: ["hash map", "doubly linked list", "o(1)", "node"],
    triggers: [/lru cache/i, /least recently used/i, /lru.*o\(1\)/i],
    conceptExplanation: `### 📚 Deep-Dive: LRU Cache in O(1) Time

#### **1. Intuition (Why This Matters)**
A Least Recently Used (LRU) cache evicts the oldest untouched entry when capacity is saturated. Achieving strict O(1) time for both \`get()\` and \`put()\` requires combining two complementary data structures.

#### **2. The Hybrid Topology**
- **Hash Map**: Stores \`key -> Node\` references. Yields **O(1)** key lookups.
- **Doubly Linked List**: Maintains chronological access order. Yields **O(1)** node removal and insertion at the head.

\`\`\`
[Head: Most Recent] <-> [Node A] <-> [Node B] <-> [Node C] <-> [Tail: Oldest / Evictable]
      ^
      |
  Hash Map: { "A": NodeA, "B": NodeB, "C": NodeC }
\`\`\`

#### **3. Operational Invariant**
Whenever a node is accessed via \`get()\` or updated via \`put()\`, it is unlinked from its current position in O(1) and spliced directly behind the head.`,
    socraticHints: [
      "A Hash Map gives O(1) lookup, but can it track chronological ordering in O(1)?",
      "An array tracks order, but removing from the middle takes O(N) shifts. What list allows O(1) middle deletion if you hold the pointer?",
      "By pointing Hash Map entries directly to Doubly Linked List nodes, we achieve O(1) splice and O(1) lookup."
    ],
    conceptCheck: {
      question: "Why is a doubly linked list used instead of a singly linked list in an LRU cache?",
      expectedKeyPoints: ["O(1) deletion needs prev pointer", "singly linked requires O(N) traversal to find previous node"]
    }
  },
  {
    id: "ds-min-heap-invariant",
    category: "data_structures",
    title: "Min-Heap Structural and Order Invariants",
    keywords: ["parent", "child", "min", "heap"],
    triggers: [/min-heap/i, /heap invariant/i, /priority queue/i],
    conceptExplanation: `### 📚 Deep-Dive: Min-Heap Invariant & Array Indexing

#### **1. Intuition & Formal Definition**
A Min-Heap is a complete binary tree where every parent node satisfies the **heap invariant**:
$$\\text{Value}(\\text{parent}) \\le \\text{Value}(\\text{child})$$
Consequently, the root node always holds the absolute minimum element in the entire structure.

#### **2. Zero-Pointer Array Representation**
Because a heap is a complete binary tree (filled left-to-right on all levels), it requires no pointers and can be stored in a contiguous array:
- Parent of index $i$: $\\lfloor(i - 1) / 2\\rfloor$
- Left child: $2i + 1$
- Right child: $2i + 2$`,
    socraticHints: [
      "In a binary search tree, left < parent < right. Is that also true in a min-heap?",
      "In a min-heap, does the left child have to be smaller than the right child?",
      "The heap invariant only enforces that the parent is less than or equal to both of its children."
    ],
    conceptCheck: {
      question: "What is the time complexity of building a heap of N elements from an unsorted array?",
      expectedKeyPoints: ["O(N) bottom-up heapify", "not O(N log N)"]
    }
  },
  {
    id: "ds-trie-prefix",
    category: "data_structures",
    title: "Trie (Prefix Tree) Time Complexity & Traversal",
    keywords: ["prefix", "node", "character", "length"],
    triggers: [/\btrie\b/i, /prefix tree/i, /prefix search/i],
    conceptExplanation: `### 📚 Deep-Dive: Trie (Prefix Tree) Complexity Bounds

#### **1. Intuition (Why This Matters)**
Searching for a prefix across a dictionary of 1,000,000 words using linear regex takes seconds. A Trie (Prefix Tree) searches by prefix in time proportional only to the length of the search word $L$, independent of dataset size $N$.

#### **2. Structural Invariant**
Each edge or child node corresponds to a single character. Words sharing a common prefix traverse the exact same root-to-node path.
- **Insert**: $O(L)$ where $L$ is word length.
- **Search / Prefix**: $O(L)$ character hops.
- **Space Complexity**: $O(\\Sigma \\cdot L \\cdot N)$ where $\\Sigma$ is alphabet size.`,
    socraticHints: [
      "If you search for 'cat' in an array of 10,000,000 words, how many comparisons occur?",
      "In a Trie, how many transitions do you take to verify the prefix 'cat'?",
      "Traversing a Trie requires exactly L transitions where L is the character length of the query."
    ],
    conceptCheck: {
      question: "What is the primary trade-off of a Trie compared to a Hash Set?",
      expectedKeyPoints: ["memory overhead for child pointers", "prefix search efficiency"]
    }
  },
  {
    id: "ds-hash-collisions",
    category: "data_structures",
    title: "Hash Collisions: Separate Chaining vs Open Addressing",
    keywords: ["collision", "chaining", "linked list", "probe"],
    triggers: [/hash collision/i, /separate chaining/i, /open addressing/i, /linear probing/i],
    conceptExplanation: `### 📚 Deep-Dive: Hash Collisions — Chaining vs Open Addressing

#### **1. Intuition (Why This Matters)**
By the Pigeonhole Principle, mapping an infinite key domain to a finite table array inevitably generates hash collisions. Two primary strategies resolve them:

#### **2. Separate Chaining**
Each bucket in the hash table points to an auxiliary data structure (typically a linked list, red-black tree, or dynamic array). When keys collide, they are appended to the bucket's chain.

#### **3. Open Addressing (Linear / Quadratic / Double Hashing)**
All elements reside directly within the primary array. When collision occurs at index $h(k)$, the algorithm probes alternative indices ($h(k) + i$) until an empty slot is located. Requires keeping the load factor $\\alpha < 0.7$ to prevent clustering.`,
    socraticHints: [
      "When two distinct keys hash to the exact same array index, where do you store the second key?",
      "Separate chaining keeps collisions outside the main array in bucket lists.",
      "Open addressing searches for the next available open slot within the array using probing."
    ],
    conceptCheck: {
      question: "What is the risk of high load factor in linear probing?",
      expectedKeyPoints: ["primary clustering", "long probe sequences", "degraded O(N) lookup"]
    }
  },
  {
    id: "ds-dsu-path-compression",
    category: "data_structures",
    title: "Disjoint Set Union (DSU) & Path Compression",
    keywords: ["dsu", "root", "path compression", "ackermann"],
    triggers: [/dsu/i, /disjoint set/i, /union find/i, /path compression/i],
    conceptExplanation: `### 📚 Deep-Dive: Disjoint Set Union (DSU) & Inverse Ackermann Time

#### **1. Intuition (Why This Matters)**
Disjoint Set Union (Union-Find) maintains partitioned equivalence classes (e.g. connected components in a graph). Naive parent pointers can degenerate into linear chains of depth $O(N)$.

#### **2. Path Compression & Union by Rank**
- **Path Compression**: During \`find(x)\`, every visited node updates its parent pointer directly to the representative root node. This flattens the tree dynamically.
- **Combined Complexity**: Combining path compression with union by rank/size guarantees an amortized time complexity of $O(\\alpha(N))$ per operation, where $\\alpha$ is the inverse Ackermann function (effectively $\\le 4$ for any universe size).`,
    socraticHints: [
      "In a naive Union-Find tree, what happens if we repeatedly union elements in a straight line?",
      "The tree degenerates into a linear linked list with O(N) find time.",
      "Path compression flattens the tree so every visited node points directly to the root, achieving inverse Ackermann amortized time."
    ],
    conceptCheck: {
      question: "Why is inverse Ackermann complexity considered practically constant time?",
      expectedKeyPoints: ["alpha(N) <= 4 for all practical N <= 10^80", "nearly O(1) amortized"]
    }
  },

  // 3. Algorithms (5 topics)
  {
    id: "algo-two-pointers",
    category: "algorithms",
    title: "Two Pointers Directional Invariant & Unsorted Breakdown",
    keywords: ["sorted", "monotonic", "direction", "invariant"],
    triggers: [/two pointer/i, /two-pointer/i, /why.*two pointers.*unsorted/i],
    conceptExplanation: `### 📚 Deep-Dive: Two Pointers Pattern & Invariant Maintenance

#### **1. Intuition (Why This Matters)**
The Two Pointers pattern replaces brute-force nested loops ($O(N^2)$) with linear-time directional traversal ($O(N)$) and constant auxiliary space ($O(1)$).

#### **2. The Directional Invariant**
On a sorted array, moving the left pointer rightward strictly increases the sum; moving the right pointer leftward strictly decreases the sum. If the array is unsorted, this directional guarantee collapses completely because moving a pointer could increase, decrease, or maintain the sum unpredictably.`,
    socraticHints: [
      "Before writing code, consider the fundamental invariant of this problem:",
      "What property must an array possess so that moving a left pointer inward always increases the sum?",
      "If the array is unsorted, you lose directional monotonicity and cannot greedily choose which pointer to move."
    ],
    conceptCheck: {
      question: "What is the trade-off of sorting an unsorted array first versus using a Hash Map?",
      expectedKeyPoints: ["O(N log N) time with O(1) space", "vs O(N) time with O(N) space"]
    }
  },
  {
    id: "algo-knapsack-1d",
    category: "algorithms",
    title: "0/1 Knapsack: Why 1D Space Optimization Iterates Backwards",
    keywords: ["backward", "capacity", "prevent", "multiple"],
    triggers: [/knapsack/i, /1d.*knapsack/i, /0\/1 knapsack/i],
    conceptExplanation: `### 📚 Deep-Dive: 0/1 Knapsack & Backward Iteration in 1D DP

#### **1. Intuition (Why This Matters)**
The standard 2D recurrence for 0/1 Knapsack is:
$$\\text{dp}[i][w] = \\max(\\text{dp}[i-1][w], v_i + \\text{dp}[i-1][w - w_i])$$
Because row $i$ depends strictly on values from row $i-1$, we can compress the memory into a single 1D array of size $W+1$.

#### **2. Why We Must Iterate Backwards**
When compressing to 1D:
- If we iterate **forward** ($w$ from $w_i$ to $W$), calculating $\\text{dp}[w]$ uses the already-updated $\\text{dp}[w - w_i]$ from the *current* item $i$, effectively including item $i$ multiple times (which solves Unbounded Knapsack, not 0/1 Knapsack).
- By iterating **backwards** ($w$ from $W$ down to $w_i$), the value $\\text{dp}[w - w_i]$ is guaranteed to come from the previous item $i-1$, preserving the 0/1 constraint. Iterating backward over capacity is mandatory to prevent taking multiple copies of the same item.`,
    socraticHints: [
      "In 1D space-optimized 0/1 Knapsack, why must the inner loop iterate backward across capacity to prevent selecting multiple instances of an item?",
      "If you iterate capacity forward in a 1D array, which row's values are you reading from?",
      "Iterating backwards over remaining capacity prevents the current item from being counted multiple times in the same step."
    ],
    conceptCheck: {
      question: "Which variation of Knapsack is solved if you iterate the 1D capacity loop forwards?",
      expectedKeyPoints: ["unbounded knapsack", "coin change with infinite coins"]
    }
  },
  {
    id: "algo-merge-sort-linked-list",
    category: "algorithms",
    title: "Merge Sort vs Quick Sort for Singly Linked Lists",
    keywords: ["merge sort", "sequential", "random access", "quick sort"],
    triggers: [/merge sort.*linked list/i, /quick sort.*linked list/i, /sorting linked list/i],
    conceptExplanation: `### 📚 Deep-Dive: Why Merge Sort Dominates Linked List Sorting

#### **1. Intuition (Why This Matters)**
While Quick Sort is often faster for contiguous arrays due to CPU cache locality and in-place partitioning, Merge Sort is the undisputed standard for sorting linked lists.

#### **2. Core Reasons**
1. **Sequential Access**: Linked lists do not support $O(1)$ random access indexing. Finding the median pivot or swapping arbitrary elements in Quick Sort takes $O(N)$ linear pointer chasing.
2. **O(1) Pointer Merging**: Merging two sorted linked lists requires only splicing pointer connections in **O(1) auxiliary space**, eliminating Merge Sort's notorious $O(N)$ array allocation overhead.`,
    socraticHints: [
      "Can you access the k-th element of a linked list in O(1) time like an array?",
      "Quick Sort relies on random access pivots and bidirectional swaps. Does a singly linked list support that?",
      "Merge Sort only requires sequential access and merges lists in O(1) auxiliary space by splicing pointers."
    ],
    conceptCheck: {
      question: "Why does array Merge Sort require O(N) extra space while linked list Merge Sort requires O(1)?",
      expectedKeyPoints: ["pointer splicing", "no contiguous buffer allocation"]
    }
  },
  {
    id: "algo-dijkstra-negative-weights",
    category: "algorithms",
    title: "Why Dijkstra's Algorithm Fails on Negative Edge Weights",
    keywords: ["dijkstra", "negative", "greedy", "shortest path"],
    triggers: [/dijkstra.*negative/i, /negative edge/i, /dijkstra.*fail/i],
    conceptExplanation: `### 📚 Deep-Dive: Dijkstra's Greedy Choice Assumption & Negative Edges

#### **1. Intuition (Why This Matters)**
Dijkstra's algorithm is a greedy algorithm. It operates on the invariant that once a node is extracted from the priority queue (marked visited), its recorded shortest path from the source is finalized and optimal.

#### **2. The Violation**
With negative edge weights, this greedy invariant breaks down:
- Suppose path $S \\to A$ has cost 5, and $S \\to B$ has cost 8.
- Dijkstra extracts $A$ and marks its distance as 5 permanently.
- However, if an edge exists $B \\to A$ with weight -10, the total path $S \\to B \\to A$ is $8 - 10 = -2$, which is shorter than 5!
- Because Dijkstra never revisits finalized nodes, it fails to find this optimal path. (Use Bellman-Ford or SPFA instead).`,
    socraticHints: [
      "What greedy assumption does Dijkstra make when extracting a node from the min-heap?",
      "It assumes all subsequent edge weights are non-negative, meaning distances can only grow.",
      "A negative edge can retroactively decrease the shortest path to an already finalized node."
    ],
    conceptCheck: {
      question: "Which algorithm should you use to find shortest paths in graphs with negative weights?",
      expectedKeyPoints: ["Bellman-Ford", "SPFA", "cycle detection"]
    }
  },
  {
    id: "algo-kahns-algorithm-cycle",
    category: "algorithms",
    title: "Kahn's Algorithm (BFS Topological Sort) Cycle Detection",
    keywords: ["in-degree", "cycle", "topological", "queue"],
    triggers: [/kahn/i, /topological sort/i, /cycle detection.*directed/i, /in-degree/i],
    conceptExplanation: `### 📚 Deep-Dive: Kahn's Algorithm & Topological Cycle Detection

#### **1. Intuition & Operational Mechanics**
Kahn's algorithm performs a BFS topological sort by tracking the in-degree of all vertices in a Directed Graph (DAG):
1. Compute in-degree for all vertices.
2. Push all vertices with $\\text{in-degree} = 0$ into a queue.
3. While queue is non-empty, dequeue vertex $u$, increment processed node counter, and decrement the in-degree of all its neighbors $v$.
4. If neighbor $v$'s in-degree drops to 0, push $v$ into the queue.

#### **2. Cycle Detection Criterion**
If the graph contains a directed cycle, nodes participating in the cycle can never have their in-degree reduced to 0. Consequently, when the queue empties, if $\\text{count of processed nodes} < |V|$, a cycle exists!`,
    socraticHints: [
      "What is the in-degree of a node inside a directed loop A -> B -> C -> A?",
      "Every node in a cycle has at least one incoming edge that can never be freed.",
      "If the number of processed nodes with in-degree 0 is less than total vertices V, a directed cycle exists."
    ],
    conceptCheck: {
      question: "Can topological sort be defined on an undirected cyclic graph?",
      expectedKeyPoints: ["only on DAGs", "directed acyclic graphs"]
    }
  },

  // 4. CS Fundamentals (5 topics)
  {
    id: "cs-belady-anomaly",
    category: "cs_fundamentals",
    title: "Operating Systems: Belady's Anomaly in FIFO Paging",
    keywords: ["belady", "fifo", "page fault", "frame"],
    triggers: [/belady/i, /page replacement/i, /fifo.*frame/i],
    conceptExplanation: `### 📚 Deep-Dive: Belady's Anomaly & Paging Algorithms

#### **1. Intuition (Why This Matters)**
Intuition suggests that allocating more physical RAM frames to a process will always reduce or maintain the number of page faults. In 1969, László Bélády proved this is false for First-In, First-Out (FIFO) replacement.

#### **2. Belady's Anomaly**
Under FIFO, increasing the number of page frames can counter-intuitively *increase* the total number of page faults for specific reference strings.

#### **3. Why Stack Algorithms (LRU) Are Immune**
Stack algorithms satisfy the property that the set of pages in an $M$-frame cache is strictly a subset of the pages in an $(M+1)$-frame cache ($S_M \\subseteq S_{M+1}$). FIFO is not a stack algorithm, whereas Least Recently Used (LRU) and Optimal (OPT) are mathematically immune.`,
    socraticHints: [
      "If you give an OS more RAM frames, should page faults go down or up?",
      "In FIFO, does having more frames guarantee that previous cached pages are retained?",
      "FIFO does not satisfy the inclusion property, causing Belady's Anomaly where more frames yield more faults."
    ],
    conceptCheck: {
      question: "Why does LRU never suffer from Belady's Anomaly?",
      expectedKeyPoints: ["stack algorithm", "inclusion property", "subset hierarchy"]
    }
  },
  {
    id: "cs-wal-durability",
    category: "cs_fundamentals",
    title: "Database Internals: Write-Ahead Logging (WAL) & ACID",
    keywords: ["wal", "disk", "atomicity", "durability"],
    triggers: [/write-ahead logging/i, /wal/i, /acid.*durability/i, /buffer pool.*disk/i],
    conceptExplanation: `### 📚 Deep-Dive: Write-Ahead Logging (WAL) & Durability

#### **1. Intuition (Why This Matters)**
Writing dirty data pages directly to random locations on disk for every SQL transaction is too slow. Databases cache modified pages in memory (Buffer Pool). But what happens if power fails before pages are flushed?

#### **2. The WAL Protocol**
The Write-Ahead Logging rule dictates:
> *No modified data page in the buffer pool may be written to non-volatile disk until the corresponding log record describing the update has been flushed to sequential append-only disk storage.*

#### **3. ACID Guarantees**
1. **Durability**: Once a transaction commits, its log record is fsynced to disk. If the server crashes immediately after, crash recovery replays the WAL (REDO) to reconstruct buffer pool state.
2. **Atomicity**: If a transaction aborts or crashes mid-way, the WAL contains the prior values (UNDO), allowing the engine to rollback uncommitted changes.`,
    socraticHints: [
      "Why is appending to a sequential log faster than writing dirty table pages directly to disk?",
      "Sequential I/O avoids random disk seeks and fsync overhead on data files.",
      "WAL guarantees durability by logging transaction mutations to disk before buffer pool pages are written."
    ],
    conceptCheck: {
      question: "What are the REDO and UNDO phases during database crash recovery?",
      expectedKeyPoints: ["REDO reapplies committed changes", "UNDO rolls back uncommitted changes"]
    }
  },
  {
    id: "cs-mvcc-postgresql",
    category: "cs_fundamentals",
    title: "PostgreSQL Concurrency: Multi-Version Concurrency Control (MVCC)",
    keywords: ["mvcc", "snapshot", "read", "write"],
    triggers: [/mvcc/i, /multi-version concurrency/i, /read.*write.*lock/i, /xmin.*xmax/i],
    conceptExplanation: `### 📚 Deep-Dive: PostgreSQL MVCC & Non-Blocking Reads

#### **1. Intuition (Why This Matters)**
In traditional database locking (2PL), reading a row blocks writers, and writing a row blocks readers. Multi-Version Concurrency Control (MVCC) achieves the gold standard:
> *Readers never block writers, and writers never block readers.*

#### **2. How PostgreSQL Implements MVCC**
- Every row header contains two hidden transaction ID fields: \`xmin\` (creating transaction ID) and \`xmax\` (deleting/updating transaction ID).
- When a row is updated, PostgreSQL does not overwrite the existing bytes in place. Instead, it sets \`xmax\` on the old row and inserts a brand new row version with \`xmin\` set to current transaction ID.
- Each transaction reads against an atomic **snapshot** of active transaction IDs, only viewing row versions that were committed prior to the snapshot.`,
    socraticHints: [
      "In standard locking, what happens when a long reporting query reads a table while updates happen?",
      "MVCC creates row versions instead of locking existing data in place.",
      "Readers see a consistent historical snapshot using xmin/xmax, preventing read-write lock contention."
    ],
    conceptCheck: {
      question: "What background PostgreSQL process reclaims old, invisible dead tuples created by MVCC?",
      expectedKeyPoints: ["VACUUM", "autovacuum", "page bloat cleanup"]
    }
  },
  {
    id: "cs-tlb-shootdown",
    category: "cs_fundamentals",
    title: "Operating Systems: TLB Shootdown in Multi-Core Architectures",
    keywords: ["tlb", "shootdown", "page table", "invalidate"],
    triggers: [/tlb shootdown/i, /translation lookaside buffer/i, /tlb.*core/i],
    conceptExplanation: `### 📚 Deep-Dive: TLB Shootdown in Multi-Core Processors

#### **1. Intuition & Architectural Challenge**
Each CPU core maintains its own local hardware Translation Lookaside Buffer (TLB) to cache virtual-to-physical address mappings. What happens when Core 0 unmaps a memory page or reduces permissions (e.g. read-write to read-only)?

#### **2. The Shootdown Sequence**
1. Core 0 updates the architectural page table in main memory.
2. Because Cores 1, 2, and 3 might still hold the stale translation in their local TLBs, Core 0 sends an Inter-Processor Interrupt (IPI) to all other cores.
3. The interrupted cores trap into the OS kernel, flush/invalidate the specified virtual address in their local TLBs, and send an acknowledgment.
4. Core 0 waits until all cores have acknowledged before proceeding, introducing synchronization overhead known as a **TLB shootdown**.`,
    socraticHints: [
      "Does CPU core 1 share the same hardware L1 cache or TLB as CPU core 2?",
      "No, TLBs are per-core hardware caches.",
      "When one core alters a page table, it must send inter-processor interrupts (IPI) to force other cores to invalidate stale entries."
    ],
    conceptCheck: {
      question: "Why is frequent TLB shootdown detrimental to multi-threaded server performance?",
      expectedKeyPoints: ["IPI interrupt overhead", "core stalling", "context switch latency"]
    }
  },
  {
    id: "cs-tcp-flow-vs-congestion",
    category: "cs_fundamentals",
    title: "Networking: TCP Flow Control vs Congestion Control",
    keywords: ["flow control", "congestion control", "receiver", "network"],
    triggers: [/flow control/i, /congestion control/i, /tcp.*flow/i, /tcp.*congestion/i, /rwnd.*cwnd/i],
    conceptExplanation: `### 📚 Deep-Dive: TCP Flow Control vs Congestion Control

#### **1. Intuition (Why This Matters)**
Both mechanisms throttle transmission rate to prevent packet drops, but they protect entirely different entities across the network:

#### **2. Flow Control (Protecting the Receiver)**
- **Objective**: Flow control prevents the sender from overwhelming the *receiver's* local buffer.
- **Mechanism**: The receiver advertises its available buffer capacity in the TCP header via the **Receive Window (\`rwnd\`)**. The sender never transmits more unacknowledged bytes than \`rwnd\`.

#### **3. Congestion Control (Protecting the Intermediate Network)**
- **Objective**: Congestion control prevents senders from overwhelming the *switches, routers, and intermediate links* of the Internet network.
- **Mechanism**: The sender dynamically estimates network capacity via the **Congestion Window (\`cwnd\`)** using algorithms like Slow Start, AIMD (Additive Increase / Multiplicative Decrease), and BBR.

$$\\text{Effective Window} = \\min(\\text{rwnd}, \\text{cwnd})$$`,
    socraticHints: [
      "If a client phone has a tiny memory buffer, which mechanism protects it from a high-speed server?",
      "Flow control uses rwnd to protect the receiver's buffer.",
      "Congestion control uses cwnd to protect the intermediate network routers from packet drops."
    ],
    conceptCheck: {
      question: "How does TCP detect network congestion in traditional Reno vs modern BBR?",
      expectedKeyPoints: ["packet loss / duplicate ACKs in Reno", "round-trip time and bottleneck bandwidth in BBR"]
    }
  },

  // 5. AI / Machine Learning (5 topics)
  {
    id: "ai-pytorch-loss-detach",
    category: "ai_machine_learning",
    title: "PyTorch Memory Management: Autograd Graph & Tensor Detach",
    keywords: ["detach", "vram", "graph", "loss"],
    triggers: [/loss\.item\(\)/i, /detach.*vram/i, /pytorch.*memory leak/i, /total_loss\s*\+=/i],
    conceptExplanation: `### 📚 Deep-Dive: PyTorch Autograd Graph & GPU VRAM Leaks

#### **1. Intuition (Why This Matters)**
A notorious PyTorch bug is the silent out-of-memory (OOM) crash that happens after several training epochs. The code looks harmless:
\`\`\`python
# ⚠️ Memory Leak: Retains entire autograd graph
total_loss += loss 
\`\`\`

#### **2. The Mechanical Cause**
In PyTorch, \`loss\` is not a float—it is a Tensor linked to the entire dynamic computational graph through its \`grad_fn\` pointer. Accumulating \`loss\` directly keeps the computational history of every previous mini-batch in GPU VRAM, preventing Python's garbage collector from freeing intermediate activations.

#### **3. The Fix**
Extract the raw Python number using \`.item()\` or decouple the tensor from the computational graph using \`.detach()\`:
\`\`\`python
# ✅ Correct: Zero memory accumulation
total_loss += loss.item()
\`\`\``,
    socraticHints: [
      "In PyTorch, does the loss variable only store a floating point number?",
      "No, loss is a tensor connected to the entire autograd backward computational graph.",
      "Using loss.item() extracts the scalar value, breaking the reference chain and freeing GPU VRAM."
    ],
    conceptCheck: {
      question: "What is the difference between tensor.detach() and tensor.item()?",
      expectedKeyPoints: ["detach returns a tensor without history", "item returns a Python float"]
    }
  },
  {
    id: "ai-cosine-vs-euclidean",
    category: "ai_machine_learning",
    title: "Vector Geometry: Cosine Similarity vs Euclidean Distance",
    keywords: ["cosine", "angle", "magnitude", "euclidean"],
    triggers: [/cosine.*euclidean/i, /cosine similarity/i, /l2 distance/i, /vector distance/i],
    conceptExplanation: `### 📚 Deep-Dive: Cosine Similarity vs Euclidean Distance

#### **1. Intuition & Geometry**
When comparing high-dimensional vector embeddings (e.g., text representations):
- **Cosine Similarity**: Measures the cosine of the **angle** between two vectors in directional space. It is completely invariant to vector magnitude:
  $$\\cos(\\theta) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|}$$
- **Euclidean Distance (L2 norm)**: Measures the straight-line spatial distance between points in coordinate space:
  $$d(A, B) = \\sqrt{\\sum (A_i - B_i)^2}$$

#### **2. When to Use Which**
For text embeddings, document length often inflates vector magnitude without changing core topical semantics. Cosine similarity correctly matches long and short documents on the same subject. Note: When vectors are L2-normalized (unit length $\\|A\\| = 1$), Euclidean distance is strictly monotonic with Cosine similarity.`,
    socraticHints: [
      "If you double the word count of an article without changing its topic, what happens to its vector length?",
      "Magnitude increases, but does the directional angle in semantic space change?",
      "Cosine similarity evaluates the angle between vectors, ignoring magnitude differences."
    ],
    conceptCheck: {
      question: "Why is Cosine Similarity mathematically identical to dot product for normalized vectors?",
      expectedKeyPoints: ["denominator ||A||*||B|| = 1", "dot product equals cos(theta)"]
    }
  },
  {
    id: "ai-hnsw-vector-index",
    category: "ai_machine_learning",
    title: "Vector Search: HNSW (Hierarchical Navigable Small World)",
    keywords: ["hnsw", "graph", "skip list", "ann"],
    triggers: [/hnsw/i, /vector index/i, /navigable small world/i, /ann search/i],
    conceptExplanation: `### 📚 Deep-Dive: HNSW Index Architecture for Approximate Nearest Neighbors (ANN)

#### **1. Intuition (Why This Matters)**
Brute-force k-NN requires computing distances against every vector in the database ($O(N \\cdot D)$), which is too slow for millions of items. HNSW accelerates Approximate Nearest Neighbor (ANN) vector retrieval to sub-10ms queries with $O(\\log N)$ search complexity.

#### **2. Multi-Layer Proximity Graph (Skip List Analogy)**
HNSW builds a hierarchical multi-layer graph inspired by a skip list:
- **Top Layers**: Sparse graphs with long-range edges between distant vectors (analogous to the top express lanes in a skip list). Fast macroscopic routing.
- **Bottom Layers**: Dense graphs with local proximity edges between tight clusters. Accurate microscopic nearest-neighbor convergence.`,
    socraticHints: [
      "How does a Skip List achieve O(log N) lookup in a linked list?",
      "It uses multiple express layers to skip large intervals before dropping down.",
      "HNSW applies the skip-list principle to multi-layer proximity graphs for logarithmic vector search."
    ],
    conceptCheck: {
      question: "What are the two primary hyperparameters governing speed vs recall in HNSW?",
      expectedKeyPoints: ["M (max links per node)", "efConstruction / efSearch (beam search width)"]
    }
  },
  {
    id: "ai-eval-no-grad",
    category: "ai_machine_learning",
    title: "PyTorch Inference: model.eval() and torch.no_grad()",
    keywords: ["eval", "no_grad", "dropout", "batchnorm"],
    triggers: [/model\.eval/i, /torch\.no_grad/i, /eval.*no_grad/i],
    conceptExplanation: `### 📚 Deep-Dive: PyTorch model.eval() vs torch.no_grad()

#### **1. Intuition (Why Both Are Mandatory)**
Developers often confuse \`model.eval()\` and \`torch.no_grad()\`, assuming one replaces the other. They control orthogonal systems:

#### **2. Distinct Roles**
- **\`model.eval()\`**: Switches model module behavior. Specifically:
  - Disables **Dropout** (sets dropout probability to 0 so all neurons fire deterministically).
  - Switches **BatchNorm** to use running population statistics (mean and variance) instead of computing batch statistics.
  - *Does NOT disable autograd graph construction!*
- **\`torch.no_grad()\`**: Context manager that disables the **autograd** gradient tracking engine. Reduces GPU memory consumption by omitting graph node allocations.`,
    socraticHints: [
      "Does model.eval() stop PyTorch from tracking gradients during backward pass?",
      "No! It only alters layer behavior like Dropout and BatchNorm.",
      "torch.no_grad() shuts off the autograd engine to save memory, while model.eval() guarantees deterministic layer inference."
    ],
    conceptCheck: {
      question: "What happens if you run evaluation with torch.no_grad() but forget model.eval()?",
      expectedKeyPoints: ["Dropout stays active (random output)", "BatchNorm uses mini-batch stats instead of population stats"]
    }
  },
  {
    id: "ai-positional-encoding",
    category: "ai_machine_learning",
    title: "Transformers: Positional Encoding in Self-Attention",
    keywords: ["positional encoding", "permutation", "order", "attention"],
    triggers: [/positional encoding/i, /transformer.*order/i, /permutation invariant/i],
    conceptExplanation: `### 📚 Deep-Dive: Positional Encoding in Transformer Self-Attention

#### **1. Intuition (Why This Matters)**
In recurrent networks (RNNs/LSTMs), tokens are ingested sequentially ($t_1, t_2, t_3$), naturally encoding word order. In Transformers, Self-Attention computes pairwise dot products across all tokens simultaneously:
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$
This operation is strictly **permutation-invariant**: "The dog bit the cat" produces the exact same attention outputs as "The cat bit the dog" unless sequence order is explicitly injected.

#### **2. Injecting Positional Information**
Positional encodings (sinusoidal or learned absolute/RoPE relative embeddings) are added to the input token embeddings before the first attention layer, providing the model with coordinate signals of token order.`,
    socraticHints: [
      "If you scramble the order of words in a sentence, does the dot product matrix Q * K^T detect the change on its own?",
      "Self-attention is permutation-invariant; it does not know which word came first.",
      "Positional encodings inject token order vectors into the word representations so the model distinguishes sequence order."
    ],
    conceptCheck: {
      question: "What is the advantage of Rotary Position Embeddings (RoPE) over absolute sinusoidal encodings?",
      expectedKeyPoints: ["relative distance modeling", "extrapolation to longer contexts via rotation"]
    }
  },

  // 6. System Design (5 topics)
  {
    id: "sys-cache-invalidation",
    category: "system_design",
    title: "Cache Invalidation: Why Delete is Safer Than Update in Cache-Aside",
    keywords: ["invalidate", "delete", "race condition", "stale"],
    triggers: [/delete.*cache/i, /invalidate.*cache-aside/i, /update.*cache/i, /cache invalidation/i],
    conceptExplanation: `### 📚 Deep-Dive: Cache-Aside Invalidation Mechanics (Delete vs Update)

#### **1. Intuition (Why This Matters)**
When updating an entity in the primary database, should the application update the Redis cache key or delete (invalidate) it? Industry consensus strongly favors **delete**:

#### **2. The Concurrent Race Condition Trap**
Consider two concurrent requests updating the same user profile:
1. Thread A updates DB to \`v1\`.
2. Thread B updates DB to \`v2\`.
3. Due to network jitter, Thread B updates Redis to \`v2\`.
4. Thread A's delayed packet arrives and updates Redis to \`v1\`.
> 💥 **Result**: The database has \`v2\`, but Redis permanently holds stale \`v1\`!

#### **3. The Safe Delete Pattern**
If threads simply **delete** the key upon DB commit, the next read cleanly misses and repopulates the latest value from the database, eliminating this race condition.`,
    socraticHints: [
      "What happens if two concurrent database updates write to Redis out of order?",
      "A delayed write from an earlier transaction could overwrite the newer value in the cache.",
      "Deleting the cache key forces the next read to query the database, preventing permanent stale cache states."
    ],
    conceptCheck: {
      question: "What is Delayed Double Deletion in distributed database setups?",
      expectedKeyPoints: ["delete cache before DB commit", "sleep briefly and delete again to eliminate replica lag race"]
    }
  },
  {
    id: "sys-cache-stampede",
    category: "system_design",
    title: "Distributed Mutex & Thundering Herd (Cache Stampede) Mitigation",
    keywords: ["stampede", "mutex", "lock", "single"],
    triggers: [/stampede/i, /thundering herd/i, /distributed mutex/i, /cache miss.*concurrent/i],
    conceptExplanation: `### 📚 Deep-Dive: Cache Stampede & Distributed Mutex Mitigation

#### **1. Intuition (Why This Matters)**
In high-throughput services (e.g. 20,000 QPS), a hot cache key (such as the homepage catalog) expiring causes thousands of concurrent requests to experience a cache miss simultaneously. Every request races to query the database, saturating connection pools and taking the database down.

#### **2. Distributed Mutex Solution**
When a cache miss occurs:
1. The thread attempts to acquire a short-lived distributed mutex (e.g., Redis \`SET lock:key token NX PX 5000\`).
2. If the lock is acquired, that **single** thread queries the database, repopulates Redis, and releases the lock.
3. All other threads fail to acquire the lock, sleep briefly (e.g., 50ms), and retry reading from the cache, which is now warm.`,
    socraticHints: [
      "When a hot key expires under 10,000 QPS, how many requests hit the database at the same second?",
      "Thousands! This is called a cache stampede or thundering herd.",
      "A distributed mutex ensures only one worker thread queries the database while others wait for the cache to repopulate."
    ],
    conceptCheck: {
      question: "What is probabilistic early expiration (XFetch) as an alternative to mutex locking?",
      expectedKeyPoints: ["refreshes cache in background before TTL expires", "asymmetric probability curve"]
    }
  },
  {
    id: "sys-bloom-filter-penetration",
    category: "system_design",
    title: "Cache Penetration & Bloom Filter Defenses",
    keywords: ["bloom filter", "penetration", "non-existent", "database"],
    triggers: [/bloom filter/i, /cache penetration/i, /non-existent.*cache/i],
    conceptExplanation: `### 📚 Deep-Dive: Cache Penetration & Space-Efficient Bloom Filters

#### **1. Intuition (Why This Matters)**
**Cache Penetration** occurs when malicious or anomalous requests continuously query keys that do *not exist* in either the cache or the database (e.g., \`GET /user/-9999\`). Because the key never exists, the cache is never populated, and every single request bypasses the cache and hammers PostgreSQL.

#### **2. Bloom Filter Defense**
A **Bloom Filter** is placed in front of the cache:
- It uses a bit array and $k$ independent hash functions to test set membership in $O(1)$ time and minimal RAM.
- **Definitive Guarantee**: If the Bloom filter returns **false**, the key *definitely does not exist* in the database. The request is rejected immediately without touching Redis or PostgreSQL.
- **False Positives**: It may occasionally return true for non-existent items, but these are safely handled by caching a short-lived null value (\`null\` object with 60s TTL).`,
    socraticHints: [
      "If a user repeatedly queries ID -12345, will the cache ever store data for it?",
      "No, so every request penetrates straight to the database.",
      "A Bloom filter tests set membership with zero false negatives, discarding non-existent queries before they touch the database."
    ],
    conceptCheck: {
      question: "Can an item be deleted from a standard Bloom Filter?",
      expectedKeyPoints: ["no, bits are shared across hash functions", "requires Counting Bloom Filter to support deletion"]
    }
  },
  {
    id: "sys-write-through-vs-write-back",
    category: "system_design",
    title: "Caching Topologies: Write-Through vs Write-Back",
    keywords: ["write-through", "write-back", "latency", "durability"],
    triggers: [/write-through.*write-back/i, /caching patterns/i, /write-behind/i],
    conceptExplanation: `### 📚 Deep-Dive: Write-Through vs Write-Back (Write-Behind) Caching

#### **1. Intuition & Architectural Comparison**
When persisting data in cached architectures:

#### **2. Write-Through**
The application writes data to the cache, and the cache synchronously writes to the database before acknowledging success to the client:
- **Pros**: Strong data consistency; cache and database are always in sync. Zero data loss on server crash.
- **Cons**: High write latency (incurs both cache write and disk database write overhead).

#### **3. Write-Back (Write-Behind)**
The application writes data only to the cache and receives an immediate acknowledgment. The cache asynchronously batches and flushes dirty writes to the database in the background:
- **Pros**: Ultra-low write latency and tremendous write throughput (absorbs high-frequency bursts).
- **Cons**: High risk of data loss if the cache server crashes before flushing dirty pages to the database.`,
    socraticHints: [
      "In Write-Through, does the client wait for the database write to complete?",
      "Yes, which ensures consistency at the cost of higher write latency.",
      "In Write-Back, the client gets immediate acknowledgment from cache, but crashes risk losing uncommitted dirty writes."
    ],
    conceptCheck: {
      question: "Which pattern is preferred for financial ledgers vs gaming analytics?",
      expectedKeyPoints: ["financial ledgers use Write-Through for durability", "gaming telemetry uses Write-Back for ultra-low latency"]
    }
  },
  {
    id: "sys-connection-pooling",
    category: "system_design",
    title: "Database Connection Pooling: Eliminating Handshake Overhead",
    keywords: ["pool", "connection", "tcp handshake", "overhead"],
    triggers: [/connection pool/i, /database connection/i, /pgpool/i, /hikari/i],
    conceptExplanation: `### 📚 Deep-Dive: Database Connection Pooling & Backend Throughput

#### **1. Intuition (Why This Matters)**
Opening a new database connection for every incoming HTTP request is a severe performance bottleneck. A single PostgreSQL connection requires:
1. TCP 3-way handshake.
2. TLS negotiation.
3. Backend authentication and password verification.
4. Spawning a new dedicated backend process with private memory (several megabytes of RAM).

#### **2. Connection Pool Architecture (e.g., PgBouncer, HikariCP)**
A connection pool maintains a set of pre-established, authenticated database connections in memory:
- When a web request arrives, it borrows an active connection from the pool in microseconds.
- After executing the query, the connection is returned to the pool instead of being closed.
- Eliminates repeated connection setup latency and caps the maximum number of concurrent database connections, preventing CPU core thrashing.`,
    socraticHints: [
      "What steps occur behind the scenes when establishing a new PostgreSQL connection?",
      "TCP handshake, TLS exchange, auth, and process spawning take 50-100ms.",
      "Connection pooling reuses warm, already-authenticated connections, slashing latency and protecting the database from process exhaustion."
    ],
    conceptCheck: {
      question: "What happens if a database pool size is set too high (e.g. 5,000 connections on an 8-core DB)?",
      expectedKeyPoints: ["CPU context switching", "disk I/O contention", "degraded query throughput"]
    }
  }
];

export class CurriculumKnowledgeService {
  public static findMatchingTopic(query: string): CurriculumTopic | undefined {
    const lower = query.toLowerCase();
    for (const topic of CURRICULUM_TOPICS) {
      if (topic.triggers.some((r) => r.test(lower))) {
        return topic;
      }
    }
    return undefined;
  }
}
