/**
 * ASTRION Personalized Roadmap & Milestone Planner Service
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Identity: ASTRION (Adaptive Strategic Intelligence & Reasoning Network)
 * Core: Personalized Roadmap Lifecycle & Adaptive Milestone Progression
 */

import { getDb } from "../../db";
import { aiMentorRoadmaps, aiMentorRoadmapMilestones } from "../../db/ai-mentor-schema";
import { eq, and, desc } from "drizzle-orm";
import { StudentGoalRecord } from "../goals/student-goal-service";
import { PersonalizedAssessmentResult } from "../assessment/personalized-assessment-service";

export interface PersonalizedMilestone {
  id: string;
  roadmapId: string;
  weekNumber: number;
  phase: string;
  title: string;
  description: string;
  requiredSkills: string[];
  prerequisites: string[];
  learningActivities: string[];
  practicalProjects: string[];
  estimatedEffortHours: number;
  successCriteria: string[];
  dependencies: number[]; // Prior week numbers required
  status: "pending" | "in_progress" | "completed";
  completedAt?: string;
  reviewPoints: string[];
  studentConfirmation?: boolean;
  evidenceRef?: string;
  deliverableUrl?: string;
  assessmentNotes?: string;
  provenance?: string;
}

export interface PersonalizedRoadmapRecord {
  id: string;
  studentUserId: string;
  goalId?: string;
  targetRole: string;
  startingReadinessScore: number;
  totalWeeks: number;
  totalEffortHours: number;
  currentMilestoneWeek: number;
  milestones: PersonalizedMilestone[];
  progressPct?: number;
  status: "active" | "paused" | "completed" | "archived";
  adaptedReason?: string;
  adaptationHistory?: { timestamp: string; reason: string; changes?: any }[];
  createdAt: string;
  updatedAt: string;
}

export interface AdaptRoadmapInput {
  targetEndDate?: string;
  availableHoursPerWeek?: number;
  completedSkillIds?: string[];
  newPrerequisitesFound?: string[];
  reason: string;
  milestoneOverrides?: Record<number, "pending" | "in_progress" | "completed">;
}

export class PersonalizedRoadmapService {
  private static roadmapsCache: Map<string, Map<string, PersonalizedRoadmapRecord>> = new Map();

  public static resetCache(): void {
    this.roadmapsCache.clear();
  }

  /**
   * Generates a fully personalized milestone roadmap tailored to student's current assessment
   */
  public static async generatePersonalizedRoadmap(
    studentUserId: string,
    goal: StudentGoalRecord,
    assessment: PersonalizedAssessmentResult
  ): Promise<PersonalizedRoadmapRecord> {
    const roadmapId = `rdm-${studentUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();

    // Duplicate prevention and preservation of completed milestones
    const existing = await this.getRoadmapByGoalId(studentUserId, goal.id);
    const completedWeeksMap = new Map<number, PersonalizedMilestone>();
    if (existing) {
      for (const m of existing.milestones) {
        if (m.status === "completed") {
          completedWeeksMap.set(m.weekNumber, m);
        }
      }
      // Archive existing roadmap to prevent duplicate active roadmaps
      existing.status = "archived";
      existing.updatedAt = now.toISOString();
      try {
        const db = getDb();
        await db
          .update(aiMentorRoadmaps)
          .set({ status: "archived", updatedAt: now })
          .where(eq(aiMentorRoadmaps.id, existing.id));
      } catch (err: any) {
        // ignore if not configured
      }
    }

    const lowerTitle = goal.title.toLowerCase();
    const confirmedStrengthNames = assessment.confirmedStrengths.map((s) => s.toLowerCase());

    const isML = lowerTitle.includes("machine learning") || lowerTitle.includes("data science") || lowerTitle.includes("ai");
    const isSys = lowerTitle.includes("distributed") || lowerTitle.includes("system design") || lowerTitle.includes("systems");

    const milestones: PersonalizedMilestone[] = [];

    if (isML) {
      // Check if student already demonstrated mastery in Python & Linear Algebra
      const hasPythonMath =
        confirmedStrengthNames.some((s) => s.includes("python")) &&
        confirmedStrengthNames.some((s) => s.includes("linear algebra"));

      milestones.push({
        id: `ms-${roadmapId}-1`,
        roadmapId,
        weekNumber: 1,
        phase: "Foundations & Mathematics",
        title: "Matrix Invariants, Vector Spaces & Gradient Descent",
        description: "Core linear algebra proofs and derivation of analytical vs numerical gradients.",
        requiredSkills: ["Linear Algebra", "Vector Calculus", "Python"],
        prerequisites: [],
        learningActivities: ["Derive backpropagation gradient flow through computational graph"],
        practicalProjects: ["Implement 2-layer Neural Network from scratch with NumPy"],
        estimatedEffortHours: hasPythonMath ? 6 : 14,
        successCriteria: ["Loss converges on MNIST benchmark", "Numerical gradient checks pass within 1e-5"],
        dependencies: [],
        status: hasPythonMath ? "completed" : "in_progress",
        completedAt: hasPythonMath ? now.toISOString() : undefined,
        reviewPoints: ["Eigenvalues vs Singular Value Decomposition", "Vanishing gradient proofs"],
      });

      milestones.push({
        id: `ms-${roadmapId}-2`,
        roadmapId,
        weekNumber: 2,
        phase: "PyTorch Framework & Deep Learning",
        title: "Autograd Engines & CNN/Transformer Architectures",
        description: "Idiomatic PyTorch module construction, custom autograd Functions, and multi-head attention.",
        requiredSkills: ["PyTorch", "Deep Learning"],
        prerequisites: ["Matrix Invariants, Vector Spaces & Gradient Descent"],
        learningActivities: ["Audit Attention Is All You Need tensor dimension flows"],
        practicalProjects: ["Build decoder-only causal Transformer model with PyTorch"],
        estimatedEffortHours: 12,
        successCriteria: ["Transformer trains with cross-entropy loss reduction", "Zero CUDA memory leaks"],
        dependencies: [1],
        status: hasPythonMath ? "in_progress" : "pending",
        reviewPoints: ["LayerNorm vs BatchNorm mechanics", "Key-Value caching for inference"],
      });

      milestones.push({
        id: `ms-${roadmapId}-3`,
        roadmapId,
        weekNumber: 3,
        phase: "Distributed Training & Optimization",
        title: "DDP, FSDP & Mixed Precision Scaling",
        description: "Scale model training across multi-GPU nodes with PyTorch Distributed Data Parallel.",
        requiredSkills: ["Distributed Training", "CUDA Optimization"],
        prerequisites: ["Autograd Engines & CNN/Transformer Architectures"],
        learningActivities: ["Benchmarking all-reduce communication bandwidth bottlenecks"],
        practicalProjects: ["Distributed fine-tuning harness for 7B open model"],
        estimatedEffortHours: 16,
        successCriteria: ["Linear scaling efficiency across distributed workers", "FP16/BF16 loss stability"],
        dependencies: [2],
        status: "pending",
        reviewPoints: ["Zero Redundancy Optimizer (ZeRO) stages", "Gradient accumulation invariants"],
      });

      milestones.push({
        id: `ms-${roadmapId}-4`,
        roadmapId,
        weekNumber: 4,
        phase: "Production Serving & MLOps",
        title: "vLLM, TensorRT & Model Serving Gateways",
        description: "Continuous batching, PagedAttention, and sub-50ms token latency optimization.",
        requiredSkills: ["Model Serving", "MLOps", "Latency Optimization"],
        prerequisites: ["DDP, FSDP & Mixed Precision Scaling"],
        learningActivities: ["Deploy vLLM inference server with Prometheus latency monitoring"],
        practicalProjects: ["Production inference gateway with token streaming & p99 SLA guarantees"],
        estimatedEffortHours: 14,
        successCriteria: ["P99 TTFT < 80ms under 50 concurrent requests", "Docker container passing health checks"],
        dependencies: [3],
        status: "pending",
        reviewPoints: ["Speculative decoding trade-offs", "KV-cache memory quantization"],
      });
    } else if (isSys) {
      milestones.push({
        id: `ms-${roadmapId}-1`,
        roadmapId,
        weekNumber: 1,
        phase: "Storage Engines & Invariants",
        title: "LSM-Trees vs B-Trees & Relational Indexing",
        description: "Write amplification, write-ahead logging (WAL), and MVCC transaction isolation.",
        requiredSkills: ["PostgreSQL", "B-Trees", "LSM-Trees"],
        prerequisites: [],
        learningActivities: ["Analyze write vs read path performance under heavy ingestion"],
        practicalProjects: ["Append-only log storage engine with memory-mapped index"],
        estimatedEffortHours: 10,
        successCriteria: ["Crash recovery test validates zero data loss from uncommitted buffers"],
        dependencies: [],
        status: "in_progress",
        reviewPoints: ["WAL checkpointing intervals", "PostgreSQL isolation anomalies"],
      });

      milestones.push({
        id: `ms-${roadmapId}-2`,
        roadmapId,
        weekNumber: 2,
        phase: "Caching & Consistency",
        title: "Cache-Aside Topologies & Distributed Invalidation",
        description: "Mitigating race conditions between DB writes and cache updates with TTL jitter.",
        requiredSkills: ["Redis", "Caching Topologies"],
        prerequisites: ["LSM-Trees vs B-Trees & Relational Indexing"],
        learningActivities: ["Simulate concurrent cache stampede and implement mutex locking"],
        practicalProjects: ["High-throughput multi-tier caching middleware"],
        estimatedEffortHours: 12,
        successCriteria: ["Zero stale reads observed under 200 concurrent read/write threads"],
        dependencies: [1],
        status: "pending",
        reviewPoints: ["Write-Through vs Cache-Aside invariants", "Redis cluster failover"],
      });

      milestones.push({
        id: `ms-${roadmapId}-3`,
        roadmapId,
        weekNumber: 3,
        phase: "Consensus & Replication",
        title: "Raft Consensus Invariants & Leader Election",
        description: "Log replication, heartbeats, term election safety, and network partition split-brain defense.",
        requiredSkills: ["Raft", "Consensus", "Distributed Systems"],
        prerequisites: ["Cache-Aside Topologies & Distributed Invalidation"],
        learningActivities: ["Verify leader election state transitions during simulated network netsplits"],
        practicalProjects: ["Mini-Raft distributed key-value store in Go/TypeScript"],
        estimatedEffortHours: 18,
        successCriteria: ["Passes Jepsen-style network partition test with linearizable reads"],
        dependencies: [2],
        status: "pending",
        reviewPoints: ["Joint consensus configuration changes", "Log compaction snapshots"],
      });
    } else {
      milestones.push({
        id: `ms-${roadmapId}-1`,
        roadmapId,
        weekNumber: 1,
        phase: "Algorithmic Invariants",
        title: "Arrays, Two Pointers & Monotonic Sequences",
        description: "Master invariant tracking across pointer bounds and amortized O(1) analysis.",
        requiredSkills: ["Arrays & Strings", "Two Pointers"],
        prerequisites: [],
        learningActivities: ["Prove correctness of two-pointer bounds under sorted conditions"],
        practicalProjects: ["Curated problem set: 15 classic two-pointer and sliding window questions"],
        estimatedEffortHours: 10,
        successCriteria: ["Optimal time/space complexity achieved on all 15 problems"],
        dependencies: [],
        status: "in_progress",
        reviewPoints: ["Left/Right pointer convergence proofs", "Window expansion vs contraction"],
      });

      milestones.push({
        id: `ms-${roadmapId}-2`,
        roadmapId,
        weekNumber: 2,
        phase: "Dynamic Programming",
        title: "Optimal Substructure & Memoization",
        description: "1D/2D State transition formulation, knapsack patterns, and space optimization.",
        requiredSkills: ["Dynamic Programming", "Recursion"],
        prerequisites: ["Arrays, Two Pointers & Monotonic Sequences"],
        learningActivities: ["Derive DAG of subproblem dependencies before writing code"],
        practicalProjects: ["Space-optimized solutions to classic 0/1 Knapsack & LCS"],
        estimatedEffortHours: 14,
        successCriteria: ["Zero O(2^N) recursion timeouts", "Space reduced from O(NW) to O(W)"],
        dependencies: [1],
        status: "pending",
        reviewPoints: ["Top-down memoization vs Bottom-up tabulation", "Backward loops in 1D DP"],
      });
    }

    // Preserve completed milestones across regenerations
    for (const ms of milestones) {
      if (completedWeeksMap.has(ms.weekNumber)) {
        const prev = completedWeeksMap.get(ms.weekNumber)!;
        ms.status = "completed";
        ms.completedAt = prev.completedAt || now.toISOString();
        ms.studentConfirmation = prev.studentConfirmation ?? true;
        ms.evidenceRef = prev.evidenceRef;
        ms.deliverableUrl = prev.deliverableUrl;
        ms.assessmentNotes = prev.assessmentNotes;
        ms.provenance = prev.provenance || "student_confirmed";
        if (prev.successCriteria && prev.successCriteria.length > 0) {
          ms.successCriteria = prev.successCriteria;
        }
      }
    }

    const currentMilestone =
      milestones.find((m) => m.status === "in_progress") ||
      milestones.find((m) => m.status === "pending") ||
      milestones[0];
    if (currentMilestone && currentMilestone.status === "pending") {
      currentMilestone.status = "in_progress";
    }
    const totalEffortHours = milestones.reduce((sum, m) => sum + m.estimatedEffortHours, 0);

    const record: PersonalizedRoadmapRecord = {
      id: roadmapId,
      studentUserId,
      goalId: goal.id,
      targetRole: goal.title,
      startingReadinessScore: assessment.overallReadinessScore,
      totalWeeks: milestones.length,
      totalEffortHours,
      currentMilestoneWeek: currentMilestone.weekNumber,
      milestones,
      progressPct: Math.round((milestones.filter((m) => m.status === "completed").length / milestones.length) * 100),
      status: "active",
      adaptedReason: `Initial roadmap calibrated to student's ${assessment.demonstratedLevel} demonstrated readiness (${assessment.overallReadinessScore}%).`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Cache
    if (!this.roadmapsCache.has(studentUserId)) {
      this.roadmapsCache.set(studentUserId, new Map());
    }
    this.roadmapsCache.get(studentUserId)!.set(roadmapId, record);

    // Persist to SQL
    try {
      const db = getDb();
      await db.insert(aiMentorRoadmaps).values({
        id: roadmapId,
        studentUserId,
        goalId: goal.id,
        targetRole: goal.title,
        currentLevel: assessment.demonstratedLevel,
        targetTimelineWeeks: milestones.length,
        progressPct: 0,
        status: "active",
        adaptedReason: record.adaptedReason,
        createdAt: now,
        updatedAt: now,
      });

      for (const ms of milestones) {
        await db.insert(aiMentorRoadmapMilestones).values({
          id: ms.id,
          roadmapId,
          weekNumber: ms.weekNumber,
          title: ms.title,
          description: ms.description,
          skillsCovered: ms.requiredSkills,
          status: ms.status,
          completedAt: ms.completedAt ? new Date(ms.completedAt) : null,
          studentConfirmation: ms.studentConfirmation ?? false,
          evidenceRef: ms.evidenceRef ?? null,
          deliverableUrl: ms.deliverableUrl ?? null,
          assessmentNotes: ms.assessmentNotes ?? null,
          successCriteria: ms.successCriteria || [],
          provenance: ms.provenance || "student_confirmed",
        });
      }
    } catch (err: any) {
      if (err?.code === "23505" || err?.message?.includes("idx_one_active_roadmap_per_goal")) {
        console.warn("[PersonalizedRoadmapService] Concurrent active roadmap detected, resolving to existing active roadmap.");
        const existingActive = await this.getRoadmapByGoalId(studentUserId, goal.id);
        if (existingActive) return existingActive;
      }
      if (err?.code !== "42P01") {
        console.warn("[PersonalizedRoadmapService] SQL insert roadmap error:", err?.message || err);
      }
    }

    return record;
  }

  /**
   * Retrieve active roadmap for a goal
   */
  public static async getRoadmapByGoalId(
    studentUserId: string,
    goalId: string
  ): Promise<PersonalizedRoadmapRecord | null> {
    const userRoadmaps = this.roadmapsCache.get(studentUserId);
    if (userRoadmaps) {
      const activeRoadmaps = Array.from(userRoadmaps.values())
        .filter((rdm) => rdm.goalId === goalId && rdm.status === "active")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      if (activeRoadmaps.length > 0) {
        return activeRoadmaps[0];
      }
    }

    // Fallback to SQL persistence
    try {
      const db = getDb();
      const roadmapRows = await db
        .select()
        .from(aiMentorRoadmaps)
        .where(
          and(
            eq(aiMentorRoadmaps.studentUserId, studentUserId),
            eq(aiMentorRoadmaps.goalId, goalId),
            eq(aiMentorRoadmaps.status, "active")
          )
        )
        .orderBy(desc(aiMentorRoadmaps.updatedAt));

      if (roadmapRows.length === 0) return null;
      const rdmRow = roadmapRows[0];

      const milestoneRows = await db
        .select()
        .from(aiMentorRoadmapMilestones)
        .where(eq(aiMentorRoadmapMilestones.roadmapId, rdmRow.id))
        .orderBy(aiMentorRoadmapMilestones.weekNumber);

      const milestones: PersonalizedMilestone[] = milestoneRows.map((m: any) => ({
        id: m.id,
        roadmapId: m.roadmapId || rdmRow.id,
        weekNumber: m.weekNumber,
        phase: `Phase ${m.weekNumber}`,
        title: m.title,
        description: m.description,
        requiredSkills: (m.skillsCovered as string[]) || [],
        prerequisites: [],
        learningActivities: [`Complete core exercises and code implementations for ${m.title}`],
        practicalProjects: [`Implement and submit project repository deliverable for ${m.title}`],
        estimatedEffortHours: 12,
        successCriteria: Array.isArray(m.successCriteria) && m.successCriteria.length > 0 ? m.successCriteria : [`Pass all test cases and validation benchmarks for ${m.title}`],
        dependencies: m.weekNumber > 1 ? [m.weekNumber - 1] : [],
        status: (m.status as any) || "pending",
        completedAt: m.completedAt ? new Date(m.completedAt).toISOString() : undefined,
        reviewPoints: [`Verify first-principles understanding of ${m.title}`],
        studentConfirmation: Boolean(m.studentConfirmation ?? false),
        evidenceRef: m.evidenceRef || undefined,
        deliverableUrl: m.deliverableUrl || undefined,
        assessmentNotes: m.assessmentNotes || undefined,
        provenance: m.provenance || "student_confirmed",
      }));

      const activeMs = milestones.find((m) => m.status === "in_progress") || milestones[0];

      const record: PersonalizedRoadmapRecord = {
        id: rdmRow.id,
        studentUserId: rdmRow.studentUserId,
        goalId: rdmRow.goalId || goalId,
        targetRole: rdmRow.targetRole,
        startingReadinessScore: 50,
        totalWeeks: rdmRow.targetTimelineWeeks || milestones.length,
        totalEffortHours: milestones.reduce((sum, m) => sum + m.estimatedEffortHours, 0),
        currentMilestoneWeek: activeMs ? activeMs.weekNumber : 1,
        milestones,
        progressPct: milestones.length > 0 ? Math.round((milestones.filter((m) => m.status === "completed").length / milestones.length) * 100) : 0,
        status: (rdmRow.status as any) || "active",
        adaptedReason: rdmRow.adaptedReason || undefined,
        createdAt: new Date(rdmRow.createdAt).toISOString(),
        updatedAt: new Date(rdmRow.updatedAt).toISOString(),
      };

      if (!this.roadmapsCache.has(studentUserId)) {
        this.roadmapsCache.set(studentUserId, new Map());
      }
      this.roadmapsCache.get(studentUserId)!.set(rdmRow.id, record);

      return record;
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[PersonalizedRoadmapService] SQL getRoadmapByGoalId error:", err?.message || err);
      }
      return null;
    }
  }

  /**
   * Mark milestone progress upon student confirmation or verified assessment
   */
  public static async markMilestoneProgress(
    studentUserId: string,
    roadmapId: string,
    weekNumberOrMilestoneId: number | string,
    newStatus: "pending" | "in_progress" | "completed",
    inputOptions?: {
      studentConfirmation?: boolean;
      evidenceRef?: string;
      deliverableUrl?: string;
      assessmentNotes?: string;
      provenance?: string;
      completionNotes?: string;
    } | string
  ): Promise<PersonalizedRoadmapRecord> {
    let roadmap = this.roadmapsCache.get(studentUserId)?.get(roadmapId);
    if (!roadmap) {
      // Check if another student owns this roadmap in memory cache
      for (const [ownerId, userMap] of this.roadmapsCache.entries()) {
        if (userMap.has(roadmapId)) {
          if (ownerId !== studentUserId) {
            throw new Error("403_FORBIDDEN: You do not have permission to modify another student's roadmap milestones.");
          }
          roadmap = userMap.get(roadmapId);
          break;
        }
      }

      // Fallback: load roadmap from SQL persistence
      if (!roadmap) {
        try {
          const db = getDb();
          const rdmRows = await db
            .select()
            .from(aiMentorRoadmaps)
            .where(eq(aiMentorRoadmaps.id, roadmapId));
          if (rdmRows.length === 0) {
            throw new Error(`Roadmap not found: ${roadmapId}`);
          }
          if (rdmRows[0].studentUserId !== studentUserId) {
            throw new Error("403_FORBIDDEN: You do not have permission to modify another student's roadmap milestones.");
          }
          roadmap = (await this.getRoadmapByGoalId(studentUserId, rdmRows[0].goalId!)) ?? undefined;
        } catch (err: any) {
          if (err.message?.includes("403_FORBIDDEN")) throw err;
        }
      }
    }

    if (!roadmap) {
      throw new Error(`Roadmap not found: ${roadmapId}`);
    }

    if (roadmap.studentUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to modify another student's roadmap milestones.");
    }

    const milestone = roadmap.milestones.find((m) =>
      typeof weekNumberOrMilestoneId === "number"
        ? m.weekNumber === weekNumberOrMilestoneId
        : m.id === weekNumberOrMilestoneId || m.weekNumber === Number(weekNumberOrMilestoneId)
    );
    if (!milestone) {
      throw new Error(`Milestone ${weekNumberOrMilestoneId} not found on roadmap.`);
    }

    const now = new Date();
    const wasAlreadyCompleted = milestone.status === "completed";

    const options = typeof inputOptions === "string" ? { completionNotes: inputOptions } : inputOptions;
    if (options) {
      if (options.studentConfirmation !== undefined) milestone.studentConfirmation = options.studentConfirmation;
      if (options.evidenceRef) milestone.evidenceRef = options.evidenceRef;
      if (options.deliverableUrl) milestone.deliverableUrl = options.deliverableUrl;
      if (options.assessmentNotes || options.completionNotes) {
        milestone.assessmentNotes = options.assessmentNotes || options.completionNotes;
      }
      if (options.provenance) milestone.provenance = options.provenance;
    }

    milestone.status = newStatus;
    if (newStatus === "completed") {
      if (!wasAlreadyCompleted) {
        milestone.completedAt = now.toISOString();
        if (milestone.studentConfirmation === undefined) {
          milestone.studentConfirmation = true;
        }

        // Automatically advance the next pending milestone to in_progress
        const next = roadmap.milestones.find((m) => m.weekNumber === milestone.weekNumber + 1 && m.status === "pending");
        if (next) {
          next.status = "in_progress";
          roadmap.currentMilestoneWeek = next.weekNumber;
        }
      }
    }

    const completedCount = roadmap.milestones.filter((m) => m.status === "completed").length;
    const progressPct = Math.round((completedCount / roadmap.milestones.length) * 100);
    roadmap.progressPct = progressPct;
    roadmap.updatedAt = now.toISOString();

    // Persist SQL
    try {
      const db = getDb();
      await db
        .update(aiMentorRoadmapMilestones)
        .set({
          status: newStatus,
          completedAt: newStatus === "completed" ? (wasAlreadyCompleted && milestone.completedAt ? new Date(milestone.completedAt) : now) : null,
          studentConfirmation: milestone.studentConfirmation ?? false,
          evidenceRef: milestone.evidenceRef ?? null,
          deliverableUrl: milestone.deliverableUrl ?? null,
          assessmentNotes: milestone.assessmentNotes ?? null,
          provenance: milestone.provenance ?? "student_confirmed",
        })
        .where(
          and(
            eq(aiMentorRoadmapMilestones.roadmapId, roadmapId),
            eq(aiMentorRoadmapMilestones.weekNumber, milestone.weekNumber)
          )
        );

      if (newStatus === "completed" && !wasAlreadyCompleted) {
        const next = roadmap.milestones.find((m) => m.weekNumber === milestone.weekNumber + 1);
        if (next && next.status === "in_progress") {
          await db
            .update(aiMentorRoadmapMilestones)
            .set({ status: "in_progress" })
            .where(
              and(
                eq(aiMentorRoadmapMilestones.roadmapId, roadmapId),
                eq(aiMentorRoadmapMilestones.weekNumber, next.weekNumber)
              )
            );
        }
      }

      await db
        .update(aiMentorRoadmaps)
        .set({
          progressPct,
          updatedAt: now,
        })
        .where(eq(aiMentorRoadmaps.id, roadmapId));
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[PersonalizedRoadmapService] SQL update milestone error:", err?.message || err);
      }
    }

    return roadmap;
  }

  /**
   * Adapt roadmap timeline or milestones when availability or goals change
   */
  public static async adaptRoadmap(
    studentUserId: string,
    roadmapId: string,
    input: AdaptRoadmapInput | string,
    milestoneOverrides?: Record<number, "pending" | "in_progress" | "completed"> | { pacingFactor?: number; [key: string]: any }
  ): Promise<PersonalizedRoadmapRecord> {
    let roadmap = this.roadmapsCache.get(studentUserId)?.get(roadmapId);
    if (!roadmap) {
      // Load from SQL fallback
      try {
        const db = getDb();
        const rdmRows = await db
          .select()
          .from(aiMentorRoadmaps)
          .where(eq(aiMentorRoadmaps.id, roadmapId));
        if (rdmRows.length === 0) {
          throw new Error(`Roadmap not found: ${roadmapId}`);
        }
        if (rdmRows[0].studentUserId !== studentUserId) {
          throw new Error("403_FORBIDDEN: You do not have permission to adapt another student's roadmap.");
        }
        roadmap = (await this.getRoadmapByGoalId(studentUserId, rdmRows[0].goalId!)) ?? undefined;
      } catch (err: any) {
        if (err.message?.includes("403_FORBIDDEN")) throw err;
      }
    }

    if (!roadmap) {
      throw new Error(`Roadmap not found: ${roadmapId}`);
    }

    if (roadmap.studentUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to adapt another student's roadmap.");
    }

    const now = new Date();
    const reason = typeof input === "string" ? input : input.reason;
    const overrides = typeof input === "string" ? milestoneOverrides : input.milestoneOverrides || milestoneOverrides;

    roadmap.adaptedReason = reason;
    roadmap.updatedAt = now.toISOString();

    if (!roadmap.adaptationHistory) {
      roadmap.adaptationHistory = [];
    }
    roadmap.adaptationHistory.push({
      timestamp: now.toISOString(),
      reason,
      changes: overrides,
    });

    if (overrides) {
      for (const [wkStr, st] of Object.entries(overrides)) {
        const wk = Number(wkStr);
        if (Number.isNaN(wk)) continue;
        const m = roadmap.milestones.find((ms) => ms.weekNumber === wk);
        if (m) {
          m.status = st;
          if (st === "completed") {
            m.completedAt = now.toISOString();
          }
        }
      }
      // Advance to next active or pending milestone
      const nextPending =
        roadmap.milestones.find((m) => m.status === "in_progress") ||
        roadmap.milestones.find((m) => m.status === "pending");
      if (nextPending) {
        nextPending.status = "in_progress";
        roadmap.currentMilestoneWeek = nextPending.weekNumber;
      }
    }

    // If available hours per week are reduced (e.g. exams/deadlines), adjust estimated effort
    if (typeof input !== "string" && input.availableHoursPerWeek && input.availableHoursPerWeek < 10) {
      for (const m of roadmap.milestones) {
        if (m.status !== "completed") {
          m.estimatedEffortHours = Math.round(m.estimatedEffortHours * 0.7);
        }
      }
    }

    // Persist SQL adaptation
    try {
      const db = getDb();
      await db
        .update(aiMentorRoadmaps)
        .set({
          adaptedReason: reason,
          updatedAt: now,
        })
        .where(eq(aiMentorRoadmaps.id, roadmapId));

      if (overrides) {
        for (const [wkStr, st] of Object.entries(overrides)) {
          const wk = Number(wkStr);
          if (Number.isNaN(wk)) continue;
          await db
            .update(aiMentorRoadmapMilestones)
            .set({
              status: st,
              completedAt: st === "completed" ? now : null,
            })
            .where(
              and(
                eq(aiMentorRoadmapMilestones.roadmapId, roadmapId),
                eq(aiMentorRoadmapMilestones.weekNumber, wk)
              )
            );
        }
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[PersonalizedRoadmapService] SQL adapt roadmap error:", err?.message || err);
      }
    }

    return roadmap;
  }
}
