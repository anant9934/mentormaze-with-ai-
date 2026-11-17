import { pgTable, varchar, text, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./schema";

// 1. AI Mentor Conversations
export const aiMentorConversations = pgTable("ai_mentor_conversations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  studentUserId: varchar("student_user_id", { length: 64 }).references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  mode: varchar("mode", { length: 32 }).notNull().default("learn"),
  activeTopic: varchar("active_topic", { length: 64 }).notNull().default("general"),
  languagePreference: varchar("language_preference", { length: 16 }).notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. AI Mentor Messages
export const aiMentorMessages = pgTable("ai_mentor_messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversation_id", { length: 64 }).references(() => aiMentorConversations.id),
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
});

// 3. Student Learning Profiles
export const studentLearningProfiles = pgTable("student_learning_profiles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  studentUserId: varchar("student_user_id", { length: 64 }).references(() => users.id).unique(),
  preferredLanguage: varchar("preferred_language", { length: 16 }).notNull().default("en"),
  preferredPacing: varchar("preferred_pacing", { length: 32 }).default("balanced"),
  targetRole: varchar("target_role", { length: 128 }).default("Software Development Engineer (SDE-1)"),
  targetGraduationYear: integer("target_graduation_year").default(2026),
  currentLevel: varchar("current_level", { length: 32 }).default("intermediate"),
  learningStyle: varchar("learning_style", { length: 64 }).default("hands_on_problem_solving"),
  consentScope: jsonb("consent_scope").default({
    shareWithMentors: true,
    useForPersonalization: true,
    retentionDays: 365,
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Student Skill Graph Nodes
export const studentSkillNodes = pgTable("student_skill_nodes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  studentUserId: varchar("student_user_id", { length: 64 }).references(() => users.id),
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
  lastAssessedAt: timestamp("last_assessed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Skill Dependency Graph
export const studentSkillDependencies = pgTable("student_skill_dependencies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  skillId: varchar("skill_id", { length: 64 }).notNull(),
  prerequisiteSkillId: varchar("prerequisite_skill_id", { length: 64 }).notNull(),
  dependencyType: varchar("dependency_type", { length: 32 }).default("hard_prerequisite"),
  minPrerequisiteState: varchar("min_prerequisite_state", { length: 32 }).default("demonstrated"),
});

// 6. Skill Assessment Evidence
export const studentSkillEvidence = pgTable("student_skill_evidence", {
  id: varchar("id", { length: 64 }).primaryKey(),
  studentUserId: varchar("student_user_id", { length: 64 }).references(() => users.id),
  skillId: varchar("skill_id", { length: 64 }).notNull(),
  assessmentType: varchar("assessment_type", { length: 64 }).notNull(),
  score: real("score").notNull(),
  feedback: text("feedback"),
  sourceRef: varchar("source_ref", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Student Memory (Structured Context)
export const studentMemory = pgTable("student_memory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  studentUserId: varchar("student_user_id", { length: 64 }).references(() => users.id),
  category: varchar("category", { length: 64 }).notNull(),
  key: varchar("key", { length: 128 }).notNull(),
  value: text("value").notNull(),
  confidence: real("confidence").default(1.0),
  provenance: varchar("provenance", { length: 64 }).default("student_reported"),
  isTemporary: boolean("is_temporary").default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. AI Mentor Roadmaps
export const aiMentorRoadmaps = pgTable("ai_mentor_roadmaps", {
  id: varchar("id", { length: 64 }).primaryKey(),
  studentUserId: varchar("student_user_id", { length: 64 }).references(() => users.id),
  targetRole: varchar("target_role", { length: 128 }).notNull(),
  currentLevel: varchar("current_level", { length: 64 }).notNull(),
  targetTimelineWeeks: integer("target_timeline_weeks").default(24),
  progressPct: integer("progress_pct").default(0),
  status: varchar("status", { length: 32 }).default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

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
export const aiFeedback = pgTable("ai_feedback", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversation_id", { length: 64 }),
  messageId: varchar("message_id", { length: 64 }),
  studentUserId: varchar("student_user_id", { length: 64 }).references(() => users.id),
  rating: integer("rating").notNull(), // 1 for helpful, -1 for unhelpful
  feedbackType: varchar("feedback_type", { length: 64 }),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
