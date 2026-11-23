import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function verifyPersistence() {
  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  console.log(`\n=== 1. Connecting to persistent PostgreSQL at: ${dataDir} ===`);
  let client = new PGlite(dataDir);
  await client.waitReady;

  const testStudentId = `student-phase4-1-2-persist-${Date.now()}`;
  const testGoalId = `goal-distributed-systems-${Date.now()}`;
  const testMilestoneId = `ms-raft-consensus-${Date.now()}`;

  console.log(`\n=== 2. Testing Check-In Preferences Lifecycle ===`);
  // Step 1: Save daily preference
  console.log("- Saving daily preference...");
  const now1 = new Date();
  await client.query(`
    INSERT INTO ai_mentor_checkin_preferences (id, student_user_id, cadence, preferred_hour, timezone, quiet_hours_enabled, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (student_user_id) DO UPDATE SET
      cadence = EXCLUDED.cadence,
      preferred_hour = EXCLUDED.preferred_hour,
      timezone = EXCLUDED.timezone,
      quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
      updated_at = EXCLUDED.updated_at;
  `, [`pref-${testStudentId}`, testStudentId, 'daily', 9, 'Asia/Kolkata', true, now1]);

  let prefCheck = await client.query(`SELECT * FROM ai_mentor_checkin_preferences WHERE student_user_id = $1;`, [testStudentId]);
  console.log(`  -> Daily Cadence Saved: ${prefCheck.rows[0].cadence}, Hour: ${prefCheck.rows[0].preferred_hour}`);

  // Step 2: Save weekly preference
  console.log("- Updating to weekly preference...");
  const now2 = new Date();
  await client.query(`
    INSERT INTO ai_mentor_checkin_preferences (id, student_user_id, cadence, preferred_hour, timezone, quiet_hours_enabled, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (student_user_id) DO UPDATE SET
      cadence = EXCLUDED.cadence,
      preferred_hour = EXCLUDED.preferred_hour,
      timezone = EXCLUDED.timezone,
      quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
      updated_at = EXCLUDED.updated_at;
  `, [`pref-${testStudentId}`, testStudentId, 'weekly', 18, 'Asia/Kolkata', true, now2]);

  prefCheck = await client.query(`SELECT * FROM ai_mentor_checkin_preferences WHERE student_user_id = $1;`, [testStudentId]);
  console.log(`  -> Weekly Cadence Updated: ${prefCheck.rows[0].cadence}, Hour: ${prefCheck.rows[0].preferred_hour}`);

  // Step 3: Pause check-ins
  console.log("- Pausing check-ins...");
  const now3 = new Date();
  await client.query(`
    UPDATE ai_mentor_checkin_preferences
    SET cadence = 'paused', updated_at = $1
    WHERE student_user_id = $2;
  `, [now3, testStudentId]);

  prefCheck = await client.query(`SELECT * FROM ai_mentor_checkin_preferences WHERE student_user_id = $1;`, [testStudentId]);
  console.log(`  -> Cadence Paused: ${prefCheck.rows[0].cadence}`);

  // Step 4-7: Create check-in response with goalId, milestoneId, blocker, and progress
  console.log(`\n=== 3. Creating Structured Check-In Record ===`);
  const checkinId = `chk-${Date.now()}-test`;
  const recordNow = new Date();
  const progressText = "Implemented Raft leader election logic, heartbeats, and randomized election timers.";
  const blockerText = "Debugging log replication consistency under split-brain partition simulation.";
  const notesText = "Requested peer code review on leader lease timeout handling.";

  await client.query(`
    INSERT INTO ai_mentor_checkin_records (
      id, student_user_id, checkin_type, goal_id, roadmap_id, milestone_id,
      student_response, progress_summary, blockers, notes,
      provenance, consent_reference, observed_at, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    );
  `, [
    checkinId, testStudentId, 'milestone_reflection', testGoalId, 'rdm-dist-sys-1', testMilestoneId,
    progressText, progressText, blockerText, notesText,
    'student_reported', 'student_memory', recordNow, recordNow
  ]);

  // Step 8: Read records from PostgreSQL before restart
  console.log("- Reading check-in record directly from PostgreSQL (Session 1)...");
  let recs = await client.query(`SELECT * FROM ai_mentor_checkin_records WHERE student_user_id = $1;`, [testStudentId]);
  console.log(`  -> Records found: ${recs.rows.length}`);
  console.log(`  -> ID: ${recs.rows[0].id}`);
  console.log(`  -> Goal ID: ${recs.rows[0].goal_id}`);
  console.log(`  -> Milestone ID: ${recs.rows[0].milestone_id}`);
  console.log(`  -> Provenance: ${recs.rows[0].provenance}`);
  console.log(`  -> Consent Reference: ${recs.rows[0].consent_reference}`);
  console.log(`  -> Blocker: ${recs.rows[0].blockers}`);
  console.log(`  -> Progress: ${recs.rows[0].progress_summary}`);

  // Step 9: Simulate complete application restart by closing client and opening a brand new instance
  console.log(`\n=== 4. Simulating Application / Database Restart ===`);
  await client.close();
  console.log("- Client 1 connection closed successfully.");

  console.log("- Re-initializing new PGlite connection from disk storage...");
  client = new PGlite(dataDir);
  await client.waitReady;
  console.log("- Client 2 connected successfully to persistent database.");

  // Step 10: Read the same records again
  console.log(`\n=== 5. Reading Records Post-Restart (Session 2) ===`);
  const postPrefs = await client.query(`SELECT * FROM ai_mentor_checkin_preferences WHERE student_user_id = $1;`, [testStudentId]);
  console.log(`- Preferences Record Post-Restart:`);
  console.log(`  -> Cadence: ${postPrefs.rows[0].cadence}`);
  console.log(`  -> Preferred Hour: ${postPrefs.rows[0].preferred_hour}`);
  console.log(`  -> Timezone: ${postPrefs.rows[0].timezone}`);

  const postRecs = await client.query(`SELECT * FROM ai_mentor_checkin_records WHERE student_user_id = $1;`, [testStudentId]);
  console.log(`- Check-In Records Post-Restart:`);
  console.log(`  -> Count: ${postRecs.rows.length}`);
  console.log(`  -> ID: ${postRecs.rows[0].id}`);
  console.log(`  -> Checkin Type: ${postRecs.rows[0].checkin_type}`);
  console.log(`  -> Goal ID: ${postRecs.rows[0].goal_id}`);
  console.log(`  -> Milestone ID: ${postRecs.rows[0].milestone_id}`);
  console.log(`  -> Blocker: ${postRecs.rows[0].blockers}`);
  console.log(`  -> Progress: ${postRecs.rows[0].progress_summary}`);
  console.log(`  -> Notes: ${postRecs.rows[0].notes}`);
  console.log(`  -> Provenance: ${postRecs.rows[0].provenance}`);
  console.log(`  -> Consent Reference: ${postRecs.rows[0].consent_reference}`);

  // Step 11: Assert all fields and provenance remain intact
  if (
    postPrefs.rows[0].cadence === 'paused' &&
    postRecs.rows[0].id === checkinId &&
    postRecs.rows[0].goal_id === testGoalId &&
    postRecs.rows[0].milestone_id === testMilestoneId &&
    postRecs.rows[0].blockers === blockerText &&
    postRecs.rows[0].progress_summary === progressText &&
    postRecs.rows[0].provenance === 'student_reported' &&
    postRecs.rows[0].consent_reference === 'student_memory'
  ) {
    console.log(`\n>>> VERIFICATION SUCCESS: All fields, linkages, and provenance survived database restart intact. <<<`);
  } else {
    throw new Error("Persistence verification failed: fields post-restart do not match original insertions.");
  }

  // Clean up test data
  console.log(`\n=== 6. Cleaning Up Temporary Test Records ===`);
  await client.query(`DELETE FROM ai_mentor_checkin_records WHERE student_user_id = $1;`, [testStudentId]);
  await client.query(`DELETE FROM ai_mentor_checkin_preferences WHERE student_user_id = $1;`, [testStudentId]);
  console.log("- Cleaned up temporary test records for student:", testStudentId);

  await client.close();
}

verifyPersistence().catch((err) => {
  console.error("Persistence verification error:", err);
  process.exit(1);
});
