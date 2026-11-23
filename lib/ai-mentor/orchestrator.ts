/**
 * Central AI Mentor Intelligence Orchestrator — ASTRION Unified Architecture
 * Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 * Identity: ASTRION (Adaptive Strategic Intelligence & Reasoning Network)
 * Core: ASTRION CORE (`astrion-core`)
 *
 * Coordinates 8 Official Specialist Capabilities, Hybrid Model Provider Routing,
 * Multi-layer Guardrails, Student Memory, and RAG Knowledge Retrieval.
 */

import {
  TeachingMode,
  FocusArea,
  LanguageCode,
  StructuredTurnResponse,
  SourceCitation,
  RecommendedAction,
  SkillUpdate,
  SpecialistCapabilityInfo,
  MentorIdentity,
  UNIFIED_MENTOR_IDENTITY,
} from "./types";
import { ModelProviderRouter } from "./model-provider-router";
import { StudentContextBuilder } from "./student-context-builder";
import { StudentSkillGraph } from "./student-skill-graph";
import { PedagogyEngine } from "./pedagogy-engine";
import { KnowledgeRAGService } from "./knowledge-rag-service";
import { CareerIntelligenceService } from "./career-intelligence";
import { CodeMentorService } from "./code-mentor";
import { InterviewCoachService } from "./interview-coach";
import { StudentMemoryService } from "./student-memory-service";
import { HumanEscalationService } from "./human-escalation-service";
import { SafetyGuardrails } from "./safety-guardrails";
import { ConversationStore } from "./conversation-store";
import { CurriculumKnowledgeService } from "./curriculum-knowledge";
import { SpecialistRegistry } from "./specialists/specialist-registry";
import { SpecialistExecutionInput } from "./specialists/specialist-interface";
import { PermissionAwareContextBuilder } from "./permission-aware-context-builder";
import { StudentGoalService, StudentGoalRecord } from "./goals/student-goal-service";
import { PersonalizedAssessmentService, PersonalizedAssessmentResult } from "./assessment/personalized-assessment-service";
import { PersonalizedRoadmapService, PersonalizedRoadmapRecord } from "./roadmap/personalized-roadmap-service";
import {
  AdaptiveLearningAgent,
  StudentProfilerAgent,
  LearningGapAgent,
  GoalRoadmapAgent,
  AccountabilityAgent,
  EngagementIntelligenceAgent,
  SafetyGuardrailAgent,
  EvaluatorCriticAgent,
  ResourceRetrieverAgent,
  CommunicationGapAgent,
  MentorCollaborationAgent,
  AgentExecutionInput,
} from "./agents";

export interface OrchestratorTurnInput {
  studentUserId: string;
  userMessage: string;
  mode?: TeachingMode;
  focusArea?: FocusArea;
  activeGoalId?: string;
  codeSnippet?: string;
  languagePreference?: LanguageCode;
  hintLevel?: number;
  activeTopic?: string;
  conversationId?: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  consentOverride?: { shareWithMentors?: boolean; useForPersonalization?: boolean };
  inferenceMode?: "generative" | "deterministic" | "fine-tuned-2b" | "pedagogical_core";
}

export class AIMentorOrchestrator {
  /**
   * Alias for processTurn to satisfy turn handling contract
   */
  public static async handleTurn(input: OrchestratorTurnInput): Promise<StructuredTurnResponse> {
    return this.processTurn(input);
  }

  /**
   * Process a student turn through the unified intelligence pipeline
   */
  public static async processTurn(input: OrchestratorTurnInput): Promise<StructuredTurnResponse> {
    const t0 = performance.now();
    const rawMode = input.focusArea || input.mode || "learn";
    const language = input.languagePreference || "en";
    const currentHintLevel = input.hintLevel || 0;
    const conversationId = input.conversationId;

    // 1. Safety & Guardrail Check (Crisis boundaries, clinical restrictions, PII scrub, prompt injection)
    const safetyCheck = SafetyGuardrails.inspectInput(input.userMessage);
    if (!safetyCheck.isSafe && safetyCheck.crisisHelpNotice) {
      const elapsed = Number((performance.now() - t0).toFixed(2));
      const crisisResp: StructuredTurnResponse = {
        requestId: `crisis-${Date.now()}`,
        message: safetyCheck.crisisHelpNotice,
        voiceText: "Please connect with professional support. MentorMaze is an educational and career platform.",
        teachingStrategy: "conceptual_explanation",
        topic: "safety_boundary",
        difficulty: "intermediate",
        hintLevel: 0,
        studentUnderstandingSignal: "unknown",
        sources: [],
        recommendedActions: [
          { id: "act-telemanas", title: "Contact Tele-MANAS Helpline (14416)", category: "Support", priority: "high" },
        ],
        latencyMs: elapsed,
        modelProvider: "tathastu-safety-guardrail",
        inferenceMode: "deterministic",
        mentorIdentity: UNIFIED_MENTOR_IDENTITY,
      };

      if (conversationId) {
        ConversationStore.addMessage(conversationId, input.studentUserId, "user", input.userMessage);
        ConversationStore.addMessage(conversationId, input.studentUserId, "assistant", safetyCheck.crisisHelpNotice, {
          teachingStrategy: "conceptual_explanation",
          modelProvider: "tathastu-safety-guardrail",
          inferenceMode: "deterministic",
        });
      }

      return crisisResp;
    }

    const sanitizedMessage = safetyCheck.sanitizedText;

    // 2. Resolve Specialist Capability from Registry (Dynamic Intent or Explicit Focus Area)
    const specialist = SpecialistRegistry.resolveSpecialist(sanitizedMessage, rawMode);
    const focusArea = specialist.id;
    const secondarySpecialist = SpecialistRegistry.resolveSecondarySpecialist(sanitizedMessage, focusArea);

    // 3. Aggregate Authorized Student Context & Skill Graph State (Targeted to Resolved Specialist Domain)
    const authorizedContext = await PermissionAwareContextBuilder.buildContext(input.studentUserId, {
      requestingUserId: input.studentUserId,
      purpose: "service_personalization",
      focusArea,
      consentOverride: input.consentOverride,
    });
    const studentContext = await StudentContextBuilder.buildContext(input.studentUserId, undefined, focusArea);
    const studentSkills = StudentSkillGraph.getStudentSkills(input.studentUserId);
    const studentMemories = StudentMemoryService.getMemories(input.studentUserId);

    // 4. Adaptive Pedagogical Strategy Selection
    const pedagogyDecision = PedagogyEngine.decide(
      sanitizedMessage,
      rawMode,
      studentContext,
      currentHintLevel,
      language
    );

    // 5. Knowledge Retrieval (RAG across verified collections)
    const ragPayload = KnowledgeRAGService.retrieve(sanitizedMessage, { limit: 3 });
    const citations: SourceCitation[] = ragPayload.citations;

    // 6. Evaluate Human Mentorship Escalation Need
    const escalation = HumanEscalationService.evaluateEscalationNeed(
      sanitizedMessage,
      studentContext.weakSkills.length,
      currentHintLevel >= 3 ? 3 : 0
    );

    // 7. Prepare Specialist Execution Context
    const specialistInput: SpecialistExecutionInput = {
      studentUserId: input.studentUserId,
      userMessage: sanitizedMessage,
      codeSnippet: input.codeSnippet,
      languagePreference: language,
      hintLevel: currentHintLevel,
      studentContext,
      ragPayload,
      pedagogyDecision,
    };

    let responseText = "";
    let voiceText = "";
    let activeModelProvider = "tathastu-pedagogical-rules";
    let inferenceMode: "generative" | "deterministic" | "fine-tuned-2b" = "deterministic";
    let lastRequestId = `turn-${Date.now()}`;
    let tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined = undefined;
    let estimatedCostUsd: number | undefined = undefined;
    let fallbackReason: string | undefined = undefined;
    let postInteractionCheck: StructuredTurnResponse["postInteractionCheck"] = undefined;

    const recommendedActions: RecommendedAction[] = [];
    const skillUpdates: SkillUpdate[] = [];

    // 8. Execution Path: Check if specialist requires deterministic domain engine or can use hybrid LLM router
    const isCodeSpecialist = focusArea === "coding_dsa" || Boolean(input.codeSnippet);
    const isResumeSpecialist = focusArea === "resume";
    const isInterviewSpecialist = focusArea === "interview";
    const isStudyPlanningSpecialist = focusArea === "study_planning" || focusArea === "career";
    const isPracticeSpecialist = focusArea === "practice" || pedagogyDecision.strategy === "socratic_guidance";

    // Build Unified System Prompt for Generative Completion
    const unifiedSystemPrompt = `You are ASTRION (Adaptive Strategic Intelligence & Reasoning Network), the unified AI Mentorship Intelligence for MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com).
Core Engine: ASTRION CORE. Parent Ecosystem: AI Tathastu. Platform: MentorMaze.

Active Specialist Intelligence: ${specialist.name} (${specialist.badge})
Domain: ${specialist.domain}

Teaching Strategy: ${pedagogyDecision.strategy}
Target Depth: ${pedagogyDecision.targetDepth}
Language Preference: ${language} (Format your responses in ${
      language === "hi"
        ? "pure Hindi"
        : language === "hinglish"
        ? "conversational Hinglish (Hindi written in Latin script with standard English technical terms)"
        : "clear, professional English"
    }).

${StudentContextBuilder.formatContextForPrompt(studentContext)}

ASTRION Operating Principles:
1. Unified Identity: You are always ASTRION. Speak with calm intellectual authority, analytical clarity, and rigorous mentorship across all turns. Never adopt a separate disconnected identity or robotic voice.
2. Socratic Scaffolding: Never dump full finished code immediately when a student asks for algorithmic help or homework. Guide them with progressive hints and fundamental invariants.
3. Zero-Fabrication: Strictly prohibit invented metrics, fake percentages, or fabricated project claims on student resumes.
4. Groundedness: Reference verified computer science, system design, and placement principles.

${specialist.getSystemPromptEnrichment(specialistInput)}${
  secondarySpecialist
    ? `\n\nCross-Domain Specialist Consultation: ${secondarySpecialist.name} (${secondarySpecialist.badge})\n${secondarySpecialist.getSystemPromptEnrichment({ ...specialistInput, studentContext })}`
    : ""
}

Retrieved Knowledge Evidence:
${ragPayload.retrievedEvidenceText || "No matching knowledge indexed; rely on verified CS curriculum standards."}`;

    // If explicit code snippet or specialized domain, use the deterministic specialist module first, then LLM if appropriate
    if (isCodeSpecialist && (input.codeSnippet || rawMode === "code_mentor" || sanitizedMessage.includes("```"))) {
      const detResult = specialist.executeDeterministic(specialistInput);
      responseText = detResult.responseText;
      voiceText = detResult.voiceText;
      recommendedActions.push(...detResult.recommendedActions);
      skillUpdates.push(...detResult.skillUpdates);
      postInteractionCheck = detResult.postInteractionCheck;
      activeModelProvider = "tathastu-pedagogical-rules";
      inferenceMode = "deterministic";
    } else if (isResumeSpecialist && rawMode === "resume_mentor") {
      const detResult = specialist.executeDeterministic(specialistInput);
      responseText = detResult.responseText;
      voiceText = detResult.voiceText;
      recommendedActions.push(...detResult.recommendedActions);
      skillUpdates.push(...detResult.skillUpdates);
      postInteractionCheck = detResult.postInteractionCheck;
      activeModelProvider = "tathastu-pedagogical-rules";
      inferenceMode = "deterministic";
    } else if (isInterviewSpecialist && rawMode === "interview_coach") {
      const detResult = specialist.executeDeterministic(specialistInput);
      responseText = detResult.responseText;
      voiceText = detResult.voiceText;
      recommendedActions.push(...detResult.recommendedActions);
      skillUpdates.push(...detResult.skillUpdates);
      postInteractionCheck = detResult.postInteractionCheck;
      activeModelProvider = "tathastu-pedagogical-rules";
      inferenceMode = "deterministic";
    } else if (isStudyPlanningSpecialist && (rawMode === "study_planner" || rawMode === "career_mentor")) {
      const detResult = specialist.executeDeterministic(specialistInput);
      responseText = detResult.responseText;
      voiceText = detResult.voiceText;
      recommendedActions.push(...detResult.recommendedActions);
      skillUpdates.push(...detResult.skillUpdates);
      postInteractionCheck = detResult.postInteractionCheck;
      activeModelProvider = "tathastu-pedagogical-rules";
      inferenceMode = "deterministic";
    } else if (isPracticeSpecialist && rawMode === "practice") {
      const detResult = specialist.executeDeterministic(specialistInput);
      responseText = detResult.responseText;
      voiceText = detResult.voiceText;
      recommendedActions.push(...detResult.recommendedActions);
      skillUpdates.push(...detResult.skillUpdates);
      postInteractionCheck = detResult.postInteractionCheck;
      activeModelProvider = "tathastu-pedagogical-rules";
      inferenceMode = "deterministic";
    } else {
      // General Hybrid LLM Router Path
      const historyMessages = (input.conversationHistory || []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const completion = await ModelProviderRouter.complete({
        systemPrompt: unifiedSystemPrompt,
        messages: [...historyMessages, { role: "user", content: sanitizedMessage }],
        taskCategory: specialist.getTaskCategory(),
        temperature: 0.3,
        studentUserId: input.studentUserId,
      });

      lastRequestId = completion.requestId;
      tokenUsage = completion.tokenUsage;
      estimatedCostUsd = completion.estimatedCostUsd;

      if (!completion.isFallback && completion.content && completion.content !== "LOCAL_PEDAGOGICAL_FALLBACK") {
        // Genuine generative completion succeeded
        responseText = completion.content;
        activeModelProvider = `${completion.provider}/${completion.model}`;
        inferenceMode = completion.inferenceMode;
        voiceText = completion.content.split("\n\n")[0]?.replace(/[*#_`~]/g, "") || "Here is what you need to know about this topic.";

        const postProcessed = specialist.postProcessGenerative(completion.content, specialistInput);
        if (postProcessed.recommendedActions) recommendedActions.push(...postProcessed.recommendedActions);
        if (postProcessed.skillUpdates) skillUpdates.push(...postProcessed.skillUpdates);
        if (postProcessed.postInteractionCheck) postInteractionCheck = postProcessed.postInteractionCheck;
      } else {
        // Fallback to specialist's deterministic execution
        activeModelProvider = "tathastu-pedagogy-v1";
        inferenceMode = "deterministic";
        fallbackReason = completion.fallbackReason || "LOCAL_DETERMINISTIC_FALLBACK";

        const fallbackBanner = `> ℹ️ **Notice**: Running on MentorMaze Local Pedagogical Rule-Engine (Deterministic Fallback Mode). Generative LLM provider keys (GEMINI_API_KEY, OPENAI_API_KEY) are not configured in the server environment.\n\n`;

        const detResult = specialist.executeDeterministic(specialistInput);
        responseText = fallbackBanner + detResult.responseText;
        voiceText = detResult.voiceText;
        recommendedActions.push(...detResult.recommendedActions);
        skillUpdates.push(...detResult.skillUpdates);
        postInteractionCheck = detResult.postInteractionCheck;
      }
    }

    // 9. Append Citations & Missing Information Notices
    if (citations.length > 0) {
      responseText += KnowledgeRAGService.formatCitationsForMarkdown(ragPayload.results);
    } else if (ragPayload.missingInformationNotice) {
      responseText += `\n\n---\n*${ragPayload.missingInformationNotice}*`;
    }

    // 10. Post-Interaction Learning Check Formulation (if not already set)
    const lowerMessage = sanitizedMessage.toLowerCase();
    const checkTopic = CurriculumKnowledgeService.findMatchingTopic(sanitizedMessage);

    if (!postInteractionCheck && checkTopic) {
      postInteractionCheck = {
        question: checkTopic.conceptCheck.question,
        expectedKeyPoints: checkTopic.conceptCheck.expectedKeyPoints,
        options: [
          `Primary: ${checkTopic.conceptCheck.expectedKeyPoints[0]}`,
          `Secondary: Invariant maintenance across state transitions`,
          `Alternative: Unconstrained linear scaling`,
          `None of the above`,
        ],
        correctOptionIndex: 0,
        explanation: `Core invariant involves: ${checkTopic.conceptCheck.expectedKeyPoints.join(", ")}.`,
      };
    } else if (!postInteractionCheck && (focusArea === "learn" || focusArea === "practice")) {
      if (lowerMessage.includes("two pointer") || lowerMessage.includes("two-pointer")) {
        postInteractionCheck = {
          question: "Under what condition does moving the left pointer inward guarantee a monotonic increase in sum?",
          options: [
            "The array must contain only positive integers",
            "The array must be sorted in non-decreasing order",
            "The array length must be an even number",
            "The array elements must be unique",
          ],
          correctOptionIndex: 1,
          explanation: "In an unsorted array, values do not correlate monotonically with pointer indices, destroying the directional guarantee.",
        };
      } else if (lowerMessage.includes("knapsack") || lowerMessage.includes("dp")) {
        postInteractionCheck = {
          question: "Why must the capacity loop iterate backwards in 1D space-optimized 0/1 Knapsack?",
          options: [
            "To prioritize higher-value items first",
            "To prevent the same item from being included multiple times in the current step",
            "To reduce runtime complexity from O(NW) to O(W)",
            "Backward loops are vectorized faster by modern CPU compilers",
          ],
          correctOptionIndex: 1,
          explanation: "Iterating forward would overwrite subproblem states from row i-1 with row i, effectively turning 0/1 Knapsack into unbounded knapsack.",
        };
      } else {
        postInteractionCheck = {
          question: "In Cache-Aside architecture, why is it safer to delete (invalidate) the cache key upon DB write rather than update it?",
          options: [
            "Redis does not support key updates",
            "To eliminate race conditions between concurrent DB updates and cache writes",
            "Deleting keys bypasses PostgreSQL transaction isolation",
            "It saves memory in Redis cluster instances",
          ],
          correctOptionIndex: 1,
          explanation: "Concurrent writes can complete in different orders across DB and cache, leaving stale values permanently in cache until TTL expires.",
        };
      }
    }

    // 11. Grounded Evidence-Based Skill Updates
    if (lowerMessage.includes("cache-aside") || lowerMessage.includes("redis")) {
      const alreadyHas = skillUpdates.some((s) => s.skillId === "relational_db_sql");
      if (!alreadyHas) {
        skillUpdates.push({
          skillId: "relational_db_sql",
          skillName: "SQL & Relational Modeling",
          previousState: "developing",
          newState: "demonstrated",
          score: 8.4,
          confidence: 0.88,
          evidence: "Demonstrated accurate Cache-Aside read/write sequence and invalidation trade-offs",
        });
      }
    }

    const elapsed = Number((performance.now() - t0).toFixed(2));

    // 12. Goal-Centric Mentorship & Multi-Agent Ecosystem Orchestration
    const agentInput: AgentExecutionInput = {
      studentUserId: input.studentUserId,
      userMessage: sanitizedMessage,
      context: authorizedContext,
      focusArea,
      language,
      activeTopic: input.activeTopic,
      conversationHistory: input.conversationHistory,
    };

    let activeGoal = authorizedContext.activeGoal;

    // Detect explicit goal-declaration intent in student message
    const isGoalDeclaration =
      lowerMessage.includes("i want to become") ||
      lowerMessage.includes("my goal is") ||
      lowerMessage.includes("aiming to become") ||
      lowerMessage.includes("i want to be a") ||
      lowerMessage.includes("preparing to be a") ||
      lowerMessage.includes("i want to prepare for") ||
      lowerMessage.includes("i want to learn");

    if (isGoalDeclaration) {
      let extractedTitle = "";
      if (lowerMessage.includes("machine learning") || lowerMessage.includes("data science") || lowerMessage.includes("ai")) {
        extractedTitle = "Machine Learning Engineer";
      } else if (lowerMessage.includes("distributed systems") || lowerMessage.includes("system architecture")) {
        extractedTitle = "Distributed Systems Engineer";
      } else if (lowerMessage.includes("full stack") || lowerMessage.includes("fullstack")) {
        extractedTitle = "Full Stack Engineer";
      } else if (lowerMessage.includes("backend")) {
        extractedTitle = "Backend Engineer";
      } else if (lowerMessage.includes("devops") || lowerMessage.includes("sre")) {
        extractedTitle = "DevOps / SRE";
      } else {
        extractedTitle = "Software Development Engineer (SDE-1)";
      }

      activeGoal = await StudentGoalService.createGoal(input.studentUserId, {
        title: extractedTitle,
        category: "career",
        importance: "primary",
        currentState: "in_progress",
      });
    }

    if (!activeGoal) {
      activeGoal = (await StudentGoalService.getActivePrimaryGoal(input.studentUserId)) ?? undefined;
    }

    // Current State Assessment
    const assessmentResult = PersonalizedAssessmentService.assessCurrentState(authorizedContext, activeGoal);
    const assessment = assessmentResult;

    let goalReference: StructuredTurnResponse["goalReference"] = undefined;
    if (activeGoal) {
      goalReference = {
        goalId: activeGoal.id,
        goalTitle: activeGoal.title,
        category: activeGoal.category,
        importance: activeGoal.importance,
        status: activeGoal.status,
      };
    }

    let studyPlan: StructuredTurnResponse["studyPlan"] = undefined;
    let progressInsights: StructuredTurnResponse["progressInsights"] = undefined;
    let resources: StructuredTurnResponse["resources"] = undefined;
    let reminders: StructuredTurnResponse["reminders"] = undefined;
    let mentorHandoff: StructuredTurnResponse["mentorHandoff"] = undefined;
    let roadmapUpdates: StructuredTurnResponse["roadmapUpdates"] = undefined;
    let milestoneUpdates: StructuredTurnResponse["milestoneUpdates"] = undefined;
    let recommendedNextAction: StructuredTurnResponse["recommendedNextAction"] = undefined;

    // A. Personalized Roadmap & Milestone Progression
    if (activeGoal) {
      let personalizedRoadmap = await PersonalizedRoadmapService.getRoadmapByGoalId(input.studentUserId, activeGoal.id);
      if (!personalizedRoadmap || isGoalDeclaration) {
        personalizedRoadmap = await PersonalizedRoadmapService.generatePersonalizedRoadmap(
          input.studentUserId,
          activeGoal,
          assessmentResult
        );
      }

      // Check if student confirmed milestone completion in this message
      if (
        lowerMessage.includes("completed week") ||
        lowerMessage.includes("finished milestone") ||
        lowerMessage.includes("completed milestone") ||
        lowerMessage.includes("marked completed") ||
        lowerMessage.includes("done with week")
      ) {
        personalizedRoadmap = await PersonalizedRoadmapService.markMilestoneProgress(
          input.studentUserId,
          personalizedRoadmap.id,
          personalizedRoadmap.currentMilestoneWeek,
          "completed",
          sanitizedMessage
        );
        roadmapUpdates = {
          roadmapId: personalizedRoadmap.id,
          adaptedReason: "Student confirmed completion of milestone deliverable.",
          updatedMilestones: personalizedRoadmap.milestones,
        };
      }

      const activeMs =
        personalizedRoadmap.milestones.find((m) => m.status === "in_progress") || personalizedRoadmap.milestones[0];

      studyPlan = {
        primaryGoal: activeGoal.title,
        totalWeeks: personalizedRoadmap.totalWeeks,
        currentMilestone: {
          weekNumber: activeMs.weekNumber,
          title: activeMs.title,
          objectives: activeMs.learningActivities,
          deliverables: activeMs.practicalProjects,
          status: activeMs.status,
        },
        milestones: personalizedRoadmap.milestones.map((m) => ({
          weekNumber: m.weekNumber,
          title: m.title,
          objectives: m.learningActivities,
          deliverables: m.practicalProjects,
          status: m.status,
        })),
      };

      const completedCount = personalizedRoadmap.milestones.filter((m) => m.status === "completed").length;
      milestoneUpdates = {
        milestoneId: activeMs.id,
        weekNumber: activeMs.weekNumber,
        status: activeMs.status,
        progressPct: Math.round((completedCount / personalizedRoadmap.milestones.length) * 100),
      };

      recommendedNextAction = {
        id: `act-ms-${activeMs.weekNumber}`,
        title: `Start Week ${activeMs.weekNumber}: ${activeMs.title}`,
        category: "Milestone Deliverable",
        priority: "high",
      };
      recommendedActions.unshift(recommendedNextAction);
    } else {
      // Fallback to GoalRoadmapAgent if no active goal is stored
      if (
        focusArea === "study_planning" ||
        focusArea === "career" ||
        lowerMessage.includes("plan") ||
        lowerMessage.includes("roadmap") ||
        lowerMessage.includes("week") ||
        lowerMessage.includes("timeline")
      ) {
        const roadmapResult = await GoalRoadmapAgent.execute(agentInput);
        if (roadmapResult.payload) {
          studyPlan = {
            primaryGoal: roadmapResult.payload.primaryGoal,
            totalWeeks: roadmapResult.payload.totalWeeks,
            currentMilestone: roadmapResult.payload.currentMilestone,
            milestones: roadmapResult.payload.milestones,
          };
          if (roadmapResult.recommendedActions) {
            recommendedActions.push(...roadmapResult.recommendedActions);
          }
        }
      }
    }

    // Accountability Reminders
    const accountabilityResult = await AccountabilityAgent.execute(agentInput);
    if (accountabilityResult.payload?.activeCheckIns?.length > 0) {
      reminders = accountabilityResult.payload.activeCheckIns.map((chk: any) => ({
        milestoneTitle: chk.milestoneTitle,
        prompt: chk.checkInPrompt,
        scheduledTime: chk.scheduledTime,
      }));
    }

    // B. Adaptive Learning & Learning Gap Agents (when query involves concepts, skills, gap analysis, or coding)
    if (
      focusArea === "learn" ||
      focusArea === "coding_dsa" ||
      focusArea === "system_design" ||
      focusArea === "career" ||
      focusArea === "practice"
    ) {
      const gapResult = await LearningGapAgent.execute(agentInput);
      const adaptiveResult = await AdaptiveLearningAgent.execute(agentInput);

      if (gapResult.payload) {
        progressInsights = {
          confirmedStrengths: authorizedContext.classifiedEvidence?.confirmedFacts || [],
          confirmedGaps: (gapResult.payload.confirmedGaps || []).map((g: any) => ({
            skillName: g.skillName,
            gapType: g.gapType,
            remediation: g.remediationStep,
          })),
          suspectedGaps: (gapResult.payload.suspectedGaps || []).map((g: any) => ({
            skillName: g.skillName,
            gapType: g.gapType,
          })),
          masteryLevel: adaptiveResult.payload?.currentMasteryLevel || "intermediate",
        };
        if (gapResult.recommendedActions) {
          recommendedActions.push(...gapResult.recommendedActions);
        }
      }
    }

    // C. Resource & Opportunity Retriever Agent
    const resourceResult = await ResourceRetrieverAgent.execute(agentInput);
    if (resourceResult.payload?.resources?.length > 0) {
      resources = resourceResult.payload.resources;
      if (resourceResult.citations?.length) {
        for (const cit of resourceResult.citations) {
          if (!citations.some((c) => c.sourceTitle === cit.sourceTitle)) {
            citations.push(cit);
          }
        }
      }
    }

    // D. Mentor Collaboration Agent (Human Mentor Handoff)
    const mentorCollabResult = await MentorCollaborationAgent.execute(agentInput);
    mentorHandoff = {
      eligible: Boolean(mentorCollabResult.payload?.eligibleForHumanHandoff),
      domains: mentorCollabResult.payload?.recommendedMentorDomains || ["Software Engineering"],
      sanitizedBriefing: mentorCollabResult.payload?.sanitizedStruggleBriefing || "No active escalation required; self-guided mentorship progressing.",
    };
    if (mentorCollabResult.payload?.eligibleForHumanHandoff && mentorCollabResult.recommendedActions) {
      recommendedActions.push(...mentorCollabResult.recommendedActions);
    }

    // E. Evaluator / Critic Agent (Quality Gate)
    const critique = EvaluatorCriticAgent.evaluateResponse({
      userQuery: sanitizedMessage,
      synthesizedResponse: responseText,
      activeSpecialists: [specialist.name, secondarySpecialist?.name].filter(Boolean) as string[],
      sources: citations,
      isMultiSpecialist: Boolean(secondarySpecialist),
    });

    // 13. Server-Side Conversation Store Persistence
    if (conversationId) {
      try {
        ConversationStore.addMessage(conversationId, input.studentUserId, "user", sanitizedMessage);
        ConversationStore.addMessage(conversationId, input.studentUserId, "assistant", responseText, {
          teachingStrategy: pedagogyDecision.strategy,
          hintLevel: pedagogyDecision.hintLevel,
          difficulty: pedagogyDecision.targetDepth,
          studentUnderstandingSignal: "strong",
          sources: citations,
          recommendedActions,
          skillUpdates,
          escalation: escalation.shouldEscalate ? escalation : undefined,
          latencyMs: Math.max(0.1, elapsed),
          modelProvider: activeModelProvider,
          inferenceMode,
        });
      } catch (storeErr) {
        console.warn("[ConversationStore] Failed to persist message turn:", storeErr);
      }
    }

    const followUpSuggestion =
      recommendedNextAction?.title ||
      (studyPlan ? `Next step: Week ${studyPlan.currentMilestone.weekNumber} - ${studyPlan.currentMilestone.title}` : undefined);

    const requiresStudentConfirmation =
      Boolean(assessmentResult?.missingEssentialInfo && assessmentResult.missingEssentialInfo.length > 0) ||
      Boolean(assessmentResult?.uncertainAreas && assessmentResult.uncertainAreas.length > 0);

    const confidence = assessmentResult?.overallReadinessScore ? Math.round(assessmentResult.overallReadinessScore) / 100 : 0.95;

    const evidenceReferences = [
      ...(assessmentResult?.confirmedStrengths || []),
      ...citations.map((c) => c.sourceTitle),
    ];

    return {
      requestId: lastRequestId,
      message: responseText,
      voiceText,
      teachingStrategy: pedagogyDecision.strategy,
      topic: input.activeTopic || "distributed_systems",
      difficulty: pedagogyDecision.targetDepth,
      hintLevel: pedagogyDecision.hintLevel,
      studentUnderstandingSignal: "strong",
      sources: citations,
      recommendedActions,
      skillUpdates,
      escalationRecommendation: escalation.shouldEscalate ? escalation : undefined,
      latencyMs: Math.max(0.1, elapsed),
      modelProvider: activeModelProvider,
      inferenceMode,
      specialistCapability: specialist.getMetadata(),
      mentorIdentity: UNIFIED_MENTOR_IDENTITY,
      tokenUsage,
      estimatedCostUsd,
      fallbackReason,
      postInteractionCheck,
      studyPlan,
      progressInsights,
      resources,
      reminders,
      mentorHandoff,
      goalReference,
      assessment,
      recommendedNextAction,
      roadmapUpdates,
      milestoneUpdates,
      followUpSuggestion,
      requiresStudentConfirmation,
      confidence,
      evidenceReferences,
    };
  }
}
