/**
 * ASTRION BloomTutor Learning Journey Service
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Reference Standard: BloomTutor (`Li-Evan/BloomTutor`)
 *
 * Implements structured learning programmes:
 * Goal -> Skill Graph -> Diagnostic -> Personalized Path -> Lesson -> Practice -> Feedback -> Assessment -> Next Lesson
 * With rich Notes, Student Annotations, Remediation, Final Assessment, and Exportable Learning Summaries.
 */

import fs from "fs";
import path from "path";
import {
  LearningProgramme,
  ProgrammeLesson,
  ProgrammeLessonFeedback,
  ProgrammeLessonEvaluation,
  StudentProgrammeNote,
  StudentAnnotation,
  ProgrammeFinalAssessment,
  CanonicalMasteryLevel,
} from "../types";
import { TOPIC_DECOMPOSITIONS, TopicDecomposition } from "../socratic-teaching-engine";
import { StudentSkillGraph } from "../student-skill-graph";
import { BayesianKnowledgeTracer } from "../pedagogy/bkt-service";
import { FSRSScheduler } from "../pedagogy/fsrs-service";
import { StudentGoalService } from "../goals/student-goal-service";

export class BloomLearningJourneyService {
  // studentUserId -> (programmeId -> LearningProgramme)
  private static programmes: Map<string, Map<string, LearningProgramme>> = new Map();
  private static isInitialized = false;

  private static get isTestEnvironment(): boolean {
    return process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  }

  private static get storageFilePath(): string | null {
    if (this.isTestEnvironment) {
      const fixtureDir = path.resolve(process.cwd(), "tests", "fixtures");
      if (!fs.existsSync(fixtureDir)) {
        fs.mkdirSync(fixtureDir, { recursive: true });
      }
      return path.resolve(fixtureDir, ".test-bloom-programmes.json");
    }
    return null;
  }

  public static reset(): void {
    this.programmes.clear();
    this.isInitialized = false;
    try {
      const filePath = this.storageFilePath;
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // ignore
    }
  }

  private static ensureLoaded(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    if (this.isTestEnvironment) {
      try {
        const filePath = this.storageFilePath;
        if (filePath && fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, "utf-8");
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            for (const [userId, userProgrammes] of Object.entries(parsed)) {
              const map = new Map<string, LearningProgramme>();
              for (const [pId, pData] of Object.entries(userProgrammes as Record<string, LearningProgramme>)) {
                map.set(pId, pData);
              }
              this.programmes.set(userId, map);
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  private static persistToDisk(): void {
    if (this.isTestEnvironment) {
      try {
        const filePath = this.storageFilePath;
        if (filePath) {
          const out: Record<string, Record<string, LearningProgramme>> = {};
          for (const [userId, userMap] of this.programmes.entries()) {
            out[userId] = {};
            for (const [pId, prog] of userMap.entries()) {
              out[userId][pId] = prog;
            }
          }
          fs.writeFileSync(filePath, JSON.stringify(out, null, 2), "utf-8");
        }
      } catch {
        // ignore
      }
    }
  }

  /**
   * Initializes a structured learning programme from topic decomposition
   */
  public static createProgramme(params: {
    studentUserId: string;
    goalId: string;
    topicName: string;
    roadmapId?: string;
    requestingUserId?: string;
  }): LearningProgramme {
    this.ensureLoaded();
    const { studentUserId, goalId, topicName, roadmapId, requestingUserId } = params;

    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to create another student's learning programme.");
    }

    const normTopic = topicName.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const decomp = TOPIC_DECOMPOSITIONS[normTopic] || TOPIC_DECOMPOSITIONS.dynamic_programming;

    // Duplicate creation prevention: Return existing active programme if already in-progress
    const existingUserMap = this.programmes.get(studentUserId);
    if (existingUserMap) {
      for (const existing of existingUserMap.values()) {
        if (existing.topic === decomp.topic && (existing.status === "active" || existing.status === "remediating")) {
          return existing;
        }
      }
    }

    const programmeId = `prog-${studentUserId}-${Date.now()}`;
    const now = new Date().toISOString();

    const lessons: ProgrammeLesson[] = decomp.subskills.map((sub, idx) => ({
      id: `les-${sub.id}`,
      subskillId: sub.id,
      order: sub.order,
      title: sub.name,
      conceptualOverview: sub.description,
      learningObjectives: [
        `Master theoretical invariant of ${sub.name}`,
        `Identify ${sub.diagnosticQuestion.targetInsight}`,
        `Implement working algorithmic solution without common errors: ${sub.diagnosticQuestion.commonMisconceptions[0] || "edge-case failure"}`,
      ],
      prerequisites: sub.prerequisites,
      exercise: {
        id: `ex-${sub.id}`,
        prompt: sub.diagnosticQuestion.questionText,
        starterCode: `// Exercise: ${sub.name}\nfunction solve(input) {\n  // Implement solution\n}`,
        sampleSolution: sub.diagnosticQuestion.sampleCorrectEvidence,
        hintLevelAvailable: 6,
      },
      status: idx === 0 ? "in_progress" : "pending",
    }));

    const programme: LearningProgramme = {
      id: programmeId,
      studentUserId,
      goalId,
      roadmapId,
      title: `${decomp.topicTitle} Mastery Programme`,
      topic: decomp.topic,
      currentLessonIndex: 0,
      lessons,
      notes: [],
      annotations: [],
      status: "active",
      remediationQueue: [],
      createdAt: now,
      updatedAt: now,
    };

    if (!this.programmes.has(studentUserId)) {
      this.programmes.set(studentUserId, new Map());
    }
    this.programmes.get(studentUserId)!.set(programmeId, programme);
    this.persistToDisk();

    return programme;
  }

  /**
   * Retrieves learning programme by ID with ownership enforcement
   */
  public static getProgramme(
    studentUserId: string,
    programmeId: string,
    requestingUserId?: string
  ): LearningProgramme {
    this.ensureLoaded();
    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's learning programme.");
    }

    const userMap = this.programmes.get(studentUserId);
    if (!userMap) {
      throw new Error(`Programme not found: ${programmeId}`);
    }
    const prog = userMap.get(programmeId);
    if (!prog) {
      throw new Error(`Programme not found: ${programmeId}`);
    }
    return prog;
  }

  /**
   * Submits student feedback on a lesson
   */
  public static submitLessonFeedback(params: {
    studentUserId: string;
    programmeId: string;
    lessonId: string;
    feedback: ProgrammeLessonFeedback;
    requestingUserId?: string;
  }): LearningProgramme {
    const { studentUserId, programmeId, lessonId, feedback, requestingUserId } = params;
    const prog = this.getProgramme(studentUserId, programmeId, requestingUserId);

    const lesson = prog.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      throw new Error(`Lesson not found: ${lessonId}`);
    }

    lesson.studentFeedback = feedback;
    prog.updatedAt = new Date().toISOString();
    this.persistToDisk();

    return prog;
  }

  /**
   * Evaluates lesson exercise, updates skill graph & BKT, and handles progression or remediation
   */
  public static evaluateLessonExercise(params: {
    studentUserId: string;
    programmeId: string;
    lessonId: string;
    score: number; // 0 to 10
    feedback: string;
    requestingUserId?: string;
  }): {
    programme: LearningProgramme;
    evaluation: ProgrammeLessonEvaluation;
    remediationNeeded: boolean;
  } {
    const { studentUserId, programmeId, lessonId, score, feedback, requestingUserId } = params;
    const prog = this.getProgramme(studentUserId, programmeId, requestingUserId);

    const lesson = prog.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      throw new Error(`Lesson not found: ${lessonId}`);
    }

    const isPassed = score >= 7.0;
    const demonstratedMastery: CanonicalMasteryLevel = isPassed
      ? score >= 9.0
        ? 4
        : 3
      : score >= 5.0
      ? 2
      : 1;

    const evaluation: ProgrammeLessonEvaluation = {
      score,
      isPassed,
      demonstratedMastery,
      feedback,
      evaluatedAt: new Date().toISOString(),
    };
    lesson.evaluation = evaluation;

    // 1. Record evidence in StudentSkillGraph
    StudentSkillGraph.recordEvidence(
      studentUserId,
      lesson.subskillId,
      score,
      "code_execution"
    );

    // 2. Update BKT
    BayesianKnowledgeTracer.recordObservation({
      studentUserId,
      conceptId: lesson.subskillId,
      outcome: isPassed ? "independent_success" : "failed_attempt",
      evidenceSource: "assessment_verified",
    });

    // 3. Update FSRS
    FSRSScheduler.recordReview({
      studentUserId,
      conceptId: lesson.subskillId,
      rating: isPassed ? (score >= 9.0 ? 4 : 3) : 1,
    });

    if (isPassed) {
      lesson.status = "completed";
      // If there was a remediation for this subskill, remove it
      prog.remediationQueue = prog.remediationQueue.filter((s) => s !== lesson.subskillId);

      // Advance to next lesson if currently on this lesson
      if (prog.currentLessonIndex < prog.lessons.length - 1) {
        prog.currentLessonIndex += 1;
        prog.lessons[prog.currentLessonIndex].status = "in_progress";
        prog.status = prog.remediationQueue.length > 0 ? "remediating" : "active";
      } else {
        // All lessons completed
        prog.status = "completed";
      }
    } else {
      lesson.status = "needs_remediation";
      if (!prog.remediationQueue.includes(lesson.subskillId)) {
        prog.remediationQueue.push(lesson.subskillId);
      }
      prog.status = "remediating";
    }

    prog.updatedAt = new Date().toISOString();
    this.persistToDisk();

    return {
      programme: prog,
      evaluation,
      remediationNeeded: !isPassed,
    };
  }

  /**
   * Adds student markdown note to a lesson
   */
  public static addNote(params: {
    studentUserId: string;
    programmeId: string;
    lessonId: string;
    content: string;
    requestingUserId?: string;
  }): StudentProgrammeNote {
    const { studentUserId, programmeId, lessonId, content, requestingUserId } = params;
    const prog = this.getProgramme(studentUserId, programmeId, requestingUserId);

    const now = new Date().toISOString();
    const note: StudentProgrammeNote = {
      id: `note-${Date.now()}`,
      lessonId,
      content,
      createdAt: now,
      updatedAt: now,
    };

    prog.notes.push(note);
    prog.updatedAt = now;
    this.persistToDisk();

    return note;
  }

  /**
   * Adds inline code/concept annotation
   */
  public static addAnnotation(params: {
    studentUserId: string;
    programmeId: string;
    lessonId: string;
    highlightedText: string;
    note: string;
    requestingUserId?: string;
  }): StudentAnnotation {
    const { studentUserId, programmeId, lessonId, highlightedText, note, requestingUserId } = params;
    const prog = this.getProgramme(studentUserId, programmeId, requestingUserId);

    const annotation: StudentAnnotation = {
      id: `ann-${Date.now()}`,
      lessonId,
      highlightedText,
      note,
      createdAt: new Date().toISOString(),
    };

    prog.annotations.push(annotation);
    prog.updatedAt = new Date().toISOString();
    this.persistToDisk();

    return annotation;
  }

  /**
   * Completes the final programme assessment
   */
  public static completeFinalAssessment(params: {
    studentUserId: string;
    programmeId: string;
    score: number;
    summary: string;
    requestingUserId?: string;
  }): ProgrammeFinalAssessment {
    const { studentUserId, programmeId, score, summary, requestingUserId } = params;
    const prog = this.getProgramme(studentUserId, programmeId, requestingUserId);

    // Lifecycle check: prevent skipping to final assessment before lessons are completed
    const incomplete = prog.lessons.filter((l) => l.status !== "completed");
    if (incomplete.length > 0) {
      throw new Error(`400_BAD_REQUEST: Cannot complete final assessment while ${incomplete.length} lessons remain incomplete.`);
    }

    const passed = score >= 8.0;
    const overallMastery: CanonicalMasteryLevel = score >= 9.0 ? 5 : score >= 8.0 ? 4 : 3;

    const assessment: ProgrammeFinalAssessment = {
      id: `fin-${Date.now()}`,
      score,
      overallMastery,
      passed,
      assessedAt: new Date().toISOString(),
      summary,
    };

    prog.finalAssessment = assessment;
    if (passed) {
      prog.status = "completed";
    }
    prog.updatedAt = new Date().toISOString();
    this.persistToDisk();

    return assessment;
  }

  /**
   * Generates exportable markdown learning summary
   */
  public static exportLearningSummary(studentUserId: string, programmeId: string, requestingUserId?: string): string {
    const prog = this.getProgramme(studentUserId, programmeId, requestingUserId);
    const activeGoal = StudentGoalService.getActivePrimaryGoalSync(studentUserId);

    let md = `# 🎓 ASTRION Learning Programme Summary\n\n`;
    md += `**Programme Title:** ${prog.title}\n`;
    md += `**Student ID:** \`${studentUserId}\`\n`;
    md += `**Status:** ${prog.status.toUpperCase()}\n`;
    md += `**Created Date:** ${prog.createdAt.split("T")[0]}\n`;
    md += `**Last Updated:** ${prog.updatedAt.split("T")[0]}\n\n`;

    if (activeGoal) {
      md += `### 🎯 Target Career Objective\n`;
      md += `- **Goal Title:** ${activeGoal.title}\n`;
      md += `- **Category:** ${activeGoal.category}\n`;
      md += `- **Success Criteria:** ${activeGoal.successCriteria.join("; ")}\n\n`;
    }

    md += `### 📚 Completed Lessons & Mastery Breakdown\n\n`;
    md += `| Order | Subskill | Status | Score | Demonstrated Level | BKT Latent Knowledge |\n`;
    md += `| :---: | :--- | :---: | :---: | :---: | :---: |\n`;

    for (const l of prog.lessons) {
      const bkt = BayesianKnowledgeTracer.getConceptState(studentUserId, l.subskillId);
      const score = l.evaluation ? `${l.evaluation.score}/10` : "Not evaluated";
      const mastery = l.evaluation ? `Level ${l.evaluation.demonstratedMastery}` : "Level 0";
      const bktEst = `${Math.round(bkt.knowledgeProbability * 100)}% (${bkt.masteryBand})`;
      md += `| ${l.order} | **${l.title}** | ${l.status} | ${score} | ${mastery} | ${bktEst} |\n`;
    }

    if (prog.notes.length > 0) {
      md += `\n### 📝 Student Lesson Notes\n\n`;
      for (const n of prog.notes) {
        const l = prog.lessons.find((les) => les.id === n.lessonId);
        md += `#### Lesson: ${l?.title || n.lessonId}\n${n.content}\n\n`;
      }
    }

    if (prog.annotations.length > 0) {
      md += `\n### 📌 Highlighted Annotations\n\n`;
      for (const a of prog.annotations) {
        md += `- *"${a.highlightedText}"*: **${a.note}**\n`;
      }
    }

    if (prog.finalAssessment) {
      md += `\n### 🏆 Final Assessment Outcome\n\n`;
      md += `- **Overall Score:** ${prog.finalAssessment.score}/10\n`;
      md += `- **Verified Mastery:** Level ${prog.finalAssessment.overallMastery}\n`;
      md += `- **Assessment Summary:** ${prog.finalAssessment.summary}\n`;
    }

    md += `\n### ⏳ Spaced Repetition Maintenance (FSRS Schedule)\n\n`;
    for (const l of prog.lessons) {
      const fsrs = FSRSScheduler.getConceptRecord(studentUserId, l.subskillId);
      md += `- **${l.title}**: Next review due on \`${fsrs.nextReviewAt.split("T")[0]}\` (Stability: ${fsrs.stability} days, Retrievability: ${Math.round(fsrs.retrievability * 100)}%)\n`;
    }

    md += `\n---\n*Generated by ASTRION Adaptive Mentorship Engine · MentorMaze by AI Tathastu*\n`;

    return md;
  }
}
