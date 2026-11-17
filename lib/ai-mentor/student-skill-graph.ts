/**
 * Student Skill Knowledge Graph Engine
 * Hierarchical Taxonomy, Prerequisite Dependency Graph, and Evidence-Based Mastery
 * Brand: MentorMaze by AI Tathastu
 */

import { MasteryState, ProvenanceType } from "./types";

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
  masteryScore: number; // 0.0 to 10.0
  confidence: number;   // 0.0 to 1.0
  assessmentCount: number;
  successCount: number;
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

export class StudentSkillGraph {
  private static userSkillStore: Map<string, Map<string, StudentSkillRecord>> = new Map();

  /**
   * Initialize or retrieve skill profile for a student
   */
  public static getStudentSkills(studentUserId: string): StudentSkillRecord[] {
    if (!this.userSkillStore.has(studentUserId)) {
      // Seed default baseline skills
      const initialMap = new Map<string, StudentSkillRecord>();
      
      const seedDefaults: Partial<StudentSkillRecord>[] = [
        {
          skillId: "typescript_core",
          masteryState: "demonstrated",
          masteryScore: 8.2,
          confidence: 0.9,
          assessmentCount: 5,
          successCount: 4,
          knownWeaknesses: ["Advanced conditional types with infer keyword"],
          commonMisconceptions: ["Confusing type aliases with interfaces"],
          evidenceSource: "code_execution",
        },
        {
          skillId: "arrays_strings",
          masteryState: "demonstrated",
          masteryScore: 8.5,
          confidence: 0.88,
          assessmentCount: 8,
          successCount: 7,
          knownWeaknesses: ["Edge cases with empty arrays or negative numbers"],
          commonMisconceptions: ["Assuming Two-Pointers works on unsorted arrays"],
          evidenceSource: "mock_interview",
        },
        {
          skillId: "dynamic_programming",
          masteryState: "developing",
          masteryScore: 5.5,
          confidence: 0.75,
          assessmentCount: 4,
          successCount: 2,
          knownWeaknesses: ["Formulating state transitions in 2D knapsack problems"],
          commonMisconceptions: ["Trying to memoize global variables without passing state"],
          evidenceSource: "code_execution",
        },
        {
          skillId: "relational_db_sql",
          masteryState: "demonstrated",
          masteryScore: 8.0,
          confidence: 0.85,
          assessmentCount: 6,
          successCount: 5,
          knownWeaknesses: ["Window functions over partitions"],
          commonMisconceptions: ["Assuming HAVING and WHERE are interchangeable"],
          evidenceSource: "project_evidence",
        },
        {
          skillId: "distributed_systems",
          masteryState: "introduced",
          masteryScore: 4.8,
          confidence: 0.6,
          assessmentCount: 2,
          successCount: 1,
          knownWeaknesses: ["Consistency guarantees under split-brain network partitions"],
          commonMisconceptions: ["Assuming Kafka is a traditional message broker queue"],
          evidenceSource: "mentor_evaluation",
        },
      ];

      for (const item of seedDefaults) {
        initialMap.set(item.skillId!, {
          id: `sk-${studentUserId}-${item.skillId}`,
          studentUserId,
          skillId: item.skillId!,
          masteryState: item.masteryState || "not_assessed",
          masteryScore: item.masteryScore || 0,
          confidence: item.confidence || 0.5,
          assessmentCount: item.assessmentCount || 0,
          successCount: item.successCount || 0,
          knownWeaknesses: item.knownWeaknesses || [],
          commonMisconceptions: item.commonMisconceptions || [],
          lastAssessedAt: new Date().toISOString(),
          evidenceSource: item.evidenceSource || "self_reported",
        });
      }

      this.userSkillStore.set(studentUserId, initialMap);
    }

    return Array.from(this.userSkillStore.get(studentUserId)!.values());
  }

  /**
   * Check whether all prerequisites for a target skill have been demonstrated
   */
  public static checkPrerequisites(
    studentUserId: string,
    targetSkillId: string
  ): { hasGaps: boolean; missingPrerequisites: SkillTaxonomyNode[] } {
    const targetNode = CANONICAL_TAXONOMY.find((n) => n.id === targetSkillId);
    if (!targetNode || targetNode.prerequisites.length === 0) {
      return { hasGaps: false, missingPrerequisites: [] };
    }

    const studentSkills = this.getStudentSkills(studentUserId);
    const missing: SkillTaxonomyNode[] = [];

    for (const prereqId of targetNode.prerequisites) {
      const found = studentSkills.find((s) => s.skillId === prereqId);
      const isDemonstrated = found && (found.masteryState === "demonstrated" || found.masteryState === "consistently_demonstrated");

      if (!isDemonstrated) {
        const prereqNode = CANONICAL_TAXONOMY.find((n) => n.id === prereqId);
        if (prereqNode) missing.push(prereqNode);
      }
    }

    return {
      hasGaps: missing.length > 0,
      missingPrerequisites: missing,
    };
  }

  /**
   * Record new evidence and calibrate student mastery state
   */
  public static recordEvidence(
    studentUserId: string,
    skillId: string,
    score: number, // 0.0 to 10.0
    evidenceSource: StudentSkillRecord["evidenceSource"],
    misconceptionDetected?: string
  ): StudentSkillRecord {
    const skills = this.getStudentSkills(studentUserId);
    const userMap = this.userSkillStore.get(studentUserId)!;
    let record = userMap.get(skillId);

    if (!record) {
      record = {
        id: `sk-${studentUserId}-${skillId}`,
        studentUserId,
        skillId,
        masteryState: "introduced",
        masteryScore: score,
        confidence: 0.5,
        assessmentCount: 1,
        successCount: score >= 7.0 ? 1 : 0,
        knownWeaknesses: [],
        commonMisconceptions: misconceptionDetected ? [misconceptionDetected] : [],
        lastAssessedAt: new Date().toISOString(),
        evidenceSource,
      };
    } else {
      record.assessmentCount += 1;
      if (score >= 7.0) record.successCount += 1;

      // Weight evidence based on rigour of evidence source
      const weight = evidenceSource === "code_execution" || evidenceSource === "mock_interview" ? 0.4 : 0.2;
      record.masteryScore = Number((record.masteryScore * (1 - weight) + score * weight).toFixed(2));
      record.confidence = Math.min(0.98, Number((record.confidence + 0.05).toFixed(2)));
      record.lastAssessedAt = new Date().toISOString();
      record.evidenceSource = evidenceSource;

      if (misconceptionDetected && !record.commonMisconceptions.includes(misconceptionDetected)) {
        record.commonMisconceptions.push(misconceptionDetected);
      }

      // Update state transitions
      if (record.successCount >= 3 && record.masteryScore >= 8.5) {
        record.masteryState = "consistently_demonstrated";
      } else if (record.successCount >= 2 && record.masteryScore >= 7.0) {
        record.masteryState = "demonstrated";
      } else if (record.masteryScore >= 5.0) {
        record.masteryState = "developing";
      } else {
        record.masteryState = "introduced";
      }
    }

    userMap.set(skillId, record);
    return record;
  }
}
