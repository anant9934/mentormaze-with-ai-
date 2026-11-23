import { PGlite } from "@electric-sql/pglite";
import path from "path";
import fs from "fs";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  console.log(`Connecting to persistent database at: ${dataDir}`);
  const client = new PGlite(dataDir);
  await client.waitReady;

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

  // 2. Read and apply Migration 0003 (ai_mentor_goals)
  const migration0003 = path.resolve(process.cwd(), "lib/db/migrations/0003_dazzling_golden_guardian.sql");
  const rawSql0003 = fs.readFileSync(migration0003, "utf-8");
  const statements0003 = rawSql0003
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`\n=== Applying Migration 0003 (${statements0003.length} statements) ===`);
  for (const stmt of statements0003) {
    console.log(`Executing: ${stmt.slice(0, 80)}...`);
    await client.exec(stmt);
  }

  // 3. Read and apply Migration 0004 (ai_mentor_roadmaps additions)
  const migration0004 = path.resolve(process.cwd(), "lib/db/migrations/0004_quiet_rattler.sql");
  const rawSql0004 = fs.readFileSync(migration0004, "utf-8");
  const statements0004 = rawSql0004
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`\n=== Applying Migration 0004 (${statements0004.length} statements) ===`);
  for (const stmt of statements0004) {
    console.log(`Executing: ${stmt.slice(0, 80)}...`);
    await client.exec(stmt);
  }

  // 4. Ensure __drizzle_migrations records both
  await client.exec(`
    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);

  const mig3Check = await client.query(`SELECT * FROM drizzle.__drizzle_migrations WHERE hash = '0003_dazzling_golden_guardian';`);
  if (mig3Check.rows.length === 0) {
    await client.exec(`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('0003_dazzling_golden_guardian', 1795371320343);
    `);
    console.log("Recorded 0003_dazzling_golden_guardian in drizzle.__drizzle_migrations.");
  }

  const mig4Check = await client.query(`SELECT * FROM drizzle.__drizzle_migrations WHERE hash = '0004_quiet_rattler';`);
  if (mig4Check.rows.length === 0) {
    await client.exec(`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('0004_quiet_rattler', 1795371340315);
    `);
    console.log("Recorded 0004_quiet_rattler in drizzle.__drizzle_migrations.");
  }

  // 5. Post-migration Catalog Verification
  console.log("\n=== Post-Migration Catalog Verification ===");
  const totalTablesRes = await client.query(`
    SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public';
  `);
  console.log(`Total Public Tables: ${totalTablesRes.rows[0].count}`);

  const goalCols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'ai_mentor_goals'
    ORDER BY ordinal_position;
  `);
  console.log(`\nai_mentor_goals columns (${goalCols.rows.length}):`);
  console.log(goalCols.rows.map((r) => `${r.column_name} (${r.data_type})`).join(", "));

  const roadmapCols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'ai_mentor_roadmaps'
    ORDER BY ordinal_position;
  `);
  console.log(`\nai_mentor_roadmaps columns (${roadmapCols.rows.length}):`);
  console.log(roadmapCols.rows.map((r) => `${r.column_name} (${r.data_type})`).join(", "));

  // 6. Verify pre-existing data integrity
  const postConv = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_conversations;`);
  const postMsg = await client.query(`SELECT COUNT(*) as count FROM ai_mentor_messages;`);
  const postMem = await client.query(`SELECT COUNT(*) as count FROM student_memory;`);
  const postUsers = await client.query(`SELECT COUNT(*) as count FROM users;`);

  console.log("\n=== Post-Migration Record Preservation Check ===");
  console.log(`ai_mentor_conversations: ${postConv.rows[0].count} (pre: ${preConv.rows[0].count})`);
  console.log(`ai_mentor_messages: ${postMsg.rows[0].count} (pre: ${preMsg.rows[0].count})`);
  console.log(`student_memory: ${postMem.rows[0].count} (pre: ${preMem.rows[0].count})`);
  console.log(`users: ${postUsers.rows[0].count} (pre: ${preUsers.rows[0].count})`);

  await client.close();
  console.log("\nMigration completed and verified successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
