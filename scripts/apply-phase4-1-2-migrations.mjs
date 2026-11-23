import { PGlite } from "@electric-sql/pglite";
import path from "path";
import fs from "fs";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  console.log(`Connecting to persistent database at: ${dataDir}`);
  const client = new PGlite(dataDir);
  await client.waitReady;

  // 1. Verify pre-existing records before migration
  const preGoals = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_goals;`);
  const preRoadmaps = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_roadmaps;`);
  const preMilestones = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_roadmap_milestones;`);
  const preUsers = await client.query(`SELECT COUNT(*) as count FROM users;`);

  console.log("\n=== Pre-Migration Record Counts ===");
  console.log(`ai_mentor_goals: ${preGoals.rows[0]?.count || 0}`);
  console.log(`ai_mentor_roadmaps: ${preRoadmaps.rows[0]?.count || 0}`);
  console.log(`ai_mentor_roadmap_milestones: ${preMilestones.rows[0]?.count || 0}`);
  console.log(`users: ${preUsers.rows[0]?.count || 0}`);

  // 2. Read and apply Migration 0006 (check-in preferences and check-in records)
  const migration0006 = path.resolve(process.cwd(), "lib/db/migrations/0006_flawless_checkin_lifecycle.sql");
  const rawSql0006 = fs.readFileSync(migration0006, "utf-8");
  const statements0006 = rawSql0006
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`\n=== Applying Migration 0006 (${statements0006.length} statements) ===`);
  for (const stmt of statements0006) {
    console.log(`Executing: ${stmt.slice(0, 80)}...`);
    await client.exec(stmt);
  }

  // 3. Ensure drizzle.__drizzle_migrations records migration 0006
  await client.exec(`
    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);

  const mig6Check = await client.query(`SELECT * FROM drizzle.__drizzle_migrations WHERE hash = '0006_flawless_checkin_lifecycle';`);
  if (mig6Check.rows.length === 0) {
    await client.exec(`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('0006_flawless_checkin_lifecycle', 1795377000000);
    `);
    console.log("Recorded 0006_flawless_checkin_lifecycle in drizzle.__drizzle_migrations.");
  } else {
    console.log("0006_flawless_checkin_lifecycle already recorded in drizzle.__drizzle_migrations.");
  }

  // 4. Verify all migration tracking entries
  console.log("\n=== All Recorded Drizzle Migrations ===");
  const allMigs = await client.query(`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id ASC;`);
  console.table(allMigs.rows);

  // 5. Post-migration Catalog Verification
  console.log("\n=== Post-Migration Tables in information_schema.tables ===");
  const tables = await client.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name IN ('ai_mentor_checkin_preferences', 'ai_mentor_checkin_records')
    ORDER BY table_name;
  `);
  console.table(tables.rows);

  console.log("\n=== Columns in ai_mentor_checkin_preferences ===");
  const prefCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'ai_mentor_checkin_preferences'
    ORDER BY ordinal_position;
  `);
  console.table(prefCols.rows);

  console.log("\n=== Columns in ai_mentor_checkin_records ===");
  const recCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'ai_mentor_checkin_records'
    ORDER BY ordinal_position;
  `);
  console.table(recCols.rows);

  console.log("\n=== Indexes on checkin tables ===");
  const indexes = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE tablename IN ('ai_mentor_checkin_preferences', 'ai_mentor_checkin_records')
    ORDER BY tablename, indexname;
  `);
  console.table(indexes.rows);

  console.log("\n=== Constraints on checkin tables ===");
  const constraints = await client.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name IN ('ai_mentor_checkin_preferences', 'ai_mentor_checkin_records')
    ORDER BY tc.table_name, tc.constraint_name;
  `);
  console.table(constraints.rows);

  console.log("\n=== Phase 4.1.2 Database Migration 0006 Successfully Completed ===");
  await client.close();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
