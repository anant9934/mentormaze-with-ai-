import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import path from "path";
import fs from "fs";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

let dbInstance: any = null;
let pgliteInstance: PGlite | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL;

  // Use Neon / Remote PostgreSQL if connection string is configured and valid
  const isRemotePostgres =
    connectionString &&
    !connectionString.includes("localhost:5432") &&
    (connectionString.includes("neon.tech") || connectionString.startsWith("postgresql://"));

  if (isRemotePostgres) {
    try {
      const client = postgres(connectionString!, {
        prepare: false,
        max: 5,
        connect_timeout: 5,
      });
      dbInstance = drizzlePg(client, { schema });
      return dbInstance;
    } catch (err) {
      console.warn("Failed to connect to remote Postgres, falling back to local PGlite engine:", err);
    }
  }

  // Persistent local PostgreSQL (PGlite WASM engine)
  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!pgliteInstance) {
    pgliteInstance = new PGlite(dataDir);
  }

  dbInstance = drizzlePglite(pgliteInstance, { schema });
  return dbInstance;
}

export const db = getDb();
export { schema };

/**
 * Initializes database tables and constraints if not yet present
 */
export async function initializeDatabaseSchema() {
  const targetDb = getDb();

  const ddl = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      display_name VARCHAR(160) NOT NULL,
      avatar_url TEXT,
      account_status VARCHAR(32) DEFAULT 'active' NOT NULL,
      role VARCHAR(32) DEFAULT 'student' NOT NULL,
      timezone VARCHAR(64) DEFAULT 'Asia/Kolkata' NOT NULL,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_identities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      provider VARCHAR(64) NOT NULL,
      provider_subject VARCHAR(255) NOT NULL,
      profile_data JSONB,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      user_agent TEXT,
      ip_address VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      institution VARCHAR(255),
      degree VARCHAR(255),
      field_of_study VARCHAR(255),
      graduation_year INTEGER,
      target_role VARCHAR(255),
      current_level VARCHAR(64),
      bio TEXT,
      preferred_languages JSONB DEFAULT '["English"]',
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_skills (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
      skill_name VARCHAR(120) NOT NULL,
      proficiency_level VARCHAR(32) DEFAULT 'intermediate',
      source VARCHAR(64) DEFAULT 'self_reported',
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_goals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(64) DEFAULT 'career' NOT NULL,
      status VARCHAR(32) DEFAULT 'in_progress' NOT NULL,
      progress_percentage INTEGER DEFAULT 0 NOT NULL,
      target_date DATE,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS action_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
      mentor_profile_id UUID,
      goal_id UUID REFERENCES student_goals(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date DATE,
      status VARCHAR(32) DEFAULT 'pending' NOT NULL,
      created_by_role VARCHAR(32) DEFAULT 'student' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      completed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS mentor_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      headline VARCHAR(255) NOT NULL,
      bio TEXT NOT NULL,
      organization VARCHAR(255) NOT NULL,
      "current_role" VARCHAR(255) NOT NULL,
      years_of_experience INTEGER DEFAULT 1 NOT NULL,
      location VARCHAR(160) DEFAULT 'India',
      rating NUMERIC(3,2) DEFAULT 5.00 NOT NULL,
      total_sessions INTEGER DEFAULT 0 NOT NULL,
      total_mentees INTEGER DEFAULT 0 NOT NULL,
      verification_status VARCHAR(32) DEFAULT 'submitted' NOT NULL,
      verified_at TIMESTAMPTZ,
      languages JSONB DEFAULT '["English"]' NOT NULL,
      session_modes JSONB DEFAULT '["1:1"]' NOT NULL,
      response_time VARCHAR(64) DEFAULT 'Within 6 hours',
      is_accepting_bookings BOOLEAN DEFAULT true NOT NULL,
      price_15min_inr INTEGER DEFAULT 149 NOT NULL,
      price_30min_inr INTEGER DEFAULT 249 NOT NULL,
      price_60min_inr INTEGER DEFAULT 449 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentor_expertise (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      primary_domain VARCHAR(120) NOT NULL,
      skills JSONB DEFAULT '[]' NOT NULL,
      focus_areas JSONB DEFAULT '[]' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentor_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      status VARCHAR(32) DEFAULT 'submitted' NOT NULL,
      identity_proof_type VARCHAR(64) DEFAULT 'Aadhaar/PAN/Passport',
      identity_proof_url TEXT,
      professional_proof_type VARCHAR(64) DEFAULT 'Work Email/Employee ID/LinkedIn',
      professional_proof_url TEXT,
      resume_url TEXT,
      linkedin_url TEXT,
      rejection_reason TEXT,
      admin_notes TEXT,
      reviewed_by_user_id UUID,
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS availability_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      service_type VARCHAR(64) NOT NULL,
      session_duration_minutes INTEGER DEFAULT 30 NOT NULL,
      start_time_utc TIMESTAMPTZ NOT NULL,
      end_time_utc TIMESTAMPTZ NOT NULL,
      user_timezone VARCHAR(64) DEFAULT 'Asia/Kolkata' NOT NULL,
      status VARCHAR(32) DEFAULT 'pending' NOT NULL,
      price_inr INTEGER NOT NULL,
      payment_status VARCHAR(32) DEFAULT 'pending' NOT NULL,
      student_discussion_points TEXT,
      resume_attachment_url TEXT,
      project_links TEXT,
      meeting_room_id VARCHAR(120),
      cancellation_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentorship_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
      livekit_room_name VARCHAR(160) NOT NULL,
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      actual_duration_seconds INTEGER,
      session_plan_checklist JSONB,
      mentor_private_notes TEXT,
      student_visible_summary TEXT,
      resources_shared JSONB,
      status VARCHAR(32) DEFAULT 'scheduled' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_interviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
      category VARCHAR(64) NOT NULL,
      target_role VARCHAR(160) NOT NULL,
      difficulty VARCHAR(32) DEFAULT 'Medium' NOT NULL,
      overall_score NUMERIC(3,1),
      score_technical NUMERIC(3,1),
      score_problem_solving NUMERIC(3,1),
      score_communication NUMERIC(3,1),
      score_confidence NUMERIC(3,1),
      strengths JSONB DEFAULT '[]',
      areas_to_improve JSONB DEFAULT '[]',
      detailed_feedback TEXT,
      recommended_next_steps TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      mentor_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
      last_message_text TEXT,
      last_message_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
      sender_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL,
      attachment_url TEXT,
      attachment_name VARCHAR(255),
      is_read BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(64) NOT NULL,
      link_url TEXT,
      is_read BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
      student_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      gross_amount_inr INTEGER NOT NULL,
      platform_commission_percent NUMERIC(4,2) DEFAULT 15.00 NOT NULL,
      platform_fee_inr INTEGER NOT NULL,
      mentor_payable_inr INTEGER NOT NULL,
      status VARCHAR(32) DEFAULT 'pending' NOT NULL,
      payment_provider VARCHAR(64) DEFAULT 'cashfree' NOT NULL,
      provider_order_id VARCHAR(160),
      provider_payment_id VARCHAR(160),
      refund_amount_inr INTEGER DEFAULT 0,
      refund_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      settled_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS outbox_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type VARCHAR(120) NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(32) DEFAULT 'pending' NOT NULL,
      retry_count INTEGER DEFAULT 0 NOT NULL,
      error_message TEXT,
      locked_at TIMESTAMPTZ,
      locked_by VARCHAR(120),
      next_retry_at TIMESTAMPTZ DEFAULT now(),
      idempotency_key VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      processed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS consent_grants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      target_system VARCHAR(64) DEFAULT 'aitathastu' NOT NULL,
      scopes JSONB DEFAULT '[]' NOT NULL,
      is_revoked BOOLEAN DEFAULT false NOT NULL,
      consent_version VARCHAR(32) DEFAULT '1.0' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      revoked_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key VARCHAR(120) PRIMARY KEY,
      value JSONB NOT NULL,
      description TEXT,
      updated_by_user_id UUID,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
    ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS locked_by VARCHAR(120);
    ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ DEFAULT now();
    ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);
  `;

  if (pgliteInstance) {
    await pgliteInstance.exec(ddl);
  } else {
    const stmts = ddl.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
    for (const stmt of stmts) {
      await (targetDb as any).execute(sql.raw(stmt));
    }
  }

  return targetDb;
}
