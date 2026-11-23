import { MasteryState, CanonicalMasteryLevel } from "./types";

export interface SkillTaxonomyNode {
  id: string;
  name: string;
  category: "Computer Science" | "Programming" | "DSA" | "Databases" | "Backend" | "Frontend" | "System Design" | "AI & ML" | "DevOps";
  parentId?: string;
  description: string;
  prerequisites: string[]; // List of required skillIds
}

export interface StudentSkillRecord {
  id: string;
  studentUserId: string;
  skillId: string;
  masteryState: MasteryState;
  masteryLevel?: CanonicalMasteryLevel;
  masteryScore: number; // 0.0 to 10.0
  confidence: number;   // 0.0 to 1.0
  assessmentCount: number;
  successCount: number;
  verifiedAssessmentIds?: string[];
  knownWeaknesses: string[];
  commonMisconceptions: string[];
  lastAssessedAt: string;
  evidenceSource: "self_reported" | "multiple_choice" | "open_explanation" | "code_execution" | "project_evidence" | "mentor_evaluation" | "mock_interview";
}

// Canonical Computer Science & Software Engineering Skill Taxonomy
export const CANONICAL_TAXONOMY: SkillTaxonomyNode[] = [
  // Programming Languages
  { id: "python_core", name: "Python Core", category: "Programming", description: "Syntax, control flow, functions, OOP, and data structures in Python", prerequisites: [] },
  { id: "typescript_core", name: "TypeScript Core", category: "Programming", description: "Types, generics, async/await, and modern ES6+ tooling", prerequisites: [] },
  { id: "cpp_core", name: "C++ & Memory Management", category: "Programming", description: "Pointers, memory layout, STL, and performance fundamentals", prerequisites: [] },

  // Data Structures & Algorithms
  { id: "arrays_strings", name: "Arrays & Strings", category: "DSA", description: "Two-pointers, sliding window, prefix sums, and in-place manipulations", prerequisites: [] },
  { id: "linked_lists", name: "Linked Lists", category: "DSA", description: "Singly/doubly linked lists, cycle detection (Floyd's algorithm)", prerequisites: ["arrays_strings"] },
  { id: "recursion", name: "Recursion & Backtracking", category: "DSA", description: "Call stack, base cases, permutations, and search trees", prerequisites: ["arrays_strings"] },
  { id: "trees_graphs", name: "Trees & Graphs", category: "DSA", description: "BFS, DFS, Dijkstra, topological sort, and tree traversals", prerequisites: ["recursion"] },
  { id: "dynamic_programming", name: "Dynamic Programming", category: "DSA", description: "Overlapping subproblems, optimal substructure, 1D/2D memoization and tabulation", prerequisites: ["recursion", "arrays_strings"] },

  // Databases & Storage
  { id: "relational_db_sql", name: "SQL & Relational Modeling", category: "Databases", description: "ACID transactions, joins, indexes, normalization, and constraints", prerequisites: [] },
  { id: "postgresql_advanced", name: "PostgreSQL Advanced", category: "Databases", description: "Explain analyze, B-tree/GIN indexes, MVCC, and query optimization", prerequisites: ["relational_db_sql"] },
  { id: "redis_caching", name: "Redis & In-Memory Caching", category: "Databases", description: "Data structures, eviction policies, distributed caching patterns", prerequisites: [] },

  // Backend & System Architecture
  { id: "rest_api_design", name: "REST & API Architecture", category: "Backend", description: "Statelessness, status codes, payload contracts, and error handling", prerequisites: ["typescript_core"] },
  { id: "distributed_systems", name: "Distributed Systems & Scalability", category: "System Design", description: "CAP theorem, horizontal sharding, load balancing, and rate limiting", prerequisites: ["relational_db_sql", "redis_caching"] },
  { id: "message_queues", name: "Event-Driven & Kafka", category: "Backend", description: "Pub/Sub, consumer groups, partition ordering, and backpressure", prerequisites: ["distributed_systems"] },

  // AI & Machine Learning
  { id: "ml_fundamentals", name: "Machine Learning Fundamentals", category: "AI & ML", description: "Supervised/unsupervised learning, cross-validation, embeddings", prerequisites: ["python_core"] },
  { id: "llm_rag_pipelines", name: "RAG & LLM Application Engineering", category: "AI & ML", description: "Vector search, chunking, re-ranking, and prompt orchestration", prerequisites: ["ml_fundamentals", "redis_caching"] },
];
