/**
 * ASTRION Personalized Current-State Assessment Service
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Identity: ASTRION (Adaptive Strategic Intelligence & Reasoning Network)
 * Core: 5-Tier Evidence Classification & Gap Analysis
 */

import { AuthorizedStudentContext } from "../permission-aware-context-builder";
import { StudentGoalRecord } from "../goals/student-goal-service";
import { SkillNodeWithEvidence } from "../student-intelligence-graph";

export type EvidenceTier =
  | "confirmed_evidence"
  | "student_reported"
  | "extracted"
  | "system_inference"
  | "system_inferred"
  | "unknown_or_missing"
  | "unknown_missing";

export interface CompetencyAssessmentItem {
  skillId: string;
  skillName: string;
  category: string;
  requiredForGoal: boolean;
  minBenchmarkScore: number;
  currentScore: number;
  tier: EvidenceTier;
  confidence: number;
  evidenceSource: string;
  status: "strong" | "gap" | "uncertain" | "missing_info";
  remediationTopic?: string;
}

export interface PersonalizedAssessmentResult {
  studentUserId: string;
  goalId?: string;
  targetGoalTitle: string;
  overallReadinessScore: number; // 0.0 - 100.0%
  demonstratedLevel: "foundational" | "intermediate" | "advanced";
  confirmedStrengths: string[];
  confirmedGaps: { skill: string; remediation: string; severity: "low" | "medium" | "high" }[];
  uncertainAreas: { skill: string; reason: string }[];
  missingEssentialInfo: { question: string; targetCompetency: string; rationale: string }[];
  evidenceTiersSummary: {
    confirmedCount: number;
    studentReportedCount: number;
    extractedCount: number;
    inferredCount: number;
    unknownMissingCount: number;
  };
  assessedAt: string;
}

// Canonical Competency Frameworks per Goal Category
const BENCHMARK_FRAMEWORKS: Record<string, { id: string; name: string; category: string; minScore: number }[]> = {
  "machine learning": [
    { id: "python_programming", name: "Python Programming & Idioms", category: "Language", minScore: 7.5 },
    { id: "linear_algebra", name: "Linear Algebra & Vector Calculus", category: "Mathematics", minScore: 7.0 },
    { id: "probability_stats", name: "Probability & Statistical Inference", category: "Mathematics", minScore: 7.0 },
    { id: "data_structures", name: "DSA & Algorithmic Efficiency", category: "Core CS", minScore: 6.5 },
    { id: "pytorch_framework", name: "PyTorch / Deep Learning Frameworks", category: "ML Engineering", minScore: 7.0 },
    { id: "data_pipelines", name: "Data Ingestion & Feature Engineering", category: "MLOps", minScore: 6.5 },
    { id: "model_serving", name: "Model Inference Serving & Latency Optimization", category: "MLOps", minScore: 6.0 },
  ],
  "distributed systems": [
    { id: "concurrency_multithreading", name: "Concurrency & Memory Models", category: "Core CS", minScore: 7.5 },
    { id: "networking_protocols", name: "TCP/IP, HTTP/2 & gRPC Protocols", category: "Networking", minScore: 7.0 },
    { id: "relational_db_sql", name: "Relational Modeling & Index Optimization", category: "Databases", minScore: 7.5 },
    { id: "distributed_consensus", name: "Consensus Protocols (Raft/Paxos)", category: "Distributed Systems", minScore: 6.5 },
    { id: "cache_invalidation", name: "Cache-Aside Topologies & Invalidation", category: "Architecture", minScore: 7.0 },
    { id: "message_queues", name: "Event Streaming (Kafka/RabbitMQ)", category: "Architecture", minScore: 6.5 },
  ],
  "software development engineer": [
    { id: "arrays_strings", name: "Arrays, Strings & Two Pointers", category: "DSA", minScore: 7.5 },
    { id: "trees_graphs", name: "Trees, Graphs & Graph Traversals", category: "DSA", minScore: 7.0 },
    { id: "dynamic_programming", name: "Dynamic Programming & Memoization", category: "DSA", minScore: 6.5 },
    { id: "rest_api_design", name: "RESTful API Design & Validation", category: "Backend", minScore: 7.0 },
    { id: "relational_db_sql", name: "SQL & Schema Normalization", category: "Databases", minScore: 7.0 },
    { id: "git_cicd", name: "Git Workflow & CI/CD Pipelines", category: "DevOps", minScore: 6.5 },
  ],
};

export class PersonalizedAssessmentService {
  /**
   * Assesses a student's current state relative to an explicit goal and authorized context
   */
  public static assessCurrentState(
    context: AuthorizedStudentContext,
    goal?: StudentGoalRecord | null
  ): PersonalizedAssessmentResult {
    const studentUserId = context.studentUserId;
    const goalTitle = goal?.title || context.targetRole || "Software Development Engineer (SDE-1)";
    const lowerGoal = goalTitle.toLowerCase();

    // Select benchmark framework
    let framework = BENCHMARK_FRAMEWORKS["software development engineer"];
    if (lowerGoal.includes("machine learning") || lowerGoal.includes("data science") || lowerGoal.includes("ai")) {
      framework = BENCHMARK_FRAMEWORKS["machine learning"];
    } else if (lowerGoal.includes("distributed") || lowerGoal.includes("system design") || lowerGoal.includes("systems")) {
      framework = BENCHMARK_FRAMEWORKS["distributed systems"];
    }

    const studentSkills: any[] = [
      ...(context.relevantSkills || []),
      ...(((context as any).studentProfile?.verifiedSkills || []) as any[]).map((v) => ({
        skillId: v.skillId || v.skillName?.toLowerCase(),
        skillName: v.skillName,
        masteryState: v.masteryState || "competent",
        masteryScore: v.masteryScore || 8.0,
        evidenceType: v.provenance === "code_review" || v.provenance === "assessment" ? "assessed" : "self_reported",
      })),
      ...(((context as any).studentGraph?.masteryNodes || []) as any[]).map((m) => ({
        skillId: m.skillId,
        skillName: m.skillName,
        masteryState: m.masteryState || "competent",
        masteryScore: m.masteryScore > 10 ? m.masteryScore / 10 : m.masteryScore,
        evidenceType: "assessed",
      })),
    ];
    const confirmedStrengths: string[] = [];
    const confirmedGaps: { skill: string; remediation: string; severity: "low" | "medium" | "high" }[] = [];
    const uncertainAreas: { skill: string; reason: string }[] = [];
    const missingEssentialInfo: { question: string; targetCompetency: string; rationale: string }[] = [];

    let confirmedCount = 0;
    let studentReportedCount = 0;
    let extractedCount = 0;
    let inferredCount = 0;
    let unknownMissingCount = 0;

    if (context.classifiedEvidence) {
      const ce: any = context.classifiedEvidence;
      if (ce.confirmedFacts?.length) confirmedCount += ce.confirmedFacts.length;
      if (ce.selfReportedClaims?.length) studentReportedCount += ce.selfReportedClaims.length;
      if (ce.studentReported?.length) studentReportedCount += ce.studentReported.length;
      if (ce.extractedEvidence?.length) extractedCount += ce.extractedEvidence.length;
      if (ce.inferredPatterns?.length) inferredCount += ce.inferredPatterns.length;
      if (ce.systemInferences?.length) inferredCount += ce.systemInferences.length;
    }

    let totalScoreNumerator = 0;
    let totalScoreDenominator = framework.length * 10;

    for (const benchmark of framework) {
      const match = studentSkills.find(
        (s) =>
          s.skillId === benchmark.id ||
          s.skillName.toLowerCase().includes(benchmark.name.toLowerCase().split(" ")[0]) ||
          benchmark.name.toLowerCase().includes(s.skillName.toLowerCase())
      );

      if (!match || match.masteryState === "not_assessed") {
        unknownMissingCount++;
        uncertainAreas.push({
          skill: benchmark.name,
          reason: "Zero assessment records or verified submissions found in student intelligence graph.",
        });

        confirmedGaps.push({
          skill: benchmark.name,
          remediation: `Complete foundational curriculum modules and practice implementations for ${benchmark.name}.`,
          severity: benchmark.minScore >= 7.0 ? "high" : "medium",
        });

        // Formulate focused clarifying questions for critical prerequisites
        if (benchmark.minScore >= 7.0) {
          missingEssentialInfo.push({
            targetCompetency: benchmark.name,
            question: `What is your current practical experience with ${benchmark.name}? Have you used it in projects, coursework, or self-study?`,
            rationale: `${benchmark.name} is a non-negotiable foundational prerequisite for ${goalTitle}.`,
          });
        }
        continue;
      }

      // Map evidence classification to the 5 tiers
      let tier: EvidenceTier = "student_reported";
      if (match.evidenceType === "assessed" || match.evidenceType === "independently_verified") {
        tier = "confirmed_evidence";
        confirmedCount++;
      } else if (match.evidenceType === "extracted") {
        tier = "extracted";
        extractedCount++;
      } else if (match.evidenceType === "inferred") {
        tier = "system_inferred";
        inferredCount++;
      } else {
        tier = "student_reported";
        studentReportedCount++;
      }

      const score = match.masteryScore || 0;
      totalScoreNumerator += score;

      if (score >= benchmark.minScore) {
        confirmedStrengths.push(`${benchmark.name} (${match.evidenceType})`);
      } else {
        const severity: "low" | "medium" | "high" =
          benchmark.minScore - score > 2.5 ? "high" : benchmark.minScore - score > 1.0 ? "medium" : "low";

        confirmedGaps.push({
          skill: benchmark.name,
          remediation: `Focus on ${benchmark.name} foundations and complete milestone implementation tasks.`,
          severity,
        });
      }
    }

    const readinessPct = Math.round((totalScoreNumerator / totalScoreDenominator) * 100);
    const demonstratedLevel: "foundational" | "intermediate" | "advanced" =
      readinessPct >= 75 ? "advanced" : readinessPct >= 40 ? "intermediate" : "foundational";

    return {
      studentUserId,
      goalId: goal?.id,
      targetGoalTitle: goalTitle,
      overallReadinessScore: readinessPct,
      demonstratedLevel,
      confirmedStrengths,
      confirmedGaps,
      uncertainAreas,
      missingEssentialInfo,
      evidenceTiersSummary: {
        confirmedCount,
        studentReportedCount,
        extractedCount,
        inferredCount,
        unknownMissingCount,
      },
      assessedAt: new Date().toISOString(),
    };
  }
}
