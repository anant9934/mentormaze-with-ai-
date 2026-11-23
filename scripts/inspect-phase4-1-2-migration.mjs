import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function checkCatalog() {
  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  console.log(`Connecting to database at: ${dataDir}`);
  const client = new PGlite(dataDir);
  await client.waitReady;

  // 1. Drizzle migrations
  console.log("\n=== 1. drizzle.__drizzle_migrations ===");
  try {
    const migs = await client.query(`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id ASC;`);
    console.table(migs.rows);
  } catch (err) {
    console.log("Could not query drizzle.__drizzle_migrations:", err.message);
  }

  // 2. Check if checkin tables exist in information_schema.tables
  console.log("\n=== 2. information_schema.tables ===");
  const tables = await client.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name IN ('ai_mentor_checkin_preferences', 'ai_mentor_checkin_records')
    ORDER BY table_name;
  `);
  console.table(tables.rows);

  // 3. Columns for ai_mentor_checkin_preferences
  console.log("\n=== 3. Columns in ai_mentor_checkin_preferences ===");
  const prefCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'ai_mentor_checkin_preferences'
    ORDER BY ordinal_position;
  `);
  console.table(prefCols.rows);

  // 4. Columns for ai_mentor_checkin_records
  console.log("\n=== 4. Columns in ai_mentor_checkin_records ===");
  const recCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'ai_mentor_checkin_records'
    ORDER BY ordinal_position;
  `);
  console.table(recCols.rows);

  // 5. Indexes on both tables
  console.log("\n=== 5. Indexes on checkin tables ===");
  const indexes = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE tablename IN ('ai_mentor_checkin_preferences', 'ai_mentor_checkin_records')
    ORDER BY tablename, indexname;
  `);
  console.table(indexes.rows);

  // 6. Constraints on both tables
  console.log("\n=== 6. Constraints on checkin tables ===");
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
}

checkCatalog().catch((err) => {
  console.error("Catalog check error:", err);
  process.exit(1);
});
