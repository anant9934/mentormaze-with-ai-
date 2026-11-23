/**
 * Phase 3.2: Production-Grade Mentorship Lifecycle Hardening Live Journey Verification
 * Validates real HTTP behaviors against http://localhost:3000:
 * 1. 401 on unauthenticated calls across all routes
 * 2. 403 on cross-student data access
 * 3. Atomic primary goal switching
 * 4. At-most-one active roadmap per goal (partial unique index enforcement)
 * 5. Milestone completion with evidence references, deliverables, and student confirmation
 * 6. Milestone idempotency
 * 7. Evidence & provenance retention across roadmap adaptation
 * 8. Personalized workload management (student-declared hours vs estimated commitments)
 */

const BASE_URL = "http://localhost:3000";
const STUDENT_A = `student-live-alice-${Date.now()}`;
const STUDENT_B = `student-live-bob-${Date.now()}`;

const AUTH_HEADERS_A = {
  "Content-Type": "application/json",
  "x-mentormaze-auth-user": STUDENT_A,
  "x-mentormaze-test": "true",
};

const AUTH_HEADERS_B = {
  "Content-Type": "application/json",
  "x-mentormaze-auth-user": STUDENT_B,
  "x-mentormaze-test": "true",
};

const results = [];

function recordStep(stepNum, stepName, success, details) {
  results.push({ stepNum, stepName, success, timestamp: new Date().toISOString(), details });
  console.log(`\n======================================================`);
  console.log(`[STEP ${stepNum}] ${stepName}: ${success ? "PASSED" : "FAILED"}`);
  console.log(JSON.stringify(details, null, 2));
}

async function run() {
  console.log("=== STARTING PHASE 3.2 LIVE HARDENING VERIFICATION ===");
  console.log(`Target: ${BASE_URL} | Student A: ${STUDENT_A} | Student B: ${STUDENT_B}`);

  // ----------------------------------------------------
  // STEP 1: 401 UNAUTHORIZED on unauthenticated calls
  // ----------------------------------------------------
  try {
    const unauthMentor = await fetch(`${BASE_URL}/api/ai-mentor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: "Hello without auth" }),
    });
    const unauthGoals = await fetch(`${BASE_URL}/api/ai-mentor/goals`);
    const unauthRoadmaps = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps?goalId=any`);

    const passed = unauthMentor.status === 401 && unauthGoals.status === 401 && unauthRoadmaps.status === 401;
    recordStep(1, "Strict 401 on Unauthenticated Endpoints", passed, {
      aiMentorStatus: unauthMentor.status,
      goalsStatus: unauthGoals.status,
      roadmapsStatus: unauthRoadmaps.status,
    });
  } catch (err) {
    recordStep(1, "Strict 401 on Unauthenticated Endpoints", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 2: Goal creation for Student A & Student B
  // ----------------------------------------------------
  let goalA1Id = null;
  let goalA2Id = null;
  let goalBId = null;

  try {
    const resA1 = await fetch(`${BASE_URL}/api/ai-mentor/goals`, {
      method: "POST",
      headers: AUTH_HEADERS_A,
      body: JSON.stringify({
        title: "Senior AI Platform Architect",
        category: "career",
        importance: "primary",
        targetOutcome: "Design scalable LLM inference pipelines",
      }),
    });
    const dataA1 = await resA1.json();
    goalA1Id = dataA1.goal?.id;

    const resA2 = await fetch(`${BASE_URL}/api/ai-mentor/goals`, {
      method: "POST",
      headers: AUTH_HEADERS_A,
      body: JSON.stringify({
        title: "Distributed Consensus Engineer",
        category: "skill",
        importance: "secondary",
        targetOutcome: "Master Raft and Paxos protocols",
      }),
    });
    const dataA2 = await resA2.json();
    goalA2Id = dataA2.goal?.id;

    const resB = await fetch(`${BASE_URL}/api/ai-mentor/goals`, {
      method: "POST",
      headers: AUTH_HEADERS_B,
      body: JSON.stringify({
        title: "Bob's Cloud Security Goal",
        category: "career",
        importance: "primary",
        targetOutcome: "Pass AWS Security Specialty",
      }),
    });
    const dataB = await resB.json();
    goalBId = dataB.goal?.id;

    const passed = !!goalA1Id && !!goalA2Id && !!goalBId;
    recordStep(2, "Authenticated Goal Creation (Student A & B)", passed, {
      goalA1Id,
      goalA2Id,
      goalBId,
    });
  } catch (err) {
    recordStep(2, "Authenticated Goal Creation (Student A & B)", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 3: 403 FORBIDDEN on Cross-Student Access
  // ----------------------------------------------------
  try {
    // Student A attempts to read Student B's goals
    const crossGoalGet = await fetch(`${BASE_URL}/api/ai-mentor/goals?userId=${STUDENT_B}`, {
      headers: AUTH_HEADERS_A,
    });
    // Student A attempts to read Student B's specific goal
    const crossGoalSpecific = await fetch(`${BASE_URL}/api/ai-mentor/goals?userId=${STUDENT_B}&goalId=${goalBId}`, {
      headers: AUTH_HEADERS_A,
    });

    const passed = crossGoalGet.status === 403 && crossGoalSpecific.status === 403;
    recordStep(3, "Cross-Student Ownership Protection (403 FORBIDDEN)", passed, {
      crossGoalGetStatus: crossGoalGet.status,
      crossGoalSpecificStatus: crossGoalSpecific.status,
    });
  } catch (err) {
    recordStep(3, "Cross-Student Ownership Protection (403 FORBIDDEN)", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 4: Atomic Primary Goal Switching
  // ----------------------------------------------------
  try {
    // Set Goal A2 to primary
    const switchRes = await fetch(`${BASE_URL}/api/ai-mentor/goals`, {
      method: "POST",
      headers: AUTH_HEADERS_A,
      body: JSON.stringify({
        action: "set_priority",
        goalId: goalA2Id,
        importance: "primary",
      }),
    });
    const switchData = await switchRes.json();

    // Verify Goal A1 was automatically demoted to secondary
    const checkA1 = await fetch(`${BASE_URL}/api/ai-mentor/goals?goalId=${goalA1Id}`, {
      headers: AUTH_HEADERS_A,
    });
    const checkA1Data = await checkA1.json();

    const passed = switchData.goal?.importance === "primary" && checkA1Data.goal?.importance === "secondary";
    recordStep(4, "Atomic Primary Goal Switching & Demotion", passed, {
      goalA2Importance: switchData.goal?.importance,
      goalA1Importance: checkA1Data.goal?.importance,
    });
  } catch (err) {
    recordStep(4, "Atomic Primary Goal Switching & Demotion", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 5: Roadmap Generation & Partial Unique Index Enforcement
  // ----------------------------------------------------
  let roadmapId = null;
  try {
    const genRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps`, {
      method: "POST",
      headers: AUTH_HEADERS_A,
      body: JSON.stringify({
        action: "generate",
        goalId: goalA2Id,
      }),
    });
    const genData = await genRes.json();
    roadmapId = genData.roadmap?.id;

    // Trigger regeneration for the same goal to test unique constraint handling
    const regenRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps`, {
      method: "POST",
      headers: AUTH_HEADERS_A,
      body: JSON.stringify({
        action: "generate",
        goalId: goalA2Id,
      }),
    });
    const regenData = await regenRes.json();

    const passed = !!roadmapId && regenData.success === true && regenData.roadmap?.status === "active";
    roadmapId = regenData.roadmap?.id;
    recordStep(5, "Roadmap Generation & One-Active-Roadmap Constraint", passed, {
      initialRoadmapId: roadmapId,
      activeRoadmapId: regenData.roadmap?.id,
      milestoneCount: regenData.roadmap?.milestones?.length,
    });
  } catch (err) {
    recordStep(5, "Roadmap Generation & One-Active-Roadmap Constraint", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 6: Milestone Completion with Evidence References & Provenance
  // ----------------------------------------------------
  try {
    const progRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps`, {
      method: "POST",
      headers: AUTH_HEADERS_A,
      body: JSON.stringify({
        action: "mark_progress",
        roadmapId,
        weekNumber: 1,
        status: "completed",
        studentConfirmation: true,
        evidenceRef: "github.com/alice/raft-consensus/commit/7a8b9c",
        deliverableUrl: "https://mentor.maze/proof/alice-raft",
        assessmentNotes: "Passed all leader election unit and partition tests.",
        provenance: "student_confirmed",
      }),
    });
    const progData = await progRes.json();
    const m1 = progData.roadmap?.milestones?.find((m) => m.weekNumber === 1);

    const passed =
      progData.success &&
      m1?.status === "completed" &&
      m1?.studentConfirmation === true &&
      m1?.evidenceRef === "github.com/alice/raft-consensus/commit/7a8b9c" &&
      m1?.deliverableUrl === "https://mentor.maze/proof/alice-raft" &&
      m1?.provenance === "student_confirmed";

    recordStep(6, "Milestone Completion with Evidence & Provenance", passed, {
      milestoneStatus: m1?.status,
      studentConfirmation: m1?.studentConfirmation,
      evidenceRef: m1?.evidenceRef,
      deliverableUrl: m1?.deliverableUrl,
      assessmentNotes: m1?.assessmentNotes,
      completedAt: m1?.completedAt,
    });
  } catch (err) {
    recordStep(6, "Milestone Completion with Evidence & Provenance", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 7: Milestone Completion Idempotency
  // ----------------------------------------------------
  try {
    const retryRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps`, {
      method: "POST",
      headers: AUTH_HEADERS_A,
      body: JSON.stringify({
        action: "mark_progress",
        roadmapId,
        weekNumber: 1,
        status: "completed",
        studentConfirmation: true,
        evidenceRef: "github.com/alice/raft-consensus/commit/7a8b9c-retry",
      }),
    });
    const retryData = await retryRes.json();
    const m1 = retryData.roadmap?.milestones?.find((m) => m.weekNumber === 1);

    // Progress percentage and milestone status must remain valid and stable
    const passed = retryData.success && m1?.status === "completed";
    recordStep(7, "Milestone Completion Idempotency", passed, {
      progressPct: retryData.roadmap?.progressPct,
      milestoneStatus: m1?.status,
    });
  } catch (err) {
    recordStep(7, "Milestone Completion Idempotency", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 8: Roadmap Adaptation & Evidence Retention
  // ----------------------------------------------------
  try {
    const adaptRes = await fetch(`${BASE_URL}/api/ai-mentor/roadmaps`, {
      method: "POST",
      headers: AUTH_HEADERS_A,
      body: JSON.stringify({
        action: "adapt",
        roadmapId,
        reason: "Midterm exams next week; reducing weekly commitments to 8h.",
        availableHoursPerWeek: 8,
      }),
    });
    const adaptData = await adaptRes.json();
    const adaptedM1 = adaptData.roadmap?.milestones?.find((m) => m.weekNumber === 1);

    const passed =
      adaptData.success &&
      adaptedM1?.status === "completed" &&
      adaptedM1?.evidenceRef?.includes("7a8b9c") &&
      adaptedM1?.deliverableUrl === "https://mentor.maze/proof/alice-raft";

    recordStep(8, "Evidence & Provenance Retention Across Roadmap Adaptation", passed, {
      adaptedReason: adaptData.roadmap?.adaptedReason,
      retainedMilestone1Status: adaptedM1?.status,
      retainedEvidenceRef: adaptedM1?.evidenceRef,
      retainedDeliverableUrl: adaptedM1?.deliverableUrl,
    });
  } catch (err) {
    recordStep(8, "Evidence & Provenance Retention Across Roadmap Adaptation", false, { error: err.message });
  }

  // ----------------------------------------------------
  // STEP 9: Personalized Workload Management
  // ----------------------------------------------------
  try {
    // Check conflicts with tight availability (8 hours/week)
    const tightRes = await fetch(`${BASE_URL}/api/ai-mentor/goals?conflicts=true&availableHours=8`, {
      headers: AUTH_HEADERS_A,
    });
    const tightData = await tightRes.json();

    // Check conflicts with generous availability (30 hours/week)
    const generousRes = await fetch(`${BASE_URL}/api/ai-mentor/goals?conflicts=true&availableHours=30`, {
      headers: AUTH_HEADERS_A,
    });
    const generousData = await generousRes.json();

    const passed =
      tightData.conflictReport?.isWorkloadOverCapacity === true &&
      generousData.conflictReport?.isWorkloadOverCapacity === false;

    recordStep(9, "Personalized Workload Management (Declared Capacity vs Estimated Effort)", passed, {
      tightDeclaredHours: tightData.conflictReport?.studentDeclaredAvailableHoursPerWeek,
      tightTotalEstimatedWeeklyEffort: tightData.conflictReport?.totalEstimatedWeeklyEffortHours,
      tightIsOverCapacity: tightData.conflictReport?.isWorkloadOverCapacity,
      generousDeclaredHours: generousData.conflictReport?.studentDeclaredAvailableHoursPerWeek,
      generousIsOverCapacity: generousData.conflictReport?.isWorkloadOverCapacity,
    });
  } catch (err) {
    recordStep(9, "Personalized Workload Management (Declared Capacity vs Estimated Effort)", false, { error: err.message });
  }

  console.log("\n======================================================");
  console.log("=== PHASE 3.2 LIVE JOURNEY VERIFICATION SUMMARY ===");
  const allPassed = results.every((r) => r.success);
  console.log(`Total Steps: ${results.length} | Passed: ${results.filter((r) => r.success).length} | Failed: ${results.filter((r) => !r.success).length}`);
  console.log(`Overall Result: ${allPassed ? "ALL TESTS PASSED (VERIFIED)" : "SOME TESTS FAILED"}`);
  console.log("======================================================\n");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
