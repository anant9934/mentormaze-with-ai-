import { PGlite } from "@electric-sql/pglite";
import path from "path";
import fs from "fs";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  console.log(`Connecting to persistent database at: ${dataDir}`);
  const client = new PGlite(dataDir);

  // 1. Verify pre-existing records before migration
  const preConv = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_conversations;`);
  const preMsg = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_messages;`);
  const preMem = await client.query(`SELECT COUNT(*) as count FROM student_memory;`);
  const preUsers = await client.query(`SELECT COUNT(*) as count FROM users;`);

  console.log("\n=== Pre-Migration Record Counts ===");
  console.log(`ai_mentor_conversations: ${preConv.rows[0].count}`);
  console.log(`ai_mentor_messages: ${preMsg.rows[0].count}`);
  console.log(`student_memory: ${preMem.rows[0].count}`);
  console.log(`users: ${preUsers.rows[0].count}`);

  // 2. Read migration file
  const migrationFile = path.resolve(process.cwd(), "lib/db/migrations/0002_black_la_nuit.sql");
  const rawSql = fs.readFileSync(migrationFile, "utf-8");
  const statements = rawSql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`\n=== Applying Migration 0002 (${statements.length} statements) ===`);

  for (const stmt of statements) {
    console.log(`Executing: ${stmt}`);
    await client.exec(stmt);
  }

  // 3. Ensure __drizzle_migrations schema & table exist to record the migration
  await client.exec(`
    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);

  // Check if 0002 already recorded
  const migrationCheck = await client.query(`
    SELECT * FROM drizzle.__drizzle_migrations WHERE created_at = 1795108154158;
  `);

  if (migrationCheck.rows.length === 0) {
    await client.exec(`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('0002_black_la_nuit', 1795108154158);
    `);
    console.log("Migration 0002 recorded in drizzle.__drizzle_migrations table.");
  }

  // 4. Verify post-migration columns on student_learning_profiles
  console.log(`\n=== Verified Columns in student_learning_profiles ===`);
  const profileCols = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'student_learning_profiles'
    ORDER BY ordinal_position;
  `);
  console.table(profileCols.rows);

  // 5. Verify post-migration columns on student_skill_nodes
  console.log(`\n=== Verified Columns in student_skill_nodes ===`);
  const skillCols = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'student_skill_nodes'
    ORDER BY ordinal_position;
  `);
  console.table(skillCols.rows);

  // 6. Verify constraints & primary keys
  console.log(`\n=== Primary Keys & Constraints ===`);
  const constraints = await client.query(`
    SELECT tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name 
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name IN ('student_learning_profiles', 'student_skill_nodes', 'student_projects', 'student_intelligence_evidence')
    ORDER BY tc.table_name, tc.constraint_type;
  `);
  console.table(constraints.rows);

  // 7. Verify post-migration record counts (must match pre-migration)
  const postConv = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_conversations;`);
  const postMsg = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_messages;`);
  const postMem = await client.query(`SELECT COUNT(*) as count FROM student_memory;`);
  const postUsers = await client.query(`SELECT COUNT(*) as count FROM users;`);

  console.log("\n=== Post-Migration Record Preservation Check ===");
  console.log(`ai_mentor_conversations: ${postConv.rows[0].count} (Expected: ${preConv.rows[0].count})`);
  console.log(`ai_mentor_messages: ${postMsg.rows[0].count} (Expected: ${preMsg.rows[0].count})`);
  console.log(`student_memory: ${postMem.rows[0].count} (Expected: ${preMem.rows[0].count})`);
  console.log(`users: ${postUsers.rows[0].count} (Expected: ${preUsers.rows[0].count})`);

  if (
    postConv.rows[0].count !== preConv.rows[0].count ||
    postMsg.rows[0].count !== preMsg.rows[0].count ||
    postMem.rows[0].count !== preMem.rows[0].count ||
    postUsers.rows[0].count !== preUsers.rows[0].count
  ) {
    throw new Error("DATA LOSS DETECTED! Pre-migration and post-migration record counts do not match!");
  }

  await client.close();
  console.log("\nMigration 0002 applied and verified successfully with zero data loss.");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
