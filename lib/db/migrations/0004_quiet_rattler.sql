ALTER TABLE "ai_mentor_roadmaps" ALTER COLUMN "current_level" SET DEFAULT 'intermediate';--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmaps" ALTER COLUMN "current_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmaps" ADD COLUMN "goal_id" varchar(64);--> statement-breakpoint
ALTER TABLE "ai_mentor_roadmaps" ADD COLUMN "adapted_reason" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_roadmaps_goal" ON "ai_mentor_roadmaps" USING btree ("goal_id");