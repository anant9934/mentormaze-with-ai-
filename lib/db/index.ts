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
    process.env.USE_LOCAL_DB !== "true" &&
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

  // In-memory or test-isolated DB mode
  if (
    process.env.USE_MEMORY_DB === "true" ||
    process.env.VITEST === "true" ||
    process.env.NODE_ENV === "test" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    if (!pgliteInstance) {
      pgliteInstance = new PGlite();
    }
    dbInstance = drizzlePglite(pgliteInstance, { schema });
    return dbInstance;
  }

  // Persistent local PostgreSQL (PGlite WASM engine)
  const dataDir = path.resolve(process.cwd(), ".mentormaze-pgdata");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    if (!pgliteInstance) {
      pgliteInstance = new PGlite(dataDir);
    }
    dbInstance = drizzlePglite(pgliteInstance, { schema });
    return dbInstance;
  } catch (err) {
    console.warn("PGlite disk lock collision, falling back to in-memory PGlite:", err);
    try {
      pgliteInstance = new PGlite();
      dbInstance = drizzlePglite(pgliteInstance, { schema });
      return dbInstance;
    } catch (innerErr) {
      console.error("Critical: In-memory PGlite failed:", innerErr);
      throw innerErr;
    }
  }
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

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      token_hash VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
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

    CREATE TABLE IF NOT EXISTS availability_exceptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      exception_date DATE NOT NULL,
      is_blocked BOOLEAN DEFAULT true NOT NULL,
      start_time TIME,
      end_time TIME,
      reason VARCHAR(255),
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
      category VARCHAR(64) DEFAULT 'general' NOT NULL,
      priority VARCHAR(32) DEFAULT 'normal' NOT NULL,
      link_url TEXT,
      action_url TEXT,
      action_label VARCHAR(120),
      is_read BOOLEAN DEFAULT false NOT NULL,
      read_at TIMESTAMPTZ,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
      in_app_enabled BOOLEAN DEFAULT true NOT NULL,
      push_enabled BOOLEAN DEFAULT true NOT NULL,
      email_enabled BOOLEAN DEFAULT true NOT NULL,
      booking_reminders BOOLEAN DEFAULT true NOT NULL,
      chat_messages BOOLEAN DEFAULT true NOT NULL,
      mentorship_updates BOOLEAN DEFAULT true NOT NULL,
      mock_interview_alerts BOOLEAN DEFAULT true NOT NULL,
      payment_receipts BOOLEAN DEFAULT true NOT NULL,
      marketing_announcements BOOLEAN DEFAULT false NOT NULL,
      quiet_hours_enabled BOOLEAN DEFAULT false NOT NULL,
      quiet_hours_start VARCHAR(5) DEFAULT '22:00' NOT NULL,
      quiet_hours_end VARCHAR(5) DEFAULT '08:00' NOT NULL,
      timezone VARCHAR(64) DEFAULT 'Asia/Kolkata' NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE NOT NULL,
      channel VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL,
      error_message TEXT,
      delivered_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      audience VARCHAR(64) DEFAULT 'all' NOT NULL,
      priority VARCHAR(32) DEFAULT 'normal' NOT NULL,
      action_url TEXT,
      action_label VARCHAR(120),
      channels JSONB DEFAULT '["in_app", "push"]' NOT NULL,
      published_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      recipient_count INTEGER DEFAULT 0 NOT NULL,
      published_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scheduled_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      reminder_type VARCHAR(32) NOT NULL,
      scheduled_for TIMESTAMPTZ NOT NULL,
      status VARCHAR(32) DEFAULT 'pending' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentor_availability_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
      buffer_time_minutes INTEGER DEFAULT 15 NOT NULL,
      min_notice_hours INTEGER DEFAULT 2 NOT NULL,
      max_advance_days INTEGER DEFAULT 30 NOT NULL,
      daily_session_limit INTEGER DEFAULT 4 NOT NULL,
      weekly_session_limit INTEGER DEFAULT 20 NOT NULL,
      custom_session_durations JSONB DEFAULT '[15, 30, 45, 60]' NOT NULL,
      timezone VARCHAR(64) DEFAULT 'Asia/Kolkata' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS booking_holds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      student_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      service_type VARCHAR(64) NOT NULL,
      session_duration_minutes INTEGER NOT NULL,
      start_time_utc TIMESTAMPTZ NOT NULL,
      end_time_utc TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      status VARCHAR(32) DEFAULT 'active' NOT NULL,
      idempotency_key VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      provider VARCHAR(64) DEFAULT 'google_calendar' NOT NULL,
      account_email VARCHAR(255),
      access_token_encrypted TEXT,
      refresh_token_encrypted TEXT,
      token_expires_at TIMESTAMPTZ,
      sync_token TEXT,
      watch_channel_id VARCHAR(255),
      watch_channel_expiration TIMESTAMPTZ,
      status VARCHAR(32) DEFAULT 'connected' NOT NULL,
      last_synced_at TIMESTAMPTZ,
      last_error TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS external_calendar_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE NOT NULL,
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      external_event_id VARCHAR(255) NOT NULL,
      booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
      start_time_utc TIMESTAMPTZ NOT NULL,
      end_time_utc TIMESTAMPTZ NOT NULL,
      is_busy BOOLEAN DEFAULT true NOT NULL,
      etag VARCHAR(255),
      last_synced_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'general';
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(32) DEFAULT 'normal';
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_label VARCHAR(120);
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;

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

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_user_id UUID,
      action VARCHAR(120) NOT NULL,
      resource_type VARCHAR(64) NOT NULL,
      resource_id VARCHAR(120),
      details JSONB,
      ip_address VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key VARCHAR(120) PRIMARY KEY,
      value JSONB NOT NULL,
      description TEXT,
      updated_by_user_id UUID,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_templates (
      id VARCHAR(120) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      preview_text VARCHAR(255),
      html_body TEXT NOT NULL,
      text_body TEXT NOT NULL,
      variables JSONB DEFAULT '[]' NOT NULL,
      is_active BOOLEAN DEFAULT true NOT NULL,
      is_system_critical BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_automations (
      id VARCHAR(120) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      event_type VARCHAR(120) NOT NULL,
      template_id VARCHAR(120) NOT NULL,
      is_enabled BOOLEAN DEFAULT true NOT NULL,
      recipient_type VARCHAR(64) DEFAULT 'user' NOT NULL,
      delay_seconds INTEGER DEFAULT 0 NOT NULL,
      max_retries INTEGER DEFAULT 5 NOT NULL,
      quiet_hours_enabled BOOLEAN DEFAULT false NOT NULL,
      last_executed_at TIMESTAMPTZ,
      execution_count INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_delivery_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_email VARCHAR(255) NOT NULL,
      recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      recipient_name VARCHAR(160),
      template_id VARCHAR(120),
      subject VARCHAR(255) NOT NULL,
      category VARCHAR(64) DEFAULT 'system' NOT NULL,
      event_type VARCHAR(120),
      status VARCHAR(32) DEFAULT 'queued' NOT NULL,
      attempt_count INTEGER DEFAULT 1 NOT NULL,
      max_attempts INTEGER DEFAULT 5 NOT NULL,
      idempotency_key VARCHAR(255) UNIQUE,
      smtp_response TEXT,
      error_message TEXT,
      metadata JSONB,
      queued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      last_attempted_at TIMESTAMPTZ,
      sent_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS email_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) UNIQUE NOT NULL,
      marketing_consent BOOLEAN DEFAULT false NOT NULL,
      recommendations_consent BOOLEAN DEFAULT true NOT NULL,
      newsletter_consent BOOLEAN DEFAULT false NOT NULL,
      booking_reminders_consent BOOLEAN DEFAULT true NOT NULL,
      unsubscribe_token VARCHAR(128) UNIQUE NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_suppressions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      reason VARCHAR(64) NOT NULL,
      source VARCHAR(120),
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_number VARCHAR(64) UNIQUE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(160) NOT NULL,
      category VARCHAR(64) NOT NULL,
      priority VARCHAR(32) DEFAULT 'medium' NOT NULL,
      status VARCHAR(32) DEFAULT 'open' NOT NULL,
      subject VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
      payment_reference VARCHAR(120),
      assigned_to_user_id UUID,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
      sender_user_id UUID,
      sender_name VARCHAR(160) NOT NULL,
      sender_role VARCHAR(32) NOT NULL,
      message TEXT NOT NULL,
      is_internal_note BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_user_id UUID,
      actor_email VARCHAR(255),
      action VARCHAR(120) NOT NULL,
      target_id VARCHAR(120),
      details JSONB,
      ip_address VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
    ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS locked_by VARCHAR(120);
    ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ DEFAULT now();
    ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);
    ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS target_system VARCHAR(64) DEFAULT 'internal';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_outbox_events_idempotency_key ON outbox_events(idempotency_key);
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_outbox_events_sync_idempotency_required'
      ) THEN
        ALTER TABLE outbox_events 
        ADD CONSTRAINT chk_outbox_events_sync_idempotency_required 
        CHECK (target_system != 'aitathastu' OR (idempotency_key IS NOT NULL AND length(trim(idempotency_key)) > 0));
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS booking_policies (
      id VARCHAR(64) PRIMARY KEY,
      version VARCHAR(32) NOT NULL,
      name VARCHAR(160) NOT NULL,
      cancellation_cutoff_hours INTEGER DEFAULT 24 NOT NULL,
      rescheduling_cutoff_hours INTEGER DEFAULT 12 NOT NULL,
      max_reschedules INTEGER DEFAULT 2 NOT NULL,
      refund_eligibility_percent INTEGER DEFAULT 100 NOT NULL,
      no_show_refund_percent INTEGER DEFAULT 0 NOT NULL,
      is_active BOOLEAN DEFAULT true NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS booking_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
      event_type VARCHAR(64) NOT NULL,
      from_status VARCHAR(32),
      to_status VARCHAR(32) NOT NULL,
      actor_id UUID,
      actor_role VARCHAR(32) DEFAULT 'system',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_attendance_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      role VARCHAR(32) NOT NULL,
      event_type VARCHAR(32) NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
      metadata JSONB
    );

    CREATE TABLE IF NOT EXISTS interview_evaluations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      student_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      category VARCHAR(64) NOT NULL,
      target_role VARCHAR(160) NOT NULL,
      difficulty VARCHAR(32) DEFAULT 'Medium' NOT NULL,
      overall_score NUMERIC(4,2) NOT NULL,
      dimension_scores JSONB NOT NULL,
      strengths JSONB DEFAULT '[]' NOT NULL,
      growth_areas JSONB DEFAULT '[]' NOT NULL,
      detailed_feedback TEXT NOT NULL,
      actionable_recommendations TEXT NOT NULL,
      is_draft BOOLEAN DEFAULT true NOT NULL,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      student_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      session_agenda TEXT,
      shared_action_items JSONB DEFAULT '[]',
      student_visible_summary TEXT,
      mentor_private_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentor_settlements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      period_start TIMESTAMPTZ NOT NULL,
      period_end TIMESTAMPTZ NOT NULL,
      session_count INTEGER DEFAULT 0 NOT NULL,
      gross_amount_paise INTEGER NOT NULL,
      platform_fee_paise INTEGER NOT NULL,
      net_payable_paise INTEGER NOT NULL,
      status VARCHAR(32) DEFAULT 'pending' NOT NULL,
      payout_method VARCHAR(64) DEFAULT 'manual_bank_transfer' NOT NULL,
      payout_reference VARCHAR(160),
      approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMPTZ,
      settled_at TIMESTAMPTZ,
      failure_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
      student_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      mentor_profile_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
      reason VARCHAR(120) NOT NULL,
      student_explanation TEXT NOT NULL,
      mentor_response TEXT,
      evidence_urls JSONB DEFAULT '[]',
      status VARCHAR(32) DEFAULT 'opened' NOT NULL,
      resolution_notes TEXT,
      refund_amount_paise INTEGER DEFAULT 0,
      resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount_paise INTEGER DEFAULT 0 NOT NULL;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency VARCHAR(8) DEFAULT 'INR' NOT NULL;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_free_session BOOLEAN DEFAULT false NOT NULL;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS policy_version_id VARCHAR(64) DEFAULT 'policy-v1';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0 NOT NULL;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_start_time_utc TIMESTAMPTZ;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_end_time_utc TIMESTAMPTZ;

    ALTER TABLE booking_events ADD COLUMN IF NOT EXISTS from_status VARCHAR(32);
    ALTER TABLE booking_events ADD COLUMN IF NOT EXISTS to_status VARCHAR(32);
    ALTER TABLE booking_events ADD COLUMN IF NOT EXISTS actor_id UUID;
    ALTER TABLE booking_events ADD COLUMN IF NOT EXISTS actor_role VARCHAR(32) DEFAULT 'system';
    ALTER TABLE booking_events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS platform_commission_percent NUMERIC(4,2) DEFAULT 15.00 NOT NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS mentor_revenue_share_percent NUMERIC(4,2) DEFAULT 85.00 NOT NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS gateway_fee_percent NUMERIC(4,2) DEFAULT 2.00 NOT NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS tax_gst_percent NUMERIC(4,2) DEFAULT 18.00 NOT NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS payout_frequency VARCHAR(32) DEFAULT 'weekly' NOT NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS min_payout_threshold_paise INTEGER DEFAULT 50000 NOT NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS settlement_hold_days INTEGER DEFAULT 3 NOT NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS dispute_window_hours INTEGER DEFAULT 72 NOT NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS effective_from_utc TIMESTAMPTZ DEFAULT now() NOT NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS effective_to_utc TIMESTAMPTZ;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS approval_status VARCHAR(32) DEFAULT 'pending_approval' NOT NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE booking_policies ADD COLUMN IF NOT EXISTS approval_notes TEXT;

    CREATE TABLE IF NOT EXISTS policy_audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      policy_id VARCHAR(64) NOT NULL,
      changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(64) NOT NULL,
      previous_state JSONB,
      new_state JSONB NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(8) DEFAULT 'INR' NOT NULL;
    ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS gross_amount_paise INTEGER DEFAULT 0 NOT NULL;
    ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS platform_fee_paise INTEGER DEFAULT 0 NOT NULL;
    ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS mentor_payable_paise INTEGER DEFAULT 0 NOT NULL;
    ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS gateway_fee_paise INTEGER DEFAULT 0 NOT NULL;
    ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS tax_paise INTEGER DEFAULT 0 NOT NULL;
    ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(32) DEFAULT 'payment' NOT NULL;
    ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS parent_transaction_id UUID;
    ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS refund_amount_paise INTEGER DEFAULT 0;

    CREATE TABLE IF NOT EXISTS journal_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id UUID REFERENCES ledger_transactions(id) ON DELETE CASCADE,
      booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
      entry_type VARCHAR(16) NOT NULL,
      account VARCHAR(64) NOT NULL,
      amount_paise INTEGER NOT NULL,
      currency VARCHAR(8) DEFAULT 'INR' NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider VARCHAR(32) DEFAULT 'cashfree' NOT NULL,
      event_id VARCHAR(160) UNIQUE NOT NULL,
      order_id VARCHAR(160),
      event_type VARCHAR(64) NOT NULL,
      raw_payload JSONB NOT NULL,
      status VARCHAR(32) DEFAULT 'processed' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id VARCHAR(128) NOT NULL,
      sender_user_id VARCHAR(128) NOT NULL,
      sender_name VARCHAR(160) NOT NULL,
      sender_role VARCHAR(32) NOT NULL,
      content TEXT NOT NULL,
      latency_ms NUMERIC(6, 2) DEFAULT 0.00,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_session_chat_booking ON session_chat_messages (booking_id, created_at);

    INSERT INTO booking_policies (
      id, version, name, platform_commission_percent, mentor_revenue_share_percent,
      gateway_fee_percent, tax_gst_percent, cancellation_cutoff_hours,
      rescheduling_cutoff_hours, max_reschedules, refund_eligibility_percent,
      no_show_refund_percent, payout_frequency, min_payout_threshold_paise,
      settlement_hold_days, dispute_window_hours, approval_status, approval_notes, is_active
    )
    VALUES (
      'policy-v1', '1.0', 'Standard MentorMaze Policy (Unapproved Baseline)', 15.00, 85.00,
      2.00, 18.00, 24, 12, 2, 100, 0, 'weekly', 50000, 3, 72,
      'pending_approval', 'Default baseline awaiting formal business owner sign-off', true
    )
    ON CONFLICT (id) DO NOTHING;

    -- =========================================================================
    -- Official AI Mentor & ASTRION Intelligence Schema (17 Tables)
    -- =========================================================================

    CREATE TABLE IF NOT EXISTS ai_mentor_conversations (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      mode VARCHAR(32) DEFAULT 'learn' NOT NULL,
      active_topic VARCHAR(64) DEFAULT 'general' NOT NULL,
      language_preference VARCHAR(16) DEFAULT 'en' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_mentor_conv_student ON ai_mentor_conversations (student_user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_mentor_conv_updated ON ai_mentor_conversations (updated_at);

    CREATE TABLE IF NOT EXISTS ai_mentor_messages (
      id VARCHAR(64) PRIMARY KEY,
      conversation_id VARCHAR(64) REFERENCES ai_mentor_conversations(id) ON DELETE CASCADE NOT NULL,
      role VARCHAR(16) NOT NULL,
      content TEXT NOT NULL,
      teaching_strategy VARCHAR(64),
      hint_level INTEGER DEFAULT 0,
      difficulty VARCHAR(32) DEFAULT 'intermediate',
      student_understanding_signal VARCHAR(32),
      sources JSONB DEFAULT '[]'::jsonb,
      recommended_actions JSONB DEFAULT '[]'::jsonb,
      latency_ms REAL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_mentor_msg_conv ON ai_mentor_messages (conversation_id);
    CREATE INDEX IF NOT EXISTS idx_ai_mentor_msg_created ON ai_mentor_messages (created_at);

    CREATE TABLE IF NOT EXISTS student_learning_profiles (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) UNIQUE NOT NULL,
      preferred_language VARCHAR(16) DEFAULT 'en' NOT NULL,
      preferred_pacing VARCHAR(32) DEFAULT 'balanced',
      target_role VARCHAR(128) DEFAULT 'Software Development Engineer (SDE-1)',
      target_graduation_year INTEGER DEFAULT 2026,
      current_level VARCHAR(32) DEFAULT 'intermediate',
      learning_style VARCHAR(64) DEFAULT 'hands_on_problem_solving',
      institution VARCHAR(255),
      degree VARCHAR(255),
      confirmed_strengths JSONB DEFAULT '[]'::jsonb,
      confirmed_weaknesses JSONB DEFAULT '[]'::jsonb,
      system_hypotheses JSONB DEFAULT '[]'::jsonb,
      learning_goals JSONB DEFAULT '[]'::jsonb,
      consent_scope JSONB DEFAULT '{"shareWithMentors": true, "useForPersonalization": true, "retentionDays": 365}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_student_learning_prof_user ON student_learning_profiles (student_user_id);

    CREATE TABLE IF NOT EXISTS student_skill_nodes (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      skill_id VARCHAR(64) NOT NULL,
      parent_skill_id VARCHAR(64),
      skill_name VARCHAR(128) NOT NULL,
      category VARCHAR(64) NOT NULL,
      mastery_state VARCHAR(32) DEFAULT 'not_assessed' NOT NULL,
      mastery_score REAL DEFAULT 0.0,
      confidence REAL DEFAULT 0.5,
      assessment_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      known_weaknesses JSONB DEFAULT '[]'::jsonb,
      common_misconceptions JSONB DEFAULT '[]'::jsonb,
      evidence_type VARCHAR(32) DEFAULT 'self_reported',
      is_independently_verified BOOLEAN DEFAULT false,
      evidence_source TEXT,
      evidence_id VARCHAR(64),
      last_assessed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_student_skill_user_id ON student_skill_nodes (student_user_id, skill_id);

    CREATE TABLE IF NOT EXISTS student_skill_dependencies (
      id VARCHAR(64) PRIMARY KEY,
      skill_id VARCHAR(64) NOT NULL,
      prerequisite_skill_id VARCHAR(64) NOT NULL,
      dependency_type VARCHAR(32) DEFAULT 'hard_prerequisite',
      min_prerequisite_state VARCHAR(32) DEFAULT 'demonstrated'
    );

    CREATE TABLE IF NOT EXISTS student_skill_evidence (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      skill_id VARCHAR(64) NOT NULL,
      assessment_type VARCHAR(64) NOT NULL,
      score REAL NOT NULL,
      feedback TEXT,
      source_ref VARCHAR(128),
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_skill_evidence_student ON student_skill_evidence (student_user_id);

    CREATE TABLE IF NOT EXISTS student_memory (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      category VARCHAR(64) NOT NULL,
      key VARCHAR(128) NOT NULL,
      value TEXT NOT NULL,
      confidence REAL DEFAULT 1.0,
      provenance VARCHAR(64) DEFAULT 'student_reported',
      is_temporary BOOLEAN DEFAULT false,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_student_memory_user ON student_memory (student_user_id);
    CREATE INDEX IF NOT EXISTS idx_student_memory_category ON student_memory (student_user_id, category);

    CREATE TABLE IF NOT EXISTS ai_mentor_roadmaps (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      goal_id VARCHAR(64),
      target_role VARCHAR(128) NOT NULL,
      current_level VARCHAR(64) DEFAULT 'intermediate',
      target_timeline_weeks INTEGER DEFAULT 24,
      progress_pct INTEGER DEFAULT 0,
      status VARCHAR(32) DEFAULT 'active',
      adapted_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_roadmaps_student ON ai_mentor_roadmaps (student_user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_roadmaps_goal ON ai_mentor_roadmaps (goal_id);
    UPDATE ai_mentor_roadmaps SET status = 'superseded' WHERE status = 'active' AND id NOT IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY goal_id ORDER BY updated_at DESC) as rn 
        FROM ai_mentor_roadmaps 
        WHERE status = 'active'
      ) t WHERE rn = 1
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_roadmap_per_goal ON ai_mentor_roadmaps (goal_id) WHERE status = 'active';
    ALTER TABLE ai_mentor_roadmaps ADD COLUMN IF NOT EXISTS goal_id VARCHAR(64);
    ALTER TABLE ai_mentor_roadmaps ADD COLUMN IF NOT EXISTS adapted_reason TEXT;

    CREATE TABLE IF NOT EXISTS ai_mentor_roadmap_milestones (
      id VARCHAR(64) PRIMARY KEY,
      roadmap_id VARCHAR(64) REFERENCES ai_mentor_roadmaps(id),
      week_number INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      skills_covered JSONB DEFAULT '[]'::jsonb,
      status VARCHAR(32) DEFAULT 'pending',
      completed_at TIMESTAMPTZ,
      student_confirmation BOOLEAN DEFAULT false,
      evidence_ref TEXT,
      deliverable_url VARCHAR(255),
      assessment_notes TEXT,
      success_criteria JSONB DEFAULT '[]'::jsonb,
      provenance VARCHAR(64) DEFAULT 'student_confirmed'
    );
    ALTER TABLE ai_mentor_roadmap_milestones ADD COLUMN IF NOT EXISTS student_confirmation BOOLEAN DEFAULT false;
    ALTER TABLE ai_mentor_roadmap_milestones ADD COLUMN IF NOT EXISTS evidence_ref TEXT;
    ALTER TABLE ai_mentor_roadmap_milestones ADD COLUMN IF NOT EXISTS deliverable_url VARCHAR(255);
    ALTER TABLE ai_mentor_roadmap_milestones ADD COLUMN IF NOT EXISTS assessment_notes TEXT;
    ALTER TABLE ai_mentor_roadmap_milestones ADD COLUMN IF NOT EXISTS success_criteria JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE ai_mentor_roadmap_milestones ADD COLUMN IF NOT EXISTS provenance VARCHAR(64) DEFAULT 'student_confirmed';

    CREATE TABLE IF NOT EXISTS knowledge_sources (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      collection VARCHAR(64) NOT NULL,
      publisher VARCHAR(128) NOT NULL,
      url_or_id VARCHAR(255),
      license VARCHAR(64) NOT NULL,
      access_scope VARCHAR(32) DEFAULT 'public',
      document_count INTEGER DEFAULT 0,
      last_verified_at TIMESTAMPTZ DEFAULT now(),
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id VARCHAR(64) PRIMARY KEY,
      source_id VARCHAR(64) REFERENCES knowledge_sources(id),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      chunk_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id VARCHAR(64) PRIMARY KEY,
      document_id VARCHAR(64) REFERENCES knowledge_documents(id),
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      token_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS dataset_registry (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      publisher VARCHAR(128) NOT NULL,
      canonical_url VARCHAR(255),
      version VARCHAR(32) NOT NULL,
      license VARCHAR(64) NOT NULL,
      commercial_allowed BOOLEAN DEFAULT false,
      pii_status VARCHAR(64) DEFAULT 'unverified',
      intended_use VARCHAR(64) DEFAULT 'evaluation',
      approval_status VARCHAR(32) DEFAULT 'pending_review',
      record_count INTEGER DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_descriptions (
      id VARCHAR(64) PRIMARY KEY,
      company VARCHAR(128) NOT NULL,
      title VARCHAR(128) NOT NULL,
      job_family VARCHAR(64) NOT NULL,
      department VARCHAR(64),
      location VARCHAR(128) NOT NULL,
      experience_req VARCHAR(64) NOT NULL,
      education_req VARCHAR(128),
      must_have_skills JSONB DEFAULT '[]'::jsonb,
      preferred_skills JSONB DEFAULT '[]'::jsonb,
      tools_tech JSONB DEFAULT '[]'::jsonb,
      responsibilities JSONB DEFAULT '[]'::jsonb,
      seniority VARCHAR(32) DEFAULT 'mid',
      employment_type VARCHAR(32) DEFAULT 'full_time',
      salary_range VARCHAR(64),
      source_url VARCHAR(255),
      is_verified BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_evaluation_cases (
      id VARCHAR(64) PRIMARY KEY,
      benchmark_suite VARCHAR(64) NOT NULL,
      category VARCHAR(64) NOT NULL,
      topic VARCHAR(128) NOT NULL,
      difficulty VARCHAR(32) NOT NULL,
      prompt TEXT NOT NULL,
      expected_criteria JSONB NOT NULL,
      holdout_split VARCHAR(32) DEFAULT 'test',
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_evaluation_runs (
      id VARCHAR(64) PRIMARY KEY,
      suite_name VARCHAR(64) NOT NULL,
      model_name VARCHAR(64) NOT NULL,
      provider VARCHAR(64) NOT NULL,
      total_cases INTEGER NOT NULL,
      technical_accuracy_score REAL NOT NULL,
      socratic_quotient_score REAL NOT NULL,
      hallucination_rate REAL NOT NULL,
      avg_latency_ms REAL NOT NULL,
      status VARCHAR(32) DEFAULT 'completed',
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_feedback (
      id VARCHAR(64) PRIMARY KEY,
      conversation_id VARCHAR(64),
      message_id VARCHAR(64),
      student_user_id VARCHAR(64) NOT NULL,
      rating INTEGER NOT NULL,
      feedback_type VARCHAR(64),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_feedback_student ON ai_feedback (student_user_id);

    -- Phase 2 Intelligence Graph Tables
    CREATE TABLE IF NOT EXISTS student_projects (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      role VARCHAR(128),
      technologies JSONB DEFAULT '[]'::jsonb,
      outcomes TEXT,
      repository_url VARCHAR(255),
      live_url VARCHAR(255),
      source_system VARCHAR(64) DEFAULT 'MentorMaze' NOT NULL,
      verification_status VARCHAR(32) DEFAULT 'self_reported' NOT NULL,
      evidence_id VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_student_projects_user ON student_projects (student_user_id);

    CREATE TABLE IF NOT EXISTS student_intelligence_evidence (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      entity_type VARCHAR(32) NOT NULL,
      entity_id VARCHAR(128) NOT NULL,
      source_type VARCHAR(32) NOT NULL,
      source_system VARCHAR(64) DEFAULT 'MentorMaze' NOT NULL,
      source_reference VARCHAR(255),
      evidence_type VARCHAR(32) NOT NULL,
      confidence REAL DEFAULT 0.5 NOT NULL,
      verification_status VARCHAR(32) DEFAULT 'unverified' NOT NULL,
      purpose VARCHAR(64) DEFAULT 'service_personalization' NOT NULL,
      consent_reference VARCHAR(64),
      observed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      expires_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_evidence_student_entity ON student_intelligence_evidence (student_user_id, entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_student_type ON student_intelligence_evidence (student_user_id, evidence_type);

    CREATE TABLE IF NOT EXISTS student_purpose_consents (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      purpose VARCHAR(64) NOT NULL,
      is_granted BOOLEAN DEFAULT true NOT NULL,
      consent_version VARCHAR(32) DEFAULT '1.0' NOT NULL,
      consent_epoch INTEGER DEFAULT 1 NOT NULL,
      audit_notes TEXT,
      granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      revoked_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    ALTER TABLE student_purpose_consents ADD COLUMN IF NOT EXISTS consent_epoch INTEGER DEFAULT 1 NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_student_purpose_lookup ON student_purpose_consents (student_user_id, purpose, is_granted);

    -- Phase 3 Goal-Centric Mentorship Schema
    CREATE TABLE IF NOT EXISTS ai_mentor_goals (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(64) DEFAULT 'career' NOT NULL,
      importance VARCHAR(32) DEFAULT 'primary' NOT NULL,
      status VARCHAR(32) DEFAULT 'active' NOT NULL,
      target_outcome TEXT,
      target_date VARCHAR(64),
      current_state VARCHAR(32) DEFAULT 'in_progress' NOT NULL,
      success_criteria JSONB DEFAULT '[]'::jsonb,
      associated_skills JSONB DEFAULT '[]'::jsonb,
      associated_projects JSONB DEFAULT '[]'::jsonb,
      roadmap_id VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_mentor_goals_student ON ai_mentor_goals (student_user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_mentor_goals_status ON ai_mentor_goals (student_user_id, status);

    -- Phase 2.1 Persistent Graph Schema Alignment
    ALTER TABLE student_learning_profiles ADD COLUMN IF NOT EXISTS institution VARCHAR(255);
    ALTER TABLE student_learning_profiles ADD COLUMN IF NOT EXISTS degree VARCHAR(255);
    ALTER TABLE student_learning_profiles ADD COLUMN IF NOT EXISTS confirmed_strengths JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE student_learning_profiles ADD COLUMN IF NOT EXISTS confirmed_weaknesses JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE student_learning_profiles ADD COLUMN IF NOT EXISTS system_hypotheses JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE student_learning_profiles ADD COLUMN IF NOT EXISTS learning_goals JSONB DEFAULT '[]'::jsonb;

    ALTER TABLE student_skill_nodes ADD COLUMN IF NOT EXISTS evidence_type VARCHAR(32) DEFAULT 'self_reported';
    ALTER TABLE student_skill_nodes ADD COLUMN IF NOT EXISTS is_independently_verified BOOLEAN DEFAULT false;
    ALTER TABLE student_skill_nodes ADD COLUMN IF NOT EXISTS evidence_source TEXT;
    ALTER TABLE student_skill_nodes ADD COLUMN IF NOT EXISTS evidence_id VARCHAR(64);

    -- Phase 4.1.1 Persistent Check-In Preferences & Dedicated Records
    CREATE TABLE IF NOT EXISTS ai_mentor_checkin_preferences (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) UNIQUE NOT NULL,
      cadence VARCHAR(32) DEFAULT 'weekly' NOT NULL,
      preferred_hour INTEGER DEFAULT 10 NOT NULL,
      timezone VARCHAR(64) DEFAULT 'Asia/Kolkata' NOT NULL,
      quiet_hours_enabled BOOLEAN DEFAULT false NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_mentor_checkin_prefs_student ON ai_mentor_checkin_preferences (student_user_id);

    CREATE TABLE IF NOT EXISTS ai_mentor_checkin_records (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      checkin_type VARCHAR(32) DEFAULT 'session_checkin' NOT NULL,
      goal_id VARCHAR(64),
      roadmap_id VARCHAR(64),
      milestone_id VARCHAR(64),
      student_response TEXT,
      progress_summary TEXT,
      blockers TEXT,
      notes TEXT,
      provenance VARCHAR(64) DEFAULT 'student_reported' NOT NULL,
      consent_reference VARCHAR(64) DEFAULT 'student_memory',
      observed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_mentor_checkin_rec_student ON ai_mentor_checkin_records (student_user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_mentor_checkin_rec_goal ON ai_mentor_checkin_records (goal_id);
    CREATE INDEX IF NOT EXISTS idx_ai_mentor_checkin_rec_observed ON ai_mentor_checkin_records (observed_at);

    ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS observed_strengths JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS development_gaps JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS recommended_actions JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS agreed_milestones JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS follow_up_date VARCHAR(64);
    ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS next_session_focus TEXT;

    CREATE TABLE IF NOT EXISTS mentorship_bridge_shares (
      id VARCHAR(64) PRIMARY KEY,
      student_user_id VARCHAR(64) NOT NULL,
      mentor_profile_id VARCHAR(64),
      booking_id VARCHAR(64),
      timeframe VARCHAR(32) DEFAULT '30_days' NOT NULL,
      selected_conversation_ids JSONB DEFAULT '[]'::jsonb,
      student_background JSONB DEFAULT '{}'::jsonb,
      mentoring_history JSONB DEFAULT '[]'::jsonb,
      current_challenges JSONB DEFAULT '[]'::jsonb,
      progress_and_evidence JSONB DEFAULT '[]'::jsonb,
      development_areas JSONB DEFAULT '[]'::jsonb,
      mentoring_objectives JSONB DEFAULT '[]'::jsonb,
      questions_for_mentor JSONB DEFAULT '[]'::jsonb,
      student_note TEXT,
      status VARCHAR(32) DEFAULT 'draft' NOT NULL,
      share_purpose VARCHAR(64) DEFAULT 'session_preparation' NOT NULL,
      consent_reference VARCHAR(64) DEFAULT 'mentorship_bridge_share',
      shared_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      access_audit_logs JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bridge_shares_student ON mentorship_bridge_shares (student_user_id);
    CREATE INDEX IF NOT EXISTS idx_bridge_shares_mentor ON mentorship_bridge_shares (mentor_profile_id);
    CREATE INDEX IF NOT EXISTS idx_bridge_shares_booking ON mentorship_bridge_shares (booking_id);
    CREATE INDEX IF NOT EXISTS idx_bridge_shares_status ON mentorship_bridge_shares (status);

    CREATE TABLE IF NOT EXISTS inbound_event_ledger (
      event_id VARCHAR(128) PRIMARY KEY,
      jti VARCHAR(128),
      source_system VARCHAR(64) DEFAULT 'ai-tathastu' NOT NULL,
      processed_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_inbound_event_ledger_jti ON inbound_event_ledger(jti) WHERE jti IS NOT NULL;

    CREATE TABLE IF NOT EXISTS shared_rate_limits (
      key VARCHAR(255) PRIMARY KEY,
      count INTEGER DEFAULT 1 NOT NULL,
      reset_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_shared_rate_limits_reset ON shared_rate_limits (reset_at);
  `;

  if (pgliteInstance) {
    await pgliteInstance.exec(ddl);
  } else {
    const stmts = ddl.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
    for (const stmt of stmts) {
      await (targetDb as any).execute(sql.raw(stmt));
    }
  }

  // Auto-seed baseline fixtures if database is freshly initialized and users is empty
  if (!(globalThis as any).__mm_is_seeding) {
    (globalThis as any).__mm_is_seeding = true;
    try {
      const userCountRes: any = await (targetDb as any).execute(sql`SELECT count(*)::int as count FROM users;`);
      const count = userCountRes.rows?.[0]?.count ?? userCountRes?.[0]?.count ?? 0;
      if (count === 0) {
        process.env.ALLOW_PROD_SEED = "1";
        const { seedDatabase } = await import("./seed");
        await seedDatabase();
      }
    } catch (err) {
      // Ignore non-fatal initialization error
    } finally {
      (globalThis as any).__mm_is_seeding = false;
    }
  }

  return targetDb;
}
