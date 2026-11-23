CREATE TABLE IF NOT EXISTS "action_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_profile_id" uuid NOT NULL,
	"mentor_profile_id" uuid,
	"goal_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"due_date" date,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_by_role" varchar(32) DEFAULT 'student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(120) NOT NULL,
	"resource_type" varchar(64) NOT NULL,
	"resource_id" varchar(120),
	"details" jsonb,
	"ip_address" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"exception_date" date NOT NULL,
	"is_blocked" boolean DEFAULT true NOT NULL,
	"start_time" time,
	"end_time" time,
	"reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"from_status" varchar(32),
	"to_status" varchar(32) NOT NULL,
	"actor_id" uuid,
	"actor_role" varchar(32) DEFAULT 'system',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"service_type" varchar(64) NOT NULL,
	"session_duration_minutes" integer NOT NULL,
	"start_time_utc" timestamp with time zone NOT NULL,
	"end_time_utc" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_holds_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_policies" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"version" varchar(32) NOT NULL,
	"name" varchar(160) NOT NULL,
	"platform_commission_percent" numeric(4, 2) DEFAULT '15.00' NOT NULL,
	"mentor_revenue_share_percent" numeric(4, 2) DEFAULT '85.00' NOT NULL,
	"gateway_fee_percent" numeric(4, 2) DEFAULT '2.00' NOT NULL,
	"tax_gst_percent" numeric(4, 2) DEFAULT '18.00' NOT NULL,
	"cancellation_cutoff_hours" integer DEFAULT 24 NOT NULL,
	"rescheduling_cutoff_hours" integer DEFAULT 12 NOT NULL,
	"max_reschedules" integer DEFAULT 2 NOT NULL,
	"refund_eligibility_percent" integer DEFAULT 100 NOT NULL,
	"no_show_refund_percent" integer DEFAULT 0 NOT NULL,
	"payout_frequency" varchar(32) DEFAULT 'weekly' NOT NULL,
	"min_payout_threshold_paise" integer DEFAULT 50000 NOT NULL,
	"settlement_hold_days" integer DEFAULT 3 NOT NULL,
	"dispute_window_hours" integer DEFAULT 72 NOT NULL,
	"effective_from_utc" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to_utc" timestamp with time zone,
	"approval_status" varchar(32) DEFAULT 'pending_approval' NOT NULL,
	"approved_by_user_id" uuid,
	"approval_notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" uuid NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"service_type" varchar(64) NOT NULL,
	"session_duration_minutes" integer DEFAULT 30 NOT NULL,
	"start_time_utc" timestamp with time zone NOT NULL,
	"end_time_utc" timestamp with time zone NOT NULL,
	"user_timezone" varchar(64) DEFAULT 'Asia/Kolkata' NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"price_inr" integer NOT NULL,
	"amount_paise" integer DEFAULT 0 NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"is_free_session" boolean DEFAULT false NOT NULL,
	"payment_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"student_discussion_points" text,
	"resume_attachment_url" text,
	"project_links" text,
	"meeting_room_id" varchar(120),
	"cancellation_reason" text,
	"policy_version_id" varchar(64) DEFAULT 'v1',
	"reschedule_count" integer DEFAULT 0 NOT NULL,
	"actual_start_time_utc" timestamp with time zone,
	"actual_end_time_utc" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"provider" varchar(64) DEFAULT 'google_calendar' NOT NULL,
	"account_email" varchar(255),
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp with time zone,
	"sync_token" text,
	"watch_channel_id" varchar(255),
	"watch_channel_expiration" timestamp with time zone,
	"status" varchar(32) DEFAULT 'connected' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consent_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_system" varchar(64) DEFAULT 'aitathastu' NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"consent_version" varchar(32) DEFAULT '1.0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" uuid NOT NULL,
	"mentor_user_id" uuid NOT NULL,
	"booking_id" uuid,
	"last_message_text" text,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"reason" varchar(120) NOT NULL,
	"student_explanation" text NOT NULL,
	"mentor_response" text,
	"evidence_urls" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(32) DEFAULT 'opened' NOT NULL,
	"resolution_notes" text,
	"refund_amount_paise" integer DEFAULT 0,
	"resolved_by_user_id" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"actor_email" varchar(255),
	"action" varchar(120) NOT NULL,
	"target_id" varchar(120),
	"details" jsonb,
	"ip_address" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_automations" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"event_type" varchar(120) NOT NULL,
	"template_id" varchar(120) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"recipient_type" varchar(64) DEFAULT 'user' NOT NULL,
	"delay_seconds" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 5 NOT NULL,
	"quiet_hours_enabled" boolean DEFAULT false NOT NULL,
	"last_executed_at" timestamp with time zone,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_delivery_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_user_id" uuid,
	"recipient_name" varchar(160),
	"template_id" varchar(120),
	"subject" varchar(255) NOT NULL,
	"category" varchar(64) DEFAULT 'system' NOT NULL,
	"event_type" varchar(120),
	"status" varchar(32) DEFAULT 'queued' NOT NULL,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"idempotency_key" varchar(255),
	"smtp_response" text,
	"error_message" text,
	"metadata" jsonb,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_attempted_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	CONSTRAINT "email_delivery_logs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" varchar(255) NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"recommendations_consent" boolean DEFAULT true NOT NULL,
	"newsletter_consent" boolean DEFAULT false NOT NULL,
	"booking_reminders_consent" boolean DEFAULT true NOT NULL,
	"unsubscribe_token" varchar(128) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_preferences_email_unique" UNIQUE("email"),
	CONSTRAINT "email_preferences_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"reason" varchar(64) NOT NULL,
	"source" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_suppressions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_templates" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(64) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"preview_text" varchar(255),
	"html_body" text NOT NULL,
	"text_body" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system_critical" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"external_event_id" varchar(255) NOT NULL,
	"booking_id" uuid,
	"start_time_utc" timestamp with time zone NOT NULL,
	"end_time_utc" timestamp with time zone NOT NULL,
	"is_busy" boolean DEFAULT true NOT NULL,
	"etag" varchar(255),
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"category" varchar(64) NOT NULL,
	"target_role" varchar(160) NOT NULL,
	"difficulty" varchar(32) DEFAULT 'Medium' NOT NULL,
	"overall_score" numeric(4, 2) NOT NULL,
	"dimension_scores" jsonb NOT NULL,
	"strengths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"growth_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"detailed_feedback" text NOT NULL,
	"actionable_recommendations" text NOT NULL,
	"is_draft" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_evaluations_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid,
	"booking_id" uuid,
	"entry_type" varchar(16) NOT NULL,
	"account" varchar(64) NOT NULL,
	"amount_paise" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ledger_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"gross_amount_inr" integer NOT NULL,
	"gross_amount_paise" integer DEFAULT 0 NOT NULL,
	"platform_commission_percent" numeric(4, 2) DEFAULT '15.00' NOT NULL,
	"platform_fee_inr" integer NOT NULL,
	"platform_fee_paise" integer DEFAULT 0 NOT NULL,
	"mentor_payable_inr" integer NOT NULL,
	"mentor_payable_paise" integer DEFAULT 0 NOT NULL,
	"gateway_fee_paise" integer DEFAULT 0 NOT NULL,
	"tax_paise" integer DEFAULT 0 NOT NULL,
	"transaction_type" varchar(32) DEFAULT 'payment' NOT NULL,
	"parent_transaction_id" uuid,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"payment_provider" varchar(64) DEFAULT 'cashfree' NOT NULL,
	"provider_order_id" varchar(160),
	"provider_payment_id" varchar(160),
	"refund_amount_inr" integer DEFAULT 0,
	"refund_amount_paise" integer DEFAULT 0,
	"refund_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentor_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'submitted' NOT NULL,
	"identity_proof_type" varchar(64) DEFAULT 'Aadhaar/PAN/Passport',
	"identity_proof_url" text,
	"professional_proof_type" varchar(64) DEFAULT 'Work Email/Employee ID/LinkedIn',
	"professional_proof_url" text,
	"resume_url" text,
	"linkedin_url" text,
	"rejection_reason" text,
	"admin_notes" text,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentor_availability_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"buffer_time_minutes" integer DEFAULT 15 NOT NULL,
	"min_notice_hours" integer DEFAULT 2 NOT NULL,
	"max_advance_days" integer DEFAULT 30 NOT NULL,
	"daily_session_limit" integer DEFAULT 4 NOT NULL,
	"weekly_session_limit" integer DEFAULT 20 NOT NULL,
	"custom_session_durations" jsonb DEFAULT '[15,30,45,60]'::jsonb NOT NULL,
	"timezone" varchar(64) DEFAULT 'Asia/Kolkata' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentor_availability_settings_mentor_profile_id_unique" UNIQUE("mentor_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentor_expertise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"primary_domain" varchar(120) NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"focus_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"headline" varchar(255) NOT NULL,
	"bio" text NOT NULL,
	"organization" varchar(255) NOT NULL,
	"current_role" varchar(255) NOT NULL,
	"years_of_experience" integer DEFAULT 1 NOT NULL,
	"location" varchar(160) DEFAULT 'India',
	"rating" numeric(3, 2) DEFAULT '5.00' NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"total_mentees" integer DEFAULT 0 NOT NULL,
	"verification_status" varchar(32) DEFAULT 'submitted' NOT NULL,
	"verified_at" timestamp with time zone,
	"languages" jsonb DEFAULT '["English"]'::jsonb NOT NULL,
	"session_modes" jsonb DEFAULT '["1:1"]'::jsonb NOT NULL,
	"response_time" varchar(64) DEFAULT 'Within 6 hours',
	"is_accepting_bookings" boolean DEFAULT true NOT NULL,
	"price_15min_inr" integer DEFAULT 149 NOT NULL,
	"price_30min_inr" integer DEFAULT 249 NOT NULL,
	"price_60min_inr" integer DEFAULT 449 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentor_settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"session_count" integer DEFAULT 0 NOT NULL,
	"gross_amount_paise" integer NOT NULL,
	"platform_fee_paise" integer NOT NULL,
	"net_payable_paise" integer NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"payout_method" varchar(64) DEFAULT 'manual_bank_transfer' NOT NULL,
	"payout_reference" varchar(160),
	"approved_by_user_id" uuid,
	"approved_at" timestamp with time zone,
	"settled_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mentorship_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"livekit_room_name" varchar(160) NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"actual_duration_seconds" integer,
	"session_plan_checklist" jsonb,
	"mentor_private_notes" text,
	"student_visible_summary" text,
	"resources_shared" jsonb,
	"status" varchar(32) DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentorship_sessions_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"attachment_url" text,
	"attachment_name" varchar(255),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mock_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"category" varchar(64) NOT NULL,
	"target_role" varchar(160) NOT NULL,
	"difficulty" varchar(32) DEFAULT 'Medium' NOT NULL,
	"overall_score" numeric(3, 1),
	"score_technical" numeric(3, 1),
	"score_problem_solving" numeric(3, 1),
	"score_communication" numeric(3, 1),
	"score_confidence" numeric(3, 1),
	"strengths" jsonb DEFAULT '[]'::jsonb,
	"areas_to_improve" jsonb DEFAULT '[]'::jsonb,
	"detailed_feedback" text,
	"recommended_next_steps" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mock_interviews_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"audience" varchar(64) DEFAULT 'all' NOT NULL,
	"priority" varchar(32) DEFAULT 'normal' NOT NULL,
	"action_url" text,
	"action_label" varchar(120),
	"channels" jsonb DEFAULT '["in_app","push"]'::jsonb NOT NULL,
	"published_by_user_id" uuid,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"channel" varchar(32) NOT NULL,
	"status" varchar(32) NOT NULL,
	"error_message" text,
	"delivered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"booking_reminders" boolean DEFAULT true NOT NULL,
	"chat_messages" boolean DEFAULT true NOT NULL,
	"mentorship_updates" boolean DEFAULT true NOT NULL,
	"mock_interview_alerts" boolean DEFAULT true NOT NULL,
	"payment_receipts" boolean DEFAULT true NOT NULL,
	"marketing_announcements" boolean DEFAULT false NOT NULL,
	"quiet_hours_enabled" boolean DEFAULT false NOT NULL,
	"quiet_hours_start" varchar(5) DEFAULT '22:00' NOT NULL,
	"quiet_hours_end" varchar(5) DEFAULT '08:00' NOT NULL,
	"timezone" varchar(64) DEFAULT 'Asia/Kolkata' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(64) NOT NULL,
	"category" varchar(64) DEFAULT 'general' NOT NULL,
	"priority" varchar(32) DEFAULT 'normal' NOT NULL,
	"link_url" text,
	"action_url" text,
	"action_label" varchar(120),
	"idempotency_key" varchar(255),
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(120) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"locked_at" timestamp with time zone,
	"locked_by" varchar(120),
	"next_retry_at" timestamp with time zone DEFAULT now(),
	"idempotency_key" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_settings" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by_user_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "policy_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" varchar(64) NOT NULL,
	"changed_by_user_id" uuid,
	"action" varchar(64) NOT NULL,
	"previous_state" jsonb,
	"new_state" jsonb NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduled_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reminder_type" varchar(32) NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_attendance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(32) NOT NULL,
	"event_type" varchar(32) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar(128) NOT NULL,
	"sender_user_id" varchar(128) NOT NULL,
	"sender_name" varchar(160) NOT NULL,
	"sender_role" varchar(32) NOT NULL,
	"content" text NOT NULL,
	"latency_ms" numeric(6, 2) DEFAULT '0.00',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"mentor_profile_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"session_agenda" text,
	"shared_action_items" jsonb DEFAULT '[]'::jsonb,
	"student_visible_summary" text,
	"mentor_private_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_notes_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_profile_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(64) DEFAULT 'career' NOT NULL,
	"status" varchar(32) DEFAULT 'in_progress' NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"target_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"institution" varchar(255),
	"degree" varchar(255),
	"field_of_study" varchar(255),
	"graduation_year" integer,
	"target_role" varchar(255),
	"current_level" varchar(64),
	"bio" text,
	"preferred_languages" jsonb DEFAULT '["English"]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_profile_id" uuid NOT NULL,
	"skill_name" varchar(120) NOT NULL,
	"proficiency_level" varchar(32) DEFAULT 'intermediate',
	"source" varchar(64) DEFAULT 'self_reported',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sender_user_id" uuid,
	"sender_name" varchar(160) NOT NULL,
	"sender_role" varchar(32) NOT NULL,
	"message" text NOT NULL,
	"is_internal_note" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar(64) NOT NULL,
	"user_id" uuid,
	"user_email" varchar(255) NOT NULL,
	"user_name" varchar(160) NOT NULL,
	"category" varchar(64) NOT NULL,
	"priority" varchar(32) DEFAULT 'medium' NOT NULL,
	"status" varchar(32) DEFAULT 'open' NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"booking_id" uuid,
	"payment_reference" varchar(120),
	"assigned_to_user_id" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(64) NOT NULL,
	"provider_subject" varchar(255) NOT NULL,
	"profile_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip_address" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"display_name" varchar(160) NOT NULL,
	"avatar_url" text,
	"account_status" varchar(32) DEFAULT 'active' NOT NULL,
	"role" varchar(32) DEFAULT 'student' NOT NULL,
	"timezone" varchar(64) DEFAULT 'Asia/Kolkata' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(32) DEFAULT 'cashfree' NOT NULL,
	"event_id" varchar(160) NOT NULL,
	"order_id" varchar(160),
	"event_type" varchar(64) NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'processed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_evaluation_cases" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"benchmark_suite" varchar(64) NOT NULL,
	"category" varchar(64) NOT NULL,
	"topic" varchar(128) NOT NULL,
	"difficulty" varchar(32) NOT NULL,
	"prompt" text NOT NULL,
	"expected_criteria" jsonb NOT NULL,
	"holdout_split" varchar(32) DEFAULT 'test',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_evaluation_runs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"suite_name" varchar(64) NOT NULL,
	"model_name" varchar(64) NOT NULL,
	"provider" varchar(64) NOT NULL,
	"total_cases" integer NOT NULL,
	"technical_accuracy_score" real NOT NULL,
	"socratic_quotient_score" real NOT NULL,
	"hallucination_rate" real NOT NULL,
	"avg_latency_ms" real NOT NULL,
	"status" varchar(32) DEFAULT 'completed',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_feedback" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"conversation_id" varchar(64),
	"message_id" varchar(64),
	"student_user_id" varchar(64) NOT NULL,
	"rating" integer NOT NULL,
	"feedback_type" varchar(64),
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_mentor_conversations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_user_id" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"mode" varchar(32) DEFAULT 'learn' NOT NULL,
	"active_topic" varchar(64) DEFAULT 'general' NOT NULL,
	"language_preference" varchar(16) DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_mentor_messages" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"conversation_id" varchar(64) NOT NULL,
	"role" varchar(16) NOT NULL,
	"content" text NOT NULL,
	"teaching_strategy" varchar(64),
	"hint_level" integer DEFAULT 0,
	"difficulty" varchar(32) DEFAULT 'intermediate',
	"student_understanding_signal" varchar(32),
	"sources" jsonb DEFAULT '[]'::jsonb,
	"recommended_actions" jsonb DEFAULT '[]'::jsonb,
	"latency_ms" real DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_mentor_roadmap_milestones" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"roadmap_id" varchar(64),
	"week_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"skills_covered" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(32) DEFAULT 'pending',
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_mentor_roadmaps" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_user_id" varchar(64) NOT NULL,
	"target_role" varchar(128) NOT NULL,
	"current_level" varchar(64) NOT NULL,
	"target_timeline_weeks" integer DEFAULT 24,
	"progress_pct" integer DEFAULT 0,
	"status" varchar(32) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dataset_registry" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"publisher" varchar(128) NOT NULL,
	"canonical_url" varchar(255),
	"version" varchar(32) NOT NULL,
	"license" varchar(64) NOT NULL,
	"commercial_allowed" boolean DEFAULT false,
	"pii_status" varchar(64) DEFAULT 'unverified',
	"intended_use" varchar(64) DEFAULT 'evaluation',
	"approval_status" varchar(32) DEFAULT 'pending_review',
	"record_count" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_descriptions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"company" varchar(128) NOT NULL,
	"title" varchar(128) NOT NULL,
	"job_family" varchar(64) NOT NULL,
	"department" varchar(64),
	"location" varchar(128) NOT NULL,
	"experience_req" varchar(64) NOT NULL,
	"education_req" varchar(128),
	"must_have_skills" jsonb DEFAULT '[]'::jsonb,
	"preferred_skills" jsonb DEFAULT '[]'::jsonb,
	"tools_tech" jsonb DEFAULT '[]'::jsonb,
	"responsibilities" jsonb DEFAULT '[]'::jsonb,
	"seniority" varchar(32) DEFAULT 'mid',
	"employment_type" varchar(32) DEFAULT 'full_time',
	"salary_range" varchar(64),
	"source_url" varchar(255),
	"is_verified" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_chunks" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"document_id" varchar(64),
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"token_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_documents" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"source_id" varchar(64),
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"chunk_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_sources" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"collection" varchar(64) NOT NULL,
	"publisher" varchar(128) NOT NULL,
	"url_or_id" varchar(255),
	"license" varchar(64) NOT NULL,
	"access_scope" varchar(32) DEFAULT 'public',
	"document_count" integer DEFAULT 0,
	"last_verified_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_learning_profiles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_user_id" varchar(64) NOT NULL,
	"preferred_language" varchar(16) DEFAULT 'en' NOT NULL,
	"preferred_pacing" varchar(32) DEFAULT 'balanced',
	"target_role" varchar(128) DEFAULT 'Software Development Engineer (SDE-1)',
	"target_graduation_year" integer DEFAULT 2026,
	"current_level" varchar(32) DEFAULT 'intermediate',
	"learning_style" varchar(64) DEFAULT 'hands_on_problem_solving',
	"consent_scope" jsonb DEFAULT '{"shareWithMentors":true,"useForPersonalization":true,"retentionDays":365}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_learning_profiles_student_user_id_unique" UNIQUE("student_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_memory" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_user_id" varchar(64) NOT NULL,
	"category" varchar(64) NOT NULL,
	"key" varchar(128) NOT NULL,
	"value" text NOT NULL,
	"confidence" real DEFAULT 1,
	"provenance" varchar(64) DEFAULT 'student_reported',
	"is_temporary" boolean DEFAULT false,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_skill_dependencies" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"skill_id" varchar(64) NOT NULL,
	"prerequisite_skill_id" varchar(64) NOT NULL,
	"dependency_type" varchar(32) DEFAULT 'hard_prerequisite',
	"min_prerequisite_state" varchar(32) DEFAULT 'demonstrated'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_skill_evidence" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_user_id" varchar(64) NOT NULL,
	"skill_id" varchar(64) NOT NULL,
	"assessment_type" varchar(64) NOT NULL,
	"score" real NOT NULL,
	"feedback" text,
	"source_ref" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_skill_nodes" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_user_id" varchar(64) NOT NULL,
	"skill_id" varchar(64) NOT NULL,
	"parent_skill_id" varchar(64),
	"skill_name" varchar(128) NOT NULL,
	"category" varchar(64) NOT NULL,
	"mastery_state" varchar(32) DEFAULT 'not_assessed' NOT NULL,
	"mastery_score" real DEFAULT 0,
	"confidence" real DEFAULT 0.5,
	"assessment_count" integer DEFAULT 0,
	"success_count" integer DEFAULT 0,
	"known_weaknesses" jsonb DEFAULT '[]'::jsonb,
	"common_misconceptions" jsonb DEFAULT '[]'::jsonb,
	"last_assessed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "action_items" ADD CONSTRAINT "action_items_student_profile_id_student_profiles_id_fk" FOREIGN KEY ("student_profile_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "action_items" ADD CONSTRAINT "action_items_goal_id_student_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."student_goals"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_holds" ADD CONSTRAINT "booking_holds_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_holds" ADD CONSTRAINT "booking_holds_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_policies" ADD CONSTRAINT "booking_policies_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_mentor_user_id_users_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_calendar_events" ADD CONSTRAINT "external_calendar_events_connection_id_calendar_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."calendar_connections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_calendar_events" ADD CONSTRAINT "external_calendar_events_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_calendar_events" ADD CONSTRAINT "external_calendar_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_transaction_id_ledger_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."ledger_transactions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentor_applications" ADD CONSTRAINT "mentor_applications_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentor_availability_settings" ADD CONSTRAINT "mentor_availability_settings_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentor_expertise" ADD CONSTRAINT "mentor_expertise_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentor_settlements" ADD CONSTRAINT "mentor_settlements_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentor_settlements" ADD CONSTRAINT "mentor_settlements_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mock_interviews" ADD CONSTRAINT "mock_interviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_announcements" ADD CONSTRAINT "notification_announcements_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "policy_audit_logs" ADD CONSTRAINT "policy_audit_logs_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session_attendance_events" ADD CONSTRAINT "session_attendance_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session_attendance_events" ADD CONSTRAINT "session_attendance_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_mentor_profile_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_profile_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_goals" ADD CONSTRAINT "student_goals_student_profile_id_student_profiles_id_fk" FOREIGN KEY ("student_profile_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_student_profile_id_student_profiles_id_fk" FOREIGN KEY ("student_profile_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_mentor_messages" ADD CONSTRAINT "ai_mentor_messages_conversation_id_ai_mentor_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_mentor_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_mentor_roadmap_milestones" ADD CONSTRAINT "ai_mentor_roadmap_milestones_roadmap_id_ai_mentor_roadmaps_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."ai_mentor_roadmaps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_feedback_student" ON "ai_feedback" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_mentor_conv_student" ON "ai_mentor_conversations" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_mentor_conv_updated" ON "ai_mentor_conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_mentor_msg_conv" ON "ai_mentor_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_mentor_msg_created" ON "ai_mentor_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_roadmaps_student" ON "ai_mentor_roadmaps" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_learning_prof_user" ON "student_learning_profiles" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_memory_user" ON "student_memory" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_memory_category" ON "student_memory" USING btree ("student_user_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_skill_evidence_student" ON "student_skill_evidence" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_skill_user_id" ON "student_skill_nodes" USING btree ("student_user_id","skill_id");