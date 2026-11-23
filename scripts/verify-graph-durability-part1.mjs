import { PGlite } from "@electric-sql/pglite";
import path from "path";

const testStudentId = "usr-durability-test-student";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  console.log(`[Part 1] Connecting to persistent database at: ${dataDir}`);
  const client = new PGlite(dataDir);

  const now = new Date();
  const nowIso = now.toISOString();

  console.log(`\n=== Creating durable test entities for ${testStudentId} ===`);

  // 1. Create student_learning_profiles
  await client.query(`
    INSERT INTO student_learning_profiles (
      id, student_user_id, preferred_language, preferred_pacing, target_role,
      target_graduation_year, current_level, learning_style, institution, degree,
      confirmed_strengths, confirmed_weaknesses, system_hypotheses, learning_goals,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    );
  `, [
    `slp-${testStudentId}`,
    testStudentId,
    "en",
    "intensive",
    "Staff Distributed Systems Architect",
    2026,
    "advanced",
    "systems_first_principles",
    "Indian Institute of Technology, Bombay",
    "M.Tech in Distributed Systems & Networking",
    JSON.stringify(["Raft Consensus", "LSM Trees", "Zero-Copy IO"]),
    JSON.stringify(["Byzantine Fault Tolerance", "Paxos Multi-Leader Quorums"]),
    JSON.stringify(["May assume Raft guarantees linearizable reads without lease read / index read"]),
    JSON.stringify(["Implement Raft with joint consensus cluster membership changes"]),
    nowIso,
  ]);
  console.log("1. Created learning profile in SQL.");

  // 2. Create student_skill_nodes
  await client.query(`
    INSERT INTO student_skill_nodes (
      id, student_user_id, skill_id, skill_name, category, mastery_state,
      mastery_score, confidence, assessment_count, success_count,
      known_weaknesses, common_misconceptions, evidence_type,
      is_independently_verified, evidence_source, evidence_id,
      last_assessed_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
    );
  `, [
    `skn-${testStudentId}-raft`,
    testStudentId,
    "distributed_consensus_raft",
    "Raft Consensus Protocol & State Machine Replication",
    "System Design",
    "consistently_demonstrated",
    9.6,
    0.98,
    12,
    12,
    JSON.stringify(["Log compaction with snapshot chunk streaming"]),
    JSON.stringify(["Confusing election timeout with heartbeat interval"]),
    "independently_verified",
    true,
    "Proctored Chaos Engineering Benchmarking Lab",
    `ev-${testStudentId}-raft-cert`,
    nowIso,
    nowIso,
  ]);
  console.log("2. Created skill node in SQL.");

  // 3. Create student_intelligence_evidence
  await client.query(`
    INSERT INTO student_intelligence_evidence (
      id, student_user_id, entity_type, entity_id, source_type, source_system,
      source_reference, evidence_type, confidence, verification_status, purpose,
      observed_at, metadata, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    );
  `, [
    `ev-${testStudentId}-raft-cert`,
    testStudentId,
    "skill",
    "distributed_consensus_raft",
    "assessment",
    "ChaosMesh Testing Suite",
    "lab-run-99824",
    "independently_verified",
    0.98,
    "independently_verified",
    "service_personalization",
    nowIso,
    JSON.stringify({ score: 98, jepsenTestPassed: true, splitBrainRecovered: true }),
    nowIso,
    nowIso,
  ]);
  console.log("3. Created intelligence evidence in SQL.");

  // 4. Create student_projects
  await client.query(`
    INSERT INTO student_projects (
      id, student_user_id, title, description, role, technologies, outcomes,
      repository_url, source_system, verification_status, evidence_id,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    );
  `, [
    `proj-${testStudentId}-raft-cluster`,
    testStudentId,
    "Distributed Sharded Raft Key-Value Cluster with Multi-Paxos Fallback",
    "Fault-tolerant linearizable distributed storage cluster with automatic leader election and log replication.",
    "Principal Distributed Systems Architect",
    JSON.stringify(["Go", "Raft", "gRPC", "Prometheus", "Docker", "eBPF"]),
    "Sustained 120,000 writes/sec with linearizable consistency verified via Jepsen testing.",
    "https://github.com/mentormaze/raft-cluster",
    "MentorMaze",
    "independently_verified",
    `ev-${testStudentId}-raft-cert`,
    nowIso,
    nowIso,
  ]);
  console.log("4. Created student project in SQL.");

  // 5. Create ai_mentor_roadmaps & ai_mentor_roadmap_milestones
  await client.query(`
    INSERT INTO ai_mentor_roadmaps (
      id, student_user_id, target_role, current_level, target_timeline_weeks,
      progress_pct, status, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    );
  `, [
    `rdm-${testStudentId}`,
    testStudentId,
    "Staff Distributed Systems Architect",
    "advanced",
    12,
    75,
    "active",
    nowIso,
    nowIso,
  ]);

  await client.query(`
    INSERT INTO ai_mentor_roadmap_milestones (
      id, roadmap_id, week_number, title, description, skills_covered, status, completed_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    );
  `, [
    `mil-${testStudentId}-w1`,
    `rdm-${testStudentId}`,
    1,
    "Implement Raft Leader Election & Randomized Heartbeat Timers",
    "Build the core state machine transitioning between Follower, Candidate, and Leader.",
    JSON.stringify(["distributed_consensus_raft"]),
    "completed",
    nowIso,
  ]);
  console.log("5. Created roadmap and milestone in SQL.");

  // 6. Create student_skill_dependencies
  await client.query(`
    INSERT INTO student_skill_dependencies (
      id, skill_id, prerequisite_skill_id, dependency_type, min_prerequisite_state
    ) VALUES (
      $1, $2, $3, $4, $5
    ) ON CONFLICT (id) DO NOTHING;
  `, [
    `dep-raft-net`,
    "distributed_consensus_raft",
    "tcp_networking",
    "hard_prerequisite",
    "demonstrated",
  ]);
  console.log("6. Created skill dependency prerequisite in SQL.");

  // Close client to ensure flush
  await client.close();
  console.log("\n[Part 1] All test records written and committed to persistent database on disk.");
}

main().catch((err) => {
  console.error("Part 1 error:", err);
  process.exit(1);
});
