# MentorMaze --- Phase 1 Product Requirements Document (PRD)

## Human Mentorship, Mock Interview Practice & Intelligence-Led Matching

**Product:** MentorMaze\
**Parent ecosystem:** AI Tathastu\
**Document type:** Product Requirements Document\
**Phase:** Phase 1 --- Human Mentorship\
**Status:** Product baseline for design and engineering\
**Primary users:** Students, mentors, platform administrators\
**Future phase:** Phase 2 --- AI Mentorship

------------------------------------------------------------------------

# 1. Executive Summary

MentorMaze is a mentorship and career-preparation platform within the AI
Tathastu ecosystem. It connects students with verified human mentors,
helps students book and attend structured mentorship sessions, supports
human-led mock interview practice, and tracks progress over time.

The platform uses an intelligence layer to understand a student's goals,
skills, interests, experience, and available context; evaluate mentor
expertise and capacity; and recommend suitable mentors with transparent
explanations.

Mentors may originate from AI Tathastu as teachers, alumni, or other
eligible professionals. When a person chooses to become a mentor, their
mentor application is created in MentorMaze. The application must be
reviewed and approved by an authorized administrator before the person
can offer mentorship.

MentorMaze must support two authentication routes: 1. Sign in through AI
Tathastu --- the preferred route because it can provide richer,
permissioned ecosystem context. 2. Independent sign in --- supported
through approved OAuth providers or email-based authentication.

The platform must also support mock interview practice as a distinct
service that students can choose alongside mentorship.

## 1.1 Product promise

**Find the right human guidance. Prepare with purpose. Make measurable
progress.**

## 1.2 Phase boundary

Phase 1 must deliver a complete, usable human mentorship and mock
interview platform.

AI mentorship is explicitly out of scope for Phase 1. The architecture
should be extensible so that AI mentorship can be introduced in Phase 2
without redesigning identity, consent, profiles, goals, session history,
or progress data.

------------------------------------------------------------------------

# 2. Product Goals and Non-Goals

## 2.1 Goals

-   Allow students to discover and connect with relevant, approved human
    mentors.
-   Support intelligent top-three mentor recommendations with
    understandable reasons.
-   Allow students to explore all approved mentors and apply filters.
-   Let mentors apply, complete profiles, set availability, and manage
    requests.
-   Ensure mentor approval and verification are controlled by
    administrators.
-   Support one-to-one mentorship bookings and live sessions.
-   Support human-led mock interview booking and delivery.
-   Provide secure chat and session-related communication.
-   Let students define goals, track action items, and review progress.
-   Give administrators operational control and auditability.
-   Integrate with AI Tathastu using explicit consent and scoped data
    sharing.
-   Accept independent users who do not have an AI Tathastu account.
-   Build a foundation for future intelligence and AI mentorship
    capabilities.

## 2.2 Non-goals for Phase 1

-   AI mentor conversations or autonomous AI mentorship.
-   AI conducting mock interviews as a service.
-   Fully automated mentor approval.
-   Unreviewed public mentor profiles.
-   Unexplained or unchallengeable recommendation scores.
-   Scraping private or restricted data without authorization.
-   Building a general-purpose social network.
-   Replacing AI Tathastu, Avsar, Collabry, or IRIS.
-   Exposing ecosystem-wide personal data to every MentorMaze user.
-   Making video recording mandatory for mentorship sessions.

------------------------------------------------------------------------

# 3. Users, Roles and Permissions

## 3.1 Student

A student can: - Register or sign in. - Connect an AI Tathastu account,
if available. - Review and control imported context permissions. -
Complete or correct their profile. - Set career, learning, and
mentorship goals. - Receive mentor recommendations. - Search and filter
approved mentors. - View mentor profiles. - Book, reschedule, or cancel
sessions according to policy. - Join live sessions. - Chat with assigned
mentors in permitted contexts. - Book human mock interviews. - View
interview feedback. - Track goals, action items, and progress. - Submit
session feedback and report concerns. - Manage privacy and
connected-account settings.

A student cannot: - View another student's private profile or
sessions. - View internal mentor verification documents. - Approve their
own mentor application. - Access administrative decisions or internal
risk notes.

## 3.2 Mentor

A mentor can: - Register or sign in. - Apply to become a mentor. -
Select mentorship and/or mock interview services. - Submit identity,
education, employment, and expertise evidence. - Complete a
public-facing mentor profile. - Set topics, languages, formats, rates if
applicable, and availability. - Submit the application for review. -
View approval status and required corrections. - Manage incoming
mentorship requests. - Accept or decline requests. - View assigned
students and relevant student-shared context. - Chat with students in
permitted conversations. - Conduct live sessions. - Create session notes
and action items. - Provide structured feedback. - Manage availability
and session history. - View permitted performance and feedback
summaries.

A mentor cannot: - Publish an unapproved profile. - Change verification
status. - Access unrelated student records. - Access AI Tathastu data
that the student has not authorized for sharing. - Alter submitted
student feedback. - View internal admin-only risk or moderation notes.

## 3.3 Administrator

Admin permissions must be role-based. Suggested administrative roles:

### Super Admin

-   Manage platform configuration.
-   Manage admin roles and permissions.
-   View audit logs.
-   Manage integration settings.
-   Override operational states only through audited actions.

### Mentor Verification Admin

-   Review mentor applications.
-   Inspect submitted evidence.
-   Approve, reject, or request changes.
-   Suspend or revoke mentor approval where policy allows.
-   Record reason codes and internal notes.

### Operations Admin

-   Manage bookings and session issues.
-   Handle cancellations, disputes, and support cases.
-   Review operational reports.
-   Manage service availability and platform content.

### Content / Program Admin

-   Manage mentorship categories, topics, programs, and resource
    content.

Administrative access must follow least privilege. Do not grant every
admin unrestricted access by default.

------------------------------------------------------------------------

# 4. Product Areas and Information Architecture

## 4.1 Public website

-   Home
-   How It Works
-   Explore Mentors
-   Mentorship Programs
-   Mock Interviews
-   About
-   Contact / Support
-   Sign In
-   Get Started

## 4.2 Student application

-   Overview
-   My Profile
-   My Goals
-   Recommended Mentors
-   Explore Mentors
-   My Mentorship
-   Book a Session
-   Messages
-   Mock Interviews
-   Feedback & Reports
-   Progress
-   Notifications
-   Connected Accounts
-   Settings / Privacy

## 4.3 Mentor application

-   Overview
-   Mentor Application
-   My Profile
-   Verification Status
-   Availability
-   Requests
-   My Students
-   Sessions
-   Messages
-   Mock Interviews
-   Feedback & Action Items
-   Performance
-   Settings

## 4.4 Admin application

-   Overview
-   Mentor Applications
-   Verification Queue
-   Mentor Directory
-   Student Directory
-   Matching Operations
-   Bookings & Sessions
-   Mock Interviews
-   Reports
-   Support / Disputes
-   Categories & Programs
-   Integrations
-   Roles & Permissions
-   Audit Logs
-   Platform Settings

Navigation must be role-aware. A user with multiple roles may switch
workspaces without mixing permissions.

------------------------------------------------------------------------

# 5. Authentication, Identity and AI Tathastu Integration

## 5.1 Authentication methods

### Method A --- Continue with AI Tathastu (recommended)

The preferred route for users who already have an AI Tathastu account.

Expected flow: 1. User selects **Continue with AI Tathastu**. 2.
MentorMaze redirects to the authorized AI Tathastu identity provider. 3.
User authenticates with AI Tathastu. 4. The identity provider returns a
signed authorization response. 5. MentorMaze validates issuer, audience,
signature, expiry, nonce, state, and redirect URI. 6. MentorMaze creates
or links the MentorMaze account using a stable external subject
identifier. 7. MentorMaze requests or receives only the data scopes the
user has authorized. 8. The student reviews imported context and
corrects profile information. 9. MentorMaze records consent version,
scopes, timestamp, and source.

The sign-in process must not silently grant every data-sharing
permission.

### Method B --- Independent sign in

Support: - Google OAuth, if configured. - Other approved OAuth
providers, if configured. - Email-based sign-in using secure
verification. - Account recovery and session management.

Independent users must be able to use the complete Phase 1 platform,
subject to required profile completion and platform policies.

## 5.2 Account linking

-   One person must not accidentally create duplicate accounts by
    switching login methods.
-   Account linking must require proof of control of both identities or
    an approved recovery process.
-   Store external identity issuer and subject, not just email.
-   Email changes must not break the identity relationship.
-   Provide a clear disconnect process for linked accounts.
-   Preserve bookings and records if an external connection is
    disconnected.

## 5.3 Two-way AI Tathastu data sharing

The integration is a controlled exchange, not unrestricted database
access.

### AI Tathastu → MentorMaze

Potential context, subject to availability, purpose, and user
authorization: - Basic identity and account reference. - Education and
academic profile. - Skills and skill assessments. - Courses and learning
activity. - Projects and project metadata. - Resume and experience
information. - Career interests and goals. - Relevant portfolio links. -
Relevant ecosystem activity from Collabry, Avsar, and IRIS where the
source system supports authorized sharing.

### MentorMaze → AI Tathastu

Potential outputs, subject to consent and product agreements: -
MentorMaze account and connection status. - Selected mentorship goals. -
Confirmed mentorship plan. - Session completion status. -
Student-approved action items. - Progress milestones. - Student-approved
feedback summaries. - Mock interview completion and selected report
data. - Recommendations or next-step signals that are safe and relevant
to return.

### Data-sharing rules

-   Each source must be identified.
-   Each field or dataset must have a purpose and permission scope.
-   Do not assume every ecosystem record is relevant to mentorship.
-   Do not copy entire source databases into MentorMaze.
-   Store a minimal local projection or reference where practical.
-   Keep provenance, timestamps, and source record identifiers.
-   Support revocation and deletion workflows.
-   Define whether revocation stops future synchronization, removes
    existing copies, or both.
-   Sensitive documents must use short-lived authorized access or secure
    storage, not public URLs.
-   Do not expose imported data to mentors unless the student explicitly
    shares it for that mentoring relationship.

## 5.4 Integration failure behavior

If AI Tathastu is unavailable: - Existing MentorMaze users can still
sign in through valid independent credentials where linked. - Existing
local profile and booking functionality remains available. - New
ecosystem context synchronization is queued or marked unavailable. - The
UI explains that imported context may be stale. - The user can continue
with manual profile completion.

------------------------------------------------------------------------

# 6. Student Onboarding

## 6.1 Onboarding objectives

Collect enough information to: - Build a useful student profile. -
Understand goals. - Recommend relevant mentors. - Support safe and
appropriate matching. - Avoid asking for information already available
with permission.

## 6.2 Onboarding steps

### Step 1 --- Account

-   AI Tathastu sign-in or independent sign-in.
-   Terms and privacy acceptance.
-   Optional ecosystem connection where applicable.

### Step 2 --- Profile review

-   Name.
-   Profile image.
-   Education.
-   Institution.
-   Current year / semester where relevant.
-   Location / timezone.
-   Languages.
-   Current role or status.

Imported values must be editable and source-labeled.

### Step 3 --- Goals

Ask the student to select or describe: - Career direction. - Target role
or domain. - Skills to develop. - Current challenges. - Desired
outcome. - Time horizon.

### Step 4 --- Skills and evidence

-   Skills.
-   Self-assessed proficiency.
-   Projects.
-   Experience.
-   Resume / portfolio links.
-   Relevant assessments, where authorized.

### Step 5 --- Mentorship preferences

-   Preferred mentor domain.
-   Desired mentor experience.
-   Preferred language.
-   Online / in-person, where supported.
-   Availability windows.
-   Mentorship topics.
-   Preferred communication style, if collected and clearly explained.

### Step 6 --- Context and consent review

Show: - What was imported. - Where it came from. - Why it is used. -
What can be shared with mentors. - What remains private. - How to change
permissions.

### Step 7 --- Recommendation

Generate the initial mentor shortlist and explain each recommendation.

## 6.3 Onboarding requirements

-   Allow save and resume.
-   Do not require every optional field.
-   Identify missing information that reduces recommendation confidence.
-   Never invent a skill, project, qualification, or achievement.
-   Distinguish self-reported, imported, and verified information.

------------------------------------------------------------------------

# 7. Mentor Application and Verification

## 7.1 Mentor eligibility

Eligible people may include: - Teachers. - Alumni. - Industry
professionals. - Subject-matter experts. - Other categories approved by
platform policy.

A teacher or alumnus joining AI Tathastu does not automatically become
an approved MentorMaze mentor.

## 7.2 Application trigger

When a user chooses **Become a Mentor** and selects mentorship or mock
interview services: 1. Create a MentorMaze mentor application. 2.
Prefill permitted information from the user's existing account. 3. Ask
the applicant to review and complete the mentor-specific fields. 4.
Collect evidence required by the selected mentor category. 5. Submit the
application for review.

## 7.3 Mentor profile fields

Identity: - Full name. - Profile photograph. - Professional headline. -
Current role. - Organization. - Location / timezone. - Languages.

Professional evidence: - Education. - Employment history. - Experience
duration. - Portfolio / website. - LinkedIn or other relevant
professional links. - Certificates or supporting documents where
required.

Mentorship capability: - Domains. - Topics. - Skills. - Student levels
supported. - Career paths supported. - Mentoring approach. - Session
formats. - Languages. - Availability. - Capacity. - Optional rates and
service terms.

Mock interview capability: - Target roles. - Interview types. -
Topics. - Difficulty levels. - Industry familiarity. - Feedback
capability. - Session duration.

## 7.4 Verification workflow

Application states: - Draft. - Submitted. - Under Review. - More
Information Required. - Approved. - Rejected. - Suspended. - Revoked.

Admin actions: - Open application. - Review identity and professional
evidence. - Review expertise claims. - Compare profile details with
submitted evidence. - Record verification checklist. - Approve. - Reject
with reason. - Request more information. - Escalate. - Suspend / revoke
with reason and audit event.

## 7.5 Verification rules

-   Approval must be an explicit administrative action.
-   A profile is not publicly discoverable as an active mentor until
    approved.
-   Verification badges must identify what was verified.
-   Do not imply that employment, degrees, or identity were verified
    unless the process actually checked them.
-   Expired or disputed evidence must have a defined review process.
-   All consequential decisions must be auditable.

------------------------------------------------------------------------

# 8. Mentor Discovery and Matching Intelligence

## 8.1 Matching objective

Recommend mentors who can help a particular student achieve a stated
outcome, while accounting for mentor capability, availability, capacity,
and student preferences.

The system should optimize for **relevance and likely usefulness**, not
popularity alone.

## 8.2 Matching pipeline

1.  Build the current student profile from permitted data.
2.  Normalize skills, topics, roles, goals, and experience.
3.  Identify missing or low-confidence fields.
4.  Retrieve only approved, active mentors.
5.  Apply hard eligibility constraints.
6.  Calculate relevance features.
7.  Apply availability and capacity constraints.
8.  Rank eligible mentors.
9.  Generate concise match explanations.
10. Present the top three recommendations.
11. Allow the student to explore the full approved directory.
12. Record impressions, profile views, bookings, and outcomes for
    evaluation.

## 8.3 Hard filters

A mentor must be excluded if: - Not approved. - Suspended or revoked. -
Not accepting students. - Outside applicable service scope. - Lacks
required language or format where mandatory. - Has no eligible
availability within the requested window. - Has reached capacity. - Has
a conflict or policy restriction.

## 8.4 Ranking signals

Potential features: - Goal-to-expertise alignment. - Required skill
coverage. - Target-role relevance. - Industry experience. - Experience
level fit. - Mentorship topic alignment. - Language preference. -
Session-format preference. - Availability fit. - Mentor capacity. -
Relevant verified evidence. - Student feedback, with sufficient sample
size. - Past successful outcomes, only where meaningful and fairly
measured.

## 8.5 Explainable matching

Each recommended mentor must have a reason grounded in data, for
example: - `Matches your goal of becoming a backend developer.` -
`Has experience with Python, APIs, and databases.` -
`Can support your project portfolio review.` -
`Offers sessions in your preferred language.`

Do not show a match percentage unless the score is calibrated,
validated, and explained. Do not describe a recommendation as
guaranteed.

## 8.6 Matching feedback loop

Collect: - Recommendation shown. - Profile opened. - Mentor saved. -
Booking initiated. - Booking completed. - Session completed. - Student
feedback. - Goal progress. - Mentor feedback.

Use these signals to evaluate and improve ranking. Do not optimize
solely for click-through rate.

## 8.7 Manual and fallback matching

If the system cannot confidently recommend three mentors: - Show fewer
strong matches rather than padding the list. - Explain that more
information or broader preferences may help. - Offer directory search. -
Allow an admin-assisted matching request.

------------------------------------------------------------------------

# 9. Mentor Discovery UI Requirements

## 9.1 Top-three recommendation area

Each recommended mentor card should show: - Portrait. - Name. - Current
role / organization. - Verification status. - Main expertise. - Relevant
experience. - Language. - Availability preview. - One or two match
reasons. - View Profile. - Book Session.

## 9.2 Directory

Filters: - Domain. - Expertise. - Target role. - Experience. -
Language. - Session type. - Availability. - Location, if relevant. -
Price, if applicable.

Search: - Mentor name. - Skill. - Topic. - Organization. - Role.

## 9.3 Profile detail

Sections: - Overview. - Experience. - Expertise. - Mentorship topics. -
Mock interview capability. - Mentoring approach. - Languages. -
Availability. - Reviews. - Booking panel.

The UI must distinguish factual credentials from mentor-authored
descriptions.

------------------------------------------------------------------------

# 10. Mentorship Lifecycle

## 10.1 Mentorship relationship states

Suggested states: - Not Started. - Request Pending. - Active. -
Paused. - Completed. - Ended. - Disputed / Under Review.

## 10.2 Request workflow

1.  Student selects a mentor.
2.  Student chooses mentorship service and topic.
3.  Student describes the goal and context they want to share.
4.  Student selects an available slot or requests a time.
5.  System validates capacity and availability.
6.  Student reviews booking details and policies.
7.  Student confirms.
8.  Mentor receives request.
9.  Mentor accepts or declines, depending on booking policy.
10. Booking is confirmed or released.
11. Both parties receive notifications.

If immediate booking is supported, the slot must be reserved atomically
to prevent double booking.

## 10.3 First-session workflow

Before the session: - Student sees mentor details and session agenda. -
Mentor sees student-shared context and goals. - Both can review
preparation notes. - Meeting link becomes available according to policy.

During: - Join session. - Camera / microphone controls. - Device
selection. - Connection status. - Chat or session notes where
supported. - Leave session. - Rejoin if permitted.

After: - Mark attendance / completion. - Mentor records notes. - Mentor
adds action items. - Student reviews next steps. - Student submits
feedback. - Progress record updates.

## 10.4 Ongoing mentorship

Support: - Recurring or one-off sessions. - Shared goals. -
Milestones. - Action items. - Follow-up notes. - Progress review. -
Session history. - Pause / resume. - Completion.

A mentorship relationship should not be marked complete merely because
one video call ended.

------------------------------------------------------------------------

# 11. Booking and Scheduling

## 11.1 Availability management

Mentors can define: - Weekly availability. - One-time availability. -
Breaks and blocked periods. - Timezone. - Session duration. - Booking
notice period. - Maximum sessions per day / week. - Buffer between
sessions. - Booking horizon.

## 11.2 Booking rules

-   Store timestamps in UTC.
-   Display in the user's selected or detected timezone.
-   Revalidate availability at confirmation.
-   Prevent overlapping bookings.
-   Use an idempotency key for booking submission.
-   Define expiry for temporary slot holds.
-   Send confirmations and reminders.
-   Keep a record of booking state transitions.

## 11.3 Cancellation and rescheduling

Define configurable policies for: - Student cancellation. - Mentor
cancellation. - Late cancellation. - No-show. - Rescheduling window. -
Refund / credit, if payment is enabled. - Admin intervention.

Always display the applicable policy before final confirmation.

------------------------------------------------------------------------

# 12. Live Sessions --- LiveKit

## 12.1 Phase 1 live-session requirements

Use LiveKit for real-time audio/video sessions.

Required capabilities: - Secure room creation. - Authorized participant
tokens. - Join / leave. - Microphone and camera controls. - Device
selection. - Connection quality indicators. - Reconnection behavior. -
Screen sharing, if enabled for the service. - Session start / end
events. - Host / participant role handling. - Session completion
tracking.

## 12.2 Security

-   Generate room tokens server-side.
-   Apply short-lived tokens.
-   Verify booking and participant authorization before issuing a token.
-   Do not expose LiveKit API secrets in the browser.
-   Use separate rooms or room namespaces per session.
-   Prevent unrelated users from joining.
-   Validate webhook signatures.
-   Keep meeting access tied to booking state.

## 12.3 Recording

Recording must not be enabled by default without a clear product, legal,
consent, and retention policy.

If recording is introduced: - Obtain explicit consent from all required
participants. - Show recording state visibly. - Define storage access
and retention. - Define deletion and export rules. - Restrict access to
authorized participants and roles. - Log access to recordings.

## 12.4 Failure states

-   Room not created.
-   Token expired.
-   Device unavailable.
-   Permission denied.
-   Network degraded.
-   Participant disconnected.
-   Session ended unexpectedly.

Provide retry and support paths without falsely marking the session
completed.

------------------------------------------------------------------------

# 13. Messaging and Notifications

## 13.1 Chat

Phase 1 chat may support: - One-to-one student--mentor conversations. -
Booking-related conversation context. - Text messages. - File
attachments, if enabled. - Read / delivery state, if supported. -
Message timestamps. - Basic reporting and blocking controls. -
Moderation and abuse reporting.

## 13.2 Chat permissions

-   A student may message a mentor through an allowed inquiry or booking
    flow.
-   A confirmed mentorship relationship may enable ongoing conversation.
-   Mentors must not browse arbitrary student accounts.
-   Admin access to message content must be restricted and
    purpose-bound.
-   File attachments must be scanned and access-controlled.
-   Deleted / retained message behavior must be documented.

## 13.3 Notifications

Channels may include: - In-app. - Email. - Push, if a mobile app
exists. - SMS / WhatsApp only through approved providers and consent.

Events: - Account verification. - Mentor application status. - New
booking request. - Booking confirmation. - Booking change. - Session
reminder. - New message. - Session completion. - Feedback request. -
Action item due. - Support case update.

Users must be able to configure non-essential notification preferences.

------------------------------------------------------------------------

# 14. Human Mock Interview Practice

Mock interviews are a separate bookable service.

## 14.1 Student journey

1.  Choose Mock Interview.
2.  Select target role.
3.  Select interview type.
4.  Select experience level.
5.  Select topic coverage.
6.  Choose language.
7.  Select human interviewer.
8.  View interviewer profile and capability.
9.  Choose slot.
10. Review booking and confirm.
11. Complete preparation checklist.
12. Join live interview.
13. Receive structured feedback.
14. Review report and recommended practice.
15. Book another session if desired.

## 14.2 Interview types

Configurable categories: - Technical. - Behavioral. - HR. - System
design. - Coding discussion. - Project deep dive. - Domain-specific. -
Resume-based.

The platform should only display categories for which qualified
interviewers are approved.

## 14.3 Interviewer profile

Show: - Verified identity / status. - Relevant role and experience. -
Interview categories. - Target levels. - Languages. - Availability. -
Session duration. - Feedback approach.

## 14.4 Feedback report

Required dimensions can include: - Problem understanding. - Technical
accuracy. - Communication. - Structure. - Reasoning. - Project
explanation. - Role-specific competencies.

Each dimension must have a defined rubric. Feedback should include
evidence and actionable recommendations, not just a numeric score.

## 14.5 Mock interview data privacy

-   Resume and project context must be shared intentionally.
-   Interview notes are visible only to authorized participants and
    roles.
-   Recording is opt-in and policy-controlled.
-   Reports must distinguish interviewer feedback from automated
    calculations.
-   Students can request correction of factual errors.

------------------------------------------------------------------------

# 15. Goals, Action Items and Progress

## 15.1 Goal model

A goal should include: - Title. - Description. - Category. - Target
outcome. - Start date. - Target date. - Status. - Priority. - Related
skills. - Assigned mentor, if applicable. - Milestones.

## 15.2 Action items

Action items may be created by: - Student. - Mentor. - Authorized
platform workflow.

Fields: - Title. - Description. - Due date. - Status. - Related goal. -
Creator. - Assignee. - Completion evidence, where relevant.

## 15.3 Progress

Track: - Goal status. - Milestone completion. - Session history. -
Action item completion. - Student reflections. - Mentor feedback. - Mock
interview history.

Do not equate number of sessions with learning outcomes. Progress
indicators should show what they measure.

------------------------------------------------------------------------

# 16. Admin Operations

## 16.1 Verification queue

Admin can: - Filter by status. - Search applicant. - Review evidence. -
Compare profile fields. - Request additional information. - Approve /
reject. - Add internal notes. - View audit history.

## 16.2 Matching operations

Admin can: - Inspect why a mentor was recommended. - Review eligible
mentor pool. - Identify capacity constraints. - Create an assisted
match. - Record override reason. - Monitor recommendation quality.

Admin overrides must not silently rewrite matching evidence.

## 16.3 Booking operations

Admin can: - Search bookings. - View status and participants. - Handle
disputes. - Cancel or reschedule when authorized. - Investigate
no-shows. - View relevant event history.

## 16.4 Platform analytics

Suggested metrics: - Active students. - Approved mentors. - Pending
mentor applications. - Recommendation-to-profile-view rate. -
Profile-view-to-booking rate. - Booking confirmation rate. - Session
completion rate. - Cancellation / no-show rate. - Repeat mentorship
rate. - Mock interview completion. - Student feedback. - Mentor capacity
utilization. - Goal and action-item progress.

Metrics must have clear definitions and date ranges.

------------------------------------------------------------------------

# 17. Data Model --- Logical Entities

The following is a logical model, not a final SQL migration.

## 17.1 Identity and access

-   `users`
-   `user_identities`
-   `roles`
-   `permissions`
-   `user_role_assignments`
-   `sessions`
-   `consents`
-   `consent_events`

## 17.2 Profiles

-   `student_profiles`
-   `mentor_profiles`
-   `mentor_applications`
-   `mentor_verification_checks`
-   `mentor_evidence`
-   `mentor_expertise`
-   `mentor_languages`
-   `mentor_service_types`
-   `mentor_capacity`

## 17.3 Intelligence and context

-   `student_goals`
-   `student_skills`
-   `profile_facts`
-   `profile_fact_sources`
-   `external_connections`
-   `external_data_permissions`
-   `external_sync_jobs`
-   `matching_runs`
-   `matching_candidates`
-   `matching_explanations`
-   `matching_feedback`

## 17.4 Mentorship

-   `mentorship_requests`
-   `mentorship_relationships`
-   `mentorship_topics`
-   `mentorship_sessions`
-   `session_participants`
-   `session_notes`
-   `action_items`
-   `milestones`
-   `session_feedback`

## 17.5 Scheduling and communications

-   `mentor_availability_rules`
-   `availability_exceptions`
-   `booking_holds`
-   `bookings`
-   `booking_events`
-   `conversations`
-   `conversation_participants`
-   `messages`
-   `message_attachments`
-   `notifications`
-   `notification_preferences`

## 17.6 Mock interviews

-   `interview_categories`
-   `interviewer_capabilities`
-   `mock_interview_bookings`
-   `mock_interview_sessions`
-   `interview_rubrics`
-   `interview_feedback`
-   `interview_reports`

## 17.7 Administration

-   `support_cases`
-   `moderation_events`
-   `admin_notes`
-   `audit_logs`
-   `platform_settings`

## 17.8 Data modeling principles

-   Use stable primary identifiers.
-   Store timestamps in UTC.
-   Use explicit status enums or constrained values.
-   Record state transitions for important workflows.
-   Use foreign keys and database constraints.
-   Add indexes for search and operational queries.
-   Store files in object storage; store metadata and access references
    in PostgreSQL.
-   Keep source provenance for imported profile facts.
-   Avoid duplicating ecosystem data unnecessarily.
-   Define retention and deletion behavior before production.

------------------------------------------------------------------------

# 18. Proposed Technical Architecture

This is the recommended baseline and must be validated against
deployment, cost, and team capability before implementation.

## 18.1 Application stack

  -----------------------------------------------------------------------
  Layer                   Proposed technology     Responsibility
  ----------------------- ----------------------- -----------------------
  Web application         Next.js + TypeScript    Public site and
                                                  role-based application

  UI                      Tailwind CSS +          Shared components and
                          shadcn/ui               styling

  Backend                 Next.js server layer /  Business logic and API
                          dedicated services      
                          where needed            

  Database                PostgreSQL              Core transactional data

  ORM                     Drizzle ORM             Schema and database
                                                  access

  Cache / ephemeral state Redis                   Rate limits,
                                                  short-lived holds,
                                                  caching

  Authentication          OAuth 2.0 / OIDC        AI Tathastu SSO and
                                                  independent login

  Video                   LiveKit                 Real-time sessions

  Realtime                WebSockets /            Chat and live status
                          provider-supported      
                          realtime                

  File storage            S3-compatible object    Resumes, evidence,
                          storage                 attachments

  Background jobs         Queue worker            Notifications, sync,
                                                  reminders, reports

  Search                  PostgreSQL search       Mentor and profile
                          initially               discovery

  Future semantic         pgvector-ready          Future semantic
  retrieval               PostgreSQL              matching / AI features

  Observability           Structured logs,        Reliability and
                          metrics, tracing        debugging
  -----------------------------------------------------------------------

## 18.2 Service boundaries

Logical services: - Identity and access. - Profile and consent. -
Ecosystem integration. - Mentor verification. - Matching. - Mentorship
lifecycle. - Booking and scheduling. - Live session orchestration. -
Messaging and notifications. - Mock interview. - Goals and progress. -
Admin and audit.

These can begin as a modular monolith. Do not introduce microservices
before independent scaling or ownership requires them.

## 18.3 Event-driven operations

Useful domain events: - `UserRegistered` - `ExternalIdentityLinked` -
`ConsentGranted` - `ConsentRevoked` - `ProfileContextUpdated` -
`MentorApplicationSubmitted` - `MentorApproved` - `MentorSuspended` -
`MatchingCompleted` - `BookingRequested` - `BookingConfirmed` -
`BookingCancelled` - `SessionStarted` - `SessionCompleted` -
`FeedbackSubmitted` - `GoalUpdated` - `MockInterviewCompleted`

Use an outbox or equivalent reliable event publication pattern for
critical database-to-queue workflows.

------------------------------------------------------------------------

# 19. API Requirements

API design should be versioned and documented. Exact route names may
change during implementation.

## 19.1 Authentication and connections

-   `POST /api/v1/auth/ai-tathastu/callback`
-   `POST /api/v1/auth/link-account`
-   `DELETE /api/v1/connections/{connectionId}`
-   `GET /api/v1/connections`
-   `GET /api/v1/consents`
-   `POST /api/v1/consents`
-   `DELETE /api/v1/consents/{consentId}`

## 19.2 Student profiles and goals

-   `GET /api/v1/students/me`
-   `PATCH /api/v1/students/me`
-   `GET /api/v1/students/me/context`
-   `PATCH /api/v1/students/me/context-sharing`
-   `POST /api/v1/goals`
-   `GET /api/v1/goals`
-   `PATCH /api/v1/goals/{goalId}`

## 19.3 Mentor applications and profiles

-   `POST /api/v1/mentor-applications`
-   `GET /api/v1/mentor-applications/me`
-   `PATCH /api/v1/mentor-applications/me`
-   `POST /api/v1/mentor-applications/me/submit`
-   `GET /api/v1/mentors`
-   `GET /api/v1/mentors/{mentorId}`
-   `PATCH /api/v1/mentors/me`

## 19.4 Matching

-   `POST /api/v1/matching/recommendations`
-   `GET /api/v1/matching/recommendations`
-   `POST /api/v1/matching/feedback`
-   `POST /api/v1/matching/refresh`

## 19.5 Booking and sessions

-   `GET /api/v1/mentors/{mentorId}/availability`
-   `POST /api/v1/bookings`
-   `GET /api/v1/bookings`
-   `GET /api/v1/bookings/{bookingId}`
-   `POST /api/v1/bookings/{bookingId}/cancel`
-   `POST /api/v1/bookings/{bookingId}/reschedule`
-   `POST /api/v1/sessions/{sessionId}/join-token`

## 19.6 Messaging and mock interviews

-   `GET /api/v1/conversations`
-   `POST /api/v1/conversations`
-   `GET /api/v1/conversations/{conversationId}/messages`
-   `POST /api/v1/conversations/{conversationId}/messages`
-   `POST /api/v1/mock-interviews/bookings`
-   `GET /api/v1/mock-interviews`
-   `GET /api/v1/mock-interviews/{interviewId}/report`
-   `POST /api/v1/mock-interviews/{interviewId}/feedback`

Every endpoint must enforce server-side authorization. Hiding a button
is not access control.

------------------------------------------------------------------------

# 20. Security, Privacy and Governance

## 20.1 Core requirements

-   Least-privilege role-based access.
-   Server-side authorization on every protected operation.
-   Secure session management.
-   OAuth/OIDC validation.
-   CSRF protection where applicable.
-   Rate limiting.
-   Input validation and output encoding.
-   Secure file upload validation and scanning.
-   Encryption in transit.
-   Encryption at rest through managed infrastructure.
-   Secret management outside source control.
-   Audit logs for sensitive operations.
-   Backup and recovery plan.
-   Incident response process.

## 20.2 Privacy principles

-   Purpose limitation.
-   Data minimization.
-   Explicit consent.
-   Source transparency.
-   User correction.
-   Revocation.
-   Retention limits.
-   Deletion workflows.
-   Restricted access to sensitive documents.

## 20.3 Mentor access to student data

Mentors should see only: - Student information required for the
mentorship. - Data the student has explicitly chosen to share. -
Relevant goals and context for the active relationship.

Mentors must not automatically receive a student's complete AI Tathastu
profile.

## 20.4 AI Tathastu integration governance

-   Maintain a data-sharing agreement between systems.
-   Define source ownership and authoritative fields.
-   Define synchronization frequency.
-   Define conflict resolution.
-   Define consent scopes.
-   Define revocation semantics.
-   Log data access and synchronization.
-   Support partial integration failure.

------------------------------------------------------------------------

# 21. Non-Functional Requirements

## 21.1 Performance

Initial targets, to be validated through production measurement: - Main
application routes should feel responsive on mid-range mobile devices. -
Common read APIs: target p95 under 500 ms under expected load. - Booking
confirmation: target p95 under 1 second excluding external payment or
provider latency. - Search results should return quickly with
pagination. - Images should be responsive and optimized. - Heavy work
should run asynchronously.

## 21.2 Availability and reliability

-   Define production availability SLO before launch.
-   Use health checks and alerting.
-   Retry transient external failures with bounded backoff.
-   Make booking and payment operations idempotent.
-   Avoid duplicate notifications.
-   Preserve data consistency through database transactions.
-   Provide graceful degradation if AI Tathastu, LiveKit, email, or
    other providers fail.

## 21.3 Scalability

-   Paginate all growing lists.
-   Index common filters and joins.
-   Use background jobs for imports and notifications.
-   Keep video traffic outside the main application server.
-   Cache only data that can safely be stale.
-   Design matching so it can be recalculated asynchronously.

## 21.4 Maintainability

-   Type-safe application code.
-   Shared validation schemas.
-   Centralized design tokens.
-   Modular domain boundaries.
-   API documentation.
-   Automated tests.
-   Database migration discipline.
-   Structured error handling.
-   Environment separation.

## 21.5 Accessibility

Target WCAG 2.2 AA: - Keyboard access. - Screen-reader labels. - Visible
focus. - Contrast. - Reduced motion. - Form error association. -
Captions or alternatives for video content where required.

------------------------------------------------------------------------

# 22. Analytics and Success Metrics

## 22.1 North-star metric

**Successful mentorship outcomes:** the number or proportion of active
students who complete a meaningful mentorship milestone, supported by a
completed human mentorship interaction and a recorded next step.

Define the exact reporting window and eligibility rules before
publishing the metric.

## 22.2 Acquisition and activation

-   Registration completion.
-   AI Tathastu login share.
-   Independent login share.
-   Onboarding completion.
-   Profile completion.
-   First recommendation view.
-   First mentor profile view.

## 22.3 Matching quality

-   Recommendation click-through.
-   Mentor profile-to-booking conversion.
-   Booking acceptance rate.
-   Student rejection / dismissal reasons.
-   Match-to-session completion.
-   Repeat booking rate.
-   Admin override rate.

## 22.4 Mentor operations

-   Application submission.
-   Verification turnaround.
-   Approval rate.
-   Active mentor ratio.
-   Availability coverage.
-   Capacity utilization.
-   Mentor cancellation rate.
-   Response time.

## 22.5 Session quality

-   Session completion.
-   No-show rate.
-   Cancellation rate.
-   Feedback completion.
-   Student satisfaction.
-   Action-item completion.
-   Repeat mentorship.

## 22.6 Mock interview quality

-   Interview booking completion.
-   Interview completion.
-   Feedback delivery time.
-   Report view rate.
-   Repeat practice rate.
-   Student-reported usefulness.

Do not treat ratings as the sole quality measure. Monitor sample size,
bias, and context.

------------------------------------------------------------------------

# 23. Functional Requirements and Acceptance Criteria

## FR-001 --- Authentication

**Requirement:** Users can sign in through AI Tathastu or an independent
authentication method.

Acceptance: - AI Tathastu OIDC/OAuth response is validated
server-side. - Independent sign-in works without an AI Tathastu
account. - Account linking prevents accidental duplicates. - Invalid or
expired authentication responses are rejected. - Users can sign out and
manage active sessions.

## FR-002 --- Consent and ecosystem context

**Requirement:** Users can authorize selected AI Tathastu context to be
used by MentorMaze.

Acceptance: - Consent identifies data categories and purpose. - Imported
fields show source and last-updated information. - Users can correct
imported values. - Users can revoke permissions. - Revocation is
recorded and affects subsequent synchronization. - Mentors see only
student-shared information.

## FR-003 --- Student onboarding

**Requirement:** Students can create a usable profile and define goals.

Acceptance: - Onboarding can be resumed. - Required and optional fields
are distinguished. - Imported information is not silently treated as
verified. - Student can edit profile and preferences. - Missing
information is reflected in recommendation confidence.

## FR-004 --- Mentor application

**Requirement:** Eligible users can apply to become mentors.

Acceptance: - Application supports draft and submit. - Required evidence
depends on mentor category and service. - Applicant can view status. -
Submitted profile is not publicly active before approval. - Resubmission
works after a request for more information.

## FR-005 --- Mentor verification

**Requirement:** Authorized admins can review and decide mentor
applications.

Acceptance: - Only authorized roles can approve or reject. - Every
decision includes a reason or decision record. - Status changes are
audited. - Approved mentor becomes discoverable. - Suspended mentor is
removed from new recommendations and bookings.

## FR-006 --- Mentor discovery

**Requirement:** Students can see relevant mentors and explore the
directory.

Acceptance: - Only eligible approved mentors appear. - Filters work in
combination. - Cards display accurate profile information. - Empty
states provide useful next steps. - Profile views do not expose private
data.

## FR-007 --- Intelligent matching

**Requirement:** The system ranks mentors using student goals,
expertise, fit, capacity, and availability.

Acceptance: - Hard eligibility constraints are applied before ranking. -
Ranking factors are recorded. - Explanations are grounded in actual
profile data. - Fewer than three results may be returned when fewer
strong matches exist. - Matching failures degrade to directory search or
assisted matching. - Admin overrides are logged.

## FR-008 --- Mentor profile

**Requirement:** Students can inspect a mentor's qualifications,
services, and availability.

Acceptance: - Verification scope is clear. - Experience and expertise
are displayed accurately. - Availability is current at the time of
booking. - Student can proceed to booking.

## FR-009 --- Booking

**Requirement:** Students can request and confirm a session.

Acceptance: - Availability is revalidated at confirmation. - Concurrent
requests cannot double-book a slot. - Timezone is visible. -
Confirmation details are recorded. - Cancellation and rescheduling
follow configured policy. - Duplicate requests are handled idempotently.

## FR-010 --- Live session

**Requirement:** Authorized participants can join a LiveKit session.

Acceptance: - Only booking participants receive valid tokens. - Tokens
are short-lived. - Join and leave events are captured. - Device and
permission errors are actionable. - Session completion is not inferred
solely from page navigation.

## FR-011 --- Messaging

**Requirement:** Students and mentors can communicate in permitted
contexts.

Acceptance: - Conversation membership is enforced server-side. -
Unauthorized users cannot read or send messages. - Attachments follow
security policy. - Abuse reporting is available. - Message retention is
defined.

## FR-012 --- Mentorship progress

**Requirement:** Students and mentors can maintain goals, milestones,
notes, and action items.

Acceptance: - Each record has an owner and visibility rule. - Students
can view relevant action items. - Mentors cannot edit student-private
records without permission. - Completion history is retained according
to policy.

## FR-013 --- Mock interviews

**Requirement:** Students can book and complete a human-led mock
interview.

Acceptance: - Interviewer capability is visible. - Interview category
and level are recorded. - Booking uses the same safe scheduling rules. -
Feedback follows a defined rubric. - Report access is restricted to
authorized parties.

## FR-014 --- Admin operations

**Requirement:** Admins can manage verification, bookings, users, and
support.

Acceptance: - Admin actions are permission-checked. - Sensitive actions
require reason capture. - Audit logs identify actor, action, target, and
timestamp. - Admin lists support search, filters, and pagination.

## FR-015 --- Notifications

**Requirement:** Users receive relevant lifecycle notifications.

Acceptance: - Notifications are tied to domain events. - Duplicate
delivery is prevented where feasible. - User preferences are
respected. - Failed delivery is retried or reported. - Notification
content does not expose sensitive information.

------------------------------------------------------------------------

# 24. Edge Cases and Failure Scenarios

## Identity and integration

-   AI Tathastu unavailable during login.
-   User revokes ecosystem access.
-   External account email changes.
-   Duplicate account linking attempt.
-   Partial profile import.
-   Conflicting source values.
-   Stale source data.
-   Source system deletes a record.

## Mentor verification

-   Incomplete application.
-   Duplicate application.
-   Unreadable evidence.
-   Conflicting employment details.
-   Applicant changes profile while under review.
-   Mentor is suspended with upcoming bookings.
-   Admin approval is made in error.

## Matching

-   No eligible mentor.
-   Only one or two strong mentors.
-   Student profile is incomplete.
-   Mentor has expertise but no capacity.
-   Mentor becomes unavailable after recommendation.
-   Student preferences conflict.
-   A mentor is popular but poorly aligned.
-   Matching service fails.

## Booking

-   Two students select the same slot.
-   Mentor changes availability during checkout.
-   Student loses connection during confirmation.
-   Duplicate submission.
-   Timezone / daylight-saving boundary.
-   Mentor cancels.
-   Student misses session.
-   Payment succeeds but booking confirmation fails, if payments are
    enabled.

## Live sessions

-   Token expiry.
-   Wrong participant.
-   Browser denies camera access.
-   Device disconnected.
-   Network interruption.
-   LiveKit outage.
-   Participant joins late.
-   Session ends unexpectedly.

## Mock interviews

-   Interviewer no-show.
-   Student uploads the wrong resume.
-   Feedback is incomplete.
-   Report contains a factual error.
-   Interview category is not supported by the assigned interviewer.

Every failure state must have a clear system state, user-facing message,
and recovery path.

------------------------------------------------------------------------

# 25. Delivery Roadmap

## Phase 0 --- Foundations

-   Confirm product scope.
-   Finalize identity and consent model.
-   Finalize role and permission matrix.
-   Establish design system.
-   Create database schema and migration strategy.
-   Establish CI/CD, environments, logging, and testing.
-   Define AI Tathastu integration contract.

**Exit criteria:** Architecture and core contracts are reviewed and
implementation-ready.

## Phase 1A --- Core Platform

-   Public landing page.
-   Independent authentication.
-   AI Tathastu authentication integration.
-   Student onboarding.
-   Mentor application.
-   Admin verification.
-   Approved mentor directory.
-   Mentor profiles.
-   Basic goals and preferences.

**Exit criteria:** Students can onboard; mentors can apply; admins can
approve; only approved mentors are discoverable.

## Phase 1B --- Human Mentorship

-   Matching engine v1.
-   Top-three mentor recommendations.
-   Mentor availability.
-   Booking and rescheduling.
-   LiveKit integration.
-   Session lifecycle.
-   Chat.
-   Session notes.
-   Action items.
-   Feedback and progress.

**Exit criteria:** A student can be matched, book, attend, and complete
a human mentorship journey.

## Phase 1C --- Mock Interviews

-   Interview categories.
-   Interviewer capabilities.
-   Interviewer discovery.
-   Booking.
-   Live interview.
-   Feedback rubric.
-   Interview report.
-   Repeat practice.

**Exit criteria:** A student can book, complete, and review a human mock
interview.

## Phase 1D --- Intelligence and Operations Expansion

-   Matching evaluation.
-   Admin-assisted matching.
-   Capacity optimization.
-   Better analytics.
-   Ecosystem context synchronization improvements.
-   Operational dashboards.
-   Reliability and performance improvements.

**Exit criteria:** Matching quality and operations are measurable and
manageable.

## Phase 2 --- AI Mentorship

Separate PRD and safety review required.

Potential capabilities: - AI mentor conversations. - Personalized
learning support. - Context-aware recommendations. - AI mock interview
practice. - Human-to-AI handoff. - AI-to-human escalation. - Shared
progress context with explicit permissions.

Phase 2 must reuse the identity, consent, profile, goal, and progress
foundations built in Phase 1.

------------------------------------------------------------------------

# 26. Testing Strategy

## Unit tests

-   Matching feature calculations.
-   Permission policies.
-   Booking state transitions.
-   Availability calculations.
-   Consent scope evaluation.
-   Verification state transitions.
-   Rubric calculations.

## Integration tests

-   AI Tathastu identity flow.
-   Context import and revocation.
-   Database transactions.
-   Redis holds / cache behavior.
-   LiveKit token generation.
-   Webhook validation.
-   Notification queue.
-   File upload and access control.

## End-to-end tests

-   Student independent registration.
-   Student AI Tathastu registration.
-   Student onboarding.
-   Mentor application.
-   Admin approval.
-   Mentor recommendation.
-   Booking.
-   Live session join.
-   Session completion.
-   Feedback.
-   Mock interview booking and report.
-   Mentor suspension and booking impact.

## Security tests

-   Cross-role access.
-   IDOR attempts.
-   Session hijacking.
-   OAuth callback manipulation.
-   Unauthorized LiveKit token requests.
-   File access bypass.
-   Rate-limit bypass.
-   Consent revocation.
-   Admin privilege escalation.

## UX tests

-   Mobile onboarding.
-   Mentor comparison.
-   Booking completion.
-   Keyboard navigation.
-   Screen reader flow.
-   Reduced-motion behavior.
-   Error recovery.

------------------------------------------------------------------------

# 27. Launch Readiness Checklist

## Product

-   [ ] Phase 1 scope approved.
-   [ ] Human mentorship workflows complete.
-   [ ] Mock interview workflows complete.
-   [ ] AI mentorship excluded from Phase 1 UI and scope.
-   [ ] Policies and service terms published.

## Identity and data

-   [ ] AI Tathastu login tested.
-   [ ] Independent login tested.
-   [ ] Account linking tested.
-   [ ] Consent and revocation tested.
-   [ ] Source provenance visible.
-   [ ] Role access verified.

## Mentors

-   [ ] Application workflow complete.
-   [ ] Verification checklist approved.
-   [ ] Admin approval tested.
-   [ ] Unapproved mentors hidden.
-   [ ] Suspension behavior tested.

## Matching and booking

-   [ ] Hard filters tested.
-   [ ] Top-three ranking tested.
-   [ ] Match explanations validated.
-   [ ] No-match state implemented.
-   [ ] Double booking prevented.
-   [ ] Timezone behavior tested.
-   [ ] Cancellation policy implemented.

## Sessions and communication

-   [ ] LiveKit token authorization tested.
-   [ ] Session lifecycle tested.
-   [ ] Chat access tested.
-   [ ] Notifications tested.
-   [ ] Recording disabled unless explicitly approved and consented.

## Operations

-   [ ] Audit logs enabled.
-   [ ] Monitoring and alerting enabled.
-   [ ] Backup and restore tested.
-   [ ] Support process ready.
-   [ ] Incident response owner assigned.

------------------------------------------------------------------------

# 28. Open Decisions Requiring Product Approval

These are decisions that should be explicitly resolved before the
relevant implementation begins.

1.  **Mentorship model:** Free, paid, institution-sponsored, or mixed?
2.  **Booking model:** Instant confirmation or mentor approval for every
    request?
3.  **Mock interview pricing:** Same model as mentorship or separately
    priced?
4.  **Session durations:** Which durations are supported?
5.  **Cancellation policy:** What are the deadlines and consequences?
6.  **Mentor eligibility:** Which evidence is mandatory for teachers,
    alumni, and industry mentors?
7.  **Verification standard:** Which claims receive a verified badge and
    what checks support each badge?
8.  **In-person sessions:** Is Phase 1 online-only or does it support
    approved in-person sessions?
9.  **Chat access:** Can a student message before booking, or only after
    a request?
10. **File sharing:** Which file types and size limits are allowed?
11. **Recording:** Is recording prohibited initially or offered only
    with explicit consent?
12. **Payments:** Is payment included in the first release?
13. **AI Tathastu sync:** Which system owns each profile field?
14. **Collabry, Avsar, and IRIS:** Which exact data contracts and
    authorized fields are available?
15. **Data retention:** How long are messages, session notes, reports,
    and uploaded evidence retained?
16. **Admin structure:** Which admin roles are needed at launch?
17. **Geography:** Which countries, timezones, and languages are
    supported at launch?

Do not silently invent answers to these decisions. Record approved
decisions in an architecture decision log.

------------------------------------------------------------------------

# 29. Final Product Definition

MentorMaze Phase 1 is a complete human mentorship and mock interview
platform supported by an intelligence layer.

Its core journey is:

**Student context → Goals → Mentor recommendations → Verified mentor →
Booking → Live session → Feedback → Action items → Progress.**

Its mentor journey is:

**AI Tathastu or independent identity → Become a Mentor → Application →
Evidence → Admin review → Approval → Availability → Student matching →
Sessions → Feedback.**

Its administrator journey is:

**Application queue → Verification → Approval → Platform operations →
Matching oversight → Support → Audit and analytics.**

AI Tathastu provides identity and permissioned ecosystem context.
MentorMaze uses that context to improve the human mentorship experience
and returns selected, authorized outcomes to the ecosystem.

Collabry, Avsar, and IRIS remain distinct products and sources.
MentorMaze consumes only the context made available through approved
integration contracts and user permissions.

**Phase 1 success means a student can independently discover, book,
attend, and benefit from a real human mentorship session or human mock
interview---with trust, transparency, and measurable next steps.**

AI mentorship is Phase 2.
