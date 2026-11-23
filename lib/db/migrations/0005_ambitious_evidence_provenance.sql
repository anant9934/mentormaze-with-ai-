UPDATE "ai_mentor_roadmaps" SET status = 'superseded' WHERE status = 'active' AND id NOT IN (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY goal_id ORDER BY updated_at DESC) as rn FROM "ai_mentor_roadmaps" WHERE status = 'active') t WHERE rn = 1);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_one_active_roadmap_per_goal" ON "ai_mentor_roadmaps" USING btree ("goal_id") WHERE status = 'active';--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "student_confirmation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "evidence_ref" text;--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "deliverable_url" varchar(255);--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "assessment_notes" text;--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "success_criteria" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmap_milestones" ADD COLUMN IF NOT EXISTS "provenance" varchar(64) DEFAULT 'student_confirmed' NOT NULL;
