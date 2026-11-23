CREATE TABLE IF NOT EXISTS "ai_mentor_goals" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_user_id" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(64) DEFAULT 'career' NOT NULL,
	"importance" varchar(32) DEFAULT 'primary' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"target_outcome" text,
	"target_date" varchar(64),
	"current_state" varchar(32) DEFAULT 'in_progress' NOT NULL,
	"success_criteria" jsonb DEFAULT '[]'::jsonb,
	"associated_skills" jsonb DEFAULT '[]'::jsonb,
	"associated_projects" jsonb DEFAULT '[]'::jsonb,
	"roadmap_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_mentor_goals_student" ON "ai_mentor_goals" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_mentor_goals_status" ON "ai_mentor_goals" USING btree ("student_user_id","status");
