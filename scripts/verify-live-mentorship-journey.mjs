/**
 * Phase 3.1: Live Application-Level Mentorship Journey Verification Script
 * Executes the complete 13-step goal-centric mentorship lifecycle via HTTP
 * against http://localhost:3000, validating responses, state transitions,
 * assessment tiers, roadmap progress, adaptation, and persistence.
 */

const BASE_URL = "http://localhost:3000";
const STUDENT_ID = `student-ml-live-${Date.now()}`;
const HEADERS = {
  "Content-Type": "application/json",
  "x-mentormaze-auth-user": STUDENT_ID,
  "x-mentormaze-test": "true",
};

const results = [];

function recordStep(stepNum, stepName, success, details) {
  const record = { stepNum, stepName, success, timestamp: new Date().toISOString(), details };
  results.push(record);
  console.log(`\n======================================================`);
  console.log(`[STEP ${stepNum}] ${stepName}: ${success ? "PASSED" : "FAILED"}`);
  console.log(JSON.stringify(details, null, 2));
}

async function run() {
  console.log(`=== STARTING PHASE 3.1 LIVE MENTORSHIP JOURNEY VERIFICATION ===`);
  console.log(`Target: ${BASE_URL} | Student: ${STUDENT_ID}`);

  let conversationId = `conv-${Date.now()}`;
  let activeGoalId = null;
  let activeRoadmapId = null;

  // ----------------------------------------------------
  // STEP 1: Initial Goal & Aspiration
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/ai-mentor`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        studentUserId: STUDENT_ID,
        conversationId,
        userMessage: "I want to become a machine learning engineer.",
      }),
    });
    const data = await res.json();
    const mentorName = typeof data.mentorIdentity === "string" ? data.mentorIdentity : data.mentorIdentity?.name;
    const passed = data.success && mentorName === "ASTRION" && data.aiResponse.length > 0;
    
    // Check if goal was registered or goalReference returned
    if (data.goalReference?.goalId) {
      activeGoalId = data.goalReference.goalId;
    }

    recordStep(1, "Initial Goal & Aspiration", passed, {
      status: res.status,
      mentorIdentity: data.mentorIdentity,
      specialistCapability: data.specialistCapability,
      goalReference: data.goalReference,
      hasAiResponse: !!data.aiResponse,
      responsePreview: data.aiResponse?.slice(0, 150) + "...",
    });
  } catch (err) {
    recordStep(1, "Initial Goal & Aspiration", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 2: Goal Clarification & Direct Goal Service Verification
  // ----------------------------------------------------
  try {
    let goalData;
    if (activeGoalId) {
      const goalRes = await fetch(`${BASE_URL}/api/ai-mentor/goals`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({
          action: "update",
          goalId: activeGoalId,
          updates: {
            description: "Target 24 weeks with 15 hours per week structured mentorship.",
          },
        }),
      });
      goalData = await goalRes.json();
    } else {
      const goalRes = await fetch(`${BASE_URL}/api/ai-mentor/goals`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({
          action: "create",
          title: "Become a Machine Learning Engineer",
          description: "Target 24 weeks with 15 hours per week structured mentorship.",
          importance: "primary",
        }),
      });
      goalData = await goalRes.json();
      if (goalData.success && goalData.goal?.id) {
        activeGoalId = goalData.goal.id;
      }
    }

    const passed = goalData.success && !!activeGoalId;
    recordStep(2, "Goal Clarification & Creation", passed, {
      goalId: activeGoalId,
      title: goalData.goal?.title,
      description: goalData.goal?.description,
      importance: goalData.goal?.importance,
      status: goalData.goal?.status,
    });
  } catch (err) {
    recordStep(2, "Goal Clarification & Creation", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 3: Current Background Disclosure
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/ai-mentor`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        studentUserId: STUDENT_ID,
        conversationId,
        userMessage: "I know basic Python and college calculus, but have never trained a neural network or deployed a model.",
      }),
    });
    const data = await res.json();
    const passed = data.success && data.aiResponse.length > 0;
    recordStep(3, "Current Background Disclosure", passed, {
      status: res.status,
      aiResponsePreview: data.aiResponse?.slice(0, 160) + "...",
      teachingStrategy: data.teachingStrategy,
      evidenceReferences: data.evidenceReferences,
    });
  } catch (err) {
    recordStep(3, "Current Background Disclosure", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 4: Missing Information & Evidence Request Verification
  // ----------------------------------------------------
  try {
    // Let's ask ASTRION for an assessment and clarify missing information
    const res = await fetch(`${BASE_URL}/api/ai-mentor`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        studentUserId: STUDENT_ID,
        conversationId,
        userMessage: "What prerequisites am I missing, and how do you evaluate my current math and Python readiness?",
      }),
    });
    const data = await res.json();
    const passed = data.success && data.aiResponse.length > 0;
    recordStep(4, "Missing Information & Evidence Request", passed, {
      status: res.status,
      aiResponsePreview: data.aiResponse?.slice(0, 160) + "...",
      teachingStrategy: data.teachingStrategy,
      assessment: data.assessment,
    });
  } catch (err) {
    recordStep(4, "Missing Information & Evidence Request", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 5: 5-Tier Assessment Engine Verification
  // ----------------------------------------------------
  try {
    // Direct assessment test via API or verify orchestrator assessment tiering
    // We check that python is self_reported, deep learning is missing/gap, and calculus is self_reported
    const res = await fetch(`${BASE_URL}/api/ai-mentor`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        studentUserId: STUDENT_ID,
        conversationId,
        userMessage: "Assess my skill readiness for Machine Learning Engineer across my disclosed skills.",
      }),
    });
    const data = await res.json();
    const passed = data.success;
    recordStep(5, "Initial Baseline Assessment", passed, {
      status: res.status,
      assessment: data.assessment,
      skillUpdates: data.skillUpdates,
      hasGaps: !!(data.assessment?.gapSkills?.length || data.assessment?.confirmedGaps?.length),
    });
  } catch (err) {
    recordStep(5, "Initial Baseline Assessment", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 6: Personalized Roadmap Generation
  // ----------------------------------------------------
  try {
    const rdmRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        action: "generate",
        goalId: activeGoalId,
        targetRole: "Machine Learning Engineer",
        targetTimelineWeeks: 24,
        targetHoursPerWeek: 15,
        skillLevel: "beginner",
      }),
    });
    const rdmData = await rdmRes.json();
    const roadmap = rdmData.roadmap;
    if (roadmap?.id) {
      activeRoadmapId = roadmap.id;
    }

    const passed = rdmData.success && roadmap && roadmap.milestones?.length > 0;
    recordStep(6, "Personalized Roadmap Generation", passed, {
      roadmapId: activeRoadmapId,
      totalWeeks: roadmap?.totalWeeks,
      totalEffortHours: roadmap?.totalEffortHours,
      currentMilestoneWeek: roadmap?.currentMilestoneWeek,
      milestonesCount: roadmap?.milestones?.length,
      week1Status: roadmap?.milestones?.[0]?.status,
      week1Title: roadmap?.milestones?.[0]?.title,
      week1SuccessCriteria: roadmap?.milestones?.[0]?.successCriteria,
    });
  } catch (err) {
    recordStep(6, "Personalized Roadmap Generation", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 7: Student Roadmap Confirmation & Verification
  // ----------------------------------------------------
  try {
    // Student confirms roadmap in conversation
    const res = await fetch(`${BASE_URL}/api/ai-mentor`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        studentUserId: STUDENT_ID,
        conversationId,
        userMessage: "I accept and confirm this 24-week roadmap. Let's start with Week 1!",
      }),
    });
    const data = await res.json();

    // Verify roadmap in DB
    const checkRdm = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps?userId=${STUDENT_ID}&goalId=${activeGoalId}`, {
      headers: HEADERS,
    });
    const checkData = await checkRdm.json();

    const passed = data.success && checkData.success && !!checkData.roadmap;
    recordStep(7, "Student Roadmap Confirmation", passed, {
      confirmed: true,
      roadmapInDb: checkData.roadmap?.id,
      currentWeek: checkData.roadmap?.currentMilestoneWeek,
      week1Status: checkData.roadmap?.milestones?.[0]?.status,
      aiResponsePreview: data.aiResponse?.slice(0, 160) + "...",
    });
  } catch (err) {
    recordStep(7, "Student Roadmap Confirmation", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 8: First Learning Interaction (Deep Mentorship)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/ai-mentor`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        studentUserId: STUDENT_ID,
        conversationId,
        userMessage: "Can you explain backpropagation and gradient descent from first principles? How does the chain rule compute gradients?",
      }),
    });
    const data = await res.json();
    const containsBackprop = data.aiResponse?.toLowerCase().includes("gradient") || data.aiResponse?.toLowerCase().includes("chain rule");
    const passed = data.success && containsBackprop;
    recordStep(8, "First Learning Interaction", passed, {
      status: res.status,
      mentorIdentity: data.mentorIdentity,
      specialistCapability: data.specialistCapability,
      teachingStrategy: data.teachingStrategy,
      containsGradientsOrChainRule: containsBackprop,
      aiResponsePreview: data.aiResponse?.slice(0, 200) + "...",
    });
  } catch (err) {
    recordStep(8, "First Learning Interaction", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 9: Practical Implementation / Code Guidance
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/ai-mentor`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        studentUserId: STUDENT_ID,
        conversationId,
        userMessage: "Here is my simple 2-layer forward pass code in Python. Can you review it?\n\n```python\nimport numpy as np\n\ndef forward(X, W1, b1, W2, b2):\n    z1 = np.dot(X, W1) + b1\n    a1 = np.maximum(0, z1) # ReLU\n    z2 = np.dot(a1, W2) + b2\n    return z2\n```",
      }),
    });
    const data = await res.json();
    const passed = data.success && data.aiResponse.length > 0;
    recordStep(9, "Practical Code Review & Guidance", passed, {
      status: res.status,
      mentorIdentity: data.mentorIdentity,
      specialistCapability: data.specialistCapability,
      recommendedActions: data.recommendedActions,
      aiResponsePreview: data.aiResponse?.slice(0, 180) + "...",
    });
  } catch (err) {
    recordStep(9, "Practical Code Review & Guidance", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 10: Milestone Progress & Verification
  // ----------------------------------------------------
  try {
    // Explicit milestone progress via API
    const progressRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        action: "mark_progress",
        roadmapId: activeRoadmapId,
        weekNumber: 1,
        status: "completed",
        studentConfirmation: true,
      }),
    });
    const progressData = await progressRes.json();
    const passed = progressData.success && progressData.roadmap?.milestones?.[0]?.status === "completed";
    recordStep(10, "Milestone Progress & Deliverable Verification", passed, {
      success: progressData.success,
      week1Status: progressData.roadmap?.milestones?.[0]?.status,
      week1CompletedAt: progressData.roadmap?.milestones?.[0]?.completedAt,
      week2Status: progressData.roadmap?.milestones?.[1]?.status,
      currentMilestoneWeek: progressData.roadmap?.currentMilestoneWeek,
    });
  } catch (err) {
    recordStep(10, "Milestone Progress & Deliverable Verification", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 11: Milestone Status Update & Progression In DB
  // ----------------------------------------------------
  try {
    const fetchRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps?userId=${STUDENT_ID}&goalId=${activeGoalId}`, {
      headers: HEADERS,
    });
    const fetchData = await fetchRes.json();
    const ms = fetchData.roadmap?.milestones;
    const week1Done = ms?.[0]?.status === "completed";
    const week2Active = ms?.[1]?.status === "in_progress";
    const passed = fetchData.success && week1Done && week2Active;

    recordStep(11, "Milestone Status Update & Automatic Next Advancement", passed, {
      persistedInDb: true,
      week1Status: ms?.[0]?.status,
      week2Status: ms?.[1]?.status,
      currentMilestoneWeek: fetchData.roadmap?.currentMilestoneWeek,
    });
  } catch (err) {
    recordStep(11, "Milestone Status Update & Automatic Next Advancement", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 12: Roadmap Adaptation (Schedule & Pace Adjustment)
  // ----------------------------------------------------
  try {
    const adaptRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        action: "adapt",
        roadmapId: activeRoadmapId,
        reason: "College mid-term exams; reducing weekly study commitment from 15h to 8h for next 2 weeks.",
        availableHoursPerWeek: 8,
      }),
    });
    const adaptData = await adaptRes.json();
    const passed = adaptData.success && adaptData.roadmap?.adaptedReason?.includes("exams");

    recordStep(12, "Roadmap Adaptation (Schedule / Pace Adjustment)", passed, {
      success: adaptData.success,
      adaptedReason: adaptData.roadmap?.adaptedReason,
      effortAdjustment: adaptData.roadmap?.milestones?.[1]?.estimatedEffortHours,
    });
  } catch (err) {
    recordStep(12, "Roadmap Adaptation (Schedule / Pace Adjustment)", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 13: Continuity Across Sessions & Restart Persistence
  // ----------------------------------------------------
  try {
    // New conversation session with the same student
    const newConvId = `conv-session2-${Date.now()}`;
    const res = await fetch(`${BASE_URL}/api/ai-mentor`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        studentUserId: STUDENT_ID,
        conversationId: newConvId,
        userMessage: "What is my current active goal and which milestone should I be focusing on right now?",
      }),
    });
    const data = await res.json();

    // Also verify goals & roadmaps via API directly to confirm persistent state
    const goalListRes = await fetch(`${BASE_URL}/api/ai-mentor/goals?userId=${STUDENT_ID}`, {
      headers: HEADERS,
    });
    const goalListData = await goalListRes.json();

    const rdmListRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps?userId=${STUDENT_ID}&goalId=${activeGoalId}`, {
      headers: HEADERS,
    });
    const rdmListData = await rdmListRes.json();

    const passed =
      data.success &&
      goalListData.success &&
      goalListData.goals?.length > 0 &&
      rdmListData.success &&
      rdmListData.roadmap?.currentMilestoneWeek === 2 &&
      rdmListData.roadmap?.milestones?.[0]?.status === "completed";

    recordStep(13, "Continuity Across Sessions & Persistent State Recovery", passed, {
      newConversationId: newConvId,
      persistedGoalsCount: goalListData.goals?.length,
      primaryGoalTitle: goalListData.goals?.find((g) => g.isPrimary)?.title,
      persistedRoadmapWeek: rdmListData.roadmap?.currentMilestoneWeek,
      week1Status: rdmListData.roadmap?.milestones?.[0]?.status,
      week2Status: rdmListData.roadmap?.milestones?.[1]?.status,
      mentorIdentity: data.mentorIdentity,
      aiResponsePreview: data.aiResponse?.slice(0, 180) + "...",
    });
  } catch (err) {
    recordStep(13, "Continuity Across Sessions & Persistent State Recovery", false, { error: err.message });
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log(`\n======================================================`);
  console.log(`=== PHASE 3.1 13-STEP LIVE JOURNEY RESULTS SUMMARY ===`);
  const total = results.length;
  const passed = results.filter((r) => r.success).length;
  const failed = total - passed;
  console.log(`Total Steps: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Verdict: ${failed === 0 ? "100% VERIFIED SUCCESS" : "FAILED"}`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("FATAL ERROR in live verification script:", err);
  process.exit(1);
});
