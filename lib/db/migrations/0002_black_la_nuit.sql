ALTER TABLE "student_learning_profiles" ADD COLUMN "institution" varchar(255);--> statement-breakpoint
ALTER TABLE "student_learning_profiles" ADD COLUMN "degree" varchar(255);--> statement-breakpoint
ALTER TABLE "student_learning_profiles" ADD COLUMN "confirmed_strengths" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "student_learning_profiles" ADD COLUMN "confirmed_weaknesses" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "student_learning_profiles" ADD COLUMN "system_hypotheses" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "student_learning_profiles" ADD COLUMN "learning_goals" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "student_skill_nodes" ADD COLUMN "evidence_type" varchar(32) DEFAULT 'self_reported';--> statement-breakpoint
ALTER TABLE "student_skill_nodes" ADD COLUMN "is_independently_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "student_skill_nodes" ADD COLUMN "evidence_source" text;--> statement-breakpoint
ALTER TABLE "student_skill_nodes" ADD COLUMN "evidence_id" varchar(64);