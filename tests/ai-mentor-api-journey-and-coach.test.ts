import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as journeyGet, POST as journeyPost } from "@/app/api/ai-mentor/learning-journey/route";
import { GET as coachGet, POST as coachPost } from "@/app/api/ai-mentor/communication-coach/route";
import { POST as mentorTurnPost } from "@/app/api/ai-mentor/route";
import { BloomLearningJourneyService } from "@/lib/ai-mentor/learning-journey/bloom-journey-service";
import { SocialCommunicationCoachService } from "@/lib/ai-mentor/communication/social-coach-service";
import { StudentSkillGraph } from "@/lib/ai-mentor/student-skill-graph";
import { BayesianKnowledgeTracer } from "@/lib/ai-mentor/pedagogy/bkt-service";
import { FSRSScheduler } from "@/lib/ai-mentor/pedagogy/fsrs-service";

describe("ASTRION Learning Journey & Communication Coach API Route Endpoints", () => {
  const TEST_STUDENT = "student-api-test-01";
  const OTHER_STUDENT = "student-api-test-02";

  beforeEach(() => {
    BloomLearningJourneyService.reset();
    SocialCommunicationCoachService.reset();
    StudentSkillGraph.reset();
    BayesianKnowledgeTracer.reset();
    FSRSScheduler.reset();
  });

  const createRequest = (url: string, method: string, body?: any, user?: string) => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-mentormaze-test": "true",
    };
    if (user) {
      headers["x-mentormaze-auth-user"] = user;
    }
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  describe("POST & GET /api/ai-mentor/learning-journey", () => {
    it("should reject unauthenticated requests with 401", async () => {
      const req = createRequest("http://localhost:3000/api/ai-mentor/learning-journey", "GET");
      const res = await journeyGet(req);
      expect(res.status).toBe(401);
    });

    it("should create a programme, record feedback, and evaluate exercise via API", async () => {
      // 1. Create Programme
      const createReq = createRequest(
        "http://localhost:3000/api/ai-mentor/learning-journey",
        "POST",
        {
          action: "create",
          goalId: "goal-101",
          topicName: "dynamic_programming",
        },
        TEST_STUDENT
      );
      const createRes = await journeyPost(createReq);
      expect(createRes.status).toBe(200);
      const createData = await createRes.json();
      expect(createData.success).toBe(true);
      const progId = createData.programme.id;
      const lesson0 = createData.programme.lessons[0];

      // 2. Submit Feedback
      const feedbackReq = createRequest(
        "http://localhost:3000/api/ai-mentor/learning-journey",
        "POST",
        {
          action: "feedback",
          programmeId: progId,
          lessonId: lesson0.id,
          feedback: {
            rating: 5,
            clarity: "clear",
            comment: "Very clear explanation",
            timestamp: new Date().toISOString(),
          },
        },
        TEST_STUDENT
      );
      const feedbackRes = await journeyPost(feedbackReq);
      expect(feedbackRes.status).toBe(200);

      // 3. Evaluate Exercise
      const evalReq = createRequest(
        "http://localhost:3000/api/ai-mentor/learning-journey",
        "POST",
        {
          action: "evaluate",
          programmeId: progId,
          lessonId: lesson0.id,
          score: 9.5,
          feedback: "Optimal recurrence relation.",
        },
        TEST_STUDENT
      );
      const evalRes = await journeyPost(evalReq);
      expect(evalRes.status).toBe(200);
      const evalData = await evalRes.json();
      expect(evalData.evaluation.isPassed).toBe(true);

      // 4. GET Programme
      const getReq = createRequest(
        `http://localhost:3000/api/ai-mentor/learning-journey?programmeId=${progId}`,
        "GET",
        undefined,
        TEST_STUDENT
      );
      const getRes = await journeyGet(getReq);
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.programme.lessons[0].status).toBe("completed");

      // 5. GET Export Markdown
      const exportReq = createRequest(
        `http://localhost:3000/api/ai-mentor/learning-journey?programmeId=${progId}&export=true`,
        "GET",
        undefined,
        TEST_STUDENT
      );
      const exportRes = await journeyGet(exportReq);
      expect(exportRes.status).toBe(200);
      const exportData = await exportRes.json();
      expect(exportData.markdown).toContain("ASTRION Learning Programme Summary");

      // 6. Cross-student access rejection (403)
      const crossReq = createRequest(
        `http://localhost:3000/api/ai-mentor/learning-journey?programmeId=${progId}&userId=${TEST_STUDENT}`,
        "GET",
        undefined,
        OTHER_STUDENT
      );
      const crossRes = await journeyGet(crossReq);
      expect(crossRes.status).toBe(403);
    });
  });

  describe("POST & GET /api/ai-mentor/communication-coach", () => {
    it("should start simulation, process turns, and complete evaluation via API", async () => {
      // 1. Start simulation
      const startReq = createRequest(
        "http://localhost:3000/api/ai-mentor/communication-coach",
        "POST",
        {
          action: "start",
          scenarioType: "salary_negotiation",
        },
        TEST_STUDENT
      );
      const startRes = await coachPost(startReq);
      expect(startRes.status).toBe(200);
      const startData = await startRes.json();
      const sessionId = startData.session.id;

      // 2. Process student dialogue turn
      const turnReq = createRequest(
        "http://localhost:3000/api/ai-mentor/communication-coach",
        "POST",
        {
          action: "turn",
          sessionId,
          studentMessage: "Based on verified market benchmarks (22-24 LPA) for SDE-1, I propose 21.5 LPA base.",
        },
        TEST_STUDENT
      );
      const turnRes = await coachPost(turnReq);
      expect(turnRes.status).toBe(200);
      const turnData = await turnRes.json();
      expect(turnData.coachingWhisper).toBeDefined();
      expect(turnData.counterpartReply).toBeDefined();

      // 3. Complete and evaluate simulation
      const evalReq = createRequest(
        "http://localhost:3000/api/ai-mentor/communication-coach",
        "POST",
        {
          action: "evaluate",
          sessionId,
        },
        TEST_STUDENT
      );
      const evalRes = await coachPost(evalReq);
      expect(evalRes.status).toBe(200);
      const evalData = await evalRes.json();
      expect(evalData.evaluation.overallScore).toBeGreaterThan(0);
      expect(evalData.evaluation.exemplaryRewrite).toBeDefined();

      // 4. Retry simulation
      const retryReq = createRequest(
        "http://localhost:3000/api/ai-mentor/communication-coach",
        "POST",
        {
          action: "retry",
          sessionId,
          adjustedAttitude: "demanding",
        },
        TEST_STUDENT
      );
      const retryRes = await coachPost(retryReq);
      expect(retryRes.status).toBe(200);
      const retryData = await retryRes.json();
      expect(retryData.session.counterpartPersona.attitude).toBe("demanding");

      // 5. Cross-student simulation retrieval rejection (403)
      const crossReq = createRequest(
        `http://localhost:3000/api/ai-mentor/communication-coach?sessionId=${sessionId}&userId=${TEST_STUDENT}`,
        "GET",
        undefined,
        OTHER_STUDENT
      );
      const crossRes = await coachGet(crossReq);
      expect(crossRes.status).toBe(403);
    });
  });

  describe("POST /api/ai-mentor with Adaptive Context", () => {
    it("should return adaptiveContext in main turn response payload", async () => {
      const turnReq = createRequest(
        "http://localhost:3000/api/ai-mentor",
        "POST",
        {
          userMessage: "Explain the recurrence relationship of longest common subsequence.",
          focusArea: "coding_dsa",
          activeTopic: "dynamic_programming",
        },
        TEST_STUDENT
      );
      const turnRes = await mentorTurnPost(turnReq);
      expect(turnRes.status).toBe(200);
      const turnData = await turnRes.json();
      expect(turnData.success).toBe(true);
      expect(turnData.adaptiveContext).toBeDefined();
      expect(turnData.adaptiveContext.currentSkill).toBe("dynamic_programming");
      expect(turnData.adaptiveContext.demonstratedMastery).toContain("Level");
      expect(turnData.adaptiveContext.bktMasteryBand).toBeDefined();
      expect(turnData.adaptiveContext.fsrsStabilityDays).toBeGreaterThan(0);
    });
  });
});
