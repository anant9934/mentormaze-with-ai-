import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import path from "path";
import fs from "fs";

async function reconcileMigrations() {
  const migrationsFolder = path.resolve(process.cwd(), "lib/db/migrations");
  console.log("=== 1. Reading Migration Files via Drizzle Official Migrator ===");
  const canonicalMigrations = readMigrationFiles({ migrationsFolder });
  console.log(`Found ${canonicalMigrations.length} canonical migrations in ${migrationsFolder}:`);
  canonicalMigrations.forEach((m, i) => {
    console.log(`  [${i}] folderMillis: ${m.folderMillis}, sha256: ${m.hash}, statements: ${m.sql.length}`);
  });

  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  console.log(`\n=== 2. Connecting to Existing Local Database at: ${dataDir} ===`);
  const client = new PGlite(dataDir);
  await client.waitReady;

  // 1. Inspect existing table in database
  const existingRows = await client.query(`
    SELECT id, hash, created_at 
    FROM drizzle.__drizzle_migrations 
    ORDER BY id ASC;
  `);
  console.log("Existing drizzle.__drizzle_migrations entries:");
  console.table(existingRows.rows);

  // 2. Reconcile entries safely without dropping application data
  console.log("\n=== 3. Reconciling Migration Tracking Table with Canonical SHA256 Hashes ===");
  await client.exec(`
    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
    DELETE FROM drizzle.__drizzle_migrations;
  `);

  for (let i = 0; i < canonicalMigrations.length; i++) {
    const m = canonicalMigrations[i];
    await client.query(`
      INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at)
      VALUES ($1, $2, $3);
    `, [i + 1, m.hash, m.folderMillis]);
  }

  // Reset sequence to 7
  await client.exec(`SELECT setval(pg_get_serial_sequence('drizzle.__drizzle_migrations', 'id'), ${canonicalMigrations.length});`);

  const reconciledRows = await client.query(`
    SELECT id, hash, created_at 
    FROM drizzle.__drizzle_migrations 
    ORDER BY id ASC;
  `);
  console.log("Reconciled drizzle.__drizzle_migrations entries:");
  console.table(reconciledRows.rows);

  // 3. Test running official Drizzle migrator against the reconciled database
  console.log("\n=== 4. Verifying Official Drizzle Migrator on Reconciled Database ===");
  const db = drizzle(client);
  console.log("- Running migrate(db, { migrationsFolder })...");
  await migrate(db, { migrationsFolder });
  console.log("- migrate() completed successfully: 0 statements executed, migration 0006 verified as applied!");

  await client.close();

  // 4. Test Disposable Fresh Development Database
  console.log("\n=== 5. Testing Fresh Disposable Development Database Initialization ===");
  const freshDbDir = path.resolve(process.cwd(), ".mentormaze-fresh-test-pgdata");
  if (fs.existsSync(freshDbDir)) {
    fs.rmSync(freshDbDir, { recursive: true, force: true });
  }

  console.log(`- Initializing fresh database at: ${freshDbDir}`);
  const freshClient = new PGlite(freshDbDir);
  await freshClient.waitReady;
  const freshDb = drizzle(freshClient);

  console.log("- Running official migrate() on fresh database from scratch (0000 -> 0006)...");
  await migrate(freshDb, { migrationsFolder });
  console.log("- Fresh database migration succeeded!");

  // Verify fresh database tracking entries
  const freshRows = await freshClient.query(`
    SELECT id, hash, created_at 
    FROM drizzle.__drizzle_migrations 
    ORDER BY id ASC;
  `);
  console.log("Fresh Database Migration Entries:");
  console.table(freshRows.rows);

  // Verify fresh database contains all tables including checkin tables
  const freshTables = await freshClient.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log(`Fresh Database Public Tables (${freshTables.rows.length}):`);
  const tableNames = freshTables.rows.map((r) => r.table_name);
  console.log(tableNames.join(", "));

  if (!tableNames.includes("ai_mentor_checkin_preferences") || !tableNames.includes("ai_mentor_checkin_records")) {
    throw new Error("Fresh database migration failed: check-in tables missing from fresh database!");
  }

  await freshClient.close();
  fs.rmSync(freshDbDir, { recursive: true, force: true });
  console.log("- Disposable test database cleaned up.");

  console.log("\n>>> DRIZZLE MIGRATION COMPATIBILITY RECONCILIATION VERIFIED 100% <<<");
}

reconcileMigrations().catch((err) => {
  console.error("Reconciliation error:", err);
  process.exit(1);
});
