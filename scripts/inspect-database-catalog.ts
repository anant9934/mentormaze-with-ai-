import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  console.log(`Connecting to persistent database at: ${dataDir}`);
  const client = new PGlite(dataDir);

  // 1. List all public tables
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log(`\n=== Total Public Tables: ${tablesRes.rows.length} ===`);
  const tableNames = tablesRes.rows.map((r: any) => r.table_name);
  console.log(tableNames.join(", "));

  // 2. Check Drizzle migration journal in DB
  const drizzleTableRes = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name LIKE '%drizzle%' OR table_name LIKE '%migration%';
  `);
  console.log(`\n=== Migration Tracking Tables ===`);
  console.log(drizzleTableRes.rows);

  for (const t of drizzleTableRes.rows) {
    try {
      const records = await client.query(`SELECT * FROM "${(t as any).table_schema}"."${(t as any).table_name}";`);
      console.log(`Records in ${(t as any).table_schema}.${(t as any).table_name}:`, records.rows);
    } catch (err: any) {
      console.log(`Error querying ${(t as any).table_name}:`, err.message);
    }
  }

  // 3. Inspect student_learning_profiles columns
  console.log(`\n=== Columns in student_learning_profiles ===`);
  const profileCols = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'student_learning_profiles'
    ORDER BY ordinal_position;
  `);
  console.log(profileCols.rows);

  // 4. Inspect student_skill_nodes columns
  console.log(`\n=== Columns in student_skill_nodes ===`);
  const skillCols = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'student_skill_nodes'
    ORDER BY ordinal_position;
  `);
  console.log(skillCols.rows);

  // 5. Inspect student_projects & student_intelligence_evidence columns
  console.log(`\n=== Columns in student_projects ===`);
  const projCols = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'student_projects'
    ORDER BY ordinal_position;
  `);
  console.log(projCols.rows);

  console.log(`\n=== Columns in student_intelligence_evidence ===`);
  const evCols = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'student_intelligence_evidence'
    ORDER BY ordinal_position;
  `);
  console.log(evCols.rows);

  // 6. Record counts in key tables
  const countTables = [
    "users",
    "ai_mentor_conversations",
    "ai_mentor_messages",
    "student_learning_profiles",
    "student_skill_nodes",
    "student_skill_dependencies",
    "student_skill_evidence",
    "student_memory",
    "ai_mentor_roadmaps",
    "ai_mentor_roadmap_milestones",
    "student_projects",
    "student_intelligence_evidence",
    "student_purpose_consents",
  ];

  console.log(`\n=== Record Counts in Persistent DB ===`);
  for (const t of countTables) {
    if (tableNames.includes(t)) {
      const c = await client.query(`SELECT COUNT(*) as count FROM "${t}";`);
      console.log(`${t}: ${(c.rows[0] as any).count}`);
    } else {
      console.log(`${t}: TABLE DOES NOT EXIST`);
    }
  }

  // 7. Check indexes on student_learning_profiles & student_skill_nodes
  console.log(`\n=== Indexes on student_learning_profiles & student_skill_nodes ===`);
  const indexRes = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE tablename IN ('student_learning_profiles', 'student_skill_nodes', 'student_projects', 'student_intelligence_evidence')
    ORDER BY tablename, indexname;
  `);
  console.log(indexRes.rows);

  await client.close();
  console.log("\nInspection complete.");
}

main().catch((err) => {
  console.error("Inspection error:", err);
  process.exit(1);
});
