# MentorMaze --- Complete User Flows & Product Journey

**Product:** MentorMaze\
**Parent ecosystem:** AI Tathastu\
**Document type:** Product workflow specification\
**Scope:** Human mentorship, human-led mock interview practice, platform
administration, and AI Tathastu context integration\
**Current phase:** Phase 1 --- Human-led services\
**Future phase:** Phase 2 --- AI mentorship and AI-powered mock
interviews

------------------------------------------------------------------------

## 1. Product Overview

MentorMaze is a mentorship and interview-practice platform where
students can:

1.  Find and work with verified human mentors.
2.  Book one-to-one or group mentorship sessions.
3.  Practice mock interviews with qualified human interviewers/mentors.
4.  Receive feedback, action items, resources, and progress tracking.
5.  Use their learning and career context from AI Tathastu, when they
    explicitly authorize sharing.

MentorMaze supports two primary student journeys:

-   **Get Mentorship:** career guidance, academic guidance, project
    reviews, skill development, and accountability.
-   **Practice Mock Interviews:** structured technical, HR, behavioral,
    system-design, or mixed interview practice.

The two journeys share identity, profile context, scheduling,
communications, session infrastructure, feedback, and progress records,
but retain distinct service types and outcome measures.

### 1.1 Product principles

-   Human-led services are the Phase 1 product. Do not present AI
    mentorship as available until Phase 2 is implemented.
-   Students may use either service independently or use both.
-   AI Tathastu sign-in is recommended, never mandatory.
-   Google, GitHub, and email authentication remain available.
-   Authentication does not automatically grant access to all AI
    Tathastu data.
-   Context sharing is separate, granular, explicit, and revocable.
-   Only approved and active mentors can receive student bookings.
-   Verification badges must reflect completed verification, not merely
    submitted documents.
-   Recommendations must explain why a mentor or interviewer is
    relevant.
-   Booking and availability operations must prevent double booking.
-   All consequential admin actions must be permission-checked and
    auditable.
-   Functional screens must explain their purpose, current state, and
    next action without requiring a tutorial.

------------------------------------------------------------------------

## 2. User Roles and Permissions

  -----------------------------------------------------------------------
  Role                    Main responsibilities   Access boundaries
  ----------------------- ----------------------- -----------------------
  Guest / Visitor         Explore the platform,   Public content only
                          programs, public mentor 
                          previews, and sign-up   
                          options                 

  Student                 Manage profile,         Own profile, bookings,
                          discover mentors, book  feedback, and permitted
                          sessions, practice      shared data
                          interviews, track       
                          progress                

  Mentor Applicant        Apply to become a       Own application and
                          mentor and submit       submitted documents
                          evidence                

  Approved Mentor         Manage profile,         Assigned mentees and
                          availability, requests, own sessions
                          mentees, sessions,      
                          notes, and impact       

  Admin / Verifier        Review applications,    Only according to
                          verify evidence, manage assigned admin
                          users and platform      permissions
                          operations              

  Support Agent           Handle support requests Minimum data required
                          and disputes            for assigned cases

  Super Admin             Manage platform-wide    Platform-wide
                          settings, roles,        privileged access
                          integrations, policies, 
                          and audit access        

  AI Tathastu             Provide identity and    Only scopes and data
                          authorized profile      categories explicitly
                          context; receive        authorized by the user
                          authorized learning     
                          outcomes                

  System Services         Scheduling,             Service-specific,
                          notifications,          least-privilege access
                          synchronization,        
                          analytics, and audit    
                          events                  
  -----------------------------------------------------------------------

### 2.1 Role separation

A user may be both a student and a mentor, but these capabilities should
be represented as distinct roles or role memberships under one identity.
A user must not gain mentor privileges merely by selecting "Become a
Mentor"; mentor privileges activate only after approval.

Admins should use role-based access control (RBAC), with separate
permissions for verification, user management, session monitoring,
matching configuration, support, billing, and platform settings.

------------------------------------------------------------------------

## 3. Entry, Authentication, and Account Creation

### 3.1 Public visitor flow

1.  Visitor opens the MentorMaze landing page.
2.  Visitor explores mentorship, mock interview practice, mentor
    profiles, programs, and platform information.
3.  Visitor selects **Get Started**, **Explore Mentors**, or **Practice
    Mock Interviews**.
4.  If the requested action requires an account, route to
    authentication.
5.  Preserve the visitor's intended destination after successful
    sign-in.

### 3.2 Authentication options

**Recommended route: Continue with AI Tathastu** - Redirect to AI
Tathastu's approved identity provider. - Authenticate the user through a
secure authorization flow. - Return to MentorMaze with a validated
identity assertion / authorization code. - Link or create the MentorMaze
account using a stable provider subject identifier. - Ask separately
whether the user wants to share profile context. - Display the
categories and purposes requested before consent. - Import only
authorized, necessary data.

**Alternative routes** - Continue with Google. - Continue with GitHub. -
Continue with email (password or passwordless verification, depending on
implementation).

All routes should resolve to one MentorMaze account identity. Avoid
duplicate accounts when the same person later uses another login
provider; account linking must require proof of control of both
identities.

### 3.3 First-time student onboarding

1.  Authenticate.
2.  Select or confirm the account role: Student.
3.  Accept the platform terms and privacy notice.
4.  Complete the minimum required profile fields.
5.  Optionally connect AI Tathastu.
6.  If connected, review context-sharing categories and grant granular
    consent.
7.  Review imported information and correct inaccurate or outdated
    fields.
8.  Choose primary interests:
    -   Career guidance
    -   Academic guidance
    -   Project review
    -   Skill development
    -   Placement preparation
    -   Technical mock interview
    -   HR / behavioral mock interview
    -   System design
9.  Add goals and preferences.
10. Complete onboarding and open the student dashboard.

Do not force users to complete every optional field before exploring the
product. Clearly distinguish required information from optional profile
enrichment.

### 3.4 Returning user flow

1.  Authenticate through any linked sign-in method.
2.  Resolve the existing MentorMaze identity.
3.  Refresh session and authorization state.
4.  Check whether AI Tathastu consent is still active.
5.  Synchronize permitted changes according to the user's preferences.
6.  Open the relevant dashboard and show pending actions.

### 3.5 Account linking and recovery

-   A user can link or unlink supported identity providers after
    re-authentication.
-   Never merge accounts solely because email addresses look similar.
-   Provide a secure account recovery path.
-   If AI Tathastu is unavailable, alternative login methods must
    continue working.
-   If context synchronization fails, retain the last valid local
    context and show sync status; do not block core MentorMaze usage.

------------------------------------------------------------------------

## 4. Student Journey

### 4.1 Student dashboard

The dashboard is the student's central workspace. It should answer:

-   What can I do next?
-   What sessions are coming up?
-   What goals am I working toward?
-   What needs my attention?

Suggested dashboard modules:

1.  Greeting and profile completion.
2.  **Get Mentorship** entry card.
3.  **Practice Mock Interview** entry card.
4.  Upcoming sessions.
5.  Active goals and milestone progress.
6.  Recommended mentors (top three).
7.  Recent feedback and action items.
8.  Notifications and messages.
9.  Context-sync status, if AI Tathastu is connected.

Do not overload the dashboard with every feature. Prioritize the next
action and the user's active commitments.

### 4.2 Student path selection

The student can choose either path at any time:

#### Path A --- Get Mentorship

1.  Select **Get Mentorship**.
2.  Choose mentorship objective:
    -   Career direction
    -   Academic guidance
    -   Project review
    -   Skill development
    -   Placement preparation
    -   Entrepreneurship / product guidance
    -   Other
3.  Review existing profile context.
4.  Add or update the specific goal and describe the challenge.
5.  Set preferences:
    -   Mentor expertise
    -   Preferred language
    -   Session format (one-to-one / group, where available)
    -   Preferred days and time windows
    -   Communication preference
6.  View the top three recommended mentors.
7.  Inspect match explanations.
8.  Open a mentor profile.
9.  Book a session or send a permitted connection request.

#### Path B --- Mock Interview Practice

1.  Select **Practice Mock Interview**.
2.  Choose interview type:
    -   Technical
    -   HR
    -   Behavioral
    -   System Design
    -   Mixed
3.  Select target role / job family.
4.  Choose difficulty or experience level.
5.  Select focus areas (for example, DSA, programming language,
    databases, frontend, backend, system design, communication).
6.  Choose practice format:
    -   Human-led mock interview (Phase 1)
    -   AI-powered mock interview (Phase 2; show as coming soon or omit
        until implemented)
7.  If human-led, view qualified interviewers / mentors or recommended
    options.
8.  Select an available slot.
9.  Review interview settings and confirm booking.
10. Attend the interview.
11. Review structured feedback and next steps.

Mock interview practice is a distinct service from mentorship, even if
the same approved mentor can provide both. Store service type, interview
configuration, rubric, and feedback separately from mentorship records.

### 4.3 Top-three mentor recommendation flow

1.  Collect the student's goal, skill profile, experience, preferences,
    and availability.
2.  Retrieve eligible, approved, active mentors.
3.  Apply hard constraints first:
    -   Mentor is approved and active.
    -   Relevant expertise exists.
    -   Mentor is accepting requests.
    -   Availability is compatible.
    -   No policy or capacity restriction prevents assignment.
4.  Rank eligible mentors using configurable matching factors.
5.  Display the top three recommendations, where three eligible options
    exist.
6.  Explain each recommendation in plain language.

Suggested initial matching dimensions (weights are configurable
hypotheses, not validated facts):

  Factor                                    Initial weight
  --------------------------------------- ----------------
  Career / goal alignment                              25%
  Skill-gap alignment                                  25%
  Domain expertise                                     20%
  Academic / professional relevance                    10%
  Communication and language preference                10%
  Availability compatibility                           10%

Display: - Match score, only if calibrated and meaningful. - Relevant
expertise tags. - Current role and organization, where verified. - Years
/ type of experience, where supported. - Verification status. - Rating
and completed sessions, once enough genuine data exists. - Next
available slot. - "Why this mentor?" explanation. - Report / not
relevant option to improve recommendations.

Do not fabricate match percentages, ratings, experience, or
availability. If confidence is low, label recommendations as suggestions
and ask for more context.

### 4.4 Mentor profile page

The mentor profile should contain:

-   Name, professional photo, and verification status.
-   Current role and organization.
-   Professional summary.
-   Expertise and focus areas.
-   Relevant experience.
-   Mentorship topics and services offered.
-   Languages.
-   Session formats.
-   Availability preview.
-   Ratings and written reviews, where genuine.
-   Completed mentorship sessions / mentees, where privacy-safe.
-   Relevant credentials or links, where verified.
-   Personalized "Why recommended for you?" section.
-   **Book a Session** primary action.
-   **Message Mentor** or **Request Connection**, if enabled.
-   Report profile action.

Clearly distinguish platform verification from endorsement of every
claim or guarantee of outcomes.

### 4.5 Booking a mentorship session

1.  Student selects **Book a Session**.
2.  Choose service type (one-to-one or group, if enabled).
3.  Choose session duration from configured options.
4.  View live availability in the student's timezone.
5.  Select date and slot.
6.  Enter session agenda / question / desired outcome.
7.  Optionally attach relevant project or resume material with explicit
    sharing controls.
8.  Review mentor, service, date, time, timezone, duration, and any fee.
9.  Confirm booking.
10. Server validates slot availability and reserves it atomically.
11. Create booking and notify both parties.
12. Display booking confirmation and calendar options.

If the slot is taken during confirmation: - Do not create a duplicate
booking. - Explain that the slot is no longer available. - Refresh
availability and offer alternatives.

### 4.6 Booking confirmation

Show: - Booking status. - Mentor identity. - Session type. - Date, time,
timezone, and duration. - Agenda. - Meeting access details when
available. - Add to calendar. - Reschedule / cancel actions according to
policy. - Preparation checklist. - Return to dashboard / My Sessions.

### 4.7 My Sessions

Provide filters or tabs: - All - Upcoming - Pending - Completed -
Cancelled - Rescheduled

Each session item should show: - Mentor / interviewer. - Service type. -
Date and time. - Status. - Join action when eligible. - View details. -
Reschedule / cancel where policy permits.

### 4.8 Live mentorship session

Phase 1 meeting experience may use LiveKit or another approved real-time
provider.

Core capabilities: - Camera and microphone controls. - Device
selection. - Screen sharing. - Participant list. - In-session chat. -
Connection quality indicators. - Session timer. - Reconnect handling. -
Host / participant permissions. - Leave / end session controls.

Recording must be off by default unless the product has a clear use
case, lawful basis, explicit notice, and required participant consent.
Make recording status visible to everyone.

### 4.9 Session completion and summary

1.  Session ends.
2.  Booking status changes to completed only after valid completion
    rules are satisfied.
3.  Mentor submits notes and action items.
4.  Student can view the shareable summary.
5.  Mentor shares agreed resources.
6.  Student rates the session and submits feedback.
7.  Student updates goals or marks action items complete.
8.  Mentor and student receive appropriate notifications.
9.  Approved, consented outcomes may sync to AI Tathastu.

Keep private mentor notes separate from student-visible session
summaries. Make visibility explicit before saving.

### 4.10 Student goals and progress

-   Create goals with descriptions and target dates.
-   Break goals into milestones.
-   Link sessions and action items to goals.
-   Track status: Not started, In progress, Blocked, Completed.
-   Record progress updates.
-   Show history and completed milestones.
-   Recommend next actions based on real session outcomes.
-   Allow students to correct or dispute inaccurate progress records.

### 4.11 Student messaging and notifications

-   One-to-one messaging only where a valid relationship or booking
    policy permits.
-   Conversation list with unread counts.
-   Attachments with file type and size restrictions.
-   Report / block controls.
-   Booking, rescheduling, cancellation, reminder, and feedback
    notifications.
-   Notification preferences by channel and category.

------------------------------------------------------------------------

## 5. Mock Interview Practice Journey

### 5.1 Configure practice

Student selects: - Interview type. - Target role. - Difficulty. -
Experience level. - Topics / competencies. - Preferred language. -
Session duration. - Human interviewer (Phase 1).

### 5.2 Match an interviewer

1.  Identify approved mentors/interviewers who offer mock interviews.
2.  Filter by role, domain, interview type, language, availability, and
    capacity.
3.  Rank suitable options.
4.  Explain why the interviewer is suitable.
5.  Show profile, verification, relevant experience, and availability.
6.  Student selects and books.

### 5.3 Before the interview

-   Show interview configuration and expected structure.
-   Let the student review the selected role and topics.
-   Provide optional resume / job description upload with consent.
-   Check camera, microphone, and network.
-   Explain whether notes or recordings will be created.
-   Display cancellation and rescheduling rules.

### 5.4 Live mock interview

-   Interviewer-led structured rounds.
-   Configurable question / competency rubric.
-   Timer and round progression.
-   Video, audio, and screen sharing where appropriate.
-   Interviewer notes visible only according to defined permissions.
-   Technical whiteboard / code editor can be a later enhancement; do
    not imply it exists until implemented.

### 5.5 Interview feedback

Provide a structured report: - Overall assessment (avoid false
precision). - Technical knowledge. - Problem solving. - Communication. -
Role-specific competencies. - Strengths. - Areas to improve. -
Question-level notes, where appropriate. - Recommended practice
topics. - Action plan and next practice suggestion.

Scores must be tied to a disclosed rubric. Do not compare students
unfairly or present an interview score as a guaranteed hiring outcome.

### 5.6 Mock interview history

Student can review: - Upcoming interviews. - Completed interviews. -
Interview type and role. - Feedback reports. - Progress across
attempts. - Repeated skill gaps. - Improvement over time, using
comparable rubrics.

------------------------------------------------------------------------

## 6. Mentor Application and Onboarding Journey

### 6.1 Become a Mentor

1.  User selects **Become a Mentor**.
2.  Review mentor expectations, code of conduct, and eligibility.
3.  Sign in or create an account.
4.  Select mentor role / service categories.
5.  Complete mentor application.

### 6.2 Mentor profile creation

Collect: - Legal / display name. - Profile photo. - Current role and
organization. - Professional summary. - Work / academic experience. -
Expertise and skills. - Topics offered. - Mentorship focus. - Mock
interview categories offered. - Languages. - Preferred session format. -
Availability preferences. - Relevant professional links. - Optional
resume / credentials.

### 6.3 Verification submission

Depending on policy, collect: - Identity evidence. - Professional or
academic evidence. - Employment proof / organization link. - Resume /
CV. - Credential evidence relevant to claimed expertise.

Data collection must be proportionate. Define retention, access, and
deletion policies for identity documents. Do not expose raw verification
documents on public profiles.

### 6.4 Application review states

Recommended states: - Draft - Submitted - Under Review - More
Information Required - Approved - Rejected - Suspended - Withdrawn

The mentor sees: - Current application status. - Submitted date. -
Missing / requested documents. - Admin message and next action. - Review
history where appropriate.

### 6.5 Approval activation

1.  Admin reviews application and evidence.
2.  Admin records decision and reason.
3.  If approved, activate mentor capabilities.
4.  Generate verified status only after required checks pass.
5.  Mentor completes availability and service setup.
6.  Mentor becomes eligible for matching and booking.

Approval should not be granted automatically because a user is an AI
Tathastu teacher, alumni, faculty member, or employee. Their identity
and mentoring eligibility must still follow MentorMaze policy. Where an
upstream organization has verified attributes, consume only verifiable
claims with clear provenance and authorization.

------------------------------------------------------------------------

## 7. Mentor Journey

### 7.1 Mentor dashboard

Show: - Pending session requests. - Today's sessions. - Upcoming
sessions. - Total completed sessions. - Active mentees. - Rating, if
statistically meaningful. - Availability status. - Unread messages. -
Action items requiring attention.

### 7.2 Session request management

For each request, show: - Student name and limited relevant profile
context. - Requested service type. - Student goal / agenda. - Proposed
slot and duration. - Any shared documents. - Accept / decline / propose
another time.

Rules: - Mentor cannot accept if the slot is no longer available. -
Decline may require a reason according to policy. - Reschedule must
generate a new slot proposal and student confirmation. - Never expose
student context that the student has not authorized.

### 7.3 Availability management

Mentor can: - Set weekly recurring hours. - Add date-specific
availability. - Block dates / time ranges. - Configure session durations
and buffers. - Set maximum sessions per day / week. - Set timezone. -
Pause new requests. - Sync an external calendar only with explicit
permission and supported integration.

Booking service must revalidate availability at confirmation time.

### 7.4 Prepare for a session

-   Review the student's shared profile context.
-   Review the student's agenda and goals.
-   Review prior shared session summaries if permitted.
-   Prepare resources.
-   Confirm session format and equipment.
-   Avoid access to private student data not needed for the session.

### 7.5 Conduct a live session

-   Join session room.
-   Verify participants.
-   Use video / audio / screen sharing / chat.
-   Follow session duration and conduct guidelines.
-   End session and record completion status.
-   Report technical or safety issues.

### 7.6 Session summary

Mentor submits: - Session topics covered. - Key observations. -
Student-visible feedback. - Action items with due dates. - Resources
shared. - Recommended next session, if needed.

Separate private notes from student-visible notes. The interface must
label each field's visibility.

### 7.7 My Mentees

Mentor can view: - Active mentees. - Session history. - Student-shared
goals. - Agreed action items. - Upcoming sessions. - Relevant shared
documents. - Communication history within policy.

Mentors must not be able to browse arbitrary student profiles or access
unrelated academic records.

### 7.8 Mentor impact and analytics

Show: - Sessions completed. - Active mentees. - Session attendance /
completion. - Feedback and rating distribution. - Repeat mentorship
rate. - Upcoming commitments. - Trends over time.

Do not reward quantity alone. Include quality, reliability, and student
feedback; guard against rating manipulation and small-sample
overinterpretation.

### 7.9 Mentor profile and settings

-   Edit public profile.
-   Manage expertise and services.
-   Verification status.
-   Availability.
-   Notifications.
-   Privacy and security.
-   Payout details, if paid services are enabled.
-   Account settings.
-   Request account deactivation.

------------------------------------------------------------------------

## 8. Admin and Operations Journey

### 8.1 Admin login

-   Secure authentication.
-   MFA for privileged roles.
-   Role-based landing page.
-   Session timeout and privileged action re-authentication where
    appropriate.

### 8.2 Admin dashboard

Overview: - Total students. - Approved mentors. - Pending mentor
applications. - Active / upcoming sessions. - Completed sessions. -
Cancellation / no-show rates. - Mock interview activity. - Support
queue. - Matching health and platform trends.

All metrics need definitions, date ranges, and source data. Avoid vanity
metrics without operational meaning.

### 8.3 Mentor verification queue

1.  View pending applications.
2.  Filter by date, status, expertise, and missing evidence.
3.  Open application.
4.  Inspect identity / professional evidence through restricted access.
5.  Compare submitted claims with evidence.
6.  Request more information, approve, or reject.
7.  Enter a reason and internal notes.
8.  Record reviewer identity and timestamp.
9.  Notify applicant.
10. Keep an auditable decision history.

Use dual review for high-risk or disputed cases if required by policy.

### 8.4 User management

Admins with permission can: - Search students and mentors. - View
account status and role memberships. - Suspend / reactivate accounts. -
Resolve duplicate-account cases. - Handle user reports. - Review consent
and integration status where necessary. - Trigger account recovery
support without viewing passwords or secrets.

Sensitive changes must be logged with actor, target, timestamp, reason,
and before/after state.

### 8.5 Session monitoring

Show: - Live sessions. - Upcoming sessions. - Completed sessions. -
Cancelled / rescheduled sessions. - No-shows and reported technical
issues.

Admin monitoring must not imply unrestricted access to private video,
audio, or private messages. Access to session content requires a defined
support, safety, or dispute purpose and appropriate authorization.

### 8.6 Matching management

Admins can: - Configure matching factors and weights. - Set eligibility
constraints. - Configure service-specific matching. - Inspect
recommendation explanations. - Review unmatched student demand. -
Identify mentor capacity shortages. - Manually reassign a student when
justified. - Record reason for override. - Version matching
configurations. - Compare outcomes across versions.

A manual override must not silently erase the algorithmic recommendation
or history.

### 8.7 Reports and analytics

Possible reports: - Student activation and retention. - Mentor
application funnel. - Verification turnaround time. - Booking
conversion. - Session completion. - Cancellation and no-show rates. -
Mock interview usage. - Feedback trends. - Matching acceptance and
outcomes. - Service demand by domain / language / time.

Use aggregated data by default. Restrict access to identifiable data.

### 8.8 Content and resource management

-   Create / edit / archive resources.
-   Categorize by topic and skill.
-   Publish programs and announcements.
-   Assign visibility and publication dates.
-   Review uploaded resources for safety, copyright, and quality.
-   Track resource engagement without exposing unnecessary personal
    data.

### 8.9 Support and disputes

Case categories: - Booking issue. - Reschedule / cancellation. -
No-show. - Mentor conduct. - Student conduct. - Payment / refund, if
applicable. - Verification dispute. - Technical meeting issue. - Privacy
/ data-sharing request.

Workflow: 1. User opens ticket. 2. System assigns case ID and status. 3.
Support agent reviews minimum necessary evidence. 4. Request additional
information if needed. 5. Escalate serious conduct, safety, or privacy
cases. 6. Record decision and resolution. 7. Notify involved parties. 8.
Close or reopen with an audit trail.

### 8.10 Platform settings

-   Roles and permissions.
-   Verification policy.
-   Session types and durations.
-   Cancellation policy.
-   Notification templates.
-   Matching configuration.
-   Integration settings.
-   Data retention.
-   Consent scopes.
-   Security settings.
-   Feature flags.
-   Localization and timezone defaults.

------------------------------------------------------------------------

## 9. AI Tathastu ↔ MentorMaze Two-Way Context Integration

### 9.1 Integration objective

Create a secure, consent-based context bridge between AI Tathastu and
MentorMaze. The platforms must not directly depend on each other's
internal databases. Use versioned APIs and events.

### 9.2 AI Tathastu → MentorMaze

Potential data categories:

  -----------------------------------------------------------------------
  Data category           Example fields          MentorMaze purpose
  ----------------------- ----------------------- -----------------------
  Academic profile        Institution, program,   Academic context and
                          branch, semester, CGPA  mentor matching
                          if authorized           

  Skills                  Skill names,            Skill-gap analysis and
                          proficiency, evidence,  mentor recommendations
                          last updated            

  Projects                Project title,          Project review and
                          description, role,      relevant mentorship
                          technologies, links     

  Career goals            Target role, domain,    Personalized matching
                          interests, target date  

  Learning activity       Topics studied,         Contextual
                          learning milestones,    recommendations
                          progress                

  Resume                  Resume metadata or      Interview preparation,
                          user-selected document  only with explicit
                                                  permission

  Credentials             Certificates and        Relevant profile
                          achievements            enrichment
  -----------------------------------------------------------------------

Do not import every conversation, file, or private record by default.
Prefer user-selected, structured, purpose-limited data.

### 9.3 MentorMaze → AI Tathastu

Potential data categories:

  -----------------------------------------------------------------------
  Data category           Example fields          AI Tathastu purpose
  ----------------------- ----------------------- -----------------------
  Mentorship history      Session date, topic,    Learning context
                          status                  

  Student-approved        Strengths, improvement  Personalized learning
  feedback                areas                   

  Skill gaps              Identified skills and   Learning
                          evidence                recommendations

  Mock interview outcomes Rubric scores,          Interview preparation
                          feedback, target role   

  Action items            Agreed tasks and        Follow-through
                          completion state        

  Resources               Shared resource IDs and Learning continuity
                          topics                  

  Milestones              Goal progress and       Career / learning
                          completion              roadmap
  -----------------------------------------------------------------------

Private mentor notes, confidential disputes, identity documents, payment
details, and private messages must not sync by default.

### 9.4 Consent and permissions

Provide a dedicated **Connected Apps & Data Sharing** screen.

For each category show: - What data is requested. - Which platform sends
it. - Which platform receives it. - Purpose. - Whether it is optional or
required. - Last synchronization time. - Permission status. - Revoke /
pause controls.

Consent should be granular. Example: - Academic profile: Share / Do not
share. - Skills and projects: Share / Do not share. - Career goals:
Share / Do not share. - Resume: Share selected document / Do not
share. - Mentorship outcomes: Share / Do not share. - Mock interview
outcomes: Share / Do not share.

Revocation stops future access and synchronization. Define how
previously synchronized data is retained, deleted, or disconnected
according to policy and applicable law; communicate this clearly.

### 9.5 Technical flow

1.  User chooses **Continue with AI Tathastu**.
2.  AI Tathastu authenticates the user through an approved identity
    protocol.
3.  MentorMaze validates the identity response.
4.  MentorMaze requests specific context scopes separately.
5.  User reviews and grants or declines each category.
6.  Context Integration API retrieves authorized structured data.
7.  MentorMaze validates, maps, timestamps, and stores the permitted
    context.
8.  MentorMaze uses context for matching and personalization.
9.  MentorMaze produces selected outcomes.
10. User-authorized outcome events are sent to AI Tathastu.
11. Both platforms record synchronization status and provenance.

### 9.6 Reliability and security requirements

-   OpenID Connect for identity where supported.
-   OAuth 2.0 authorization-code flow with PKCE for delegated access
    where applicable.
-   Short-lived access tokens and secure refresh-token handling.
-   TLS in transit and encryption at rest.
-   Signed webhooks / authenticated event delivery.
-   Idempotency keys and deduplication.
-   Retry with backoff and dead-letter handling.
-   Event versioning and schema validation.
-   Data provenance and last-updated timestamps.
-   Audit logs for access, consent, sync, and revocation.
-   Rate limits and abuse detection.
-   Least-privilege service credentials.
-   No secrets in client-side code or logs.

### 9.7 Conflict handling

If a field changes in both platforms: - Define a source of truth for
each field. - Prefer explicit user edits over inferred updates. - Store
source, timestamp, and version. - Do not silently overwrite conflicting
values. - Present a review / resolution option for important profile
fields.

------------------------------------------------------------------------

## 10. Shared Notifications and Communication

Trigger notifications for: - Account creation and security events. -
Mentor application submission and decision. - New session request. -
Request accepted / declined / rescheduled. - Booking confirmation. -
Upcoming session reminders. - Cancellation. - Session completion. -
Feedback availability. - New message. - Goal or action-item reminder. -
Context-sync success, failure, or permission expiry. - Support ticket
updates.

Users control non-essential notification categories. Security and
critical service notifications may be mandatory where justified.

------------------------------------------------------------------------

## 11. Core Status Models

### 11.1 Mentor application

`Draft → Submitted → Under Review → Approved`

Alternative transitions: - Under Review → More Information Required →
Under Review - Under Review → Rejected - Draft / Submitted → Withdrawn -
Approved → Suspended (by authorized admin, with reason)

### 11.2 Booking

`Requested → Accepted → Confirmed → In Progress → Completed`

Alternative states: - Declined - Cancelled by Student - Cancelled by
Mentor - Reschedule Proposed - Rescheduled - No-show - Disputed

Define which transitions are automatic and which require actor
confirmation.

### 11.3 Support ticket

`Open → Assigned → In Progress → Waiting for User → Resolved → Closed`

Allow reopening according to policy.

### 11.4 Context synchronization

`Not Connected → Authorization Pending → Connected → Syncing → Synced`

Exception states: - Permission Denied - Permission Revoked - Token
Expired - Sync Failed - Conflict Needs Review - Disconnected

------------------------------------------------------------------------

## 12. Cross-Platform Navigation / Information Architecture

### 12.1 Public navigation

-   Home
-   Programs
-   Mentors
-   Mock Interviews
-   Resources
-   About
-   Contact
-   Sign In / Get Started

### 12.2 Student navigation

-   Home
-   Find Mentors
-   Mock Interviews
-   My Sessions
-   Goals & Progress
-   Messages
-   Resources
-   Profile
-   Connected Apps & Data Sharing
-   Settings

### 12.3 Mentor navigation

-   Dashboard
-   Session Requests
-   Calendar / Availability
-   My Mentees
-   My Sessions
-   Messages
-   Resources
-   Impact & Analytics
-   Profile & Verification
-   Payouts (only if applicable)
-   Settings

### 12.4 Admin navigation

-   Dashboard
-   Mentor Applications
-   Verification
-   Students
-   Mentors
-   Sessions
-   Matching Management
-   Mock Interview Management
-   Reports & Analytics
-   Content & Programs
-   Support & Disputes
-   Integrations
-   Roles & Permissions
-   Audit Logs
-   Platform Settings

------------------------------------------------------------------------

## 13. Important Edge Cases and Failure Paths

  -----------------------------------------------------------------------
  Scenario                            Expected behavior
  ----------------------------------- -----------------------------------
  AI Tathastu unavailable             Allow alternative sign-in and core
                                      MentorMaze use

  User declines context sharing       Continue with manual onboarding

  Context permission revoked          Stop future sync and show
                                      disconnected status

  Duplicate identity provider account Require secure account-linking flow

  Mentor application rejected         Show reason / next steps according
                                      to policy

  Mentor suspended with future        Flag affected bookings and initiate
  bookings                            reassignment / cancellation
                                      workflow

  Slot booked by another user         Reject stale booking and refresh
                                      slots

  Mentor does not join                Apply no-show policy and provide
                                      support path

  Student does not join               Apply no-show policy and provide
                                      support path

  Meeting connection fails            Provide reconnect and support
                                      options; preserve booking state

  Session ends unexpectedly           Do not mark completed until
                                      completion rules are met

  Feedback not submitted              Keep session completed; show
                                      feedback pending

  Mentor has no matching availability Show alternatives or allow
                                      preference adjustment

  No three eligible mentors           Show fewer results; never fabricate
                                      recommendations

  Matching confidence is low          Explain uncertainty and request
                                      more profile information

  Sync event delivered twice          Deduplicate using event ID /
                                      idempotency key

  Data conflicts across platforms     Apply field ownership rules or ask
                                      user to resolve

  Admin lacks permission              Deny action and record security
                                      event

  Dispute involves private notes      Restrict access to authorized case
                                      handlers

  User requests account deletion      Follow verified deletion and
                                      retention workflow
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 14. Product Analytics and Success Measures

### Student funnel

-   Landing page → sign-up conversion.
-   Onboarding completion.
-   AI Tathastu connection and consent rate.
-   Mentor recommendation engagement.
-   Profile views → booking conversion.
-   Mock interview configuration → booking conversion.
-   Session attendance and completion.
-   Repeat usage.
-   Goal / action-item completion.

### Mentor funnel

-   Application start and submission.
-   Verification turnaround time.
-   Approval rate and rejection reasons.
-   Availability setup completion.
-   Request response time.
-   Acceptance rate.
-   Session completion and no-show rate.
-   Student feedback.

### Admin operations

-   Pending verification queue age.
-   Dispute resolution time.
-   Support backlog.
-   Matching coverage.
-   Unmatched demand.
-   Manual override frequency.
-   Audit completeness.

### Integration health

-   Authorization success rate.
-   Context import success rate.
-   Event delivery success rate.
-   Sync latency.
-   Revocation propagation time.
-   Conflict rate.
-   Failed sync recovery rate.

Use privacy-preserving aggregation and avoid exposing individual student
performance to users who do not need it.

------------------------------------------------------------------------

## 15. Phase-wise Delivery

### Phase 1 --- Human Mentorship + Human Mock Interviews

Implement: - Public website and authentication. - Student onboarding and
dashboard. - Mentor application, profile, verification, and approval. -
Top-three mentor recommendations and explainability. - Mentor profile
and booking. - Availability and calendar management. - Human-led
one-to-one / group mentorship as supported. - Human-led mock interview
configuration and booking. - Live sessions using LiveKit or an
equivalent provider. - In-session chat and screen sharing. - Session
summaries, feedback, action items, goals, and progress. - Student,
mentor, and admin dashboards. - Messaging, notifications, support, and
audit logs. - AI Tathastu SSO and consent-based context integration, if
both systems and contracts are ready.

### Phase 2 --- AI Mentorship and AI Mock Interviews

Add: - AI mentor / assistant experiences. - AI-led mock interview
sessions. - Automated interview analysis and structured feedback. -
Personalized AI learning plans. - Context-aware conversational
guidance. - Human-to-AI handoff and escalation. - Unified progress
across human and AI services.

AI features should be introduced as distinct service modes with clear
disclosure. Do not represent AI-generated feedback as human evaluation.

------------------------------------------------------------------------

## 16. Acceptance Criteria --- End-to-End

The first production-ready release should satisfy these conditions:

1.  A student can register through AI Tathastu or an alternative
    provider.
2.  AI Tathastu context is imported only after explicit category-level
    authorization.
3.  A student can complete onboarding without connecting AI Tathastu.
4.  A student can select mentorship or mock interview practice
    independently.
5.  Only approved mentors appear as bookable mentors.
6.  Recommendations are based on eligible mentors and explain their
    relevance.
7.  The system can show fewer than three recommendations when fewer
    valid matches exist.
8.  Students can inspect a mentor profile before booking.
9.  Booking confirmation prevents double booking.
10. Mentors can manage requests and availability.
11. Students and mentors can attend live sessions with required
    controls.
12. Session completion creates the correct summary / feedback workflow.
13. Students can track goals and progress.
14. Admin decisions and privileged actions are auditable.
15. Mentor and student data are protected by role-based access.
16. Users can inspect, pause, and revoke AI Tathastu context sharing.
17. MentorMaze can send explicitly authorized outcomes back to AI
    Tathastu.
18. Sync failures do not corrupt records or block core services.
19. Human-led and AI-led service types are clearly distinguished.
20. Phase 1 screens do not expose unimplemented Phase 2 AI functionality
    as available.

------------------------------------------------------------------------

## 17. Recommended Build Order

1.  Identity, roles, permissions, and account linking.
2.  Student onboarding and profile.
3.  Mentor application, verification, and admin approval.
4.  Mentor availability and booking engine.
5.  Mentor discovery and explainable top-three matching.
6.  Mentor profile and booking experience.
7.  Student / mentor session workspaces.
8.  Live meeting, chat, and screen sharing.
9.  Human mock interview workflow and feedback rubric.
10. Goals, action items, progress, and analytics.
11. Admin operations, support, and audit logs.
12. AI Tathastu context bridge and two-way sync.
13. Security, privacy, accessibility, performance, and end-to-end
    testing.

**Implementation rule:** Build the shared identity, permission, booking,
and event foundations before duplicating workflows across student,
mentor, and admin interfaces. This reduces rework and keeps both
mentorship and mock interview services consistent.
