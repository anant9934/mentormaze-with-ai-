/**
 * ASTRION Student Goal Management Service
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Identity: ASTRION (Adaptive Strategic Intelligence & Reasoning Network)
 * Core: Goal-Centric Mentorship Lifecycle
 */

import { getDb } from "../../db";
import { aiMentorGoals, studentLearningProfiles, studentIntelligenceEvidence } from "../../db/ai-mentor-schema";
import { eq, and, ne } from "drizzle-orm";

export type GoalCategory =
  | "academic"
  | "career"
  | "technical_skill"
  | "project"
  | "research"
  | "personal_learning"
  | "other";

export type GoalImportance = "primary" | "secondary" | "exploratory";

export type GoalStatus = "active" | "paused" | "completed" | "abandoned";

export type GoalCurrentState = "not_started" | "in_progress" | "blocked" | "achieved" | "achieving";

export interface StudentGoalRecord {
  id: string;
  studentUserId: string;
  title: string;
  description: string;
  category: GoalCategory;
  importance: GoalImportance;
  status: GoalStatus;
  targetOutcome: string;
  targetDate?: string;
  currentState: GoalCurrentState;
  successCriteria: string[];
  associatedSkills: string[];
  associatedProjects: string[];
  roadmapId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  category?: GoalCategory;
  importance?: GoalImportance;
  targetOutcome?: string;
  targetDate?: string;
  currentState?: GoalCurrentState;
  successCriteria?: string[];
  associatedSkills?: string[];
  associatedProjects?: string[];
  roadmapId?: string;
}

export interface GoalConflictReport {
  hasConflicts: boolean;
  conflictingGoals: { id: string; title: string; category: string }[];
  tradeOffAnalysis: string[];
  recommendedResolution: string;
  studentDeclaredAvailableHoursPerWeek?: number;
  totalEstimatedWeeklyEffortHours?: number;
  isWorkloadOverCapacity?: boolean;
  workloadBreakdown?: { goalId: string; title: string; estimatedWeeklyEffortHours: number }[];
}

export class StudentGoalService {
  // In-memory low-latency synchronized cache: studentUserId -> Map<goalId, StudentGoalRecord>
  private static goalsCache: Map<string, Map<string, StudentGoalRecord>> = new Map();

  public static resetCache(): void {
    this.goalsCache.clear();
  }

  public static reset(): void {
    this.resetCache();
  }

  /**
   * Ownership / Cross-tenant privacy guard
   */
  private static validateAccess(studentUserId: string, requestingUserId?: string): void {
    if (
      requestingUserId &&
      requestingUserId !== studentUserId &&
      !requestingUserId.startsWith("mentor-") &&
      requestingUserId !== "admin"
    ) {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's goals.");
    }
  }

  /**
   * Create a new student goal
   */
  public static async createGoal(
    studentUserId: string,
    input: CreateGoalInput,
    requestingUserId?: string
  ): Promise<StudentGoalRecord> {
    this.validateAccess(studentUserId, requestingUserId);

    const now = new Date();
    const id = `goal-${studentUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const category: GoalCategory = input.category || "career";
    const importance: GoalImportance = input.importance || "primary";

    const record: StudentGoalRecord = {
      id,
      studentUserId,
      title: input.title.trim(),
      description: input.description?.trim() || "",
      category,
      importance,
      status: "active",
      targetOutcome: input.targetOutcome?.trim() || `Achieve proficiency and success in ${input.title.trim()}`,
      targetDate: input.targetDate,
      currentState: input.currentState || "in_progress",
      successCriteria: input.successCriteria || [
        `Demonstrate assessed mastery in core competencies for ${input.title.trim()}`,
        "Complete at least one verified end-to-end milestone project",
      ],
      associatedSkills: input.associatedSkills || [],
      associatedProjects: input.associatedProjects || [],
      roadmapId: input.roadmapId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Update in-memory cache
    if (!this.goalsCache.has(studentUserId)) {
      this.goalsCache.set(studentUserId, new Map());
    }

    // If marked primary, optionally demote existing primary of same category to secondary
    if (importance === "primary") {
      const userGoals = this.goalsCache.get(studentUserId)!;
      for (const [, existing] of userGoals.entries()) {
        if (existing.status === "active" && existing.importance === "primary" && existing.id !== id) {
          existing.importance = "secondary";
          existing.updatedAt = now.toISOString();
        }
      }
    }

    this.goalsCache.get(studentUserId)!.set(id, record);

    // Persist to SQL
    try {
      const db = getDb();
      await db.insert(aiMentorGoals).values({
        id: record.id,
        studentUserId: record.studentUserId,
        title: record.title,
        description: record.description || null,
        category: record.category,
        importance: record.importance,
        status: record.status,
        targetOutcome: record.targetOutcome || null,
        targetDate: record.targetDate || null,
        currentState: record.currentState,
        successCriteria: record.successCriteria,
        associatedSkills: record.associatedSkills,
        associatedProjects: record.associatedProjects,
        roadmapId: record.roadmapId || null,
        createdAt: now,
        updatedAt: now,
      });

      // Also record in immutable evidence ledger
      await db.insert(studentIntelligenceEvidence).values({
        id: `ev-${id}`,
        studentUserId,
        entityType: "goal",
        entityId: id,
        sourceType: "student_reported",
        sourceSystem: "MentorMaze",
        sourceReference: "student_declared_goal",
        evidenceType: "self_reported",
        confidence: 0.9,
        verificationStatus: "student_confirmed",
        purpose: "service_personalization",
        observedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentGoalService] SQL insert goal error:", err?.message || err);
      }
    }

    return record;
  }

  /**
   * Retrieve all goals for a student with optional status filtering
   */
  public static async getGoals(
    studentUserId: string,
    filter?: { status?: GoalStatus; category?: GoalCategory },
    requestingUserId?: string
  ): Promise<StudentGoalRecord[]> {
    this.validateAccess(studentUserId, requestingUserId);

    // 1. Check in-memory cache
    if (this.goalsCache.has(studentUserId)) {
      let list = Array.from(this.goalsCache.get(studentUserId)!.values());
      if (filter?.status) {
        list = list.filter((g) => g.status === filter.status);
      }
      if (filter?.category) {
        list = list.filter((g) => g.category === filter.category);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // 2. Query SQL
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(aiMentorGoals)
        .where(eq(aiMentorGoals.studentUserId, studentUserId));

      const records: StudentGoalRecord[] = [];
      const userMap = new Map<string, StudentGoalRecord>();

      for (const row of rows) {
        const record: StudentGoalRecord = {
          id: row.id,
          studentUserId: row.studentUserId,
          title: row.title,
          description: row.description || "",
          category: row.category as GoalCategory,
          importance: row.importance as GoalImportance,
          status: row.status as GoalStatus,
          targetOutcome: row.targetOutcome || "",
          targetDate: row.targetDate || undefined,
          currentState: row.currentState as GoalCurrentState,
          successCriteria: (row.successCriteria as string[]) || [],
          associatedSkills: (row.associatedSkills as string[]) || [],
          associatedProjects: (row.associatedProjects as string[]) || [],
          roadmapId: row.roadmapId || undefined,
          createdAt: new Date(row.createdAt).toISOString(),
          updatedAt: new Date(row.updatedAt).toISOString(),
        };
        userMap.set(row.id, record);
        records.push(record);
      }

      this.goalsCache.set(studentUserId, userMap);

      let filtered = records;
      if (filter?.status) {
        filtered = filtered.filter((g) => g.status === filter.status);
      }
      if (filter?.category) {
        filtered = filtered.filter((g) => g.category === filter.category);
      }
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentGoalService] SQL getGoals error:", err?.message || err);
      }
      return [];
    }
  }

  /**
   * Retrieve active primary goal for a student
   */
  public static async getActivePrimaryGoal(
    studentUserId: string,
    requestingUserId?: string
  ): Promise<StudentGoalRecord | null> {
    const goals = await this.getGoals(studentUserId, { status: "active" }, requestingUserId);
    const primary = goals.find((g) => g.importance === "primary");
    return primary || goals[0] || null;
  }

  /**
   * Synchronously retrieve active primary goal from in-memory cache
   */
  public static getActivePrimaryGoalSync(
    studentUserId: string,
    requestingUserId?: string
  ): StudentGoalRecord | null {
    this.validateAccess(studentUserId, requestingUserId);
    const userGoals = this.goalsCache.get(studentUserId);
    if (!userGoals || userGoals.size === 0) return null;
    const list = Array.from(userGoals.values()).filter((g) => g.status === "active");
    const primary = list.find((g) => g.importance === "primary");
    return primary || list[0] || null;
  }

  /**
   * Retrieve single goal by ID
   */
  public static async getGoalById(
    studentUserId: string,
    goalId: string,
    requestingUserId?: string
  ): Promise<StudentGoalRecord | null> {
    this.validateAccess(studentUserId, requestingUserId);
    const goals = await this.getGoals(studentUserId, undefined, requestingUserId);
    return goals.find((g) => g.id === goalId) || null;
  }

  /**
   * Update goal details
   */
  public static async updateGoal(
    studentUserId: string,
    goalId: string,
    updates: Partial<CreateGoalInput & { status?: GoalStatus; currentState?: GoalCurrentState; roadmapId?: string }>,
    requestingUserId?: string
  ): Promise<StudentGoalRecord> {
    this.validateAccess(studentUserId, requestingUserId);

    const goal = await this.getGoalById(studentUserId, goalId, requestingUserId);
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    const now = new Date();
    if (updates.title !== undefined) goal.title = updates.title.trim();
    if (updates.description !== undefined) goal.description = updates.description.trim();
    if (updates.category !== undefined) goal.category = updates.category;
    if (updates.importance !== undefined) goal.importance = updates.importance;
    if (updates.status !== undefined) goal.status = updates.status;
    if (updates.targetOutcome !== undefined) goal.targetOutcome = updates.targetOutcome;
    if (updates.targetDate !== undefined) goal.targetDate = updates.targetDate;
    if (updates.currentState !== undefined) goal.currentState = updates.currentState;
    if (updates.successCriteria !== undefined) goal.successCriteria = updates.successCriteria;
    if (updates.associatedSkills !== undefined) goal.associatedSkills = updates.associatedSkills;
    if (updates.associatedProjects !== undefined) goal.associatedProjects = updates.associatedProjects;
    if (updates.roadmapId !== undefined) goal.roadmapId = updates.roadmapId;
    goal.updatedAt = now.toISOString();

    // Persist cache
    if (!this.goalsCache.has(studentUserId)) {
      this.goalsCache.set(studentUserId, new Map());
    }
    this.goalsCache.get(studentUserId)!.set(goalId, goal);

    // Persist SQL
    try {
      const db = getDb();
      await db
        .update(aiMentorGoals)
        .set({
          title: goal.title,
          description: goal.description,
          category: goal.category,
          importance: goal.importance,
          status: goal.status,
          targetOutcome: goal.targetOutcome,
          targetDate: goal.targetDate || null,
          currentState: goal.currentState,
          successCriteria: goal.successCriteria,
          associatedSkills: goal.associatedSkills,
          associatedProjects: goal.associatedProjects,
          roadmapId: goal.roadmapId || null,
          updatedAt: now,
        })
        .where(and(eq(aiMentorGoals.id, goalId), eq(aiMentorGoals.studentUserId, studentUserId)));
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentGoalService] SQL updateGoal error:", err?.message || err);
      }
    }

    return goal;
  }

  /**
   * Transition goal status (active, paused, completed, abandoned)
   */
  public static async updateGoalStatus(
    studentUserId: string,
    goalId: string,
    status: GoalStatus,
    reason?: string,
    requestingUserId?: string
  ): Promise<StudentGoalRecord> {
    const validStatuses: GoalStatus[] = ["active", "paused", "completed", "abandoned"];
    if (!validStatuses.includes(status)) {
      throw new Error(`400_BAD_REQUEST: Invalid goal status '${status}'. Must be one of: ${validStatuses.join(", ")}`);
    }

    const currentGoal = await this.getGoalById(studentUserId, goalId, requestingUserId);
    if (!currentGoal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    // State transition guards
    if (currentGoal.status === "completed" && status === "paused") {
      throw new Error("400_BAD_REQUEST: Cannot pause an already completed goal. Reopen it to 'active' first.");
    }
    if (currentGoal.status === "abandoned" && status === "completed") {
      throw new Error("400_BAD_REQUEST: Cannot directly complete an abandoned goal. Restore it to 'active' first.");
    }

    return this.updateGoal(
      studentUserId,
      goalId,
      {
        status,
        description: reason ? `${reason}` : undefined,
        currentState: status === "completed" ? "achieved" : status === "paused" ? "blocked" : "in_progress",
      },
      requestingUserId
    );
  }

  /**
   * Set goal priority / importance without silent overwrite
   */
  public static async setGoalPriority(
    studentUserId: string,
    goalId: string,
    importance: GoalImportance,
    requestingUserId?: string
  ): Promise<StudentGoalRecord> {
    this.validateAccess(studentUserId, requestingUserId);

    const goals = await this.getGoals(studentUserId, undefined, requestingUserId);
    const target = goals.find((g) => g.id === goalId);
    if (!target) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    // If making this goal primary, demote other active primary goals atomically
    if (importance === "primary") {
      try {
        const db = getDb();
        await db
          .update(aiMentorGoals)
          .set({ importance: "secondary", updatedAt: new Date() })
          .where(
            and(
              eq(aiMentorGoals.studentUserId, studentUserId),
              eq(aiMentorGoals.importance, "primary"),
              ne(aiMentorGoals.id, goalId)
            )
          );
      } catch (err: any) {
        if (err?.code !== "42P01") {
          console.warn("[StudentGoalService] SQL demote primary goals error:", err?.message || err);
        }
      }

      for (const g of goals) {
        if (g.id !== goalId && g.importance === "primary" && g.status === "active") {
          g.importance = "secondary";
          g.updatedAt = new Date().toISOString();
        }
      }
    }

    target.importance = importance;
    target.updatedAt = new Date().toISOString();

    return this.updateGoal(studentUserId, goalId, { importance }, requestingUserId);
  }

  /**
   * Alias for getGoals for backwards and external caller compatibility
   */
  public static async getStudentGoals(
    studentUserId: string,
    filter?: { status?: GoalStatus; category?: GoalCategory },
    requestingUserId?: string
  ): Promise<StudentGoalRecord[]> {
    return this.getGoals(studentUserId, filter, requestingUserId);
  }

  /**
   * Detect conflicting goals and formulate trade-off explanations with personalized workload management
   */
  public static async detectGoalConflicts(
    studentUserId: string,
    requestingUserIdOrOptions?: string | { availableHoursPerWeek?: number; configurableWorkloadLimit?: number },
    options?: { availableHoursPerWeek?: number; configurableWorkloadLimit?: number }
  ): Promise<GoalConflictReport> {
    const requestingUserId = typeof requestingUserIdOrOptions === "string" ? requestingUserIdOrOptions : studentUserId;
    const effectiveOptions = typeof requestingUserIdOrOptions === "object" ? requestingUserIdOrOptions : options;

    this.validateAccess(studentUserId, requestingUserId);
    const activeGoals = await this.getGoals(studentUserId, { status: "active" }, requestingUserId);

    const activePrimary = activeGoals.filter((g) => g.importance === "primary");
    const conflicts: { id: string; title: string; category: string }[] = [];
    const tradeOffs: string[] = [];

    // Check 1: Multiple primary goals
    if (activePrimary.length > 1) {
      conflicts.push(...activePrimary.map((g) => ({ id: g.id, title: g.title, category: g.category })));
      tradeOffs.push(
        `You currently have ${activePrimary.length} goals marked as 'Primary' (${activePrimary.map((g) => `'${g.title}'`).join(" and ")}). Pursuing multiple primary goals simultaneously divides weekly study capacity and slows milestone momentum.`
      );
    }

    // Check 2: Divergent technical disciplines (e.g., Deep Learning vs Low-Level Systems)
    const titles = activeGoals.map((g) => g.title.toLowerCase());
    const hasML = titles.some((t) => t.includes("machine learning") || t.includes("data science") || t.includes("ai"));
    const hasSys = titles.some((t) => t.includes("distributed systems") || t.includes("operating systems") || t.includes("embedded"));

    if (hasML && hasSys) {
      const mlGoal = activeGoals.find((g) => g.title.toLowerCase().includes("machine learning") || g.title.toLowerCase().includes("ai"))!;
      const sysGoal = activeGoals.find((g) => g.title.toLowerCase().includes("distributed") || g.title.toLowerCase().includes("systems"))!;
      if (!conflicts.some((c) => c.id === mlGoal.id)) conflicts.push({ id: mlGoal.id, title: mlGoal.title, category: mlGoal.category });
      if (!conflicts.some((c) => c.id === sysGoal.id)) conflicts.push({ id: sysGoal.id, title: sysGoal.title, category: sysGoal.category });

      tradeOffs.push(
        "Machine Learning Engineering requires deep linear algebra, PyTorch, and model training optimizations, whereas Distributed Systems prioritizes consensus invariants (Raft/Paxos), networking, and storage engines. Splitting focus across both foundational paths simultaneously increases cognitive load."
      );
    }

    // Check 3: Personalized Workload Management (Student-Declared vs Estimated Effort)
    const declaredHours = effectiveOptions?.availableHoursPerWeek || effectiveOptions?.configurableWorkloadLimit || 15;
    const workloadBreakdown: { goalId: string; title: string; estimatedWeeklyEffortHours: number }[] = [];
    let totalEstimatedWeeklyEffort = 0;

    for (const g of activeGoals) {
      // Allocate personalized effort: primary goal 10-12h, secondary 6-8h, exploratory 4h
      let weeklyEffort = g.importance === "primary" ? 12 : g.importance === "secondary" ? 8 : 4;
      workloadBreakdown.push({
        goalId: g.id,
        title: g.title,
        estimatedWeeklyEffortHours: weeklyEffort,
      });
      totalEstimatedWeeklyEffort += weeklyEffort;
    }

    const isWorkloadOverCapacity = totalEstimatedWeeklyEffort > declaredHours;
    if (isWorkloadOverCapacity && activeGoals.length > 1) {
      conflicts.push(...activeGoals.map((g) => ({ id: g.id, title: g.title, category: g.category })));
      tradeOffs.push(
        `Your student-declared weekly capacity is ${declaredHours}h/week, but your active goals require an estimated total of ${totalEstimatedWeeklyEffort}h/week (${workloadBreakdown.map((w) => `${w.title}: ~${w.estimatedWeeklyEffortHours}h`).join(", ")}). Exceeding your declared availability risks burnout and diluted learning depth.`
      );
    }

    const hasConflicts = conflicts.length > 0;
    const recommendedResolution = hasConflicts
      ? "Recommend prioritizing one primary goal for the next 8-12 weeks while maintaining the other as secondary or exploratory with reduced weekly pacing."
      : "No conflicting goals detected. Current goal allocation supports balanced progress.";

    return {
      hasConflicts,
      conflictingGoals: conflicts,
      tradeOffAnalysis: tradeOffs,
      recommendedResolution,
      studentDeclaredAvailableHoursPerWeek: declaredHours,
      totalEstimatedWeeklyEffortHours: totalEstimatedWeeklyEffort,
      isWorkloadOverCapacity,
      workloadBreakdown,
    };
  }
}
