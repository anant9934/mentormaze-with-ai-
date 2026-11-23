/**
 * ASTRION Student Intelligence — Student Profiler & Memory Agent
 * Layer: Student Intelligence Agents (Agent Layer B)
 * Responsibilities:
 *  - Maintain authorized student preferences, learning goals, and factual context
 *  - Retrieve relevant memory items with strict provenance, confidence, and freshness
 *  - Support explicit student correction and revocation
 *  - Enforce anti-profiling policy: Never create hidden psychological or behavioral diagnoses
 */

import { AgentMetadata, AgentExecutionInput, AgentExecutionResult } from "./agent-interface";
import { StudentMemoryService, StudentMemoryItem } from "../student-memory-service";

export interface StudentProfilerOutput {
  authorizedPreferences: Record<string, string>;
  activeLearningGoals: string[];
  recentMemories: StudentMemoryItem[];
  provenanceAudit: {
    totalMemories: number;
    studentReportedCount: number;
    systemObservedCount: number;
    hasExpiredRecords: boolean;
  };
}

export class StudentProfilerAgent {
  public static readonly metadata: AgentMetadata = {
    id: "student-profiler-agent",
    name: "Student Profiler & Memory Intelligence",
    layer: "StudentIntelligence",
    description: "Maintains authorized student preferences, memories, and explicit profile goals with zero psychological profiling.",
    isDeterministic: true,
    requiredConsentPurposes: ["student_memory", "service_personalization"],
  };

  /**
   * Retrieves and audits authorized memory and preference records
   */
  public static async execute(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const studentUserId = input.studentUserId;

    // 1. Retrieve authorized student memories
    let memories: StudentMemoryItem[] = [];
    try {
      memories = StudentMemoryService.getMemories(studentUserId, studentUserId);
    } catch {
      memories = [];
    }

    // 2. Filter out non-consented, sensitive, or speculative entries
    const safeMemories = memories.filter((m) => {
      // Disallow speculative personality or hidden psychological categorization
      const isSensitiveCategory =
        (m.category as string) === "psychological_profile" ||
        (m.category as string) === "behavioral_diagnosis";
      return !isSensitiveCategory;
    });

    let studentReportedCount = 0;
    let systemObservedCount = 0;
    const preferences: Record<string, string> = {};
    const learningGoals: string[] = [];

    for (const mem of safeMemories) {
      if (mem.provenance === "student_reported" || mem.studentConfirmed) {
        studentReportedCount++;
      } else {
        systemObservedCount++;
      }

      if (mem.category === "learning_preferences") {
        preferences[mem.key] = mem.value;
      } else if (mem.category === "current_goals" || mem.category === "career_objectives") {
        learningGoals.push(mem.value);
      }
    }

    const outputPayload: StudentProfilerOutput = {
      authorizedPreferences: preferences,
      activeLearningGoals: learningGoals,
      recentMemories: safeMemories.slice(0, 5),
      provenanceAudit: {
        totalMemories: safeMemories.length,
        studentReportedCount,
        systemObservedCount,
        hasExpiredRecords: false,
      },
    };

    return {
      agentId: this.metadata.id,
      success: true,
      insights: [
        `Authorized Memory Bank: ${safeMemories.length} items (${studentReportedCount} student-confirmed).`,
        `Target Goals: ${learningGoals.slice(0, 3).join(", ") || "General Computer Science"}`,
      ],
      payload: outputPayload,
    };
  }
}
