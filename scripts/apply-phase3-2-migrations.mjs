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

  // 2. Read and apply Migration 0005 (evidence & provenance columns + partial unique index)
  const migration0005 = path.resolve(process.cwd(), "lib/db/migrations/0005_ambitious_evidence_provenance.sql");
  const rawSql0005 = fs.readFileSync(migration0005, "utf-8");
  const statements0005 = rawSql0005
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`\n=== Applying Migration 0005 (${statements0005.length} statements) ===`);
  for (const stmt of statements0005) {
    console.log(`Executing: ${stmt.slice(0, 80)}...`);
    await client.exec(stmt);
  }

  // 3. Ensure drizzle.__drizzle_migrations records migration 0005
  await client.exec(`
    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);

  const mig5Check = await client.query(`SELECT * FROM drizzle.__drizzle_migrations WHERE hash = '0005_ambitious_evidence_provenance';`);
  if (mig5Check.rows.length === 0) {
    await client.exec(`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('0005_ambitious_evidence_provenance', 1795373800000);
    `);
    console.log("Recorded 0005_ambitious_evidence_provenance in drizzle.__drizzle_migrations.");
  } else {
    console.log("0005_ambitious_evidence_provenance already recorded in drizzle.__drizzle_migrations.");
  }

  // 4. Verify all migration tracking entries
  console.log("\n=== All Recorded Drizzle Migrations ===");
  const allMigs = await client.query(`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id ASC;`);
  console.table(allMigs.rows);

  // 5. Post-migration Catalog Verification
  console.log("\n=== Post-Migration Catalog Verification ===");
  const indexCheck = await client.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'ai_mentor_roadmaps' AND indexname = 'idx_one_active_roadmap_per_goal';
  `);
  console.log(`Partial unique index found: ${indexCheck.rows.length > 0}`);
  if (indexCheck.rows.length > 0) {
    console.log(`Index definition: ${indexCheck.rows[0].indexdef}`);
  }

  const milestoneCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'ai_mentor_roadmap_milestones'
    ORDER BY ordinal_position;
  `);
  console.log(`\nai_mentor_roadmap_milestones columns (${milestoneCols.rows.length}):`);
  console.table(milestoneCols.rows);

  console.log("\n=== Phase 3.2 Database Migration Successfully Completed ===");
  await client.close();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
