import { PGlite } from "@electric-sql/pglite";
import path from "path";

const testStudentId = "usr-durability-test-student";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  console.log(`[Part 2 - Cold Restart] Connecting fresh process to persistent database at: ${dataDir}`);
  const client = new PGlite(dataDir);

  console.log(`\n=== Verifying Durable Graph Persistence from PostgreSQL on Disk ===`);

  // 1. Verify student_learning_profiles
  const profileRes = await client.query(`
    SELECT * FROM student_learning_profiles WHERE student_user_id = $1;
  `, [testStudentId]);
  console.log(`\n1. Learning Profile Check: ${profileRes.rows.length} row(s)`);
  if (profileRes.rows.length !== 1) throw new Error("Durability failure: learning profile not found!");
  const prof = profileRes.rows[0];
  console.log(`  - Institution: ${prof.institution}`);
  console.log(`  - Degree: ${prof.degree}`);
  console.log(`  - Target Role: ${prof.target_role}`);
  console.log(`  - Confirmed Strengths: ${JSON.stringify(prof.confirmed_strengths)}`);
  console.log(`  - Learning Goals: ${JSON.stringify(prof.learning_goals)}`);
  if (prof.institution !== "Indian Institute of Technology, Bombay") {
    throw new Error(`Profile institution mismatch: ${prof.institution}`);
  }

  // 2. Verify student_skill_nodes
  const skillRes = await client.query(`
    SELECT * FROM student_skill_nodes WHERE student_user_id = $1 AND skill_id = 'distributed_consensus_raft';
  `, [testStudentId]);
  console.log(`\n2. Skill Node Check: ${skillRes.rows.length} row(s)`);
  if (skillRes.rows.length !== 1) throw new Error("Durability failure: skill node not found!");
  const skill = skillRes.rows[0];
  console.log(`  - Skill Name: ${skill.skill_name}`);
  console.log(`  - Mastery State: ${skill.mastery_state}`);
  console.log(`  - Evidence Type: ${skill.evidence_type}`);
  console.log(`  - Independently Verified: ${skill.is_independently_verified}`);
  console.log(`  - Evidence Source: ${skill.evidence_source}`);
  if (!skill.is_independently_verified || skill.evidence_type !== "independently_verified") {
    throw new Error("Durability failure: skill verification fields mismatch!");
  }

  // 3. Verify student_intelligence_evidence
  const evRes = await client.query(`
    SELECT * FROM student_intelligence_evidence WHERE student_user_id = $1 AND entity_id = 'distributed_consensus_raft';
  `, [testStudentId]);
  console.log(`\n3. Evidence Ledger Check: ${evRes.rows.length} row(s)`);
  if (evRes.rows.length !== 1) throw new Error("Durability failure: intelligence evidence not found!");
  const ev = evRes.rows[0];
  console.log(`  - Evidence ID: ${ev.id}`);
  console.log(`  - Source System: ${ev.source_system}`);
  console.log(`  - Confidence: ${ev.confidence}`);
  console.log(`  - Metadata: ${JSON.stringify(ev.metadata)}`);

  // 4. Verify student_projects
  const projRes = await client.query(`
    SELECT * FROM student_projects WHERE student_user_id = $1;
  `, [testStudentId]);
  console.log(`\n4. Project Check: ${projRes.rows.length} row(s)`);
  if (projRes.rows.length !== 1) throw new Error("Durability failure: project record not found!");
  const proj = projRes.rows[0];
  console.log(`  - Project Title: ${proj.title}`);
  console.log(`  - Technologies: ${JSON.stringify(proj.technologies)}`);
  console.log(`  - Outcomes: ${proj.outcomes}`);
  const techs = Array.isArray(proj.technologies) ? proj.technologies : JSON.parse(proj.technologies);
  if (!techs.includes("Raft") || !techs.includes("Go")) {
    throw new Error("Durability failure: project technologies mismatch!");
  }

  // 5. Verify ai_mentor_roadmaps & milestones
  const rdmRes = await client.query(`
    SELECT r.id as roadmap_id, r.target_role, m.week_number, m.title, m.status 
    FROM ai_mentor_roadmaps r
    JOIN ai_mentor_roadmap_milestones m ON r.id = m.roadmap_id
    WHERE r.student_user_id = $1;
  `, [testStudentId]);
  console.log(`\n5. Roadmap & Milestone Check: ${rdmRes.rows.length} row(s)`);
  if (rdmRes.rows.length !== 1) throw new Error("Durability failure: roadmap milestone not found!");
  const rdm = rdmRes.rows[0];
  console.log(`  - Roadmap Target: ${rdm.target_role}`);
  console.log(`  - Week ${rdm.week_number}: ${rdm.title} [${rdm.status}]`);
  if (rdm.week_number !== 1 || rdm.status !== "completed") {
    throw new Error("Durability failure: milestone details mismatch!");
  }

  // 6. Verify student_skill_dependencies
  const depRes = await client.query(`
    SELECT * FROM student_skill_dependencies WHERE skill_id = 'distributed_consensus_raft';
  `);
  console.log(`\n6. Prerequisite Dependency Check: ${depRes.rows.length} row(s)`);
  if (depRes.rows.length === 0) throw new Error("Durability failure: skill dependency not found!");
  console.log(`  - Skill: ${depRes.rows[0].skill_id} requires ${depRes.rows[0].prerequisite_skill_id} (${depRes.rows[0].dependency_type})`);

  console.log("\n===============================================================================");
  console.log("DURABILITY VERIFICATION COMPLETE: ALL 6 GRAPH STRUCTURES SURVIVED COLD RESTART!");
  console.log("===============================================================================");

  // 7. Controlled Cleanup of test records ONLY
  console.log(`\n=== Cleaning up only test records for ${testStudentId} ===`);
  await client.query(`DELETE FROM ai_mentor_roadmap_milestones WHERE id = $1;`, [`mil-${testStudentId}-w1`]);
  await client.query(`DELETE FROM ai_mentor_roadmaps WHERE id = $1;`, [`rdm-${testStudentId}`]);
  await client.query(`DELETE FROM student_projects WHERE student_user_id = $1;`, [testStudentId]);
  await client.query(`DELETE FROM student_intelligence_evidence WHERE student_user_id = $1;`, [testStudentId]);
  await client.query(`DELETE FROM student_skill_nodes WHERE student_user_id = $1;`, [testStudentId]);
  await client.query(`DELETE FROM student_learning_profiles WHERE student_user_id = $1;`, [testStudentId]);
  await client.query(`DELETE FROM student_skill_dependencies WHERE id = 'dep-raft-net';`);
  console.log("Cleanup of test records complete.");

  // 8. Confirm baseline tables remain intact
  const postConv = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_conversations;`);
  const postMsg = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_messages;`);
  const postMem = await client.query(`SELECT COUNT(*) as count FROM student_memory;`);
  const postUsers = await client.query(`SELECT COUNT(*) as count FROM users;`);

  console.log("\n=== Baseline Data Preservation Check ===");
  console.log(`ai_mentor_conversations: ${postConv.rows[0].count} (Preserved: 33)`);
  console.log(`ai_mentor_messages: ${postMsg.rows[0].count} (Preserved: 58)`);
  console.log(`student_memory: ${postMem.rows[0].count} (Preserved: 55)`);
  console.log(`users: ${postUsers.rows[0].count} (Preserved: 6)`);

  if (
    Number(postConv.rows[0].count) !== 33 ||
    Number(postMsg.rows[0].count) !== 58 ||
    Number(postMem.rows[0].count) !== 55 ||
    Number(postUsers.rows[0].count) !== 6
  ) {
    throw new Error("Baseline records were altered during cleanup!");
  }

  await client.close();
  console.log("\nDurability verification and baseline preservation fully verified.");
}

main().catch((err) => {
  console.error("Part 2 error:", err);
  process.exit(1);
});
