# MentorMaze --- Free-Tier-First Technical Architecture

## Phase 1 Human Mentorship + Mock Interviews

**Parent ecosystem:** AI Tathastu\
**Architecture target:** \$0 initial infrastructure spend\
**Primary database:** Neon PostgreSQL\
**Frontend hosting:** Vercel / Cloudflare Pages depending on deployment
eligibility\
**Realtime:** Supabase Realtime or a replaceable realtime adapter\
**Video:** LiveKit\
**Backend:** Next.js modular monolith initially\
**Status:** Recommended baseline; validate provider quotas and
commercial terms before public launch

------------------------------------------------------------------------

# 1. Architecture Objective

Build MentorMaze as a complete human mentorship platform using free
tiers and open-source technology wherever practical.

Phase 1 includes: - Student, mentor and admin experiences. - AI Tathastu
sign-in and permissioned context exchange. - Independent OAuth/email
sign-in. - Mentor applications and admin verification. -
Intelligence-based mentor matching. - Human mentorship bookings. - Human
mock interview bookings. - Calendar and availability management. - Live
video sessions. - Realtime chat and presence. - In-app, email and push
notifications. - Goals, action items, session notes and feedback. -
Admin operations, analytics and audit logs.

Phase 2 introduces AI mentorship. Phase 1 must not depend on paid LLM
APIs to function.

## 1.1 Non-negotiable principles

1.  No paid service is required for the core Phase 1 journey during
    development.
2.  Free-tier limits must be treated as hard resource constraints.
3.  Avoid provider lock-in through adapters and standard protocols.
4.  PostgreSQL remains the source of truth for bookings, users, profiles
    and messages.
5.  Realtime transports deliver events; they do not become the only
    durable store.
6.  Never use a sleeping/free server as the only critical notification
    or booking mechanism.
7.  No secrets or service-role keys in browser code.
8.  No AI call is required for mentor matching v1.
9.  Every important workflow must degrade gracefully when a provider is
    unavailable.
10. Keep a documented migration path to paid plans.

------------------------------------------------------------------------

# 2. Recommended Stack

  --------------------------------------------------------------------------------
  Layer             Recommended       Free-first role   Important caveat
                    choice                              
  ----------------- ----------------- ----------------- --------------------------
  Web app           Next.js +         Student, mentor,  Keep server workloads
                    TypeScript        admin and public  within host limits
                                      pages             

  UI                Tailwind CSS +    Design system and Self-host fonts/assets
                    shadcn/ui         components        where possible

  Frontend hosting  Vercel or         Preview and web   Vercel Hobby is restricted
                    Cloudflare Pages  hosting           to personal,
                                                        non-commercial use

  Primary database  Neon PostgreSQL   Transactional     Free
                                      application data  compute/storage/transfer
                                                        quotas apply

  ORM               Drizzle ORM       Typed schema and  Keep migrations portable
                                      migrations        PostgreSQL

  Authentication    Auth.js or        Independent login Validate provider
                    compatible OIDC   and AI Tathastu   configuration and account
                    client            SSO               linking

  Realtime          Supabase Realtime Chat delivery,    Keep message persistence
                                      typing and        in PostgreSQL
                                      presence          

  Video             LiveKit Cloud     One-to-one        Confirm RTC usage quotas;
                    Build or          mentorship and    free agent minutes are not
                    self-hosted       interviews        automatically equivalent
                    LiveKit                             to unlimited video

  Object storage    Cloudflare R2     Private resumes,  Configure private buckets
                                      evidence and      and signed access
                                      attachments       

  Email             Resend            Transactional     Free plan currently lists
                                      emails            3,000/month and 100/day

  Push              Firebase Cloud    Web/mobile push   FCM itself is no-cost;
                    Messaging         delivery          clients still need
                                                        permission

  Calendar          Internal          Availability,     API use has quotas; use
                    calendar + Google event export/sync OAuth per user
                    Calendar API                        

  Background jobs   PostgreSQL        Notifications,    Do not rely on in-memory
                    outbox + worker   sync, reminders   timers

  Cache / rate      PostgreSQL        Short-lived state Avoid adding Redis before
  limits            initially;        and throttling    a real need
                    Upstash Redis if                    
                    needed                              

  Search            PostgreSQL        Mentor discovery  Add a search engine only
                    full-text search                    when justified

  AI / LLM          Ollama on         Local experiments Laptop must be online; not
  development       developer machine and prompt        a hosted production
                                      development       inference service

  Optional hosted   Provider adapter  Non-critical      Free quotas and model
  LLM               for an available  experiments       access change; never
                    free quota                          assume permanent free
                                                        service

  Monitoring        Sentry free tier  Error visibility  Verify current quotas and
                    / provider logs                     data retention

  CI/CD             GitHub Actions    Tests, lint and   Respect included runner
                                      builds            limits
  --------------------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Hosting Decision: Vercel, Cloudflare Pages and Render

## 3.1 Vercel

Use for: - Development previews. - Personal/non-commercial prototypes. -
Frontend deployments where the account and project comply with plan
terms.

Important: Vercel Hobby is intended for personal, non-commercial use.
MentorMaze is part of a startup/product ecosystem. Do not assume the
Hobby plan is permitted for a commercial production launch. Review
current terms and choose an eligible plan or a different host.

## 3.2 Cloudflare Pages / Workers

Consider when: - The application can run within supported runtime
constraints. - Static and edge-delivered frontend assets are useful. -
The team is comfortable with Cloudflare's runtime and deployment model.

Do not assume every Node.js dependency or Next.js server feature works
unchanged in an edge runtime. Validate framework compatibility before
choosing it as the primary host.

## 3.3 Render

Use free Render services for: - Experiments. - Demo APIs. - Webhook
prototypes. - Non-critical workers during development.

Do not use a free Render service as the sole production realtime or
critical API host: - Free web services spin down after 15 minutes
without qualifying inbound traffic. - Cold starts can take around a
minute. - Local filesystem is ephemeral. - Free Postgres expires after
30 days. - Free Key Value is in-memory and loses state on restart.

Never store the primary production database on free Render Postgres.

## 3.4 Hosting recommendation

For the initial implementation: - Keep the application deployable as a
standard Next.js application. - Use a host whose terms permit the
intended commercial use. - Use Neon as the persistent database. - Keep
background processing and realtime adapters replaceable. - Avoid a
multi-host deployment until a real runtime requirement justifies it.

------------------------------------------------------------------------

# 4. Database --- Neon PostgreSQL

Neon is the primary transactional database.

Use it for: - Users and identities. - Roles and permissions. - Student
and mentor profiles. - Mentor applications and verification. - Consent
grants and integration metadata. - Profile facts and provenance. -
Skills, topics and goals. - Matching runs and explanations. -
Availability and bookings. - Session metadata and notes. - Conversations
and durable messages. - Mock interview reports. - Notifications and
delivery records. - Audit logs and outbox events.

## 4.1 Neon free-tier planning

The current Neon Free documentation lists per-project quotas
including: - 100 CU-hours monthly. - 1 GB Postgres storage per
project. - 5 GB public network transfer per project. - Compute scales to
zero after inactivity.

These are provider limits, not application guarantees. Check the current
pricing and usage dashboard before launch.

## 4.2 Connection management

-   Use pooled connection strings for serverless application workloads.
-   Do not create a new direct database connection per request.
-   Keep connection counts bounded.
-   Use transactions for booking and state transitions.
-   Set sensible query timeouts.
-   Monitor compute-hours and data transfer.
-   Export backups independently; do not assume the free tier provides
    production-grade backup guarantees.

## 4.3 Database safety

-   Use separate development, preview and production projects where
    quota permits.
-   Never use production data in preview deployments.
-   Apply migrations through CI or a controlled release step.
-   Do not run schema migrations on every serverless cold start.
-   Keep a restore/export procedure tested.

------------------------------------------------------------------------

# 5. Authentication and AI Tathastu SSO

## 5.1 Two login paths

### Continue with AI Tathastu

-   OIDC/OAuth authorization code flow.
-   PKCE where applicable.
-   Validate issuer, audience, signature, state, nonce and expiry.
-   Use stable `(issuer, subject)` identity.
-   Request only the required identity scopes.
-   Ask for separate data-sharing consent for imported context.

### Continue with Google / email

-   Independent account creation.
-   Verified email.
-   Account recovery.
-   Optional account linking after proof of control.

## 5.2 Identity is not data consent

Signing in through AI Tathastu does not authorize MentorMaze to import
every record.

Use separate scopes such as: - Basic profile. - Education. - Skills. -
Projects. - Career goals. - Resume metadata. - Selected Collabry
context. - Selected Avsar context. - Selected IRIS context. - Return of
MentorMaze progress.

Only enable source categories when the upstream product provides an
approved API or data contract and the user has authorized the purpose.

## 5.3 Integration adapter

Create a provider-neutral interface:

``` ts
interface EcosystemProvider {
  getIdentity(): Promise<ExternalIdentity>;
  getAuthorizedContext(scopes: string[]): Promise<ContextRecord[]>;
  publishApprovedOutcome(event: MentorMazeOutcome): Promise<void>;
  revokeConnection(): Promise<void>;
}
```

Implement AI Tathastu first. Add Collabry, Avsar and IRIS only after
their API contracts, ownership rules, and consent requirements are
confirmed.

------------------------------------------------------------------------

# 6. Realtime Chat, Presence and Typing

## 6.1 Recommended design

Use: - Neon PostgreSQL for durable messages. - Supabase Realtime for
delivery, typing indicators and online presence. - Server-side
authorization for conversation membership.

The realtime layer is a delivery channel, not the source of truth.

## 6.2 Message flow

1.  Client sends message to MentorMaze API.
2.  API authenticates sender.
3.  API checks conversation membership and status.
4.  API validates and stores message in Neon.
5.  API publishes a realtime event.
6.  Other participant receives event.
7.  Client reconciles event with persisted message history.
8.  Read receipts are stored only if the product enables them.

If realtime delivery fails, the message remains stored and appears on
the next history fetch.

## 6.3 Realtime events

-   `message.created`
-   `message.updated`
-   `message.deleted`
-   `conversation.read`
-   `typing.started`
-   `typing.stopped`
-   `presence.online`
-   `presence.offline`
-   `booking.updated`
-   `session.started`
-   `session.ended`

Do not persist every typing event. Use ephemeral channels and rate
limits.

## 6.4 Channel security

-   Use private channels.
-   Authenticate channel subscriptions.
-   Authorize users against conversation membership.
-   Do not trust client-supplied user IDs.
-   Do not broadcast private student context in presence payloads.
-   Rate-limit message sends and typing events.
-   Sanitize rendered content and secure attachments.

## 6.5 Fallback

If the realtime provider is unavailable: - Send and persist messages
through the normal API. - Poll recent messages with bounded intervals
while the conversation is open. - Show a connection status indicator. -
Reconnect with exponential backoff. - Do not lose locally unsent
messages silently.

------------------------------------------------------------------------

# 7. Live Video --- LiveKit

Use LiveKit for human mentorship and mock interview calls.

## 7.1 Phase 1 features

-   One-to-one audio/video.
-   Camera and microphone controls.
-   Device selection.
-   Screen sharing if enabled.
-   Participant join/leave.
-   Reconnection.
-   Connection-quality indicators.
-   Session duration and completion events.
-   Pre-join device check.
-   Session-specific room access.

## 7.2 Secure token flow

1.  User opens a confirmed booking.
2.  Backend checks user is a participant.
3.  Backend checks booking/session state.
4.  Backend creates a short-lived LiveKit access token.
5.  Client joins the room.
6.  Webhooks are signature-validated.
7.  Backend records session events.

Never expose LiveKit API secrets or create unrestricted tokens in
frontend code.

## 7.3 Free-tier rule

LiveKit's free Build plan is useful for development, but its published
AI agent minutes and inference credits must not be interpreted as
unlimited standard video conferencing. Verify the current Cloud RTC
usage, bandwidth and participant limits before relying on it for real
users.

If Cloud quotas are unsuitable: - Run local LiveKit for development. -
Evaluate self-hosting only when a stable server, bandwidth and
operational ownership exist. - Do not assume self-hosting is zero-cost:
TURN, bandwidth, uptime and maintenance still have costs.

## 7.4 Recording

Do not record by default. Add recording only after consent, retention,
access, deletion and legal requirements are defined.

------------------------------------------------------------------------

# 8. Calendar and Scheduling

Build MentorMaze's own scheduling system first. Google Calendar should
be an optional integration, not the booking database.

## 8.1 Internal calendar capabilities

-   Weekly mentor availability.
-   One-off availability.
-   Blocked dates and holidays.
-   Timezone-aware display.
-   Session duration.
-   Buffer time.
-   Booking notice period.
-   Booking horizon.
-   Student calendar.
-   Mentor calendar.
-   Upcoming / past sessions.
-   Reschedule and cancellation.
-   Calendar event details.
-   Reminder scheduling.

## 8.2 Google Calendar integration

Optional features: - Connect Google Calendar through OAuth. - Read
busy/free windows where permitted. - Create an event after booking
confirmation. - Update event after reschedule. - Delete or cancel event
after cancellation. - Store external calendar event ID. - Handle revoked
permissions and expired tokens. - Use push/watch notifications where
available; avoid aggressive polling.

Do not make Google Calendar availability the sole protection against
double booking. MentorMaze must enforce its own booking constraints
transactionally.

## 8.3 ICS fallback

Generate `.ics` calendar invitations for users who do not connect Google
Calendar. This works with many calendar applications and avoids forcing
a provider integration.

## 8.4 Calendar data model additions

-   `calendar_connections`
-   `external_calendar_events`
-   `calendar_sync_jobs`
-   `availability_rules`
-   `availability_exceptions`
-   `booking_holds`
-   `bookings`

Store provider event IDs and sync status; do not duplicate entire
external calendars.

------------------------------------------------------------------------

# 9. Notifications

## 9.1 Channels

  -----------------------------------------------------------------------
  Channel                 Technology              Purpose
  ----------------------- ----------------------- -----------------------
  In-app                  Neon + application UI   Notification center

  Realtime                Supabase Realtime       Immediate badge and
                                                  notification updates

  Email                   Resend                  Booking and account
                                                  emails

  Web push                Firebase Cloud          Browser notifications
                          Messaging               where supported

  Android push            Firebase Cloud          Native app
                          Messaging               notifications

  SMS / WhatsApp          Excluded initially      Paid or
                                                  provider-dependent
  -----------------------------------------------------------------------

## 9.2 Required notification events

### Account

-   Email verification.
-   New login/security event where appropriate.
-   AI Tathastu connection status.
-   Consent changes.

### Mentor application

-   Application submitted.
-   Under review.
-   More information required.
-   Approved.
-   Rejected.
-   Suspended.

### Booking

-   Request received.
-   Booking accepted / declined.
-   Booking confirmed.
-   Rescheduled.
-   Cancelled.
-   Upcoming reminder.
-   No-show or completion status.

### Mentorship

-   New message.
-   Action item assigned.
-   Action item due.
-   Goal milestone updated.
-   Feedback requested.

### Mock interview

-   Booking confirmation.
-   Preparation reminder.
-   Interview completed.
-   Feedback report ready.

## 9.3 Notification architecture

1.  Business transaction writes a domain event to `outbox_events`.
2.  Worker reads pending events.
3.  Worker creates in-app notification.
4.  Worker sends email/push where enabled.
5.  Delivery attempt is recorded.
6.  Failed delivery retries with bounded exponential backoff.
7.  Idempotency prevents duplicate messages.

Do not rely on a browser tab being open to send reminders.

## 9.4 Free email tier

Resend currently lists a free allowance of 3,000 emails/month and 100
emails/day. Keep email templates concise and use in-app notifications
for high-frequency events.

------------------------------------------------------------------------

# 10. Background Jobs Without Paid Queue Infrastructure

Start with PostgreSQL-backed jobs and the transactional outbox pattern.

Use tables: - `outbox_events` - `job_runs` -
`notification_delivery_attempts` - `external_sync_jobs`

Jobs: - Booking reminders. - Expired booking holds. - Mentor application
notifications. - Calendar synchronization. - AI Tathastu context
synchronization. - Email retries. - Cleanup of expired temporary
records. - Daily aggregate metrics.

## 10.1 Worker options

Development: - Run worker locally as a separate process.

Hosted: - Use a host that supports a continuously running worker within
the chosen plan. - If using serverless cron, keep each invocation short
and idempotent. - Use an external scheduler only if its free allowance
and terms are suitable.

Do not depend on Render Free for exact-time reminders: free services can
sleep and wake slowly. Do not depend on a Vercel Hobby cron for
commercial production without confirming plan eligibility and current
limits.

## 10.2 Scheduling accuracy

For reminders: - Store `scheduled_for` in UTC. - Query due jobs using an
indexed timestamp. - Claim jobs safely with row locking /
`SKIP LOCKED`. - Use idempotency keys. - Record completion and retry
state. - Allow late delivery after downtime and show accurate status.

------------------------------------------------------------------------

# 11. AI and LLM Strategy

AI mentorship is Phase 2. Phase 1 intelligence must work without LLMs.

## 11.1 Phase 1 intelligence without LLM

Use deterministic, explainable logic for: - Skill normalization. -
Goal-to-mentor alignment. - Eligibility filtering. - Mentor ranking. -
Availability filtering. - Capacity filtering. - Top-three
recommendation. - Match explanations from structured facts. -
Admin-assisted matching.

This is cheaper, testable and easier to audit.

## 11.2 Local LLM development

Use Ollama locally for: - Prompt experiments. - Profile summarization
prototypes. - Skill extraction tests. - Mock interview report
experiments. - Future AI mentor prototypes.

Local inference is not a production service unless the machine is
reliably hosted, monitored and secured.

## 11.3 Hosted free-quota models

Create a provider adapter. Do not hard-code one provider:

``` ts
interface LLMProvider {
  generate(input: LLMRequest): Promise<LLMResponse>;
  getCapabilities(): Promise<ModelCapabilities>;
}
```

Rules: - Free model quotas are volatile. - Add timeout, retry and
rate-limit handling. - Add request budgets per user. - Redact sensitive
context. - Do not send resumes or private records without explicit
purpose and consent. - Never make account, verification, booking or
eligibility decisions solely from an LLM. - Provide a deterministic
fallback. - Store model/provider/version metadata for generated outputs.

## 11.4 Phase 2 AI capabilities

Potential later features: - AI mentor chat. - Context-aware learning
support. - AI mock interview. - Resume and project feedback. - Human
mentor handoff. - Session preparation summaries. - Goal progress
suggestions.

These require a separate safety, privacy and cost review.

------------------------------------------------------------------------

# 12. Object Storage

Use Cloudflare R2 for: - Resume files. - Mentor verification evidence. -
Message attachments. - Profile images. - Mock interview supporting
files.

The published R2 free allowance currently lists 10 GB-month storage, 1
million Class A operations and 10 million Class B operations per month,
with no egress fees for standard storage.

Security: - Private bucket. - Server-generated object keys. -
Short-lived signed URLs. - MIME and file-size validation. - Malware
scanning where available. - Access logs for sensitive evidence. -
Retention and deletion jobs. - Never store private file URLs in public
profile responses.

If R2 account setup or payment requirements conflict with a strict
no-card policy, use an alternative eligible free object-storage provider
or defer file upload; do not store uploads on ephemeral application
disks.

------------------------------------------------------------------------

# 13. Search and Discovery

Start with PostgreSQL.

Search fields: - Mentor name. - Headline. - Organization. - Bio. -
Skills. - Topics. - Target roles. - Languages.

Use: - `tsvector` and GIN indexes for full-text search. - Normalized
skill/topic tables. - SQL filters for availability and approval. -
Pagination and stable sorting.

Do not add Elasticsearch, OpenSearch, Pinecone or a vector database for
Phase 1. Add semantic search only when keyword and structured matching
are demonstrably insufficient.

------------------------------------------------------------------------

# 14. Realtime Architecture Overview

``` mermaid
flowchart TD
    U[Student / Mentor / Admin Browser] --> W[Next.js Application]
    W --> API[Server API and Domain Services]
    API --> DB[(Neon PostgreSQL)]
    API --> RT[Supabase Realtime]
    RT --> U
    API --> LK[LiveKit]
    LK --> U
    DB --> OB[Outbox Events]
    OB --> JOB[Background Worker]
    JOB --> EMAIL[Resend]
    JOB --> PUSH[Firebase Cloud Messaging]
    JOB --> CAL[Google Calendar API]
    JOB --> AT[AI Tathastu Integration]
    API --> R2[Cloudflare R2]
```

Key rule: PostgreSQL stores durable business state. Realtime providers
distribute updates. LiveKit carries media. Workers handle asynchronous
side effects.

------------------------------------------------------------------------

# 15. Repository Structure

Recommended modular monolith:

``` text
mentormaze/
  apps/
    web/
      app/
        (public)/
        (auth)/
        student/
        mentor/
        admin/
        api/
      components/
      features/
        auth/
        onboarding/
        mentors/
        matching/
        bookings/
        calendar/
        sessions/
        chat/
        notifications/
        mock-interviews/
        goals/
        admin/
      lib/
      middleware.ts
  packages/
    db/
      schema/
      migrations/
      relations/
    auth/
    validation/
    domain/
    integrations/
      ai-tathastu/
      collabry/
      avsar/
      iris/
      livekit/
      realtime/
      calendar/
      email/
      push/
      storage/
      llm/
    ui/
    config/
  workers/
    jobs/
    outbox/
    notifications/
  docs/
    architecture/
    api/
    security/
  tests/
```

A monorepo is optional. Do not add workspace complexity unless shared
packages are actually needed.

------------------------------------------------------------------------

# 16. Environment Variables and Secret Management

Example variable names:

``` env
DATABASE_URL=
DATABASE_URL_UNPOOLED=

AUTH_SECRET=
AUTH_URL=

AI_TATHASTU_ISSUER=
AI_TATHASTU_CLIENT_ID=
AI_TATHASTU_CLIENT_SECRET=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

RESEND_API_KEY=
FCM_PROJECT_ID=
FCM_CLIENT_EMAIL=
FCM_PRIVATE_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

LLM_PROVIDER=
LLM_API_KEY=
```

Rules: - Keep secrets in host environment settings. - `.env` files must
be gitignored. - Commit `.env.example` with placeholders only. - Never
prefix private secrets with `NEXT_PUBLIC_`. - Rotate exposed credentials
immediately. - Use separate credentials for development and
production. - Avoid storing provider secrets in Neon tables.

------------------------------------------------------------------------

# 17. Free-Tier Risk Register

  -----------------------------------------------------------------------
  Provider / layer        Main risk               Mitigation
  ----------------------- ----------------------- -----------------------
  Neon                    Compute, storage or     Usage monitoring, query
                          transfer quota          optimization,
                          exhausted               export/backup plan

  Vercel Hobby            Non-commercial plan     Use eligible commercial
                          restriction             hosting

  Render Free             Sleep, cold starts,     Use only for
                          ephemeral disk,         experiments; keep
                          expiring database       durable state elsewhere

  Supabase Realtime       Connection/message      Rate limits, private
                          limits and              channels, fallback
                          authorization           polling
                          complexity              

  LiveKit Cloud           RTC minutes/bandwidth   Measure usage; test
                          may not be unlimited    actual participant
                                                  minutes

  R2                      Storage/operation       File limits, retention
                          allowance exceeded      and cleanup

  Resend                  Daily/monthly email cap In-app notification
                                                  fallback

  FCM                     Browser permission and  Keep in-app
                          device delivery         notification center
                          variability             

  Google Calendar         API quota, revoked      Internal calendar is
                          OAuth, sync failures    source of truth; ICS
                                                  fallback

  Free LLM API            Quota changes, rate     No LLM dependency in
                          limits, provider        critical Phase 1 paths
                          outages                 

  Local Ollama            Developer machine       Use only for local
                          unavailable             development and
                                                  experiments
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 18. Cost-Control Rules

-   Set provider usage alerts where available.
-   Do not enable paid auto-upgrades without explicit approval.
-   Avoid adding a payment method unless required and understood.
-   Monitor database storage, compute, transfer and realtime message
    counts.
-   Limit file upload size and retention.
-   Use image optimization and compression.
-   Avoid unnecessary polling.
-   Batch email notifications where appropriate.
-   Do not run an LLM for every page view or recommendation.
-   Use deterministic matching.
-   Use database indexes before adding infrastructure.
-   Keep a monthly infrastructure usage review.

A free tier is a quota, not a guarantee of zero future cost. Some
providers require billing details for certain products or can suspend
service at quota exhaustion.

------------------------------------------------------------------------

# 19. Development and Deployment Environments

## Local

-   Next.js app.
-   Local PostgreSQL or Neon development branch.
-   Local Ollama where needed.
-   LiveKit local/dev setup or approved Cloud project.
-   Mock email adapter.
-   Mock calendar provider.
-   Seed data.

## Preview

-   Isolated preview database or Neon branch.
-   Non-production provider credentials.
-   No real student documents.
-   Test OAuth callback URLs.
-   Test webhooks.

## Production

-   Commercially eligible hosting plan.
-   Separate Neon project.
-   Restricted provider keys.
-   Private storage.
-   Real domain and HTTPS.
-   Monitoring and alerts.
-   Tested database export/restore.
-   Documented incident and rollback procedures.

------------------------------------------------------------------------

# 20. Implementation Order

## Stage 1 --- Foundation

-   Next.js + TypeScript.
-   Drizzle + Neon.
-   Identity and RBAC.
-   Student, mentor and admin shells.
-   Environment and CI setup.

## Stage 2 --- Mentorship workflows

-   Student onboarding.
-   Mentor application.
-   Admin verification.
-   Mentor directory.
-   Deterministic matching v1.

## Stage 3 --- Calendar and booking

-   Availability rules.
-   Internal calendar.
-   Booking transactions.
-   Cancellation/reschedule.
-   ICS export.
-   Google Calendar connection as optional enhancement.

## Stage 4 --- Realtime and sessions

-   Durable chat messages.
-   Realtime delivery and presence.
-   LiveKit rooms and secure tokens.
-   Session lifecycle and notes.

## Stage 5 --- Notifications and mock interviews

-   Outbox worker.
-   In-app notifications.
-   Email and FCM.
-   Mock interview booking and rubrics.
-   Reports and feedback.

## Stage 6 --- Ecosystem integration

-   AI Tathastu SSO.
-   Consent management.
-   Context import.
-   Selected outcome export.
-   Collabry, Avsar and IRIS only through approved contracts.

## Stage 7 --- Hardening

-   Security tests.
-   Booking concurrency tests.
-   Realtime failure tests.
-   Usage and quota monitoring.
-   Backup/restore rehearsal.
-   Accessibility and performance audit.

------------------------------------------------------------------------

# 21. Definition of Done

The free-tier-first architecture is ready for Phase 1 release when:

-   A student can sign in through AI Tathastu or independently.
-   A student can complete onboarding and define goals.
-   A mentor can apply and submit evidence.
-   An authorized admin can approve the mentor.
-   Matching returns explainable eligible recommendations.
-   A student can book without double-booking a mentor.
-   Both participants can join a secure LiveKit room.
-   Chat persists even if realtime delivery fails.
-   Calendar events and reminders use durable backend state.
-   Notifications are retried safely and do not duplicate.
-   A student can complete a human mock interview and view feedback.
-   Private student context is not exposed to mentors by default.
-   No critical Phase 1 workflow depends on an LLM.
-   Provider limits and failure states are documented.
-   Production hosting complies with the selected provider's terms.

------------------------------------------------------------------------

# 22. Official Provider References

Check these before implementation and again before launch because
free-tier terms change.

-   Neon pricing and free limits: https://neon.com/pricing
-   Neon free plan limits: https://neon.com/docs/introduction/pro-plan
-   Vercel Hobby plan: https://vercel.com/docs/plans/hobby
-   Render free services: https://render.com/docs/free
-   LiveKit pricing: https://livekit.io/pricing
-   Supabase pricing: https://supabase.com/pricing
-   Supabase Realtime limits:
    https://supabase.com/docs/guides/realtime/limits
-   Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
-   Firebase pricing / FCM: https://firebase.google.com/pricing
-   Google Calendar API quotas:
    https://developers.google.com/workspace/calendar/api/guides/quota
-   Resend pricing: https://resend.com/pricing
-   Ollama: https://ollama.com/

------------------------------------------------------------------------

# 23. Final Recommendation

Use a modular monolith and keep the stack intentionally small:

**Next.js + TypeScript + Drizzle + Neon + Supabase Realtime + LiveKit +
Cloudflare R2 + Resend + Firebase Cloud Messaging + Google Calendar
API.**

Use a commercially eligible frontend/backend host. Treat Render Free as
a development tool, not the production backbone. Use Ollama locally for
AI experiments. Keep Phase 1 matching deterministic and explainable.

Do not integrate every provider on day one. Build the core
student-to-human-mentor journey first, then add realtime, calendar,
notifications, mock interviews and ecosystem synchronization in that
order.

The system must remain functional if an optional AI provider, calendar
integration, email provider or realtime transport is temporarily
unavailable.
