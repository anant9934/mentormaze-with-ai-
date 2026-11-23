import { pgTable, varchar, text, integer, real, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 1. AI Mentor Conversations
export const aiMentorConversations = pgTable(
  "ai_mentor_conversations",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    mode: varchar("mode", { length: 32 }).notNull().default("learn"),
    activeTopic: varchar("active_topic", { length: 64 }).notNull().default("general"),
    languagePreference: varchar("language_preference", { length: 16 }).notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentIdx: index("idx_ai_mentor_conv_student").on(table.studentUserId),
    updatedAtIdx: index("idx_ai_mentor_conv_updated").on(table.updatedAt),
  })
);

// 2. AI Mentor Messages
export const aiMentorMessages = pgTable(
  "ai_mentor_messages",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    conversationId: varchar("conversation_id", { length: 64 })
      .notNull()
      .references(() => aiMentorConversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(), // 'user' | 'assistant' | 'system'
    content: text("content").notNull(),
    teachingStrategy: varchar("teaching_strategy", { length: 64 }),
    hintLevel: integer("hint_level").default(0),
    difficulty: varchar("difficulty", { length: 32 }).default("intermediate"),
    studentUnderstandingSignal: varchar("student_understanding_signal", { length: 32 }),
    sources: jsonb("sources").default([]),
    recommendedActions: jsonb("recommended_actions").default([]),
    latencyMs: real("latency_ms").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    convIdx: index("idx_ai_mentor_msg_conv").on(table.conversationId),
    createdIdx: index("idx_ai_mentor_msg_created").on(table.createdAt),
  })
);

// 3. Student Learning Profiles
export const studentLearningProfiles = pgTable(
  "student_learning_profiles",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).unique().notNull(),
    preferredLanguage: varchar("preferred_language", { length: 16 }).notNull().default("en"),
    preferredPacing: varchar("preferred_pacing", { length: 32 }).default("balanced"),
    targetRole: varchar("target_role", { length: 128 }).default("Software Development Engineer (SDE-1)"),
    targetGraduationYear: integer("target_graduation_year").default(2026),
    currentLevel: varchar("current_level", { length: 32 }).default("intermediate"),
    learningStyle: varchar("learning_style", { length: 64 }).default("hands_on_problem_solving"),
    institution: varchar("institution", { length: 255 }),
    degree: varchar("degree", { length: 255 }),
    confirmedStrengths: jsonb("confirmed_strengths").default([]),
    confirmedWeaknesses: jsonb("confirmed_weaknesses").default([]),
    systemHypotheses: jsonb("system_hypotheses").default([]),
    learningGoals: jsonb("learning_goals").default([]),
    consentScope: jsonb("consent_scope").default({
      shareWithMentors: true,
      useForPersonalization: true,
      retentionDays: 365,
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentIdx: index("idx_student_learning_prof_user").on(table.studentUserId),
  })
);

// 4. Student Skill Graph Nodes
export const studentSkillNodes = pgTable(
  "student_skill_nodes",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    skillId: varchar("skill_id", { length: 64 }).notNull(),
    parentSkillId: varchar("parent_skill_id", { length: 64 }),
    skillName: varchar("skill_name", { length: 128 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    masteryState: varchar("mastery_state", { length: 32 }).notNull().default("not_assessed"),
    masteryScore: real("mastery_score").default(0.0),
    confidence: real("confidence").default(0.5),
    assessmentCount: integer("assessment_count").default(0),
    successCount: integer("success_count").default(0),
    knownWeaknesses: jsonb("known_weaknesses").default([]),
    commonMisconceptions: jsonb("common_misconceptions").default([]),
    evidenceType: varchar("evidence_type", { length: 32 }).default("self_reported"),
    isIndependentlyVerified: boolean("is_independently_verified").default(false),
    evidenceSource: text("evidence_source"),
    evidenceId: varchar("evidence_id", { length: 64 }),
    lastAssessedAt: timestamp("last_assessed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentSkillIdx: index("idx_student_skill_user_id").on(table.studentUserId, table.skillId),
  })
);

// 5. Skill Dependency Graph
export const studentSkillDependencies = pgTable("student_skill_dependencies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  skillId: varchar("skill_id", { length: 64 }).notNull(),
  prerequisiteSkillId: varchar("prerequisite_skill_id", { length: 64 }).notNull(),
  dependencyType: varchar("dependency_type", { length: 32 }).default("hard_prerequisite"),
  minPrerequisiteState: varchar("min_prerequisite_state", { length: 32 }).default("demonstrated"),
});

// 6. Skill Assessment Evidence
export const studentSkillEvidence = pgTable(
  "student_skill_evidence",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    skillId: varchar("skill_id", { length: 64 }).notNull(),
    assessmentType: varchar("assessment_type", { length: 64 }).notNull(),
    score: real("score").notNull(),
    feedback: text("feedback"),
    sourceRef: varchar("source_ref", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentIdx: index("idx_skill_evidence_student").on(table.studentUserId),
  })
);

// 7. Student Memory (Structured Context)
export const studentMemory = pgTable(
  "student_memory",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    key: varchar("key", { length: 128 }).notNull(),
    value: text("value").notNull(),
    confidence: real("confidence").default(1.0),
    provenance: varchar("provenance", { length: 64 }).default("student_reported"),
    isTemporary: boolean("is_temporary").default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentIdx: index("idx_student_memory_user").on(table.studentUserId),
    categoryIdx: index("idx_student_memory_category").on(table.studentUserId, table.category),
  })
);

// 8. AI Mentor Roadmaps
export const aiMentorRoadmaps = pgTable(
  "ai_mentor_roadmaps",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    goalId: varchar("goal_id", { length: 64 }),
    targetRole: varchar("target_role", { length: 128 }).notNull(),
    currentLevel: varchar("current_level", { length: 64 }).default("intermediate"),
    targetTimelineWeeks: integer("target_timeline_weeks").default(24),
    progressPct: integer("progress_pct").default(0),
    status: varchar("status", { length: 32 }).default("active"),
    adaptedReason: text("adapted_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentIdx: index("idx_ai_roadmaps_student").on(table.studentUserId),
    goalIdx: index("idx_ai_roadmaps_goal").on(table.goalId),
    oneActiveRoadmapPerGoal: uniqueIndex("idx_one_active_roadmap_per_goal")
      .on(table.goalId)
      .where(sql`status = 'active'`),
  })
);

// 9. Roadmap Milestones
export const aiMentorRoadmapMilestones = pgTable("ai_mentor_roadmap_milestones", {
  id: varchar("id", { length: 64 }).primaryKey(),
  roadmapId: varchar("roadmap_id", { length: 64 }).references(() => aiMentorRoadmaps.id),
  weekNumber: integer("week_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  skillsCovered: jsonb("skills_covered").default([]),
  status: varchar("status", { length: 32 }).default("pending"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  studentConfirmation: boolean("student_confirmation").default(false).notNull(),
  evidenceRef: text("evidence_ref"),
  deliverableUrl: varchar("deliverable_url", { length: 255 }),
  assessmentNotes: text("assessment_notes"),
  successCriteria: jsonb("success_criteria").default([]),
  provenance: varchar("provenance", { length: 64 }).default("student_confirmed").notNull(),
});

// 10. Knowledge Sources
export const knowledgeSources = pgTable("knowledge_sources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  collection: varchar("collection", { length: 64 }).notNull(),
  publisher: varchar("publisher", { length: 128 }).notNull(),
  urlOrId: varchar("url_or_id", { length: 255 }),
  license: varchar("license", { length: 64 }).notNull(),
  accessScope: varchar("access_scope", { length: 32 }).default("public"),
  documentCount: integer("document_count").default(0),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 11. Knowledge Documents
export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sourceId: varchar("source_id", { length: 64 }).references(() => knowledgeSources.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").default({}),
  chunkCount: integer("chunk_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 12. Knowledge Chunks
export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  documentId: varchar("document_id", { length: 64 }).references(() => knowledgeDocuments.id),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").default({}),
  tokenCount: integer("token_count").default(0),
});

// 13. Dataset Registry
export const datasetRegistry = pgTable("dataset_registry", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  publisher: varchar("publisher", { length: 128 }).notNull(),
  canonicalUrl: varchar("canonical_url", { length: 255 }),
  version: varchar("version", { length: 32 }).notNull(),
  license: varchar("license", { length: 64 }).notNull(),
  commercialAllowed: boolean("commercial_allowed").default(false),
  piiStatus: varchar("pii_status", { length: 64 }).default("unverified"),
  intendedUse: varchar("intended_use", { length: 64 }).default("evaluation"),
  approvalStatus: varchar("approval_status", { length: 32 }).default("pending_review"),
  recordCount: integer("record_count").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 14. Job Descriptions
export const jobDescriptions = pgTable("job_descriptions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  company: varchar("company", { length: 128 }).notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  jobFamily: varchar("job_family", { length: 64 }).notNull(),
  department: varchar("department", { length: 64 }),
  location: varchar("location", { length: 128 }).notNull(),
  experienceReq: varchar("experience_req", { length: 64 }).notNull(),
  educationReq: varchar("education_req", { length: 128 }),
  mustHaveSkills: jsonb("must_have_skills").default([]),
  preferredSkills: jsonb("preferred_skills").default([]),
  toolsTech: jsonb("tools_tech").default([]),
  responsibilities: jsonb("responsibilities").default([]),
  seniority: varchar("seniority", { length: 32 }).default("mid"),
  employmentType: varchar("employment_type", { length: 32 }).default("full_time"),
  salaryRange: varchar("salary_range", { length: 64 }),
  sourceUrl: varchar("source_url", { length: 255 }),
  isVerified: boolean("is_verified").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 15. AI Evaluation Cases
export const aiEvaluationCases = pgTable("ai_evaluation_cases", {
  id: varchar("id", { length: 64 }).primaryKey(),
  benchmarkSuite: varchar("benchmark_suite", { length: 64 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  topic: varchar("topic", { length: 128 }).notNull(),
  difficulty: varchar("difficulty", { length: 32 }).notNull(),
  prompt: text("prompt").notNull(),
  expectedCriteria: jsonb("expected_criteria").notNull(),
  holdoutSplit: varchar("holdout_split", { length: 32 }).default("test"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 16. AI Evaluation Runs
export const aiEvaluationRuns = pgTable("ai_evaluation_runs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  suiteName: varchar("suite_name", { length: 64 }).notNull(),
  modelName: varchar("model_name", { length: 64 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  totalCases: integer("total_cases").notNull(),
  technicalAccuracyScore: real("technical_accuracy_score").notNull(),
  socraticQuotientScore: real("socratic_quotient_score").notNull(),
  hallucinationRate: real("hallucination_rate").notNull(),
  avgLatencyMs: real("avg_latency_ms").notNull(),
  status: varchar("status", { length: 32 }).default("completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 17. AI Pedagogical Feedback
export const aiFeedback = pgTable(
  "ai_feedback",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    conversationId: varchar("conversation_id", { length: 64 }),
    messageId: varchar("message_id", { length: 64 }),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    rating: integer("rating").notNull(), // 1 for helpful, -1 for unhelpful
    feedbackType: varchar("feedback_type", { length: 64 }),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentIdx: index("idx_ai_feedback_student").on(table.studentUserId),
  })
);

// 18. Student Projects & Portfolio Intelligence (Phase 2)
export const studentProjects = pgTable(
  "student_projects",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    role: varchar("role", { length: 128 }),
    technologies: jsonb("technologies").default([]),
    outcomes: text("outcomes"),
    repositoryUrl: varchar("repository_url", { length: 255 }),
    liveUrl: varchar("live_url", { length: 255 }),
    sourceSystem: varchar("source_system", { length: 64 }).default("MentorMaze").notNull(),
    verificationStatus: varchar("verification_status", { length: 32 }).default("self_reported").notNull(),
    evidenceId: varchar("evidence_id", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentIdx: index("idx_student_projects_user").on(table.studentUserId),
  })
);

// 19. Student Intelligence Evidence & Provenance Ledger (Phase 2)
export const studentIntelligenceEvidence = pgTable(
  "student_intelligence_evidence",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 32 }).notNull(), // 'skill' | 'project' | 'goal' | 'experience' | 'fact'
    entityId: varchar("entity_id", { length: 128 }).notNull(),
    sourceType: varchar("source_type", { length: 32 }).notNull(), // 'student_reported' | 'mentor_verified' | 'assessment' | 'system_inferred' | 'external_connector'
    sourceSystem: varchar("source_system", { length: 64 }).default("MentorMaze").notNull(), // 'MentorMaze' | 'AITathastu' | 'Collaborate' | 'Avsar' | 'IRIS' | 'GitHub' | 'LeetCode'
    sourceReference: varchar("source_reference", { length: 255 }),
    evidenceType: varchar("evidence_type", { length: 32 }).notNull(), // 'self_reported' | 'extracted' | 'inferred' | 'assessed' | 'project_demonstrated' | 'independently_verified'
    confidence: real("confidence").default(0.5).notNull(),
    verificationStatus: varchar("verification_status", { length: 32 }).default("unverified").notNull(), // 'unverified' | 'student_confirmed' | 'mentor_verified' | 'independently_verified' | 'rejected'
    purpose: varchar("purpose", { length: 64 }).default("service_personalization").notNull(),
    consentReference: varchar("consent_reference", { length: 64 }),
    observedAt: timestamp("observed_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentEntityIdx: index("idx_evidence_student_entity").on(table.studentUserId, table.entityType, table.entityId),
    studentTypeIdx: index("idx_evidence_student_type").on(table.studentUserId, table.evidenceType),
  })
);

// 20. Purpose-Specific Consent Ledger (Phase 2)
export const studentPurposeConsents = pgTable(
  "student_purpose_consents",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    purpose: varchar("purpose", { length: 64 }).notNull(), // 'service_personalization' | 'student_memory' | 'external_data_integration' | 'external_llm_processing' | 'model_training' | 'mentor_sharing' | 'analytics_evaluation'
    isGranted: boolean("is_granted").default(true).notNull(),
    consentVersion: varchar("consent_version", { length: 32 }).default("1.0").notNull(),
    consentEpoch: integer("consent_epoch").default(1).notNull(),
    auditNotes: text("audit_notes"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentPurposeIdx: index("idx_student_purpose_lookup").on(table.studentUserId, table.purpose, table.isGranted),
  })
);

// 21. Persistent Student Goals (Goal-Centric Mentorship Architecture)
export const aiMentorGoals = pgTable(
  "ai_mentor_goals",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 64 }).notNull().default("career"), // 'academic' | 'career' | 'technical_skill' | 'project' | 'research' | 'personal_learning' | 'other'
    importance: varchar("importance", { length: 32 }).notNull().default("primary"), // 'primary' | 'secondary' | 'exploratory'
    status: varchar("status", { length: 32 }).notNull().default("active"), // 'active' | 'paused' | 'completed' | 'abandoned'
    targetOutcome: text("target_outcome"),
    targetDate: varchar("target_date", { length: 64 }),
    currentState: varchar("current_state", { length: 32 }).notNull().default("in_progress"), // 'not_started' | 'in_progress' | 'blocked' | 'achieving'
    successCriteria: jsonb("success_criteria").default([]),
    associatedSkills: jsonb("associated_skills").default([]),
    associatedProjects: jsonb("associated_projects").default([]),
    roadmapId: varchar("roadmap_id", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentGoalIdx: index("idx_ai_mentor_goals_student").on(table.studentUserId),
    studentGoalStatusIdx: index("idx_ai_mentor_goals_status").on(table.studentUserId, table.status),
  })
);

// 22. AI Mentor Check-In Preferences (Phase 4.1.1)
export const aiMentorCheckinPreferences = pgTable(
  "ai_mentor_checkin_preferences",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).unique().notNull(),
    cadence: varchar("cadence", { length: 32 }).notNull().default("weekly"), // 'daily' | 'weekly' | 'paused'
    preferredHour: integer("preferred_hour").notNull().default(10),
    timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Kolkata"),
    quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentCheckinPrefIdx: index("idx_ai_mentor_checkin_prefs_student").on(table.studentUserId),
  })
);

// 23. AI Mentor Dedicated Check-In Records (Phase 4.1.1)
export const aiMentorCheckinRecords = pgTable(
  "ai_mentor_checkin_records",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    checkinType: varchar("checkin_type", { length: 32 }).notNull().default("session_checkin"), // 'session_checkin' | 'daily' | 'weekly' | 'milestone_reflection'
    goalId: varchar("goal_id", { length: 64 }),
    roadmapId: varchar("roadmap_id", { length: 64 }),
    milestoneId: varchar("milestone_id", { length: 64 }),
    studentResponse: text("student_response"),
    progressSummary: text("progress_summary"),
    blockers: text("blockers"),
    notes: text("notes"),
    provenance: varchar("provenance", { length: 64 }).notNull().default("student_reported"),
    consentReference: varchar("consent_reference", { length: 64 }).default("mentorship_checkins"),
    observedAt: timestamp("observed_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    studentCheckinRecIdx: index("idx_ai_mentor_checkin_rec_student").on(table.studentUserId),
    goalCheckinRecIdx: index("idx_ai_mentor_checkin_rec_goal").on(table.goalId),
    observedCheckinRecIdx: index("idx_ai_mentor_checkin_rec_observed").on(table.observedAt),
  })
);

// 24. Mentorship Intelligence Bridge Shares (Part 5)
export const mentorshipBridgeShares = pgTable(
  "mentorship_bridge_shares",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentUserId: varchar("student_user_id", { length: 64 }).notNull(),
    mentorProfileId: varchar("mentor_profile_id", { length: 64 }),
    bookingId: varchar("booking_id", { length: 64 }),
    timeframe: varchar("timeframe", { length: 32 }).notNull().default("30_days"), // 'session' | '7_days' | '30_days' | 'custom'
    selectedConversationIds: jsonb("selected_conversation_ids").default([]),
    studentBackground: jsonb("student_background").default({}),
    mentoringHistory: jsonb("mentoring_history").default([]),
    currentChallenges: jsonb("current_challenges").default([]),
    progressAndEvidence: jsonb("progress_and_evidence").default([]),
    developmentAreas: jsonb("development_areas").default([]),
    mentoringObjectives: jsonb("mentoring_objectives").default([]),
    questionsForMentor: jsonb("questions_for_mentor").default([]),
    studentNote: text("student_note"),
    status: varchar("status", { length: 32 }).notNull().default("draft"), // 'draft' | 'shared' | 'revoked' | 'expired'
    sharePurpose: varchar("share_purpose", { length: 64 }).notNull().default("session_preparation"),
    consentReference: varchar("consent_reference", { length: 64 }).default("mentorship_bridge_share"),
    sharedAt: timestamp("shared_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    accessAuditLogs: jsonb("access_audit_logs").default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    bridgeStudentIdx: index("idx_bridge_shares_student").on(table.studentUserId),
    bridgeMentorIdx: index("idx_bridge_shares_mentor").on(table.mentorProfileId),
    bridgeBookingIdx: index("idx_bridge_shares_booking").on(table.bookingId),
    bridgeStatusIdx: index("idx_bridge_shares_status").on(table.status),
  })
);



