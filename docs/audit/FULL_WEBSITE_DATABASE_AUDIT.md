# MentorMaze — Full Website Database Audit

**Generated:** 2026-11-23  
**Auditor:** database-auditor swarm agent  
**Codebase:** `/Users/quantum/Desktop/MENTOR MAZE`

---

## Table of Contents

1. [Configuration & Connection](#1-configuration--connection)
2. [Migration Status](#2-migration-status)
3. [Schema Tables — schema.ts (Core Platform)](#3-schema-tables--schemats-core-platform)
4. [Schema Tables — ai-mentor-schema.ts (AI / Intelligence Layer)](#4-schema-tables--ai-mentor-schemats-ai--intelligence-layer)
5. [Foreign Key Relationships](#5-foreign-key-relationships)
6. [Index Coverage & Missing Indexes](#6-index-coverage--missing-indexes)
7. [Concurrency Protections](#7-concurrency-protections)
8. [Mock vs Real DB Split](#8-mock-vs-real-db-split)
9. [Seed Script Analysis](#9-seed-script-analysis)
10. [Critical Issues & Recommendations](#10-critical-issues--recommendations)

---

## 1. Configuration & Connection

### Database Engine Hierarchy (`lib/db/index.ts`)

The connection is resolved at startup via a **three-tier fallback**:

| Priority | Condition | Engine |
|---|---|---|
| 1 (highest) | `USE_LOCAL_DB !== "true"` AND `DATABASE_URL` contains `neon.tech` or starts with `postgresql://` | **Neon / Remote PostgreSQL** via `postgres-js` driver (pool size 5, 5 s timeout) |
| 2 | `USE_MEMORY_DB=true` OR `VITEST=true` OR `NODE_ENV=test` | **In-memory PGlite** (ephemeral, no disk) |
| 3 (fallback) | Otherwise | **Persistent PGlite WASM** stored in `.mentormaze-pgdata/` on disk |

> [!IMPORTANT]
> **`.env` sets `USE_LOCAL_DB="true"`**, which short-circuits Neon even though a valid `DATABASE_URL` is present. The application currently boots against **PGlite (local disk)**, not Neon, unless `USE_LOCAL_DB` is removed or set to `"false"`.

### `.env` Credentials (Development)

```
DATABASE_URL=postgresql://neondb_owner:[REDACTED_DATABASE_SECRET]@ep-withered-heart-bebleio4-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DIRECT_DATABASE_URL=postgresql://neondb_owner:[REDACTED_DATABASE_SECRET]@ep-withered-heart-bebleio4.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
USE_LOCAL_DB=true   ← overrides DATABASE_URL, forces PGlite disk mode
```

> [!CAUTION]
> **Raw credentials are present in `.env` (committed to repo).** Neon password `[REDACTED_DATABASE_SECRET]` and Google OAuth secret `[REDACTED_GOOGLE_CLIENT_SECRET]` are exposed. These must be rotated before any production deployment or sharing of the codebase.

### `drizzle.config.ts`

```ts
schema: "./lib/db/schema.ts"
out:    "./lib/db/migrations"
dialect: "postgresql"
// only schema.ts listed — ai-mentor-schema.ts is NOT included in drizzle-kit migrations
```

> [!WARNING]
> `ai-mentor-schema.ts` is **excluded from drizzle.config.ts**. Its 23 tables are not part of the drizzle-kit migration lifecycle and are instead managed via raw `CREATE TABLE IF NOT EXISTS` DDL inside `initializeDatabaseSchema()`.

---

## 2. Migration Status

### Drizzle Migration Files (`lib/db/migrations/`)

| # | File | Status |
|---|---|---|
| 0 | `0000_open_komodo.sql` | ✅ Tracked |
| 1 | `0001_absurd_wong.sql` | ✅ Tracked |
| 2 | `0002_black_la_nuit.sql` | ✅ Tracked |
| 3 | `0003_dazzling_golden_guardian.sql` | ✅ Tracked |
| 4 | `0004_quiet_rattler.sql` | ✅ Tracked |
| 5 | `0005_ambitious_evidence_provenance.sql` | ✅ Tracked |
| 6 | `0006_flawless_checkin_lifecycle.sql` | ✅ Tracked |

**7 migrations tracked in `_journal.json`** (Drizzle Kit v7 format, PostgreSQL dialect). Snapshots exist for migrations 0–4 (5 snapshot files found).

> [!NOTE]
> Migrations track the **core schema (`schema.ts`)** only. The AI mentor schema (23 additional tables) is applied by calling `initializeDatabaseSchema()` at runtime via inline DDL — this means those tables are **not version-controlled** via drizzle-kit and cannot be reliably rolled back or diffed with `drizzle-kit push/pull`.

### Schema Application for PGlite

When PGlite is active, `initializeDatabaseSchema()` applies a **single monolithic DDL string** using `pgliteInstance.exec(ddl)`. This includes:
- All core tables (duplicating the migration SQL)
- All AI mentor tables
- Many `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` incremental patches
- A seeded `booking_policies` row

This is effectively a **migration-free, always-idempotent init** pattern — appropriate for local dev but unsuitable for production schema management.

---

## 3. Schema Tables — `schema.ts` (Core Platform)

**Total: 43 tables** across 10 domain sections.

### Section 1 — Identity & Authentication

| Table | Key Columns | Notes |
|---|---|---|
| `users` | `id` UUID PK, `email` UNIQUE NOT NULL, `password_hash`, `display_name`, `role` (student/mentor/admin/super_admin), `account_status`, `timezone`, `last_login_at` | Central identity table; all other tables reference this |
| `user_identities` | `id`, `user_id` → users, `provider`, `provider_subject`, `profile_data` JSONB | OAuth/SSO provider links (Google, AI Tathastu, etc.) |

### Section 2 — Student Profiles & Goals

| Table | Key Columns | Notes |
|---|---|---|
| `student_profiles` | `id`, `user_id` UNIQUE → users, `institution`, `degree`, `field_of_study`, `graduation_year`, `target_role`, `current_level`, `bio`, `preferred_languages` JSONB | 1:1 with users |
| `student_skills` | `id`, `student_profile_id` → student_profiles, `skill_name`, `proficiency_level`, `source` | Skills attached to student profile |
| `student_goals` | `id`, `student_profile_id` → student_profiles, `title`, `category`, `status`, `progress_percentage`, `target_date` | Goal tracking |
| `action_items` | `id`, `student_profile_id` → student_profiles, `mentor_profile_id` (unindexed FK), `goal_id` → student_goals, `title`, `status`, `created_by_role` | Action items can be created by mentor or student |

### Section 3 — Mentor Profiles & Verification

| Table | Key Columns | Notes |
|---|---|---|
| `mentor_profiles` | `id`, `user_id` UNIQUE → users, `headline`, `bio`, `organization`, `current_role`, `years_of_experience`, `rating` NUMERIC(3,2), `verification_status`, `is_accepting_bookings`, `price_15min_inr`, `price_30min_inr`, `price_60min_inr` | Central mentor entity |
| `mentor_expertise` | `id`, `mentor_profile_id` → mentor_profiles, `primary_domain`, `skills` JSONB, `focus_areas` JSONB | Skills/domain stored as JSONB arrays |
| `mentor_applications` | `id`, `mentor_profile_id` → mentor_profiles, `status`, `identity_proof_url`, `professional_proof_url`, `resume_url`, `linkedin_url`, `rejection_reason`, `admin_notes`, `reviewed_by_user_id` (unindexed) | Verification workflow |

### Section 4 — Availability & Scheduling

| Table | Key Columns | Notes |
|---|---|---|
| `availability_rules` | `id`, `mentor_profile_id` → mentor_profiles, `day_of_week`, `start_time`, `end_time`, `is_active` | Weekly recurring availability |
| `availability_exceptions` | `id`, `mentor_profile_id` → mentor_profiles, `exception_date`, `is_blocked`, `start_time`, `end_time` | Date-specific overrides |
| `mentor_availability_settings` | `id`, `mentor_profile_id` UNIQUE → mentor_profiles, `buffer_time_minutes`, `min_notice_hours`, `max_advance_days`, `daily_session_limit`, `weekly_session_limit`, `custom_session_durations` JSONB | Per-mentor scheduling constraints |
| `booking_holds` | `id`, `mentor_profile_id` → mentor_profiles, `student_user_id` → users, `start_time_utc`, `end_time_utc`, `expires_at`, `status`, `idempotency_key` UNIQUE | Temporary slot holds during booking flow |
| `calendar_connections` | `id`, `user_id` → users, `mentor_profile_id` → mentor_profiles, `provider`, `access_token_encrypted`, `refresh_token_encrypted`, `token_expires_at`, `status` | OAuth calendar integration |
| `external_calendar_events` | `id`, `connection_id` → calendar_connections, `mentor_profile_id` → mentor_profiles, `booking_id` → bookings, `start_time_utc`, `end_time_utc`, `is_busy` | Synced external busy blocks |

### Section 5 — Bookings & Sessions

| Table | Key Columns | Notes |
|---|---|---|
| `bookings` | `id`, `student_user_id` → users, `mentor_profile_id` → mentor_profiles, `service_type`, `session_duration_minutes`, `start_time_utc`, `end_time_utc`, `status` (10 states), `price_inr`, `amount_paise`, `payment_status`, `is_free_session`, `policy_version_id`, `reschedule_count`, `meeting_room_id` | **Core transactional table** |
| `booking_events` | `id`, `booking_id` → bookings, `event_type`, `from_status`, `to_status`, `actor_id`, `actor_role`, `metadata` JSONB | Append-only audit log of state transitions |
| `booking_policies` | `id` VARCHAR PK, `version`, `platform_commission_percent` (15%), `mentor_revenue_share_percent` (85%), `gateway_fee_percent` (2%), `tax_gst_percent` (18%), `cancellation_cutoff_hours`, `max_reschedules`, `refund_eligibility_percent`, `approval_status` | Policy config; one seeded row `policy-v1` |
| `policy_audit_logs` | `id`, `policy_id`, `changed_by_user_id` → users, `action`, `previous_state` JSONB, `new_state` JSONB, `reason` | Immutable policy change trail |
| `session_attendance_events` | `id`, `booking_id` → bookings, `user_id` → users, `role`, `event_type` (joined/left/ping), `timestamp`, `metadata` | LiveKit attendance tracking |
| `interview_evaluations` | `id`, `booking_id` UNIQUE → bookings, `mentor_profile_id`, `student_user_id`, `category`, `overall_score` NUMERIC(4,2), `dimension_scores` JSONB, `strengths` JSONB, `growth_areas` JSONB, `detailed_feedback`, `is_draft`, `published_at` | Rubric-based evaluation records |
| `session_notes` | `id`, `booking_id` UNIQUE → bookings, `mentor_profile_id`, `student_user_id`, `session_agenda`, `shared_action_items` JSONB, `student_visible_summary`, `mentor_private_notes` | Per-session notes with confidentiality split |
| `mentor_settlements` | `id`, `mentor_profile_id` → mentor_profiles, `period_start`, `period_end`, `gross_amount_paise`, `net_payable_paise`, `status`, `payout_method`, `approved_by_user_id` → users | Settlement batch records |
| `disputes` | `id`, `booking_id` → bookings, `student_user_id`, `mentor_profile_id`, `reason`, `status`, `refund_amount_paise`, `resolved_by_user_id` → users | Dispute resolution workflow |
| `mentorship_sessions` | `id`, `booking_id` UNIQUE → bookings, `livekit_room_name`, `started_at`, `ended_at`, `actual_duration_seconds`, `session_plan_checklist` JSONB, `mentor_private_notes`, `student_visible_summary`, `resources_shared` JSONB, `status` | LiveKit session entity |

### Section 6 — Mock Interviews

| Table | Key Columns | Notes |
|---|---|---|
| `mock_interviews` | `id`, `booking_id` UNIQUE → bookings, `category`, `target_role`, `difficulty`, `overall_score`, `score_technical`, `score_problem_solving`, `score_communication`, `score_confidence`, `strengths` JSONB, `areas_to_improve` JSONB | Mock interview outcome |

### Section 7 — Realtime Messaging & Notifications

| Table | Key Columns | Notes |
|---|---|---|
| `conversations` | `id`, `student_user_id` → users, `mentor_user_id` → users, `booking_id` → bookings, `last_message_text`, `last_message_at` | Conversation threads |
| `messages` | `id`, `conversation_id` → conversations, `sender_user_id` → users, `content`, `attachment_url`, `is_read` | Chat messages |
| `session_chat_messages` | `id`, `booking_id` VARCHAR (not UUID FK!), `sender_user_id` VARCHAR, `sender_name`, `sender_role`, `content`, `latency_ms` | In-session real-time chat; **typed as VARCHAR, not UUID FK** |
| `notifications` | `id`, `user_id` → users, `title`, `message`, `type`, `category`, `priority`, `idempotency_key`, `is_read`, `read_at`, `metadata` JSONB | Per-user notification inbox |
| `notification_preferences` | `id`, `user_id` UNIQUE → users, `in_app_enabled`, `push_enabled`, `email_enabled`, booking/chat/mentorship/mock/payment/marketing toggles, `quiet_hours_*`, `timezone` | User notification settings |
| `push_subscriptions` | `id`, `user_id` → users, `endpoint` UNIQUE, `p256dh`, `auth`, `user_agent` | Web Push VAPID subscriptions |
| `notification_deliveries` | `id`, `notification_id` → notifications, `channel`, `status`, `error_message`, `delivered_at` | Delivery receipt tracking |
| `notification_announcements` | `id`, `title`, `content`, `audience`, `priority`, `channels` JSONB, `published_by_user_id` → users, `recipient_count` | Broadcast announcements |
| `scheduled_notifications` | `id`, `booking_id` → bookings, `user_id` → users, `reminder_type`, `scheduled_for`, `status` | Pre-scheduled session reminders |

### Section 8 — Marketplace Payments & Ledger

| Table | Key Columns | Notes |
|---|---|---|
| `ledger_transactions` | `id`, `booking_id` → bookings, `student_user_id`, `mentor_profile_id`, `gross_amount_inr`, `gross_amount_paise`, `platform_commission_percent`, `platform_fee_paise`, `mentor_payable_paise`, `gateway_fee_paise`, `tax_paise`, `transaction_type`, `parent_transaction_id`, `payment_provider`, `provider_order_id`, `provider_payment_id`, `refund_amount_paise` | Financial ledger; Cashfree integration |
| `journal_entries` | `id`, `transaction_id` → ledger_transactions, `booking_id` → bookings, `entry_type` (debit/credit), `account`, `amount_paise` | Double-entry bookkeeping journal |
| `webhook_events` | `id`, `provider`, `event_id` UNIQUE, `order_id`, `event_type`, `raw_payload` JSONB, `status` | Idempotent webhook ingestion log |

### Section 9 — Ecosystem Integration, Consent & Audit

| Table | Key Columns | Notes |
|---|---|---|
| `user_sessions` | `id`, `user_id` → users, `token` UNIQUE, `expires_at`, `user_agent`, `ip_address` | Server-side session tokens |
| `outbox_events` | `id`, `event_type`, `payload` JSONB, `status` (pending/processing/completed/failed/dead_letter), `retry_count`, `locked_at`, `locked_by`, `next_retry_at`, `idempotency_key` | Transactional outbox pattern for async notifications |
| `consent_grants` | `id`, `user_id` → users, `target_system`, `scopes` JSONB, `is_revoked`, `consent_version` | AI Tathastu data-sharing consent |
| `audit_logs` | `id`, `actor_user_id`, `action`, `resource_type`, `resource_id`, `details` JSONB, `ip_address` | General platform audit trail |
| `platform_settings` | `key` VARCHAR PK, `value` JSONB, `description`, `updated_by_user_id` | Key-value platform configuration |

### Section 10 — Email Communication & Support

| Table | Key Columns | Notes |
|---|---|---|
| `email_templates` | `id` VARCHAR PK, `name`, `category`, `subject`, `html_body`, `text_body`, `variables` JSONB, `is_active`, `is_system_critical` | Email template store |
| `email_automations` | `id` VARCHAR PK, `event_type`, `template_id`, `is_enabled`, `delay_seconds`, `max_retries`, `execution_count` | Event-triggered automation rules |
| `email_delivery_logs` | `id`, `recipient_email`, `recipient_user_id`, `template_id`, `status`, `idempotency_key` UNIQUE, `smtp_response` | Email delivery tracking |
| `email_preferences` | `id`, `user_id` → users, `email` UNIQUE, `marketing_consent`, `unsubscribe_token` UNIQUE | Per-email subscription preferences |
| `email_suppressions` | `id`, `email` UNIQUE, `reason`, `source` | Bounce/unsubscribe suppressions |
| `support_tickets` | `id`, `ticket_number` UNIQUE, `user_id` → users, `category`, `priority`, `status`, `subject`, `booking_id` → bookings | Customer support tickets |
| `support_messages` | `id`, `ticket_id` → support_tickets, `sender_user_id`, `sender_name`, `sender_role`, `is_internal_note` | Support thread messages |
| `email_audit_logs` | `id`, `actor_user_id`, `action`, `target_id`, `details` JSONB, `ip_address` | Email system audit trail |

---

## 4. Schema Tables — `ai-mentor-schema.ts` (AI / Intelligence Layer)

**Total: 23 tables** — these are managed entirely via inline DDL in `initializeDatabaseSchema()`, **not** via drizzle-kit migrations.

> [!NOTE]
> AI mentor tables use **VARCHAR(64) PKs** (not UUID). `studentUserId` columns reference users by string ID but carry **no FK constraint** back to the `users` table. This is intentional for cross-system compatibility (AI Tathastu, etc.) but means referential integrity is not enforced at the DB level.

| # | Table | Purpose |
|---|---|---|
| 1 | `ai_mentor_conversations` | Chat conversation threads with the AI mentor |
| 2 | `ai_mentor_messages` | Individual messages; tracks `teaching_strategy`, `hint_level`, `latency_ms` |
| 3 | `student_learning_profiles` | AI-inferred/self-reported learning style, pacing, strengths/weaknesses |
| 4 | `student_skill_nodes` | Knowledge graph nodes; `mastery_state`, `mastery_score`, `confidence` |
| 5 | `student_skill_dependencies` | Prerequisite skill edges (directed dependency graph) |
| 6 | `student_skill_evidence` | Assessment evidence backing skill nodes |
| 7 | `student_memory` | Structured key-value memory per student; supports TTL via `expires_at` |
| 8 | `ai_mentor_roadmaps` | Goal-linked multi-week learning roadmaps; partial unique index enforces one active roadmap per goal |
| 9 | `ai_mentor_roadmap_milestones` | Weekly milestones inside a roadmap; `student_confirmation`, `deliverable_url` |
| 10 | `knowledge_sources` | RAG knowledge base sources (license, publisher, access scope) |
| 11 | `knowledge_documents` | Documents within a knowledge source |
| 12 | `knowledge_chunks` | Tokenized text chunks for vector retrieval |
| 13 | `dataset_registry` | Dataset governance ledger (license, PII status, approval status) |
| 14 | `job_descriptions` | Structured JDs for skills-gap alignment |
| 15 | `ai_evaluation_cases` | Benchmark test cases (Socratic evaluation) |
| 16 | `ai_evaluation_runs` | AI model benchmark run results (`hallucination_rate`, `socratic_quotient_score`) |
| 17 | `ai_feedback` | Thumbs-up/down feedback on AI messages |
| 18 | `student_projects` | Portfolio projects (Phase 2 intelligence graph) |
| 19 | `student_intelligence_evidence` | Provenance ledger for all student intelligence data points |
| 20 | `student_purpose_consents` | Fine-grained purpose-specific consent (7 purposes: service_personalization, model_training, etc.) |
| 21 | `ai_mentor_goals` | Persistent student goals (goal-centric mentorship architecture) |
| 22 | `ai_mentor_checkin_preferences` | Per-student cadence/hour/timezone preferences for AI check-ins |
| 23 | `ai_mentor_checkin_records` | Dedicated records for each AI check-in session |

### AI Mentor Schema Index Summary

| Table | Indexes Declared |
|---|---|
| `ai_mentor_conversations` | `idx_ai_mentor_conv_student` (studentUserId), `idx_ai_mentor_conv_updated` (updatedAt) |
| `ai_mentor_messages` | `idx_ai_mentor_msg_conv` (conversationId), `idx_ai_mentor_msg_created` (createdAt) |
| `student_learning_profiles` | `idx_student_learning_prof_user` (studentUserId) |
| `student_skill_nodes` | `idx_student_skill_user_id` (studentUserId, skillId) |
| `student_skill_evidence` | `idx_skill_evidence_student` (studentUserId) |
| `student_memory` | `idx_student_memory_user` (studentUserId), `idx_student_memory_category` (studentUserId, category) |
| `ai_mentor_roadmaps` | `idx_ai_roadmaps_student`, `idx_ai_roadmaps_goal`, **`idx_one_active_roadmap_per_goal`** (partial unique: `WHERE status = 'active'`) |
| `ai_feedback` | `idx_ai_feedback_student` |
| `student_projects` | `idx_student_projects_user` |
| `student_intelligence_evidence` | `idx_evidence_student_entity` (studentUserId, entityType, entityId), `idx_evidence_student_type` |
| `student_purpose_consents` | `idx_student_purpose_lookup` (studentUserId, purpose, isGranted) |
| `ai_mentor_goals` | `idx_ai_mentor_goals_student`, `idx_ai_mentor_goals_status` (studentUserId, status) |
| `ai_mentor_checkin_preferences` | `idx_ai_mentor_checkin_prefs_student` |
| `ai_mentor_checkin_records` | `idx_ai_mentor_checkin_rec_student`, `idx_ai_mentor_checkin_rec_goal`, `idx_ai_mentor_checkin_rec_observed` |
| `session_chat_messages` | `idx_session_chat_booking` (bookingId, createdAt) |

---

## 5. Foreign Key Relationships

### Core FK Graph (schema.ts)

```
users (id)
  ├── user_identities.user_id              [CASCADE DELETE]
  ├── user_sessions.user_id                [CASCADE DELETE]
  ├── student_profiles.user_id             [CASCADE DELETE, UNIQUE]
  │     ├── student_skills.student_profile_id      [CASCADE DELETE]
  │     ├── student_goals.student_profile_id       [CASCADE DELETE]
  │     │     └── action_items.goal_id             [SET NULL on DELETE]
  │     └── action_items.student_profile_id        [CASCADE DELETE]
  ├── mentor_profiles.user_id              [CASCADE DELETE, UNIQUE]
  │     ├── mentor_expertise.mentor_profile_id     [CASCADE DELETE]
  │     ├── mentor_applications.mentor_profile_id  [CASCADE DELETE]
  │     ├── availability_rules.mentor_profile_id   [CASCADE DELETE]
  │     ├── availability_exceptions.mentor_profile_id [CASCADE DELETE]
  │     ├── mentor_availability_settings.mentor_profile_id [CASCADE DELETE, UNIQUE]
  │     ├── booking_holds.mentor_profile_id        [CASCADE DELETE]
  │     ├── calendar_connections.mentor_profile_id [CASCADE DELETE]
  │     ├── external_calendar_events.mentor_profile_id [CASCADE DELETE]
  │     ├── bookings.mentor_profile_id             [CASCADE DELETE]
  │     ├── interview_evaluations.mentor_profile_id [CASCADE DELETE]
  │     ├── session_notes.mentor_profile_id        [CASCADE DELETE]
  │     ├── mentor_settlements.mentor_profile_id   [CASCADE DELETE]
  │     ├── disputes.mentor_profile_id             [CASCADE DELETE]
  │     └── ledger_transactions.mentor_profile_id  [CASCADE DELETE]
  ├── bookings.student_user_id             [CASCADE DELETE]
  │     ├── booking_events.booking_id              [CASCADE DELETE]
  │     ├── mentorship_sessions.booking_id         [CASCADE DELETE, UNIQUE]
  │     ├── mock_interviews.booking_id             [CASCADE DELETE, UNIQUE]
  │     ├── session_attendance_events.booking_id   [CASCADE DELETE]
  │     ├── interview_evaluations.booking_id       [CASCADE DELETE, UNIQUE]
  │     ├── session_notes.booking_id               [CASCADE DELETE, UNIQUE]
  │     ├── disputes.booking_id                    [CASCADE DELETE]
  │     ├── external_calendar_events.booking_id    [SET NULL on DELETE]
  │     ├── conversations.booking_id               [SET NULL on DELETE]
  │     ├── ledger_transactions.booking_id         [CASCADE DELETE]
  │     ├── journal_entries.booking_id             [CASCADE DELETE]
  │     ├── scheduled_notifications.booking_id     [CASCADE DELETE]
  │     └── support_tickets.booking_id             [SET NULL on DELETE]
  ├── conversations.student_user_id/mentor_user_id [CASCADE DELETE]
  │     └── messages.conversation_id               [CASCADE DELETE]
  ├── notifications.user_id                [CASCADE DELETE]
  │     └── notification_deliveries.notification_id [CASCADE DELETE]
  ├── notification_preferences.user_id    [CASCADE DELETE, UNIQUE]
  ├── push_subscriptions.user_id          [CASCADE DELETE]
  ├── consent_grants.user_id              [CASCADE DELETE]
  ├── ledger_transactions.id
  │     └── journal_entries.transaction_id         [CASCADE DELETE]
  └── booking_policies.id
        ├── policy_audit_logs (via policy_id — no FK constraint declared)
        └── bookings.policy_version_id (VARCHAR reference — no FK constraint declared)
```

### Unenfored References (Missing FK Constraints)

| Column | Expected Target | Issue |
|---|---|---|
| `action_items.mentor_profile_id` | `mentor_profiles.id` | No FK — just bare UUID column |
| `mentor_applications.reviewed_by_user_id` | `users.id` | No FK — bare UUID |
| `booking_events.actor_id` | `users.id` | No FK — bare UUID |
| `policy_audit_logs.policy_id` | `booking_policies.id` | No FK — bare VARCHAR |
| `bookings.policy_version_id` | `booking_policies.id` | No FK — bare VARCHAR |
| `ledger_transactions.parent_transaction_id` | `ledger_transactions.id` | No FK — self-ref not declared |
| `audit_logs.actor_user_id` | `users.id` | No FK — bare UUID |
| `platform_settings.updated_by_user_id` | `users.id` | No FK — bare UUID |
| `email_audit_logs.actor_user_id` | `users.id` | No FK — bare UUID |
| `support_tickets.assigned_to_user_id` | `users.id` | No FK — bare UUID |
| `support_messages.sender_user_id` | `users.id` | No FK — bare UUID |
| `session_chat_messages.booking_id` | `bookings.id` | **VARCHAR, not UUID FK** |
| `session_chat_messages.sender_user_id` | `users.id` | **VARCHAR, not UUID FK** |
| All AI mentor `studentUserId` columns | `users.id` | No FK — deliberate cross-system design |

---

## 6. Index Coverage & Missing Indexes

### Explicit Indexes in schema.ts (Core Schema)

The core schema (`schema.ts`) defines **almost no explicit indexes** beyond primary keys and unique constraints. The only explicit compound index in the core schema is for `session_chat_messages`:

```sql
CREATE INDEX IF NOT EXISTS idx_session_chat_booking ON session_chat_messages (booking_id, created_at);
```

> [!WARNING]
> **Critical missing indexes on high-traffic foreign key columns in core schema:**

| Table | Column(s) | Query Pattern | Risk |
|---|---|---|---|
| `bookings` | `student_user_id` | Fetch all bookings for a student | Sequential scan on large table |
| `bookings` | `mentor_profile_id` | Fetch mentor's schedule / conflict check | Used in critical booking overlap check SQL |
| `bookings` | `start_time_utc` | Date-range queries for available slots | No index — full scan |
| `bookings` | `status` | Filter by status (confirmed, completed, etc.) | No index |
| `booking_events` | `booking_id` | Audit log queries per booking | Only covered by FK, no explicit index |
| `messages` | `conversation_id` | Load messages for a chat thread | No explicit index |
| `messages` | `sender_user_id` | Messages sent by a user | No explicit index |
| `notifications` | `user_id` | Inbox fetch (most common query) | No explicit index |
| `notifications` | `is_read` | Unread count | No index |
| `notifications` | `created_at` | Time-ordered notification feed | No index |
| `ledger_transactions` | `booking_id` | Financial lookup per booking | No explicit index |
| `ledger_transactions` | `mentor_profile_id` | Settlement batch computation | No explicit index |
| `outbox_events` | `status`, `next_retry_at` | Outbox polling worker | No composite index |
| `user_sessions` | `token` | Covered by UNIQUE constraint ✅ | — |
| `session_attendance_events` | `booking_id` | Attendance logs per booking | No explicit index |
| `scheduled_notifications` | `scheduled_for`, `status` | Reminder scheduler | No composite index |
| `support_tickets` | `user_id`, `status` | User's open tickets | No index |
| `webhook_events` | `order_id` | Payment webhook lookup | No explicit index |

### Recommended Priority Indexes

```sql
-- CRITICAL: booking overlap check (used in createBookingInDb)
CREATE INDEX idx_bookings_mentor_time ON bookings (mentor_profile_id, start_time_utc, end_time_utc);

-- HIGH: student session list
CREATE INDEX idx_bookings_student ON bookings (student_user_id, status);

-- HIGH: notification inbox
CREATE INDEX idx_notifications_user_read ON notifications (user_id, is_read, created_at DESC);

-- HIGH: outbox worker
CREATE INDEX idx_outbox_status_retry ON outbox_events (status, next_retry_at) WHERE status IN ('pending', 'failed');

-- HIGH: messages per conversation
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);

-- MEDIUM: settlement computation
CREATE INDEX idx_ledger_mentor ON ledger_transactions (mentor_profile_id, status);
```

---

## 7. Concurrency Protections

### Two-Tier Concurrency Architecture

MentorMaze implements a **two-tier concurrency control** system for booking creation:

#### Tier 1 — Process-Level: `MentorLockManager` (`lib/db/concurrency.ts`)

A per-mentor **promise queue** using JavaScript's event loop serialization:
- Uses a `Map<string, Promise<void>>` keyed by `mentorId`
- Each new booking request chains onto the mentor's current queue tail
- Prevents parallel execution **within a single Node.js process**
- **Limitation:** Does not protect against multi-instance deployments (multiple server pods) — only the database-level lock (Tier 2) provides true distributed protection

#### Tier 2 — Database-Level: `SELECT ... FOR UPDATE` + ACID Transactions

Used in `booking-service.ts` and `booking-state-machine.ts`:

```sql
-- createBookingInDb: locks mentor profile row
SELECT id, user_id, verification_status, is_accepting_bookings
FROM mentor_profiles WHERE id = $mentorId FOR UPDATE;

-- Then: overlap check
SELECT id FROM bookings
WHERE mentor_profile_id = $mentorId
  AND status != 'cancelled'
  AND start_time_utc < $endTime
  AND end_time_utc > $startTime
LIMIT 1;

-- BookingStateMachine.transition: locks booking row
SELECT ... FROM bookings WHERE id = $bookingId FOR UPDATE;

-- rescheduleBookingInDb: locks booking + joined mentor
SELECT b.id, b.student_user_id, b.mentor_profile_id, ... , m.user_id
FROM bookings b JOIN mentor_profiles m ON m.id = b.mentor_profile_id
WHERE b.id = $bookingId FOR UPDATE;
```

#### Transaction Scope in `createBookingInDb`

```
BEGIN TRANSACTION
  1. SELECT mentor_profiles FOR UPDATE          ← distributed lock
  2. Overlap check on bookings (read snapshot)
  3. INSERT INTO bookings
  4. INSERT INTO ledger_transactions (if paid)
  5. INSERT INTO outbox_events
COMMIT
```
Post-commit (outside transaction): notification dispatch, reminder scheduling.

#### Transaction Scope in `confirmPayment`

```
BEGIN TRANSACTION
  1. SELECT bookings + mentor_profiles FOR UPDATE
  2. UPDATE bookings (status=confirmed, payment_status=paid)
  3. INSERT INTO ledger_transactions
  4. INSERT INTO journal_entries × 3 (double-entry)
  5. INSERT INTO booking_events (audit)
  6. INSERT INTO outbox_events
COMMIT
```

> [!NOTE]
> `SELECT FOR UPDATE` works correctly with **Neon PostgreSQL** (true PostgreSQL). With **PGlite** (local/dev), locking semantics are single-process and weaker — this is acceptable for development but confirms PGlite must not be used in production multi-pod deployments.

---

## 8. Mock vs Real DB Split

### Current State (`.env` has `USE_LOCAL_DB=true`)

The app runs **PGlite locally** and uses the **real Drizzle ORM** for all db-routed operations. However, a significant subset of API routes bypass Drizzle entirely and use the **in-memory mock `store`**.

### API Routes Using `store.` (In-Memory Mock Data)

| API Route | Store Operations | Impact |
|---|---|---|
| `app/api/matching/route.ts` | `store.getStudentProfile()`, `store.getMentors()` | Mentor matching returns mock data only; no real DB mentors considered |
| `app/api/payments/webhook/route.ts` | `store.getBookingById()` | Webhook falls back to mock store booking lookup |
| `app/api/ai-mentor/handoff/route.ts` | `store.getMentors()`, `store.getMentorById()`, `store.createBooking()` | AI-to-human handoff creates bookings in mock store, NOT the real DB |

### API Routes Using `db.` (Real Drizzle / PGlite / Neon)

| API Route | DB Operations |
|---|---|
| `app/api/admin/bookings/route.ts` | Real DB |
| `app/api/admin/disputes/route.ts` | Real DB |
| `app/api/admin/payments/reconciliation/route.ts` | Real DB |
| `app/api/admin/payments/route.ts` | Real DB |
| `app/api/admin/policies/route.ts` | Real DB |
| `app/api/admin/settlements/route.ts` | Real DB |
| `app/api/auth/callback/google/route.ts` | Real DB |
| `app/api/auth/login/route.ts` | Real DB |
| `app/api/auth/logout/route.ts` | Real DB |
| `app/api/bookings/[id]/cancel/route.ts` | Real DB (via BookingStateMachine) |
| `app/api/bookings/[id]/reschedule/route.ts` | Real DB |
| `app/api/calendar/google/callback/route.ts` | Real DB |
| `app/api/calendar/google/sync/route.ts` | Real DB |
| `app/api/messages/route.ts` | Real DB |
| `app/api/mock-interviews/[id]/evaluation/route.ts` | Real DB |
| `app/api/payments/create-order/route.ts` | Real DB |
| `app/api/payments/refund/route.ts` | Real DB |
| `app/api/payments/webhook/route.ts` | Real DB (primary) + mock store (fallback) |
| `app/api/sessions/[id]/attendance/route.ts` | Real DB |
| `app/api/sessions/[id]/chat/route.ts` | Real DB |
| `app/api/sessions/[id]/notes/route.ts` | Real DB |

### Hardcoded User IDs Found

| File | Hardcoded Value | Risk |
|---|---|---|
| `app/api/matching/route.ts` | `"user-student-1"` (fallback) | Returns mock Anant Kumar data for unauthenticated callers |
| `app/api/livekit/token/route.ts` | `"user-student-1"`, `"user-mentor-priya"` | LiveKit tokens issued for mock users if auth missing |

### Mock Store Scope

The `MentorMazeDataStore` (`lib/data/store.ts`) is a **global Node.js singleton** that manages in-memory maps for:

- **7 user records** (1 student, 4 mentors, 1 AI mentor, 1 admin)
- **1 student profile** (Anant Kumar, LPU)
- **4 mentor profiles** (Priya/Microsoft, Rohan/Google, Aditya/Adobe, Rahul/Google)
- **2 applications**
- **2 initial bookings**
- **1 mock interview report**
- **3 notifications**
- **3 messages** (in `conv-priya-anant` conversation)
- **2 ledger entries** (auto-generated from initial bookings)
- **1 consent grant** (for `user-student-1`)

> [!CAUTION]
> The mock store **resets on every server restart** (Next.js hot reload, cold boot, etc.). Any data written via `store.createBooking()` or `store.sendMessage()` is **ephemeral** and not persisted anywhere. This is especially dangerous for the AI mentor handoff flow which calls `store.createBooking()` — users could lose booking confirmations on restart.

---

## 9. Seed Script Analysis (`lib/db/seed.ts`)

### What It Seeds (Real DB)

```
Production guard: aborts if NODE_ENV=production && !ALLOW_PROD_SEED
```

| Entity | Count | Details |
|---|---|---|
| `users` | 6 | Anant (student), Priya/Rohan/Aditya/Rahul (mentors), admin — fixed UUIDs `00000000-…-000001` through `000006` |
| `student_profiles` | 1 | Anant Kumar @ LPU, B.Tech CSE, graduating 2027 |
| `student_goals` | 2 | "Crack SDE Interview" (60%), "Build a Portfolio Project" (40%) |
| `mentor_profiles` | 4 | Priya (approved), Rohan (approved), Aditya (approved), Rahul (submitted/not accepting) |
| `mentor_expertise` | 4 | One per mentor — skills/focusAreas stored as JSONB arrays |
| `mentor_applications` | 2 | Rahul (submitted), Priya (approved) |
| `platform_settings` | 3 | general, payments, matching_weights |

### Seed Credentials (⚠️ Demo Only)

```
student: student123
mentor:  mentor123
admin:   admin123
```

Passwords are bcrypt-hashed (`bcryptjs`, salt rounds 10) before insertion. The guard prevents seeding in production (`NODE_ENV=production`) unless `ALLOW_PROD_SEED=true` is explicitly set.

### What Is NOT Seeded

- Bookings (no demo bookings in real DB; those live in the mock store only)
- Notifications (not seeded into `notifications` table)
- Availability rules (mentors have no availability in real DB)
- AI mentor tables (completely empty on fresh seed)

---

## 10. Critical Issues & Recommendations

### 🔴 Critical

| # | Issue | Location | Recommended Fix |
|---|---|---|---|
| C1 | **Credentials committed to `.env`** — Neon password and Google OAuth secret in plaintext in repo | `.env` | Rotate credentials immediately; use `.env.local` (gitignored) for secrets; use Neon environment variables in production |
| C2 | **AI handoff creates bookings in mock store, not DB** — bookings from AI mentor handoff flow are ephemeral, lost on restart | `app/api/ai-mentor/handoff/route.ts` | Replace `store.createBooking()` with `createBookingInDb()` from `booking-service.ts` |
| C3 | **Missing composite index on `bookings(mentor_profile_id, start_time_utc, end_time_utc)`** — the booking overlap check SQL runs a sequential scan on the bookings table | `lib/db/booking-service.ts` | Add index urgently before load increases |
| C4 | **`USE_LOCAL_DB=true` forces PGlite in dev** — actual Neon DB connection is never exercised despite being configured | `.env` | Test against Neon periodically; set `USE_LOCAL_DB=false` in CI |

### 🟡 High

| # | Issue | Recommended Fix |
|---|---|---|
| H1 | **Matching API uses mock store** — `app/api/matching/route.ts` returns results from in-memory mock mentors, ignoring any mentors in the real DB | Rewrite to query `mentor_profiles` table via Drizzle |
| H2 | **Hardcoded `user-student-1` fallback IDs** in matching and LiveKit routes | Require auth; return 401 if session missing; remove fallbacks |
| H3 | **AI mentor schema excluded from drizzle-kit** — 23 tables are unversioned, schema drift is undetectable | Add `ai-mentor-schema.ts` to `drizzle.config.ts` schema array; generate proper migrations |
| H4 | **`session_chat_messages` uses VARCHAR for booking_id/sender_user_id** instead of UUID FK | Alter column types; add FK constraints |
| H5 | **Notification inbox index missing** — `notifications` has no index on `(user_id, is_read, created_at)` — will degrade significantly with volume | Add compound index |
| H6 | **`outbox_events` has no index on `(status, next_retry_at)`** — the outbox polling worker will scan the full table | Add partial index for pending/failed status |

### 🟠 Medium

| # | Issue | Recommended Fix |
|---|---|---|
| M1 | Multiple unenfored FK columns (`action_items.mentor_profile_id`, `booking_events.actor_id`, etc.) | Add FK constraints or at minimum application-level validation |
| M2 | `booking_policies.approval_status` defaults to `"pending_approval"` — policy-v1 is never formally approved | Complete the approval workflow or change default to `"approved"` for the seeded baseline |
| M3 | `initializeDatabaseSchema()` applies DDL via raw SQL, bypassing Drizzle ORM schema management | Unify under drizzle-kit migrations; remove inline DDL pattern |
| M4 | No index on `messages(conversation_id, created_at)` — chat load will degrade | Add index |
| M5 | `email_delivery_logs.idempotency_key` has UNIQUE constraint but can be NULL — allows duplicate NULLs (depends on PG version behavior) | Use conditional unique index or coalesce to a placeholder |

### 🟢 Positive Findings

| Strength | Detail |
|---|---|
| ✅ Solid two-tier concurrency | `MentorLockManager` + `SELECT FOR UPDATE` correctly serializes bookings per mentor |
| ✅ Double-entry ledger | `journal_entries` implements proper debit/credit accounting with 3 entries per payment |
| ✅ Outbox pattern | `outbox_events` with `locked_at`/`locked_by` enables at-least-once delivery for async notifications |
| ✅ Idempotency keys | `booking_holds.idempotency_key` UNIQUE, `webhook_events.event_id` UNIQUE prevent duplicate processing |
| ✅ Append-only audit | `booking_events` provides immutable state transition history |
| ✅ Production seed guard | `seed.ts` checks `NODE_ENV=production && !ALLOW_PROD_SEED` before inserting demo data |
| ✅ 7 tracked migrations | Drizzle-kit migration journal is clean and well-structured for core schema |
| ✅ Consent architecture | Dual consent system: `consent_grants` (core) + `student_purpose_consents` (AI, 7 fine-grained purposes) |

---

## Summary Statistics

| Metric | Value |
|---|---|
| Total tables (schema.ts) | **43** |
| Total tables (ai-mentor-schema.ts) | **23** |
| **Grand total tables** | **66** |
| Tracked drizzle-kit migrations | 7 (0000–0006) |
| AI mentor tables under drizzle-kit | **0** (all via inline DDL) |
| API routes using mock `store.` | **3 files** (matching, ai-mentor handoff, payment webhook partial) |
| API routes using real `db.` | **~20 files** |
| Hardcoded user IDs in API routes | 2 locations (`matching`, `livekit/token`) |
| Missing critical indexes | 6+ (bookings overlap, notifications inbox, outbox worker, messages, ledger) |
| Credentials exposed in .env | ⚠️ Neon DB password + Google OAuth secret |
