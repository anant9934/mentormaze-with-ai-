import postgres from "postgres";

const stagingPostgresUrl = (
  process.env.DIRECT_DATABASE_URL ||
  "postgresql://neondb_owner:npg_h6L3cvsjztUO@ep-withered-heart-bebleio4.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require"
)
  .replace("&channel_binding=require", "")
  .replace("?channel_binding=require", "?");

async function applyConstraints() {
  console.log("Connecting to Neon cloud staging database...");
  const sql = postgres(stagingPostgresUrl, {
    max: 1,
    connect_timeout: 60,
    idle_timeout: 120,
  });

  try {
    // 1. target_system DEFAULT 'internal' and NOT NULL
    console.log("Applying NOT NULL on outbox_events.target_system...");
    await sql`ALTER TABLE outbox_events ALTER COLUMN target_system SET DEFAULT 'internal';`;
    await sql`ALTER TABLE outbox_events ALTER COLUMN target_system SET NOT NULL;`;
    console.log("-> target_system is now NOT NULL with DEFAULT 'internal'");

    // 2. chk_outbox_events_target_system_valid (reject empty and whitespace-only strings)
    console.log("Applying chk_outbox_events_target_system_valid...");
    await sql`ALTER TABLE outbox_events DROP CONSTRAINT IF EXISTS chk_outbox_events_target_system_valid;`;
    await sql`
      ALTER TABLE outbox_events 
      ADD CONSTRAINT chk_outbox_events_target_system_valid 
      CHECK (length(trim(target_system)) > 0);
    `;
    console.log("-> chk_outbox_events_target_system_valid applied");

    // 3. chk_outbox_events_sync_idempotency_required (airtight against null, whitespace, and invalid target systems)
    console.log("Applying chk_outbox_events_sync_idempotency_required...");
    await sql`ALTER TABLE outbox_events DROP CONSTRAINT IF EXISTS chk_outbox_events_sync_idempotency_required;`;
    await sql`
      ALTER TABLE outbox_events 
      ADD CONSTRAINT chk_outbox_events_sync_idempotency_required 
      CHECK (
        CASE 
          WHEN lower(trim(target_system)) = 'aitathastu' 
            OR event_type IN ('mentorship.outcomes.synced', 'student.consent.revoked')
            OR event_type LIKE '%tathastu%'
          THEN (idempotency_key IS NOT NULL AND length(trim(idempotency_key)) >= 10)
          ELSE true
        END
      );
    `;
    console.log("-> chk_outbox_events_sync_idempotency_required applied");

    // 4. Verify catalog
    const constraints = await sql`
      SELECT conname, pg_get_constraintdef(c.oid) AS def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'outbox_events' AND conname LIKE 'chk_outbox_events_%';
    `;
    console.log("Verified constraints on Neon:", JSON.stringify(constraints, null, 2));

    const cols = await sql`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'outbox_events' AND column_name IN ('target_system', 'idempotency_key');
    `;
    console.log("Verified columns on Neon:", JSON.stringify(cols, null, 2));

  } finally {
    await sql.end();
  }
}

applyConstraints().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
