/**
 * Unified Intelligence Architecture — Specialist Registry & Intent Resolver
 * Product: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Mentor: Dr. Aarav Mehta (Principal Mentor · AI Intelligence)
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

export class SpecialistRegistry {
  private static specialists: Map<FocusArea, ISpecialistCapability> = new Map();

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
}
