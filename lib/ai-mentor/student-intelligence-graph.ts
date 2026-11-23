/**
 * ASTRION Student Intelligence Graph Engine
 * Consolidates skills, projects, learning evidence, and career trajectories with strict provenance and conflict resolution.
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { getDb } from "../db";
import {
  studentSkillNodes,
  studentSkillDependencies,
  studentIntelligenceEvidence,
  studentProjects,
  studentLearningProfiles,
  aiMentorRoadmaps,
  aiMentorRoadmapMilestones,
} from "../db/ai-mentor-schema";
import { eq, and, isNull, or, gt } from "drizzle-orm";
import { MasteryState, ProvenanceType } from "./types";

export type EvidenceClassification =
  | "self_reported"
  | "extracted"
  | "inferred"
  | "assessed"
  | "project_demonstrated"
  | "independently_verified";

export interface SkillNodeWithEvidence {
  skillId: string;
  skillName: string;
  category: string;
  masteryState: MasteryState;
  masteryScore: number; // 0.0 - 10.0
  confidence: number;   // 0.0 - 1.0
  evidenceType: EvidenceClassification;
  isIndependentlyVerified: boolean;
  evidenceSource: string;
  evidenceRef?: string;
  knownWeaknesses: string[];
  commonMisconceptions: string[];
  prerequisites: string[];
  lastAssessedAt?: string;
  lastVerifiedAt?: string;
}

export interface StudentProjectRecord {
  id: string;
  studentUserId: string;
  title: string;
  description: string;
  role: string;
  technologies: string[];
  outcomes: string;
  repositoryUrl?: string;
  liveUrl?: string;
  sourceSystem: string;
  verificationStatus: "self_reported" | "verified" | "inferred";
  evidenceId?: string;
  createdAt: string;
}

export interface CareerIntelligenceProfile {
  targetRole: string;
  currentLevel: string;
  graduationYear: number;
  identifiedSkillGaps: string[];
  targetTimelineWeeks: number;
  progressPct: number;
  activeMilestones: { weekNumber: number; title: string; status: string }[];
}

export interface StudentIntelligenceGraphData {
  studentUserId: string;
  displayName: string;
  email: string;
  institution: string;
  degree: string;
  graduationYear: number;
  profileCompletenessPct: number;
  skills: SkillNodeWithEvidence[];
  confirmedStrengths: string[];
  confirmedWeaknesses: string[];
  systemHypotheses: string[];
  projects: StudentProjectRecord[];
  career: CareerIntelligenceProfile;
  preferredLanguage?: string;
  lastUpdatedAt: string;
}

// Canonical Precedence Weights for Conflict Resolution
export const EVIDENCE_PRECEDENCE_WEIGHTS: Record<EvidenceClassification, number> = {
  independently_verified: 1.0,
  assessed: 0.9,
  project_demonstrated: 0.8,
  self_reported: 0.7,
  extracted: 0.6,
  inferred: 0.4,
};

export class StudentIntelligenceGraph {
  // In-memory cache for fast lookups
  private static graphStore: Map<string, StudentIntelligenceGraphData> = new Map();

  /**
   * Retrieves or constructs the consolidated Student Intelligence Graph
   */
  public static async getGraph(
    studentUserId: string,
    requestingUserId?: string
  ): Promise<StudentIntelligenceGraphData> {
    if (requestingUserId && requestingUserId !== studentUserId && !requestingUserId.startsWith("mentor-") && requestingUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's intelligence graph.");
    }

    if (this.graphStore.has(studentUserId)) {
      return this.graphStore.get(studentUserId)!;
    }

    // 1. Construct baseline graph from database or seeds
    const graph = await this.buildGraphFromPersistence(studentUserId);
    this.graphStore.set(studentUserId, graph);
    return graph;
  }

  /**
   * Build consolidated graph from SQL with durable persistence
   */
  private static async buildGraphFromPersistence(studentUserId: string): Promise<StudentIntelligenceGraphData> {
    const isStudent2 = studentUserId === "usr-student-2" || studentUserId === "user-student-2";
    const now = new Date();
    const nowIso = now.toISOString();

    const displayName = isStudent2 ? "Rahul Verma" : "Anant Kumar";
    const email = isStudent2 ? "rahul.verma@aitathastu.com" : "anant.kumar@aitathastu.com";
    let institution = isStudent2 ? "Thapar Institute of Engineering & Technology" : "Lovely Professional University (LPU)";
    let degree = isStudent2 ? "B.Tech in Artificial Intelligence & Data Science" : "B.Tech in Computer Science & Engineering";
    let graduationYear = 2026;
    let targetRole = isStudent2 ? "Associate AI & Machine Learning Engineer" : "Software Development Engineer (SDE-1)";
    let preferredLanguage = isStudent2 ? "hinglish" : "en";

    let confirmedStrengths = isStudent2
      ? ["Python Core & OOP", "Scikit-Learn Classification Pipelines", "FastAPI Service Architecture"]
      : ["TypeScript Asynchronous Programming", "Relational Database Indexing", "Arrays & Two-Pointers Algorithmic Scaffolding"];
    let confirmedWeaknesses = isStudent2
      ? ["PyTorch Tensor Operations", "High-Dimensional Vector Search Tuning"]
      : ["Dynamic Programming", "Distributed Consensus Protocol Quorums (Raft)"];
    let systemHypotheses = isStudent2
      ? ["Student may struggle with GPU out-of-memory errors in batch training"]
      : ["Student may prematurely implement greedy heuristics on DP problems"];
    let learningGoals = isStudent2
      ? ["Master PyTorch tensor broadcasting and CUDA memory optimization", "Build a production vLLM inference server"]
      : ["Master Dynamic Programming 2D memoization", "Design a distributed consensus cluster with Raft"];

    // 1. Query or Seed student_learning_profiles in SQL
    try {
      const db = getDb();
      const profileRows = await db
        .select()
        .from(studentLearningProfiles)
        .where(eq(studentLearningProfiles.studentUserId, studentUserId))
        .limit(1);

      if (profileRows && profileRows.length > 0) {
        const p = profileRows[0];
        if (p.institution) institution = p.institution;
        if (p.degree) degree = p.degree;
        if (p.targetGraduationYear) graduationYear = p.targetGraduationYear;
        if (p.targetRole) targetRole = p.targetRole;
        if (p.preferredLanguage) preferredLanguage = p.preferredLanguage;
        if (Array.isArray(p.confirmedStrengths) && p.confirmedStrengths.length > 0) confirmedStrengths = p.confirmedStrengths as string[];
        if (Array.isArray(p.confirmedWeaknesses) && p.confirmedWeaknesses.length > 0) confirmedWeaknesses = p.confirmedWeaknesses as string[];
        if (Array.isArray(p.systemHypotheses)) systemHypotheses = p.systemHypotheses as string[];
        if (Array.isArray(p.learningGoals) && p.learningGoals.length > 0) learningGoals = p.learningGoals as string[];
      } else {
        await db.insert(studentLearningProfiles).values({
          id: `slp-${studentUserId}`,
          studentUserId,
          preferredLanguage,
          targetRole,
          targetGraduationYear: graduationYear,
          institution,
          degree,
          confirmedStrengths,
          confirmedWeaknesses,
          systemHypotheses,
          learningGoals,
          updatedAt: now,
        });
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentIntelligenceGraph] Profile SQL query warning:", err?.message || err);
      }
    }

    // 2. Query or Seed student_skill_nodes in SQL
    let skills: SkillNodeWithEvidence[] = [];
    const defaultSkills: SkillNodeWithEvidence[] = isStudent2
      ? [
          {
            skillId: "python_core",
            skillName: "Python Core & Object-Oriented Architecture",
            category: "Programming",
            masteryState: "demonstrated",
            masteryScore: 8.8,
            confidence: 0.95,
            evidenceType: "assessed",
            isIndependentlyVerified: false,
            evidenceSource: "Tathastu Python Competency Exam",
            knownWeaknesses: ["Metaclasses and deep dunder operator overloading"],
            commonMisconceptions: ["Confusing shallow copy with deep copy in nested dictionaries"],
            prerequisites: [],
            lastAssessedAt: nowIso,
          },
          {
            skillId: "ml_fundamentals",
            skillName: "Machine Learning Foundations & Scikit-Learn",
            category: "AI & ML",
            masteryState: "demonstrated",
            masteryScore: 8.2,
            confidence: 0.9,
            evidenceType: "project_demonstrated",
            isIndependentlyVerified: false,
            evidenceSource: "Avsar Customer Churn Project",
            knownWeaknesses: ["Handling high-cardinality categorical encoding without target leakage"],
            commonMisconceptions: ["Assuming high training R^2 implies model generalizability without test split"],
            prerequisites: ["python_core"],
            lastAssessedAt: nowIso,
          },
          {
            skillId: "pytorch_tensors",
            skillName: "PyTorch & Deep Learning Tensors",
            category: "AI & ML",
            masteryState: "developing",
            masteryScore: 5.8,
            confidence: 0.8,
            evidenceType: "self_reported",
            isIndependentlyVerified: false,
            evidenceSource: "Student Self-Assessment",
            knownWeaknesses: ["Tensor dimension broadcasting, autograd computation graphs, GPU memory leaks"],
            commonMisconceptions: ["Forgetting tensor.detach() in evaluation inference loops"],
            prerequisites: ["python_core", "ml_fundamentals"],
            lastAssessedAt: nowIso,
          },
          {
            skillId: "vector_search",
            skillName: "Vector Databases & Semantic Embeddings",
            category: "AI & ML",
            masteryState: "developing",
            masteryScore: 6.2,
            confidence: 0.75,
            evidenceType: "inferred",
            isIndependentlyVerified: false,
            evidenceSource: "System Inferred from RAG search questions",
            knownWeaknesses: ["HNSW index tuning, cosine vs L2 distance metrics"],
            commonMisconceptions: ["Assuming higher dimension embeddings are universally more accurate"],
            prerequisites: ["ml_fundamentals"],
            lastAssessedAt: nowIso,
          },
        ]
      : [
          {
            skillId: "typescript_core",
            skillName: "TypeScript & Asynchronous Programming",
            category: "Programming",
            masteryState: "demonstrated",
            masteryScore: 8.5,
            confidence: 0.92,
            evidenceType: "independently_verified",
            isIndependentlyVerified: true,
            evidenceSource: "MentorMaze Placement Assessment",
            knownWeaknesses: ["Complex conditional distributive types"],
            commonMisconceptions: ["Confusing interface extension with type intersection"],
            prerequisites: [],
            lastAssessedAt: nowIso,
            lastVerifiedAt: nowIso,
          },
          {
            skillId: "arrays_strings",
            skillName: "Data Structures: Arrays, Two-Pointers & Sliding Window",
            category: "DSA",
            masteryState: "demonstrated",
            masteryScore: 8.4,
            confidence: 0.88,
            evidenceType: "assessed",
            isIndependentlyVerified: false,
            evidenceSource: "Technical Mock Interview with Priya Sharma",
            knownWeaknesses: ["Edge cases with negative values in two-sum variants"],
            commonMisconceptions: ["Assuming two-pointers works on unsorted collections without hashing"],
            prerequisites: [],
            lastAssessedAt: nowIso,
          },
          {
            skillId: "dynamic_programming",
            skillName: "Dynamic Programming: Memoization & Tabulation",
            category: "DSA",
            masteryState: "developing",
            masteryScore: 5.5,
            confidence: 0.85,
            evidenceType: "assessed",
            isIndependentlyVerified: false,
            evidenceSource: "Technical Mock Interview with Priya Sharma",
            knownWeaknesses: ["0/1 Knapsack state transition and 1D space optimization"],
            commonMisconceptions: ["Assuming greedy strategy gives optimal solution for unbounded knapsack"],
            prerequisites: ["arrays_strings"],
            lastAssessedAt: nowIso,
          },
          {
            skillId: "distributed_systems",
            skillName: "Distributed Systems: Consensus & Caching",
            category: "System Design",
            masteryState: "developing",
            masteryScore: 6.0,
            confidence: 0.78,
            evidenceType: "project_demonstrated",
            isIndependentlyVerified: false,
            evidenceSource: "Rate Limiter Cluster Project on GitHub",
            knownWeaknesses: ["Raft consensus split-brain handling, cache-aside stampede defense"],
            commonMisconceptions: ["Confusing eventual consistency with strong linearizability"],
            prerequisites: ["typescript_core"],
            lastAssessedAt: nowIso,
          },
          {
            skillId: "react_frontend",
            skillName: "React & Modern Frontend Architecture",
            category: "Frontend",
            masteryState: "developing",
            masteryScore: 6.8,
            confidence: 0.72,
            evidenceType: "self_reported",
            isIndependentlyVerified: false,
            evidenceSource: "Student Profile Self-Declaration",
            knownWeaknesses: ["Concurrent mode, React 19 server actions vs client hooks"],
            commonMisconceptions: ["Overusing useEffect for derived state"],
            prerequisites: ["typescript_core"],
            lastAssessedAt: nowIso,
          },
        ];

    try {
      const db = getDb();
      const skillRows = await db
        .select()
        .from(studentSkillNodes)
        .where(eq(studentSkillNodes.studentUserId, studentUserId));

      if (skillRows && skillRows.length > 0) {
        skills = skillRows.map((row: any) => ({
          skillId: row.skillId,
          skillName: row.skillName,
          category: row.category,
          masteryState: row.masteryState as any,
          masteryScore: row.masteryScore ?? 5.0,
          confidence: row.confidence ?? 0.8,
          evidenceType: (row.evidenceType as EvidenceClassification) || "self_reported",
          isIndependentlyVerified: !!row.isIndependentlyVerified,
          evidenceSource: row.evidenceSource || "SQL Persistent Store",
          evidenceRef: row.evidenceId || undefined,
          knownWeaknesses: Array.isArray(row.knownWeaknesses) ? row.knownWeaknesses : [],
          commonMisconceptions: Array.isArray(row.commonMisconceptions) ? row.commonMisconceptions : [],
          prerequisites: [],
          lastAssessedAt: row.lastAssessedAt ? new Date(row.lastAssessedAt).toISOString() : nowIso,
        }));
      } else {
        // Seed default skills into SQL
        for (const s of defaultSkills) {
          await db.insert(studentSkillNodes).values({
            id: `skn-${studentUserId}-${s.skillId}`,
            studentUserId,
            skillId: s.skillId,
            skillName: s.skillName,
            category: s.category,
            masteryState: s.masteryState,
            masteryScore: s.masteryScore,
            confidence: s.confidence,
            evidenceType: s.evidenceType,
            isIndependentlyVerified: s.isIndependentlyVerified,
            evidenceSource: s.evidenceSource,
            evidenceId: `seed-${s.skillId}`,
            knownWeaknesses: s.knownWeaknesses,
            commonMisconceptions: s.commonMisconceptions,
            lastAssessedAt: now,
            updatedAt: now,
          });
        }
        skills = defaultSkills;
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentIntelligenceGraph] Skills SQL query warning:", err?.message || err);
      }
      skills = defaultSkills;
    }

    // 3. Query or Seed student_projects in SQL
    let projects: StudentProjectRecord[] = [];
    const defaultProjects: StudentProjectRecord[] = isStudent2
      ? [
          {
            id: "proj-rag-search",
            studentUserId,
            title: "Semantic Document Search Engine using FastAPI & pgvector",
            description: "High-performance semantic retrieval system indexing 10,000+ research papers with hybrid sparse-dense ranking.",
            role: "Sole Backend & ML Engineer",
            technologies: ["Python", "FastAPI", "pgvector", "Docker", "HuggingFace"],
            outcomes: "Reduced semantic query latency to 38ms p95; eliminated false positive matching by 22% using reciprocal rank fusion.",
            repositoryUrl: "https://github.com/mentormaze/semantic-search",
            sourceSystem: "MentorMaze",
            verificationStatus: "verified",
            createdAt: nowIso,
          },
          {
            id: "proj-churn-model",
            studentUserId,
            title: "Customer Churn Prediction Pipeline with SHAP Explainability",
            description: "End-to-end predictive classification pipeline with feature engineering, hyperparameter tuning, and model explainability.",
            role: "Data Science Intern",
            technologies: ["Python", "Scikit-Learn", "Pandas", "Matplotlib", "SHAP"],
            outcomes: "Achieved 0.87 ROC-AUC across 5-fold stratified cross validation; generated localized feature attribution for non-technical stakeholders.",
            sourceSystem: "Avsar",
            verificationStatus: "verified",
            createdAt: nowIso,
          },
        ]
      : [
          {
            id: "proj-webrtc-collab",
            studentUserId,
            title: "Peer-to-Peer Low-Latency Collaboration Engine",
            description: "Real-time canvas and multi-party voice communication platform using WebRTC data channels and signaling meshes.",
            role: "Lead Fullstack Architect",
            technologies: ["WebRTC", "TypeScript", "Node.js", "Redis", "Next.js"],
            outcomes: "Maintained sub-50ms peer latency across 12 concurrent users with automatic reconnection fallback on packet drop.",
            repositoryUrl: "https://github.com/mentormaze/webrtc-engine",
            sourceSystem: "Collaborate",
            verificationStatus: "verified",
            createdAt: nowIso,
          },
          {
            id: "proj-rate-limiter",
            studentUserId,
            title: "Distributed Rate Limiter & Token Bucket Cluster",
            description: "High-throughput token bucket rate limiter deployed in Redis with sliding-window log algorithms and Prometheus telemetry.",
            role: "Backend Engineer",
            technologies: ["Go", "Redis", "Docker", "Prometheus"],
            outcomes: "Sustained 45,000 requests/sec with zero race-condition drops using atomic Redis Lua scripts.",
            repositoryUrl: "https://github.com/mentormaze/rate-limiter",
            sourceSystem: "MentorMaze",
            verificationStatus: "verified",
            createdAt: nowIso,
          },
        ];

    try {
      const db = getDb();
      const projRows = await db
        .select()
        .from(studentProjects)
        .where(eq(studentProjects.studentUserId, studentUserId));

      if (projRows && projRows.length > 0) {
        projects = projRows.map((r: any) => ({
          id: r.id,
          studentUserId: r.studentUserId,
          title: r.title,
          description: r.description || "",
          role: r.role || "Contributor",
          technologies: Array.isArray(r.technologies) ? r.technologies : [],
          outcomes: r.outcomes || "",
          repositoryUrl: r.repositoryUrl || undefined,
          liveUrl: r.liveUrl || undefined,
          sourceSystem: r.sourceSystem || "MentorMaze",
          verificationStatus: r.verificationStatus as any,
          evidenceId: r.evidenceId || undefined,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : nowIso,
        }));
      } else {
        for (const p of defaultProjects) {
          await db.insert(studentProjects).values({
            id: p.id,
            studentUserId,
            title: p.title,
            description: p.description,
            role: p.role,
            technologies: p.technologies,
            outcomes: p.outcomes,
            repositoryUrl: p.repositoryUrl,
            liveUrl: p.liveUrl,
            sourceSystem: p.sourceSystem,
            verificationStatus: p.verificationStatus,
            createdAt: now,
            updatedAt: now,
          });
        }
        projects = defaultProjects;
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentIntelligenceGraph] Projects SQL query warning:", err?.message || err);
      }
      projects = defaultProjects;
    }

    // 4. Query or Seed active milestones from ai_mentor_roadmaps in SQL
    let activeMilestones: { weekNumber: number; title: string; status: string }[] = [];
    const defaultMilestones = [
      { weekNumber: 1, title: "Algorithmic Invariants & Space Complexity Optimization", status: "completed" },
      { weekNumber: 2, title: "Relational Modeling, Index Selectivity & Transaction Isolation", status: "in_progress" },
      { weekNumber: 3, title: "Distributed Caching, Sharding & CAP Trade-Offs", status: "pending" },
    ];

    try {
      const db = getDb();
      const roadmapRows = await db
        .select()
        .from(aiMentorRoadmaps)
        .where(eq(aiMentorRoadmaps.studentUserId, studentUserId))
        .limit(1);

      let rId = `rdm-${studentUserId}`;
      if (roadmapRows && roadmapRows.length > 0) {
        rId = roadmapRows[0].id;
      } else {
        await db.insert(aiMentorRoadmaps).values({
          id: rId,
          studentUserId,
          targetRole,
          currentLevel: isStudent2 ? "Final Year Undergraduate (AI/ML)" : "Final Year Undergraduate (CSE)",
          targetTimelineWeeks: 24,
          progressPct: isStudent2 ? 42 : 55,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
      }

      const milestoneRows = await db
        .select()
        .from(aiMentorRoadmapMilestones)
        .where(eq(aiMentorRoadmapMilestones.roadmapId, rId));

      if (milestoneRows && milestoneRows.length > 0) {
        activeMilestones = milestoneRows
          .sort((a: any, b: any) => a.weekNumber - b.weekNumber)
          .map((m: any) => ({
            weekNumber: m.weekNumber,
            title: m.title,
            status: m.status || "pending",
          }));
      } else {
        for (const m of defaultMilestones) {
          await db.insert(aiMentorRoadmapMilestones).values({
            id: `mlt-${studentUserId}-${m.weekNumber}`,
            roadmapId: rId,
            weekNumber: m.weekNumber,
            title: m.title,
            description: m.title,
            skillsCovered: [],
            status: m.status,
          });
        }
        activeMilestones = defaultMilestones;
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentIntelligenceGraph] Milestones SQL query warning:", err?.message || err);
      }
      activeMilestones = defaultMilestones;
    }

    // 5. Query active evidence records from student_intelligence_evidence in SQL
    try {
      const db = getDb();
      const activeEvidence = await db
        .select()
        .from(studentIntelligenceEvidence)
        .where(
          and(
            eq(studentIntelligenceEvidence.studentUserId, studentUserId),
            isNull(studentIntelligenceEvidence.revokedAt),
            or(
              isNull(studentIntelligenceEvidence.expiresAt),
              gt(studentIntelligenceEvidence.expiresAt, now)
            )
          )
        );

      if (activeEvidence && activeEvidence.length > 0) {
        for (const ev of activeEvidence) {
          if (ev.entityType === "skill") {
            const skill = skills.find((s) => s.skillId === ev.entityId);
            if (skill) {
              const incomingWeight = EVIDENCE_PRECEDENCE_WEIGHTS[ev.evidenceType as EvidenceClassification] || 0.5;
              const currentWeight = EVIDENCE_PRECEDENCE_WEIGHTS[skill.evidenceType] || 0.5;

              if (incomingWeight >= currentWeight) {
                skill.evidenceType = ev.evidenceType as EvidenceClassification;
                skill.confidence = Math.max(skill.confidence, ev.confidence);
                skill.evidenceSource = `${ev.sourceSystem} (${ev.sourceType})`;
                skill.evidenceRef = ev.id;
                if (ev.evidenceType === "independently_verified") {
                  skill.isIndependentlyVerified = true;
                  skill.lastVerifiedAt = ev.observedAt ? new Date(ev.observedAt).toISOString() : nowIso;
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentIntelligenceGraph] Evidence reconciliation SQL warning:", err?.message || err);
      }
    }

    // 6. Build Career Intelligence Profile
    const career: CareerIntelligenceProfile = {
      targetRole,
      currentLevel: isStudent2 ? "Final Year Undergraduate (AI/ML)" : "Final Year Undergraduate (CSE)",
      graduationYear,
      identifiedSkillGaps: isStudent2
        ? ["PyTorch CUDA Tensor Optimization", "Distributed Model Serving (vLLM)", "MLOps Model Monitoring"]
        : ["Dynamic Programming (0/1 Knapsack)", "Distributed Consensus (Raft/Paxos)", "Kafka Partition Rebalancing"],
      targetTimelineWeeks: 24,
      progressPct: isStudent2 ? 42 : 55,
      activeMilestones,
    };

    return {
      studentUserId,
      displayName,
      email,
      institution,
      degree,
      graduationYear,
      profileCompletenessPct: 88,
      skills,
      confirmedStrengths,
      confirmedWeaknesses,
      systemHypotheses,
      projects,
      career,
      preferredLanguage,
      lastUpdatedAt: nowIso,
    };
  }

  /**
   * Record a new piece of evidence with strict classification, audit trail, and precedence conflict resolution
   */
  public static async recordEvidence(
    studentUserId: string,
    entityType: "skill" | "project" | "goal" | "experience" | "fact",
    entityId: string,
    evidenceType: EvidenceClassification,
    sourceType: "student_reported" | "mentor_verified" | "assessment" | "system_inferred" | "external_connector",
    sourceSystem: string,
    confidence: number,
    metadata: Record<string, any> = {},
    requestingUserId?: string,
    expiresAt?: Date
  ): Promise<string> {
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to record evidence for another student.");
    }

    // MANDATORY RULE: Never represent an inferred skill as independently verified
    if (sourceType === "system_inferred" && evidenceType === "independently_verified") {
      throw new Error("VALIDATION_ERROR: System inferred observations cannot be classified as independently verified.");
    }

    const now = new Date();
    const id = `ev-${studentUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // 1. Insert into student_intelligence_evidence (Preserve complete durable history - never deletes)
    try {
      const db = getDb();
      await db.insert(studentIntelligenceEvidence).values({
        id,
        studentUserId,
        entityType,
        entityId,
        sourceType,
        sourceSystem,
        evidenceType,
        confidence,
        verificationStatus: evidenceType === "independently_verified" ? "independently_verified" : "unverified",
        purpose: "service_personalization",
        observedAt: now,
        expiresAt: expiresAt || null,
        revokedAt: null,
        metadata,
        createdAt: now,
        updatedAt: now,
      });

      // 2. If entityType === "skill", check precedence against student_skill_nodes in SQL and update if promoted
      if (entityType === "skill") {
        const skillRows = await db
          .select()
          .from(studentSkillNodes)
          .where(
            and(
              eq(studentSkillNodes.studentUserId, studentUserId),
              eq(studentSkillNodes.skillId, entityId)
            )
          )
          .limit(1);

        if (skillRows && skillRows.length > 0) {
          const current = skillRows[0];
          const incomingWeight = EVIDENCE_PRECEDENCE_WEIGHTS[evidenceType] || 0.5;
          const currentWeight = EVIDENCE_PRECEDENCE_WEIGHTS[(current.evidenceType as EvidenceClassification) || "self_reported"] || 0.5;

          // Promote if incoming weight is strictly higher or has higher confidence at equal weight
          if (incomingWeight > currentWeight || (incomingWeight === currentWeight && confidence > (current.confidence ?? 0))) {
            await db
              .update(studentSkillNodes)
              .set({
                evidenceType,
                isIndependentlyVerified: evidenceType === "independently_verified",
                evidenceSource: `${sourceSystem} (${sourceType})`,
                evidenceId: id,
                confidence: Math.max(current.confidence ?? 0.5, confidence),
                lastAssessedAt: now,
                updatedAt: now,
              })
              .where(
                and(
                  eq(studentSkillNodes.studentUserId, studentUserId),
                  eq(studentSkillNodes.skillId, entityId)
                )
              );
          }
        }
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentIntelligenceGraph] SQL recordEvidence warning:", err?.message || err);
      }
    }

    // 3. Update in-memory graph cache if present
    const graph = this.graphStore.get(studentUserId);
    if (graph && entityType === "skill") {
      const skill = graph.skills.find((s) => s.skillId === entityId);
      if (skill) {
        const incomingWeight = EVIDENCE_PRECEDENCE_WEIGHTS[evidenceType] || 0.5;
        const currentWeight = EVIDENCE_PRECEDENCE_WEIGHTS[skill.evidenceType] || 0.5;

        if (incomingWeight > currentWeight || (incomingWeight === currentWeight && confidence > skill.confidence)) {
          skill.evidenceType = evidenceType;
          skill.confidence = Math.max(skill.confidence, confidence);
          skill.evidenceSource = `${sourceSystem} (${sourceType})`;
          skill.evidenceRef = id;
          if (evidenceType === "independently_verified") {
            skill.isIndependentlyVerified = true;
            skill.lastVerifiedAt = now.toISOString();
          }
          skill.lastAssessedAt = now.toISOString();
        }
      }
    }

    return id;
  }

  /**
   * Revoke an active piece of evidence with audit record
   * Supports either (studentUserId, evidenceId, requestingUserId) or (evidenceId, requestingUserId)
   */
  public static async revokeEvidence(
    studentUserIdOrEvidenceId: string,
    evidenceIdOrRequesting?: string,
    requestingUserId?: string
  ): Promise<void> {
    let studentUserId = studentUserIdOrEvidenceId;
    let evidenceId = evidenceIdOrRequesting;
    let reqUserId = requestingUserId;

    if (studentUserIdOrEvidenceId.startsWith("ev-")) {
      evidenceId = studentUserIdOrEvidenceId;
      reqUserId = evidenceIdOrRequesting;
      // Resolve studentUserId from SQL
      try {
        const db = getDb();
        const rows = await db
          .select()
          .from(studentIntelligenceEvidence)
          .where(eq(studentIntelligenceEvidence.id, evidenceId));
        if (rows && rows.length > 0) {
          studentUserId = rows[0].studentUserId;
        } else {
          // If evidence row not found yet and requestingUserId is an attacker, enforce check
          studentUserId = "unknown-student";
        }
      } catch {}
    }

    if (reqUserId && reqUserId !== studentUserId && !reqUserId.startsWith("mentor-") && reqUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to revoke evidence for another student.");
    }

    const now = new Date();
    try {
      const db = getDb();
      await db
        .update(studentIntelligenceEvidence)
        .set({
          revokedAt: now,
          updatedAt: now,
        })
        .where(eq(studentIntelligenceEvidence.id, evidenceId!));
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentIntelligenceGraph] revokeEvidence SQL warning:", err?.message || err);
      }
    }

    // Invalidate cache so graph recalculates active evidence
    this.graphStore.delete(studentUserId);
  }

  /**
   * Retrieve complete audit history of evidence (including conflicting, expired, and revoked)
   * Supports either (studentUserId, entityId, requestingUserId) or (studentUserId, requestingUserId)
   */
  public static async getEvidenceAuditHistory(
    studentUserId: string,
    entityIdOrRequesting?: string,
    requestingUserId?: string
  ): Promise<any[]> {
    let entityId: string | undefined = undefined;
    let reqUserId: string | undefined = undefined;

    if (requestingUserId !== undefined) {
      entityId = entityIdOrRequesting;
      reqUserId = requestingUserId;
    } else if (entityIdOrRequesting) {
      if (
        entityIdOrRequesting === studentUserId ||
        entityIdOrRequesting.startsWith("usr-") ||
        entityIdOrRequesting.startsWith("mentor-") ||
        entityIdOrRequesting === "admin"
      ) {
        reqUserId = entityIdOrRequesting;
      } else {
        entityId = entityIdOrRequesting;
      }
    }

    if (reqUserId && reqUserId !== studentUserId && !reqUserId.startsWith("mentor-") && reqUserId !== "admin") {
      throw new Error("403_FORBIDDEN: You do not have permission to access another student's evidence audit trail.");
    }

    try {
      const db = getDb();
      if (entityId) {
        const rows = await db
          .select()
          .from(studentIntelligenceEvidence)
          .where(
            and(
              eq(studentIntelligenceEvidence.studentUserId, studentUserId),
              eq(studentIntelligenceEvidence.entityId, entityId)
            )
          );
        return (rows || []).map((r: any) => ({
          ...r,
          isRevoked: Boolean(r.revokedAt),
        }));
      } else {
        const rows = await db
          .select()
          .from(studentIntelligenceEvidence)
          .where(eq(studentIntelligenceEvidence.studentUserId, studentUserId));
        return (rows || []).map((r: any) => ({
          ...r,
          isRevoked: Boolean(r.revokedAt),
        }));
      }
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentIntelligenceGraph] getEvidenceAuditHistory SQL warning:", err?.message || err);
      }
      return [];
    }
  }

  /**
   * Apply explicit student correction overriding unverified hypotheses with durable audit logging
   */
  public static async applyStudentCorrection(
    studentUserId: string,
    category: "weakness" | "strength" | "skill",
    targetItem: string,
    correctionText: string,
    requestingUserId?: string
  ): Promise<void> {
    if (requestingUserId && requestingUserId !== studentUserId) {
      throw new Error("403_FORBIDDEN: You do not have permission to modify another student's profile.");
    }

    const graph = await this.getGraph(studentUserId);
    const now = new Date();

    if (category === "weakness") {
      // Remove hypothesis if student explicitly clarified
      graph.systemHypotheses = graph.systemHypotheses.filter((h) => !h.toLowerCase().includes(targetItem.toLowerCase()));
      if (!graph.confirmedWeaknesses.includes(correctionText)) {
        graph.confirmedWeaknesses.push(correctionText);
      }
    } else if (category === "strength") {
      if (!graph.confirmedStrengths.includes(correctionText)) {
        graph.confirmedStrengths.push(correctionText);
      }
    }

    graph.lastUpdatedAt = now.toISOString();
    this.graphStore.set(studentUserId, graph);

    // 1. Durable Audit Trail: Record the correction into student_intelligence_evidence
    try {
      const db = getDb();
      await db.insert(studentIntelligenceEvidence).values({
        id: `ev-correction-${studentUserId}-${Date.now()}`,
        studentUserId,
        entityType: category === "weakness" ? "weakness" : "skill",
        entityId: targetItem,
        sourceType: "student_reported",
        sourceSystem: "Student Sovereign Correction",
        evidenceType: "self_reported",
        confidence: 1.0,
        verificationStatus: "student_confirmed",
        purpose: "service_personalization",
        observedAt: now,
        notes: correctionText,
        metadata: {
          originalContestedTarget: targetItem,
          correctionText,
        },
        createdAt: now,
        updatedAt: now,
      });

      // 2. Persist updated weaknesses, strengths, and hypotheses to student_learning_profiles in SQL
      await db
        .update(studentLearningProfiles)
        .set({
          confirmedWeaknesses: graph.confirmedWeaknesses,
          confirmedStrengths: graph.confirmedStrengths,
          systemHypotheses: graph.systemHypotheses,
          updatedAt: now,
        })
        .where(eq(studentLearningProfiles.studentUserId, studentUserId));
    } catch (err: any) {
      if (err?.code !== "42P01") {
        console.warn("[StudentIntelligenceGraph] applyStudentCorrection SQL warning:", err?.message || err);
      }
    }
  }

  /**
   * Clear cache for testing
   */
  public static resetCache(): void {
    this.graphStore.clear();
  }
}
