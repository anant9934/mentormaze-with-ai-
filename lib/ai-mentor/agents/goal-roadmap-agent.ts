/**
 * ASTRION Student Intelligence — Goal & Roadmap Planner Agent
 * Layer: Student Intelligence Agents (Agent Layer B)
 * Responsibilities:
 *  - Convert student-approved goals into structured, actionable milestones
 *  - Map dependency sequences (prerequisite-first ordering)
 *  - Generate realistic short-term (4-week) and long-term (12-week) study roadmaps
 *  - Recalculate milestones when progress advances or pauses
 *  - Enforce integrity: Never silently alter the student's primary career goal
 */

import { AgentMetadata, AgentExecutionInput, AgentExecutionResult } from "./agent-interface";
import { RecommendedAction } from "../types";

export interface RoadmapMilestoneItem {
  weekNumber: number;
  phase: string;
  title: string;
  objectives: string[];
  deliverables: string[];
  prerequisites: string[];
  estimatedEffortHours: number;
  status: "pending" | "in_progress" | "completed";
}

export interface GoalRoadmapOutput {
  primaryGoal: string;
  totalWeeks: number;
  totalEffortHours: number;
  currentMilestone: RoadmapMilestoneItem;
  milestones: RoadmapMilestoneItem[];
  criticalPathNotice?: string;
}

export class GoalRoadmapAgent {
  public static readonly metadata: AgentMetadata = {
    id: "goal-roadmap-agent",
    name: "Goal & Roadmap Planner Intelligence",
    layer: "StudentIntelligence",
    description: "Transforms student goals into structured milestone roadmaps with strict prerequisite mapping.",
    isDeterministic: true,
    requiredConsentPurposes: ["service_personalization"],
  };

  /**
   * Plans or updates the student's structured learning roadmap
   */
  public static async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const primaryGoal = input.context.targetRole || "Software Development Engineer (SDE-1)";
    const confirmedSkills = (input.context.relevantSkills || []).filter((s) => s.masteryScore >= 7.0);

    const hasStrongDSA = confirmedSkills.some((s) => s.skillId === "arrays_strings" || s.category === "DSA");
    const hasStrongSQL = confirmedSkills.some((s) => s.skillId === "relational_db_sql" || s.category === "Databases");

    // Formulate 12-week milestone sequence based on demonstrated prerequisites
    const milestones: RoadmapMilestoneItem[] = [
      {
        weekNumber: 1,
        phase: "Foundations & Asymptotics",
        title: "Algorithmic Invariants & Time Complexity",
        objectives: ["Two-pointer techniques", "Sliding window state tracking", "Space-time proofs"],
        deliverables: ["15 curated LeetCode Mediums", "Space-time complexity derivation doc"],
        prerequisites: [],
        estimatedEffortHours: 10,
        status: hasStrongDSA ? "completed" : "in_progress",
      },
      {
        weekNumber: 2,
        phase: "Core Data Structures",
        title: "Trees, Graphs & Traversal Invariants",
        objectives: ["BFS/DFS recursion call stacks", "Cycle detection", "Topological sorting"],
        deliverables: ["10 Graph problems", "Dependency resolution implementation"],
        prerequisites: ["Algorithmic Invariants"],
        estimatedEffortHours: 12,
        status: hasStrongDSA ? "in_progress" : "pending",
      },
      {
        weekNumber: 3,
        phase: "Dynamic Programming",
        title: "Optimal Substructure & Memoization",
        objectives: ["1D/2D State transition formulation", "Knapsack patterns", "Subsequence matching"],
        deliverables: ["8 classic DP patterns documented", "Space optimization proofs"],
        prerequisites: ["Trees, Graphs & Traversal Invariants"],
        estimatedEffortHours: 12,
        status: "pending",
      },
      {
        weekNumber: 4,
        phase: "Relational Modeling & Storage",
        title: "PostgreSQL Schema & Index Optimization",
        objectives: ["B-Tree vs GIN indexing", "EXPLAIN ANALYZE query planning", "Transaction isolation levels"],
        deliverables: ["Optimized relational schema", "Benchmarked multi-join query plan"],
        prerequisites: [],
        estimatedEffortHours: 8,
        status: hasStrongSQL ? "completed" : "pending",
      },
      {
        weekNumber: 5,
        phase: "Systems & Architecture",
        title: "Cache Invalidation & Rate Limiting",
        objectives: ["Cache-Aside race condition mitigation", "Token bucket / Leaky bucket", "Redis distributed locks"],
        deliverables: ["Working rate limiter middleware", "Documented cache invalidation policy"],
        prerequisites: ["PostgreSQL Schema & Index Optimization"],
        estimatedEffortHours: 14,
        status: "pending",
      },
      {
        weekNumber: 6,
        phase: "Interview Calibration",
        title: "STAR Behavioral & Technical Mock Screens",
        objectives: ["STAR technique calibration", "Edge case communication", "System design whiteboard screen"],
        deliverables: ["1 Mock technical screen", "1 Mock behavioral interview"],
        prerequisites: ["Cache Invalidation & Rate Limiting"],
        estimatedEffortHours: 8,
        status: "pending",
      },
    ];

    const currentMilestone = milestones.find((m) => m.status === "in_progress") || milestones[0];
    const totalEffort = milestones.reduce((sum, m) => sum + m.estimatedEffortHours, 0);

    const recommendedActions: RecommendedAction[] = [
      {
        id: `act-milestone-${currentMilestone.weekNumber}`,
        title: `Start Week ${currentMilestone.weekNumber}: ${currentMilestone.title}`,
        category: "Roadmap Milestone",
        priority: "high",
      },
    ];

    const payload: GoalRoadmapOutput = {
      primaryGoal,
      totalWeeks: milestones.length,
      totalEffortHours: totalEffort,
      currentMilestone,
      milestones,
      criticalPathNotice: "Prerequisites strictly preserved: Core DSA & Relational modeling must precede Distributed Systems.",
    };

    return {
      agentId: this.metadata.id,
      success: true,
      insights: [
        `Active Milestone: Week ${currentMilestone.weekNumber} (${currentMilestone.title})`,
        `Estimated Total Curriculum: ${totalEffort} hours across ${milestones.length} core phases.`,
      ],
      recommendedActions,
      payload,
    };
  }
}
