# MentorMaze — Database Schema & Architecture Specification

**Database Engine:** PostgreSQL 16+ (Neon Serverless compatible)  
**ORM / Data Layer:** Drizzle ORM (`drizzle-orm/pg-core`)  
**Design Reference:** `mentormaze_database_schema_erd.md`  

---

## 1. Relational Entity Structure

### 1.1 `users`
Canonical user account record across students, mentors, and administrators.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `email` (varchar 255, unique, not null)
- `password_hash` (varchar 255, nullable for OAuth/SSO)
- `display_name` (varchar 160, not null)
- `avatar_url` (text)
- `account_status` (varchar 32: `active`, `suspended`, `closed`)
- `role` (varchar 32: `student`, `mentor`, `admin`, `super_admin`)
- `timezone` (varchar 64: default `Asia/Kolkata`)
- `last_login_at` (timestamptz)
- `created_at` (timestamptz, default `now()`)
- `updated_at` (timestamptz, default `now()`)

### 1.2 `student_profiles`
Student education, target roles, and career intent.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `users.id`, Unique)
- `institution` (varchar 255)
- `degree` (varchar 255)
- `field_of_study` (varchar 255)
- `graduation_year` (integer)
- `target_role` (varchar 255: e.g. "Software Engineer")
- `current_level` (varchar 64: e.g. "Undergraduate")
- `bio` (text)
- `preferred_languages` (jsonb array: `["English", "Hindi"]`)

### 1.3 `mentor_profiles`
Verified mentor marketplace information, rates, ratings, and capacity.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `users.id`, Unique)
- `headline` (varchar 255: e.g. "Software Engineer @ Microsoft")
- `bio` (text)
- `organization` (varchar 255)
- `current_role` (varchar 255)
- `years_of_experience` (integer)
- `location` (varchar 160)
- `rating` (numeric 3,2, default 5.00)
- `total_sessions` (integer)
- `total_mentees` (integer)
- `verification_status` (varchar 32: `draft`, `submitted`, `under_review`, `approved`, `rejected`, `suspended`)
- `verified_at` (timestamptz)
- `languages` (jsonb array)
- `session_modes` (jsonb array: `["1:1", "Group"]`)
- `response_time` (varchar 64)
- `is_accepting_bookings` (boolean, default true)
- `price_15min_inr` (integer: default ₹149)
- `price_30min_inr` (integer: default ₹249)
- `price_60min_inr` (integer: default ₹449)

### 1.4 `mentor_applications`
Verification audit history and compliance review queue.
- `id` (UUID, PK)
- `mentor_profile_id` (UUID, FK -> `mentor_profiles.id`)
- `status` (varchar 32: `submitted`, `approved`, `rejected`, `info_requested`)
- `identity_proof_type` (varchar 64)
- `identity_proof_url` (text)
- `professional_proof_type` (varchar 64)
- `professional_proof_url` (text)
- `resume_url` (text)
- `linkedin_url` (text)
- `admin_notes` (text)
- `rejection_reason` (text)
- `reviewed_by_user_id` (UUID)
- `reviewed_at` (timestamptz)

### 1.5 `bookings`
Core transaction entity with strict double-booking constraints.
- `id` (UUID, PK)
- `student_user_id` (UUID, FK -> `users.id`)
- `mentor_profile_id` (UUID, FK -> `mentor_profiles.id`)
- `service_type` (varchar 64: `1on1_mentorship`, `group_mentorship`, `mock_interview`)
- `session_duration_minutes` (integer: 15, 30, 45, 60)
- `start_time_utc` (timestamptz, not null)
- `end_time_utc` (timestamptz, not null)
- `user_timezone` (varchar 64)
- `status` (varchar 32: `pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`)
- `price_inr` (integer)
- `payment_status` (varchar 32: `pending`, `paid`, `refunded`)
- `student_discussion_points` (text)
- `meeting_room_id` (varchar 120)

### 1.6 `mentorship_sessions`
Live WebRTC audio/video call state and notes.
- `id` (UUID, PK)
- `booking_id` (UUID, FK -> `bookings.id`, Unique)
- `livekit_room_name` (varchar 160)
- `started_at` (timestamptz)
- `ended_at` (timestamptz)
- `actual_duration_seconds` (integer)
- `session_plan_checklist` (jsonb)
- `mentor_private_notes` (text)
- `student_visible_summary` (text)
- `resources_shared` (jsonb array)
- `status` (varchar 32: `scheduled`, `live`, `completed`, `no_show`)

### 1.7 `mock_interviews`
Rubric-based evaluation outcomes.
- `id` (UUID, PK)
- `booking_id` (UUID, FK -> `bookings.id`, Unique)
- `category` (varchar 64: `Technical`, `HR`, `System Design`, `Behavioral`, `Mixed`)
- `target_role` (varchar 160)
- `difficulty` (varchar 32: `Easy`, `Medium`, `Hard`)
- `overall_score` (numeric 3,1: e.g. 8.2)
- `score_technical` (numeric 3,1)
- `score_problem_solving` (numeric 3,1)
- `score_communication` (numeric 3,1)
- `score_confidence` (numeric 3,1)
- `strengths` (jsonb array)
- `areas_to_improve` (jsonb array)
- `detailed_feedback` (text)
- `recommended_next_steps` (text)

### 1.8 `ledger_transactions`
Double-entry marketplace accounting table.
- `id` (UUID, PK)
- `booking_id` (UUID, FK -> `bookings.id`)
- `student_user_id` (UUID, FK -> `users.id`)
- `mentor_profile_id` (UUID, FK -> `mentor_profiles.id`)
- `gross_amount_inr` (integer)
- `platform_commission_percent` (numeric 4,2: default 15.00)
- `platform_fee_inr` (integer)
- `mentor_payable_inr` (integer)
- `status` (varchar 32: `pending`, `settled`, `refunded`, `held`)
- `payment_provider` (varchar 64: `cashfree`)
- `provider_order_id` (varchar 160)
- `provider_payment_id` (varchar 160)
- `refund_amount_inr` (integer)

---

## 2. Integrity & Concurrency Constraints

1. **Double-Booking Prevention:**  
   Overlap constraint ensures no mentor has two non-cancelled bookings where $(start_A < end_B) \land (end_A > start_B)$.
2. **Auditable State Transitions:**  
   Every state change in mentor applications and bookings emits a corresponding audit log or booking event.
3. **Privacy Boundary:**  
   `mentor_private_notes` is strictly segregated from student-visible endpoints.

