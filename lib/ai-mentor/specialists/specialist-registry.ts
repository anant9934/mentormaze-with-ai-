/**
 * ASTRION Unified Intelligence Architecture — Specialist Registry & Intent Resolver
 * Product: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Identity: ASTRION (Adaptive Strategic Intelligence & Reasoning Network)
 * Core: ASTRION CORE (`astrion-core`)
 * Specialists: SAGE, CIPHER, ATLAS, FORGE, VECTRA, PRISM, ORACLE, CHRONOS
 */

import { FocusArea, TeachingMode, SpecialistCapabilityInfo } from "../types";
import { ISpecialistCapability } from "./specialist-interface";
import { LearningSpecialist } from "./learning-specialist";
import { PracticeSpecialist } from "./practice-specialist";
import { CodingSpecialist } from "./coding-specialist";
import { SystemDesignSpecialist } from "./system-design-specialist";
import { CareerSpecialist } from "./career-specialist";
import { ResumeSpecialist } from "./resume-specialist";
import { InterviewSpecialist } from "./interview-specialist";
import { ProjectSpecialist } from "./project-specialist";
import { StudyPlanningSpecialist } from "./study-planning-specialist";
import {
  type SpecialistCodeName,
  type SpecialistContract,
  CANONICAL_SPECIALISTS,
} from "../contracts/specialist.contract";

export type {
  SpecialistCodeName,
  SpecialistContract,
};
export {
  CANONICAL_SPECIALISTS,
};

export const CANONICAL_SPECIALIST_NAMES: SpecialistCodeName[] = [
  "SAGE",
  "CIPHER",
  "ATLAS",
  "FORGE",
  "VECTRA",
  "PRISM",
  "ORACLE",
  "CHRONOS",
];

export class SpecialistRegistry {
  private static specialists: Map<FocusArea, ISpecialistCapability> = new Map();

  /**
   * Canonical 8-Specialist to Capability Mapping Specification
   */
  public static readonly CANONICAL_SPECIALISTS: Record<
    SpecialistCodeName,
    { id: FocusArea; responsibility: string }
  > = {
    SAGE: { id: "learn", responsibility: "Learning intelligence" },
    CIPHER: { id: "coding_dsa", responsibility: "Programming and DSA" },
    ATLAS: { id: "system_design", responsibility: "Systems architecture" },
    FORGE: { id: "projects", responsibility: "Project intelligence" },
    VECTRA: { id: "career", responsibility: "Career strategy" },
    PRISM: { id: "resume", responsibility: "Resume intelligence" },
    ORACLE: { id: "interview", responsibility: "Interview intelligence" },
    CHRONOS: { id: "study_planning", responsibility: "Planning intelligence" },
  };

  static {
    const list: ISpecialistCapability[] = [
      new LearningSpecialist(),
      new PracticeSpecialist(),
      new CodingSpecialist(),
      new SystemDesignSpecialist(),
      new CareerSpecialist(),
      new ResumeSpecialist(),
      new InterviewSpecialist(),
      new ProjectSpecialist(),
      new StudyPlanningSpecialist(),
    ];

    for (const spec of list) {
      this.specialists.set(spec.id, spec);
    }
  }

  /**
   * Normalizes legacy TeachingMode identifiers into the 9 canonical FocusArea IDs
   */
  public static normalizeFocusArea(modeOrArea?: string): FocusArea {
    if (!modeOrArea) return "learn";
    const key = modeOrArea.trim().toLowerCase();

    switch (key) {
      case "code_mentor":
      case "coding_dsa":
      case "code":
      case "coding":
        return "coding_dsa";

      case "system_design":
      case "systemdesign":
      case "architecture":
        return "system_design";

      case "career_mentor":
      case "career":
        return "career";

      case "resume_mentor":
      case "resume":
        return "resume";

      case "interview_coach":
      case "interview":
        return "interview";

      case "project_mentor":
      case "project_architect":
      case "projects":
      case "project":
        return "projects";

      case "study_planner":
      case "study_planning":
      case "roadmap":
        return "study_planning";

      case "practice":
        return "practice";

      case "learn":
      default:
        return "learn";
    }
  }

  /**
   * Gets a specialist by canonical FocusArea ID
   */
  public static getSpecialist(focusArea: FocusArea): ISpecialistCapability {
    const specialist = this.specialists.get(focusArea);
    if (!specialist) {
      return this.specialists.get("learn")!;
    }
    return specialist;
  }

  /**
   * Resolves the most appropriate specialist based on explicit user intent or natural language prompt
   */
  public static resolveSpecialist(
    message: string,
    explicitModeOrArea?: TeachingMode | FocusArea | string
  ): ISpecialistCapability {
    // 1. If explicit focus area was provided and is not default "learn", honor it directly
    if (explicitModeOrArea && explicitModeOrArea !== "learn") {
      const canonical = this.normalizeFocusArea(explicitModeOrArea);
      return this.getSpecialist(canonical);
    }

    // 2. Perform intelligent natural-language intent classification
    const lower = message.toLowerCase();

    // Check high-priority domain patterns first
    if (
      lower.includes("resume") ||
      lower.includes("cv") ||
      lower.includes("bullet point") ||
      lower.includes("xyz formula")
    ) {
      return this.getSpecialist("resume");
    }

    if (
      lower.includes("interview") ||
      lower.includes("behavioral") ||
      lower.includes("star method") ||
      lower.includes("mock interview")
    ) {
      return this.getSpecialist("interview");
    }

    if (
      lower.includes("system design") ||
      lower.includes("distributed system") ||
      lower.includes("rate limiter") ||
      lower.includes("cache-aside") ||
      lower.includes("kafka") ||
      lower.includes("sharding")
    ) {
      return this.getSpecialist("system_design");
    }

    if (
      lower.includes("code review") ||
      lower.includes("debug") ||
      lower.includes("time complexity") ||
      lower.includes("optimize this") ||
      lower.includes("leetcode") ||
      lower.includes("two sum") ||
      lower.includes("big o")
    ) {
      return this.getSpecialist("coding_dsa");
    }

    if (
      lower.includes("roadmap") ||
      lower.includes("study plan") ||
      lower.includes("study schedule") ||
      lower.includes("24-week")
    ) {
      return this.getSpecialist("study_planning");
    }

    if (
      lower.includes("job description") ||
      lower.includes("naukri") ||
      lower.includes("salary range") ||
      lower.includes("sde 1") ||
      lower.includes("sde-1") ||
      lower.includes("sde 2")
    ) {
      return this.getSpecialist("career");
    }

    if (
      lower.includes("portfolio project") ||
      lower.includes("tech stack for") ||
      lower.includes("what project to build")
    ) {
      return this.getSpecialist("projects");
    }

    if (
      lower.includes("hint") ||
      lower.includes("stuck") ||
      lower.includes("quiz me") ||
      lower.includes("give me a problem")
    ) {
      return this.getSpecialist("practice");
    }

    // 3. Fallback to explicit or normalized focus area
    const canonical = this.normalizeFocusArea(explicitModeOrArea);
    return this.getSpecialist(canonical);
  }

  /**
   * Resolves an optional secondary specialist when the query spans multiple domains (bounded multi-specialist routing)
   */
  public static resolveSecondarySpecialist(
    message: string,
    primaryFocusArea: FocusArea
  ): ISpecialistCapability | null {
    const lower = message.toLowerCase();

    // Bounded execution: at most one secondary specialist
    if (
      primaryFocusArea !== "coding_dsa" &&
      (lower.includes("code review") || lower.includes("write code") || lower.includes("implement this") || lower.includes("dsa solution"))
    ) {
      return this.getSpecialist("coding_dsa");
    }

    if (
      primaryFocusArea !== "resume" &&
      (lower.includes("resume") || lower.includes("cv") || lower.includes("bullet point"))
    ) {
      return this.getSpecialist("resume");
    }

    if (
      primaryFocusArea !== "career" &&
      (lower.includes("career ladder") || lower.includes("salary expectations") || lower.includes("job market"))
    ) {
      return this.getSpecialist("career");
    }

    if (
      primaryFocusArea !== "system_design" &&
      (lower.includes("system design") || lower.includes("distributed architecture") || lower.includes("scalability"))
    ) {
      return this.getSpecialist("system_design");
    }

    if (
      primaryFocusArea !== "study_planning" &&
      (lower.includes("study plan") || lower.includes("milestone roadmap") || lower.includes("learning schedule"))
    ) {
      return this.getSpecialist("study_planning");
    }

    return null;
  }

  /**
   * Returns all 9 specialist capability modules
   */
  public static getAllSpecialists(): ISpecialistCapability[] {
    return Array.from(this.specialists.values());
  }

  /**
   * Returns metadata for all 9 specialists for UI selectors
   */
  public static getSpecialistMetadataList(): SpecialistCapabilityInfo[] {
    return this.getAllSpecialists().map((s) => s.getMetadata());
  }

  /**
   * Retrieves strongly typed domain contract for a canonical specialist
   */
  public static getCanonicalContract(codeName: SpecialistCodeName): SpecialistContract {
    const contract = CANONICAL_SPECIALISTS[codeName];
    if (!contract) {
      return CANONICAL_SPECIALISTS.SAGE;
    }
    return contract;
  }

  /**
   * Retrieves specialist capability implementation by canonical code name
   */
  public static getSpecialistByCodeName(codeName: SpecialistCodeName): ISpecialistCapability {
    const contract = this.getCanonicalContract(codeName);
    return this.getSpecialist(contract.focusAreaId);
  }
}

export const SPECIALIST_CAPABILITIES: SpecialistCapabilityInfo[] = SpecialistRegistry.getSpecialistMetadataList();

export function resolveSecondarySpecialist(
  primarySpecialistOrFocus: string,
  userMessage: string
): ISpecialistCapability | null {
  let focus: FocusArea = "learn";
  if (primarySpecialistOrFocus.includes("cipher") || primarySpecialistOrFocus === "coding_dsa" || primarySpecialistOrFocus === "coding") {
    focus = "coding_dsa";
  } else if (primarySpecialistOrFocus.includes("atlas") || primarySpecialistOrFocus === "system_design") {
    focus = "system_design";
  } else if (primarySpecialistOrFocus.includes("prism") || primarySpecialistOrFocus === "resume") {
    focus = "resume";
  } else if (primarySpecialistOrFocus.includes("vectra") || primarySpecialistOrFocus === "career") {
    focus = "career";
  } else if (primarySpecialistOrFocus.includes("oracle") || primarySpecialistOrFocus === "interview" || primarySpecialistOrFocus === "interviews") {
    focus = "interview";
  } else if (primarySpecialistOrFocus.includes("chronos") || primarySpecialistOrFocus === "study_planning" || primarySpecialistOrFocus === "planning") {
    focus = "study_planning";
  } else if (primarySpecialistOrFocus.includes("forge") || primarySpecialistOrFocus === "projects") {
    focus = "projects";
  } else {
    focus = "learn";
  }
  return SpecialistRegistry.resolveSecondarySpecialist(userMessage, focus);
}
