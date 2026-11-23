CREATE TABLE IF NOT EXISTS "ai_mentor_checkin_preferences" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "student_user_id" varchar(64) NOT NULL UNIQUE,
  "cadence" varchar(32) DEFAULT 'weekly' NOT NULL,
  "preferred_hour" integer DEFAULT 10 NOT NULL,
  "timezone" varchar(64) DEFAULT 'Asia/Kolkata' NOT NULL,
  "quiet_hours_enabled" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_mentor_checkin_prefs_student" ON "ai_mentor_checkin_preferences" ("student_user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_mentor_checkin_records" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "student_user_id" varchar(64) NOT NULL,
  "checkin_type" varchar(32) DEFAULT 'session_checkin' NOT NULL,
  "goal_id" varchar(64),
  "roadmap_id" varchar(64),
  "milestone_id" varchar(64),
  "student_response" text,
  "progress_summary" text,
  "blockers" text,
  "notes" text,
  "provenance" varchar(64) DEFAULT 'student_reported' NOT NULL,
  "consent_reference" varchar(64) DEFAULT 'student_memory',
  "observed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_mentor_checkin_rec_student" ON "ai_mentor_checkin_records" ("student_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_mentor_checkin_rec_goal" ON "ai_mentor_checkin_records" ("goal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_mentor_checkin_rec_observed" ON "ai_mentor_checkin_records" ("observed_at");
