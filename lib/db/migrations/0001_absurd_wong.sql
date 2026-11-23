CREATE TABLE IF NOT EXISTS "student_intelligence_evidence" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_user_id" varchar(64) NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"entity_id" varchar(128) NOT NULL,
	"source_type" varchar(32) NOT NULL,
	"source_system" varchar(64) DEFAULT 'MentorMaze' NOT NULL,
	"source_reference" varchar(255),
	"evidence_type" varchar(32) NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"verification_status" varchar(32) DEFAULT 'unverified' NOT NULL,
	"purpose" varchar(64) DEFAULT 'service_personalization' NOT NULL,
	"consent_reference" varchar(64),
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_projects" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_user_id" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"role" varchar(128),
	"technologies" jsonb DEFAULT '[]'::jsonb,
	"outcomes" text,
	"repository_url" varchar(255),
	"live_url" varchar(255),
	"source_system" varchar(64) DEFAULT 'MentorMaze' NOT NULL,
	"verification_status" varchar(32) DEFAULT 'self_reported' NOT NULL,
	"evidence_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_purpose_consents" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_user_id" varchar(64) NOT NULL,
	"purpose" varchar(64) NOT NULL,
	"is_granted" boolean DEFAULT true NOT NULL,
	"consent_version" varchar(32) DEFAULT '1.0' NOT NULL,
	"audit_notes" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evidence_student_entity" ON "student_intelligence_evidence" USING btree ("student_user_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evidence_student_type" ON "student_intelligence_evidence" USING btree ("student_user_id","evidence_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_projects_user" ON "student_projects" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_purpose_lookup" ON "student_purpose_consents" USING btree ("student_user_id","purpose","is_granted");