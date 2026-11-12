# MentorMaze --- Intelligence Layers & AI System Architecture

**Product:** MentorMaze\
**Ecosystem:** AI Tathastu\
**Document type:** Product + technical architecture specification\
**Scope:** Intelligence architecture for student guidance, mentor
matching, mock interview practice, mentor support, platform operations,
and two-way context exchange\
**Delivery strategy:** Rules-first, explainable intelligence in Phase 1;
advanced AI capabilities in later phases

------------------------------------------------------------------------

## 1. Executive Summary

MentorMaze should not be designed as a collection of disconnected AI
features. It should operate as a coordinated intelligence system that
converts reliable user context and real platform activity into useful
decisions.

The intelligence system has six core responsibilities:

1.  **Understand the student:** Build a current, evidence-backed picture
    of skills, goals, projects, experience, preferences, and progress.
2.  **Understand the mentor:** Represent verified expertise, experience,
    mentoring services, availability, communication preferences, and
    demonstrated outcomes.
3.  **Match intelligently:** Recommend suitable mentors and interviewers
    using eligibility constraints, relevance, availability, and
    explainable ranking.
4.  **Guide action:** Convert goals and session outcomes into concrete
    next steps, resources, and progress signals.
5.  **Improve practice:** Structure human-led mock interviews and, in a
    later phase, provide AI-led practice and feedback.
6.  **Learn responsibly:** Use consented outcomes and aggregate quality
    signals to improve recommendations without exposing private data or
    making unsupported claims.

The system must distinguish **known facts**, **user-provided claims**,
**inferred signals**, and **AI-generated suggestions**. These are not
interchangeable.

### Core architecture principle

> Deterministic systems should control permissions, eligibility,
> booking, payments, and state transitions. AI should assist with
> interpretation, explanation, summarization, and recommendations---but
> must not bypass those controls.

------------------------------------------------------------------------

## 2. Intelligence Architecture at a Glance

``` text
                    AI TATHASTU ECOSYSTEM
             Identity + Authorized User Context
                             |
                    Consent & Context Gateway
                             |
                             v
+----------------------------------------------------------------+
|                         MENTORMAZE                              |
|                                                                |
|  LAYER 1   Identity, Consent & Permission Intelligence          |
|      |                                                         |
|  LAYER 2   Data Ingestion, Validation & Provenance              |
|      |                                                         |
|  LAYER 3   Unified Student / Mentor / Opportunity Profiles      |
|      |                                                         |
|  LAYER 4   Skill, Goal & Career Understanding                   |
|      |                                                         |
|  LAYER 5   Matching, Ranking & Recommendation                   |
|      |                                                         |
|  LAYER 6   Mentorship & Mock Interview Intelligence              |
|      |                                                         |
|  LAYER 7   Progress, Feedback & Outcome Intelligence             |
|      |                                                         |
|  LAYER 8   Conversational & Agent Orchestration                   |
|      |                                                         |
|  LAYER 9   Admin, Quality, Risk & Platform Intelligence          |
|      |                                                         |
|  LAYER 10  Evaluation, Learning & Optimization                   |
|                                                                |
+----------------------------------------------------------------+
                             |
                 Auditing, Monitoring & Governance
```

These are logical layers, not necessarily ten separately deployed
microservices. Start with clear modules and stable interfaces. Split
services only when scale, reliability, security boundaries, or team
ownership justify it.

------------------------------------------------------------------------

## 3. Layer 1 --- Identity, Consent & Permission Intelligence

### Purpose

Establish who the user is, what role they have, which data they control,
and what MentorMaze is permitted to do with that data.

### Inputs

-   MentorMaze account identity.
-   AI Tathastu identity assertion, when used.
-   Linked Google / GitHub identity.
-   Role memberships: student, mentor, admin, support.
-   Consent records and authorized scopes.
-   Account status and security events.

### Capabilities

-   Identity resolution across connected platforms.
-   Secure account linking.
-   Role and permission checks.
-   Consent capture and versioning.
-   Scope-specific data access.
-   Consent revocation and propagation.
-   Session and token validation.

### Key rules

-   AI Tathastu login is recommended, not mandatory.
-   Authentication is not consent to import all data.
-   A user may authenticate through AI Tathastu but decline context
    sharing.
-   Each data category must have a defined purpose and permission.
-   A revoked permission must stop future access and synchronization.
-   Admin and mentor roles must not be inferred from a user's profile
    text.

### Outputs

-   Validated user identity.
-   Active role permissions.
-   Authorized data scopes.
-   Consent status.
-   Audit events.

### Failure behavior

If AI Tathastu is unavailable, users must still be able to use
alternative authentication. If consent cannot be verified, do not import
or export the affected data.

------------------------------------------------------------------------

## 4. Layer 2 --- Data Ingestion, Validation & Provenance

### Purpose

Convert incoming information into structured, reliable records while
preserving where each value came from.

### Data sources

  -----------------------------------------------------------------------
  Source                  Example                 Trust treatment
  ----------------------- ----------------------- -----------------------
  Student-entered profile Goals, preferred role,  User-provided; may need
                          languages               confirmation

  Resume                  Skills, education,      Extracted claim; verify
                          experience              or confirm

  Project records         Technologies, links,    User-provided; evidence
                          contribution            may be checked

  AI Tathastu context     Academic profile,       Authorized upstream
                          learning history        data with provenance

  Mentor application      Experience, expertise,  Applicant claim until
                          credentials             verified

  Admin verification      Approved identity /     Verified only within
                          credentials             the scope of the check

  Session outcomes        Feedback, action items, Platform event or
                          attendance              human-authored record

  Mock interview rubric   Competency observations Human evaluation in
                          and ratings             Phase 1

  Platform activity       Bookings,               System-generated event
                          cancellations,          
                          completion              
  -----------------------------------------------------------------------

### Ingestion pipeline

1.  Receive data through an authenticated API, user upload, or platform
    event.
2.  Validate schema and required fields.
3.  Check authorization and permitted purpose.
4.  Normalize formats, labels, dates, and identifiers.
5.  Detect duplicates and conflicting values.
6.  Attach source, timestamp, confidence, and verification status.
7.  Store structured records.
8.  Send eligible records to downstream intelligence modules.

### Provenance model

Every important profile attribute should carry:

-   `value`
-   `source`
-   `source_record_id`
-   `observed_at`
-   `updated_at`
-   `verification_status`
-   `confidence` where an actual confidence estimate exists
-   `consent_scope` where externally sourced
-   `visibility`
-   `expiry_or_review_date` where relevant

Do not assign arbitrary confidence values merely to make a record look
intelligent.

### Data quality checks

-   Missing or malformed fields.
-   Stale information.
-   Conflicting skill levels.
-   Duplicate projects.
-   Unverifiable mentor credentials.
-   Invalid or inaccessible portfolio links.
-   Inconsistent dates and experience durations.
-   Unsupported claims.

### Outputs

A validated, traceable data foundation for all later layers.

------------------------------------------------------------------------

## 5. Layer 3 --- Unified Student, Mentor & Opportunity Profiles

### 5.1 Student intelligence profile

The student profile should represent the student's current direction,
not just a static resume.

Suggested dimensions:

  -----------------------------------------------------------------------
  Dimension                           Information
  ----------------------------------- -----------------------------------
  Academic context                    Institution, program, branch,
                                      semester, academic interests

  Career direction                    Target role, domains, preferred
                                      industries

  Skills                              Skill, evidence, level, recency,
                                      confidence

  Projects                            Project, contribution, stack,
                                      outcome, links

  Experience                          Internship, work, volunteering,
                                      leadership

  Learning                            Topics studied, milestones,
                                      resources completed

  Goals                               Short-term and long-term objectives

  Skill gaps                          Target competency versus current
                                      evidence

  Preferences                         Language, session format,
                                      availability

  Readiness                           Role-specific evidence and practice
                                      history

  Constraints                         Time, location / timezone,
                                      accessibility preferences
  -----------------------------------------------------------------------

A student's academic score, institution, or background must not be
treated as a complete measure of ability.

### 5.2 Mentor intelligence profile

Represent mentors by what they can credibly help with.

-   Verified identity status.
-   Current role and organization.
-   Relevant experience.
-   Domain expertise.
-   Skills and proficiency evidence.
-   Mentorship topics.
-   Mock interview categories.
-   Languages.
-   Session formats.
-   Availability and capacity.
-   Student feedback and sample size.
-   Session completion and reliability.
-   Profile freshness.

Separate: - **Claimed expertise** - **Evidence-supported expertise** -
**Admin-verified credentials** - **Observed platform performance**

### 5.3 Opportunity profile

A mentorship request or mock interview requirement should also be
structured.

Fields: - Service type. - Student goal. - Target role / domain. -
Required competencies. - Preferred mentor attributes. - Language. -
Session format. - Time window. - Urgency, if user supplied. - Required
preparation material. - Constraints.

### Outputs

Machine-readable student, mentor, and opportunity representations that
can be used by matching, guidance, and analytics systems.

------------------------------------------------------------------------

## 6. Layer 4 --- Skill, Goal & Career Understanding

### Purpose

Interpret profile evidence to identify what a student knows, what they
want to achieve, and what may be missing.

### 6.1 Skill taxonomy

Maintain a controlled skill taxonomy with categories such as:

-   Programming languages.
-   Data structures and algorithms.
-   Web development.
-   Mobile development.
-   Databases.
-   Cloud and DevOps.
-   AI / ML and data science.
-   Cybersecurity.
-   Product and design.
-   Communication.
-   Leadership.
-   Domain-specific knowledge.

Each skill should have a canonical ID, aliases, parent category, and
relevant role mappings.

### 6.2 Skill evidence model

A skill should not be inferred from a keyword alone.

Evidence may include: - Student self-assessment. - Resume mention. -
Project implementation. - Code repository. - Certificate. - Course
completion. - Mentor observation. - Mock interview performance.

Store the evidence type and date. A GitHub repository can support a
claim that a skill was used; it does not automatically prove mastery.

### 6.3 Skill-level representation

Use a transparent scale, for example:

1.  Familiarity --- recognizes concepts.
2.  Beginner --- can complete guided tasks.
3.  Working --- can complete common tasks independently.
4.  Proficient --- can solve varied problems and explain trade-offs.
5.  Advanced --- can design, optimize, and review complex work.

These labels require clear rubrics. Do not assign a level from an LLM's
unverified guess.

### 6.4 Goal decomposition

Convert a broad goal into a measurable path.

Example:

``` text
Goal: Prepare for a backend developer role
  ├── Core programming
  ├── Data structures and algorithms
  ├── API design
  ├── Database fundamentals
  ├── Authentication and security
  ├── Testing and debugging
  ├── Deployment
  └── Interview practice
```

For each goal: - Define target outcome. - Identify required
competencies. - Compare with available evidence. - Identify gaps. -
Prioritize gaps. - Suggest a mentor or practice activity. - Track
milestones and review dates.

### Outputs

-   Skill map.
-   Evidence-backed skill profile.
-   Goal graph.
-   Potential skill gaps.
-   Role-specific preparation requirements.
-   Questions for the student when data is insufficient.

------------------------------------------------------------------------

## 7. Layer 5 --- Intelligent Mentor Matching & Recommendations

### Purpose

Select the most relevant eligible mentors for each student and explain
the recommendation.

### 7.1 Matching pipeline

``` text
Student Profile + Goal
          |
          v
Eligible Mentor Retrieval
          |
          v
Hard Constraint Filtering
          |
          v
Feature Comparison
          |
          v
Ranking
          |
          v
Availability Check
          |
          v
Top 3 Recommendations
          |
          v
Explanation + Student Choice
```

### 7.2 Hard constraints

Apply these before scoring:

-   Mentor is approved and active.
-   Mentor offers the requested service.
-   Relevant expertise exists.
-   Mentor is accepting bookings.
-   No suspension or capacity restriction applies.
-   Required language / format constraints are satisfied.
-   Availability can be checked.
-   Any safeguarding or policy restrictions are satisfied.

A high score must never override an eligibility failure.

### 7.3 Initial ranking model

Use a transparent weighted score as a starting hypothesis:

  Matching factor                         Initial weight
  ------------------------------------- ----------------
  Goal and career alignment                          25%
  Skill-gap alignment                                25%
  Domain expertise                                   20%
  Experience relevance                               10%
  Language / communication preference                10%
  Availability compatibility                         10%

Formula:

``` text
match_score =
    0.25 * goal_alignment
  + 0.25 * skill_gap_alignment
  + 0.20 * domain_expertise
  + 0.10 * experience_relevance
  + 0.10 * preference_alignment
  + 0.10 * availability_compatibility
```

Normalize each factor to a documented scale before combining. These
weights are initial product hypotheses; calibrate them with real
booking, satisfaction, and outcome data.

### 7.4 Recommendation explanations

Each result should answer:

-   Why is this mentor relevant?
-   Which of the student's goals align?
-   Which skills or gaps does the mentor cover?
-   What relevant experience is evidenced?
-   When are they available?
-   What should the student discuss in the first session?

Example:

> Recommended because this mentor has verified backend engineering
> experience, offers API and database guidance, and has availability
> matching your selected schedule.

Do not display a match percentage until it has been calibrated and
validated. A numerical score can create false precision.

### 7.5 Top-three behavior

-   Return up to three eligible recommendations.
-   Return fewer than three when fewer valid mentors exist.
-   Never invent profiles or availability.
-   Offer filters or a request to broaden preferences if no suitable
    mentor exists.
-   Allow students to dismiss or report irrelevant recommendations.
-   Store recommendation version and explanation for evaluation.

### 7.6 Feedback loop

Use explicit and behavioral signals carefully:

-   Profile opened.
-   Mentor saved.
-   Booking started.
-   Booking completed.
-   Request accepted / declined.
-   Session completed.
-   Student feedback.
-   Repeat booking.
-   Goal relevance feedback.

A click is not proof of a successful match. Optimize for relevant,
completed, high-quality mentorship---not clicks alone.

------------------------------------------------------------------------

## 8. Layer 6 --- Mentorship Intelligence

### Purpose

Help students and mentors turn each human session into a structured,
continuous learning process.

### Before a session

Generate a preparation brief from authorized information:

-   Student's stated goal.
-   Relevant skills and projects.
-   Previous student-visible session summaries.
-   Open action items.
-   Questions the student wants answered.
-   Suggested agenda.

The student should be able to edit the brief before sharing it.

### During a session --- Phase 1

Human mentor leads the session. Platform intelligence can provide: -
Agenda display. - Shared notes. - Goal context. - Session timer. -
Action-item capture. - Resource sharing.

Do not silently record, transcribe, or analyze private conversations.
Any recording or transcription requires a disclosed purpose, appropriate
consent, and visible controls.

### After a session

The mentor submits: - Topics covered. - Student-visible observations. -
Strengths. - Areas to improve. - Action items. - Resources. - Suggested
next milestone.

The system can structure these notes, but the mentor remains responsible
for reviewing and approving the final summary.

### Mentorship continuity

Before the next session: 1. Retrieve prior student-visible summary. 2.
Identify open action items. 3. Ask the student for progress updates. 4.
Prepare a short continuity brief. 5. Let the mentor review it.

### Phase 2 intelligence

-   AI-generated session summaries, subject to consent.
-   Suggested follow-up questions.
-   Personalized resource recommendations.
-   Goal decomposition and milestone suggestions.
-   Mentor copilot for session preparation.
-   Student learning assistant between sessions.

------------------------------------------------------------------------

## 9. Layer 7 --- Mock Interview Intelligence

### Purpose

Make interview practice structured, repeatable, and measurable.

### 9.1 Interview configuration

Collect: - Target role. - Interview type: technical, HR, behavioral,
system design, or mixed. - Experience level. - Difficulty. - Topics. -
Language. - Duration. - Human interviewer in Phase 1. - AI interviewer
only when Phase 2 is released.

### 9.2 Interviewer matching

Use service eligibility and relevant expertise: - Role alignment. -
Interview category. - Technical domain. - Relevant professional
experience. - Language. - Availability. - Interviewer quality and
reliability.

### 9.3 Interview rubric

Use a disclosed rubric. Example dimensions:

  -----------------------------------------------------------------------
  Dimension                           What is evaluated
  ----------------------------------- -----------------------------------
  Technical correctness               Accuracy of concepts and
                                      implementation

  Problem solving                     Decomposition, reasoning, and
                                      approach

  Communication                       Clarity and structured explanation

  Practical judgment                  Trade-offs and real-world decisions

  Role alignment                      Competencies relevant to the target
                                      role

  Adaptability                        Response to hints, constraints, and
                                      follow-up questions
  -----------------------------------------------------------------------

The rubric should vary by interview type. HR interviews should not be
scored using a coding rubric.

### 9.4 Phase 1 --- Human evaluation

-   Human interviewer conducts the session.
-   Interviewer records rubric-based observations.
-   Interviewer submits strengths, gaps, and recommendations.
-   Student receives the approved feedback report.
-   Student can ask for clarification or report an issue.

### 9.5 Phase 2 --- AI interview engine

Potential components: 1. Interview plan generation. 2. Role-specific
question selection. 3. Conversation state management. 4. Follow-up
question generation. 5. Answer evaluation against a rubric. 6.
Evidence-linked feedback. 7. Improvement recommendations. 8. Practice
history and trend analysis.

AI evaluation must: - Explain the rubric. - Distinguish objective errors
from subjective judgments. - Avoid claiming certainty about hiring
outcomes. - Avoid evaluating protected or irrelevant personal
characteristics. - Provide evidence for feedback. - Allow users to
challenge or correct factual errors. - Be tested across languages,
accents, and different communication styles.

### 9.6 Interview report

Show: - Interview type and target role. - Rubric dimensions. -
Strengths. - Improvement areas. - Question-level feedback where
appropriate. - Suggested practice tasks. - Next interview
recommendation. - Comparison with previous attempts only when rubrics
are comparable.

------------------------------------------------------------------------

## 10. Layer 8 --- Progress & Outcome Intelligence

### Purpose

Measure whether platform activity is helping students make progress
toward their own goals.

### Progress model

``` text
Student Goal
    |
    v
Required Competencies
    |
    v
Milestones
    |
    v
Mentorship / Practice Activities
    |
    v
Evidence of Completion
    |
    v
Progress Review
    |
    v
Updated Next Steps
```

### Progress signals

-   Goal milestones completed.
-   Action items completed.
-   Projects delivered.
-   Skills supported by new evidence.
-   Mock interview rubric changes.
-   Session attendance and continuity.
-   Student-reported confidence or readiness.
-   Mentor observations.

### Important distinction

Track **activity**, **evidence**, and **outcomes** separately.

For example: - Activity: Student attended three sessions. - Evidence:
Student completed an API project. - Outcome: Student improved on a
defined API-design rubric.

Do not claim that a student is job-ready merely because they completed a
certain number of sessions.

### Student-facing outputs

-   Current goals.
-   Milestone timeline.
-   Skills being developed.
-   Completed action items.
-   Pending actions.
-   Recent feedback.
-   Suggested next step.
-   Progress history.

### Mentor-facing outputs

Only show information shared with that mentor or legitimately associated
with their mentees.

------------------------------------------------------------------------

## 11. Layer 9 --- Conversational Intelligence & Agent Orchestration

### Purpose

Provide a consistent natural-language interface for students, mentors,
and admins without allowing an LLM to bypass application rules.

### 11.1 Role-aware assistants

**Student assistant** - Explain platform features. - Help define
goals. - Clarify skill gaps. - Prepare session agendas. - Explain mentor
recommendations. - Help interpret feedback. - Suggest next actions.

**Mentor copilot** - Prepare session briefs. - Summarize authorized
student context. - Suggest questions. - Structure session notes. - Draft
action items. - Find relevant resources.

**Admin assistant** - Summarize verification queues. - Explain matching
outcomes. - Surface operational anomalies. - Draft reports. - Help
investigate support cases within authorized access.

### 11.2 Agent architecture

``` text
User Request
    |
    v
Identity + Role + Permission Check
    |
    v
Intent Classification
    |
    v
Context Retrieval (authorized only)
    |
    v
Policy / Business Rule Check
    |
    v
Tool or Workflow Selection
    |
    v
Execution with Validation
    |
    v
Response + Evidence + Audit
```

### 11.3 Tool boundaries

An assistant may: - Search eligible mentors. - Read authorized profile
data. - Prepare a booking draft. - Retrieve session details. - Draft a
feedback summary. - Create a proposed action plan.

An assistant must not autonomously: - Approve a mentor. - Change user
roles. - Override booking constraints. - Share private data with another
user. - Change consent scopes. - Issue refunds or payments without the
required workflow. - Submit consequential evaluations without human
review. - Delete or modify records outside authorized operations.

### 11.4 Human approval

Require explicit confirmation for: - Sending messages. - Confirming or
cancelling bookings. - Sharing documents. - Exporting data. - Publishing
profile changes. - Making admin decisions. - Any action with financial,
privacy, or account consequences.

### 11.5 Retrieval and knowledge sources

Potential knowledge sources: - Platform documentation. - Verified mentor
profiles. - Approved learning resources. - Student-authorized profile
context. - Student-visible session summaries. - Interview rubrics. -
Policies and support documentation.

Use source metadata, access control, freshness checks, and citations /
links where relevant. Do not let retrieved text override system
permissions or business rules.

------------------------------------------------------------------------

## 12. Layer 10 --- Admin, Quality, Risk & Platform Intelligence

### Purpose

Help administrators operate the platform safely and efficiently.

### Operational intelligence

-   Mentor application backlog.
-   Verification turnaround.
-   Mentor capacity and demand.
-   Booking conversion.
-   Cancellation and no-show trends.
-   Session completion.
-   Unmatched student requests.
-   Mock interview usage.
-   Support ticket aging.
-   Integration health.

### Quality intelligence

-   Mentor feedback trends.
-   Repeated complaints.
-   Session reliability.
-   Recommendation relevance.
-   Interview feedback completion.
-   Resource quality reports.

### Risk signals

Potential flags: - Repeated no-shows. - Suspicious account activity. -
Duplicate or inconsistent credential submissions. - Abusive messages
reported by users. - Unusual booking patterns. - Unauthorized data
access attempts. - Repeated failed synchronization.

Risk flags should trigger review, not automatic punishment. Provide
evidence, reason codes, and appeal paths.

### Admin assistant boundaries

Admin AI may summarize and prioritize. It must not make final
verification, suspension, or dispute decisions without the required
human authority and workflow.

------------------------------------------------------------------------

## 13. Layer 11 --- Evaluation, Learning & Optimization

### Purpose

Improve the system using measured performance rather than intuition or
raw engagement.

### Recommendation evaluation

Track: - Eligible mentor coverage. - Top-three recommendation
relevance. - Profile-to-booking conversion. - Booking acceptance. -
Session completion. - Student feedback. - Repeat mentorship. - No-match
rate. - Manual override rate.

### Interview evaluation

Track: - Rubric completion. - Feedback usefulness. - Student-reported
clarity. - Repeated skill-gap patterns. - Practice engagement. -
Improvement on comparable rubric dimensions.

### Assistant evaluation

Track: - Correctness. - Groundedness. - Permission compliance. -
Tool-call success. - Unsupported claim rate. - User correction rate. -
Escalation rate. - Latency and cost.

### Experimentation

-   Version matching rules.
-   Run controlled experiments where ethical and statistically
    appropriate.
-   Compare quality and outcomes, not only click-through rates.
-   Avoid changing eligibility or fairness rules through unreviewed
    experiments.
-   Maintain rollback capability.

### Feedback is not automatically training data

Do not use private conversations, session recordings, resumes, or
personal data to train models by default. Any model improvement use must
have a defined lawful basis, user-facing disclosure, required consent,
retention policy, and appropriate de-identification.

------------------------------------------------------------------------

## 14. Intelligence Data Architecture

### 14.1 Suggested logical data domains

  -----------------------------------------------------------------------
  Domain                              Core records
  ----------------------------------- -----------------------------------
  Identity                            Users, identities, role memberships

  Consent                             Consent grants, scopes, versions,
                                      revocations

  Profiles                            Student profiles, mentor profiles

  Evidence                            Skills, projects, credentials,
                                      source records

  Goals                               Goals, competencies, milestones

  Matching                            Match requests, candidates, scores,
                                      explanations, versions

  Scheduling                          Availability, slots, bookings

  Sessions                            Session metadata, attendance,
                                      summaries

  Interviews                          Interview configuration, rubric,
                                      evaluation

  Progress                            Action items, evidence, progress
                                      snapshots

  Communication                       Conversations, messages,
                                      notifications

  Integration                         External connections, sync jobs,
                                      events

  Governance                          Audit logs, access events, admin
                                      decisions

  Analytics                           Aggregated metrics and experiment
                                      results
  -----------------------------------------------------------------------

### 14.2 Storage pattern

Use the right storage for each data type:

-   Relational database for identity, roles, consent, bookings,
    structured profiles, and audit metadata.
-   Object storage for uploaded resumes, credentials, and approved
    attachments with strict access controls.
-   Search index for approved searchable resources and mentor discovery.
-   Vector retrieval only where semantic search adds measurable value
    and access filters can be enforced.
-   Analytics warehouse / aggregate tables for reporting.
-   Event queue for asynchronous integration and workflow events.

Do not introduce a vector database merely because the product includes
AI. Start with relational and full-text search where they meet the
requirement.

### 14.3 Event-driven updates

Example events: - `student.profile.updated` - `student.goal.created` -
`student.skill.evidence_added` - `mentor.application.submitted` -
`mentor.verification.approved` - `mentor.availability.updated` -
`match.recommendations.generated` - `booking.confirmed` -
`session.completed` - `mentorship.summary.approved` -
`mock_interview.feedback_submitted` - `consent.revoked` -
`context.sync.failed`

Events should be versioned, authenticated, idempotent, and traceable.

------------------------------------------------------------------------

## 15. Two-Way AI Tathastu ↔ MentorMaze Intelligence Bridge

### 15.1 Direction A --- AI Tathastu to MentorMaze

Potential authorized context: - Academic profile. - Skills and
evidence. - Projects. - Career goals. - Learning milestones. -
User-selected resume metadata or documents. - Certificates and
achievements.

MentorMaze uses this context to: - Enrich student profile. - Identify
possible skill gaps. - Improve mentor matching. - Prepare mentorship
briefs. - Configure mock interviews. - Personalize resources and next
steps.

### 15.2 Direction B --- MentorMaze to AI Tathastu

Potential authorized outcomes: - Mentorship topics and dates. -
Student-approved session summaries. - Agreed action items. - Skill gaps
identified through a disclosed rubric. - Mock interview outcomes. -
Progress milestones. - Resources shared.

AI Tathastu uses these outcomes to: - Maintain continuity in future
conversations. - Update learning plans. - Recommend relevant learning
resources. - Help students prepare for the next mentorship or
interview. - Reflect progress in the user's broader learning context.

### 15.3 Data that must not sync by default

-   Private mentor notes.
-   Private messages.
-   Identity verification documents.
-   Payment credentials.
-   Confidential support / dispute records.
-   Session recordings.
-   Raw transcripts.
-   Any data category without explicit authorization and a defined
    purpose.

### 15.4 Integration controls

-   Separate identity authentication from context authorization.
-   Use OAuth / OpenID Connect flows appropriate to the integration.
-   Use scoped tokens and short lifetimes.
-   Validate webhook signatures.
-   Encrypt data in transit and at rest.
-   Maintain data provenance and timestamps.
-   Use idempotency keys.
-   Support retries and dead-letter queues.
-   Respect revocation.
-   Log access and synchronization.
-   Define source-of-truth rules for every shared field.

### 15.5 Conflict resolution

If the same field changes in both systems: 1. Identify the field's
designated source of truth. 2. Compare timestamps and versions. 3.
Preserve both source records. 4. Prefer explicit user corrections over
inferred values. 5. Request user resolution for consequential conflicts.
6. Never silently replace verified information with a model-generated
inference.

------------------------------------------------------------------------

## 16. Intelligence Governance & Safety

### 16.1 Data minimization

Collect and process only what is necessary for the feature being used. A
mentor matching request does not require unrestricted access to a
student's full AI conversation history.

### 16.2 Visibility model

Every data item should have a defined audience: - Private to student. -
Shared with a selected mentor. - Shared with all approved mentors (only
if explicitly public). - Admin-restricted. - Shared with AI Tathastu
under a specific consent scope.

### 16.3 Explainability

For consequential recommendations, preserve: - Factors used. - Source
records. - Model / rules version. - Recommendation timestamp. - Reason
for inclusion or exclusion. - Any human override.

### 16.4 Fairness

-   Do not use protected characteristics as matching shortcuts.
-   Avoid proxies that unfairly exclude students.
-   Do not equate institution prestige or CGPA with overall potential.
-   Audit recommendation coverage across relevant user groups where
    lawful and appropriate.
-   Provide a way to correct inaccurate profile data.
-   Keep human review available for disputed outcomes.

### 16.5 Security

-   Least-privilege access.
-   Encryption.
-   Secure file access.
-   MFA for privileged roles.
-   Audit logging.
-   Rate limiting.
-   Input validation.
-   Prompt-injection defenses for retrieved content.
-   Secrets management.
-   Incident response procedures.

### 16.6 AI output policy

AI-generated content must be labeled where users could mistake it for a
verified human assessment. Do not fabricate mentor credentials, student
achievements, interview scores, ratings, or outcomes.

------------------------------------------------------------------------

## 17. Phase-Wise Intelligence Roadmap

### Phase 1 --- Reliable Rules-Based Intelligence

Build: - Identity and consent foundations. - Data provenance. -
Structured student and mentor profiles. - Skill taxonomy. - Goal and
preference capture. - Rules-based eligibility. - Weighted mentor
matching. - Explainable top-three recommendations. - Availability-aware
booking. - Human-led mentorship workflows. - Human-led mock interview
rubrics. - Structured feedback and action items. - Basic progress
tracking. - Admin analytics. - AI Tathastu SSO and scoped context
exchange where integration readiness permits.

**Do not build yet:** autonomous AI mentor, AI interviewer, opaque
predictive scores, or unrestricted agent access.

### Phase 2 --- Assisted Intelligence

Add: - Resume and project parsing with user confirmation. - Semantic
mentor / resource search. - Student goal decomposition. - Mentor session
preparation copilot. - AI-assisted summary drafting with human
approval. - Personalized resource suggestions. - Interview preparation
plans. - Better recommendation calibration using measured outcomes.

### Phase 3 --- AI Practice & Guidance

Add: - AI mock interview engine. - Adaptive question selection. -
Evidence-based answer evaluation. - Conversational student learning
assistant. - AI mentor support between sessions. - Progress trend
analysis. - Human escalation and handoff.

### Phase 4 --- Advanced Optimization

Only after sufficient high-quality data: - Learning-to-rank matching
models. - Demand and capacity forecasting. - Mentor-student
compatibility optimization. - Personalized intervention timing. -
Advanced outcome analysis. - Controlled recommendation experiments.

Predictive models must outperform transparent baselines on relevant
quality measures before replacing them.

------------------------------------------------------------------------

## 18. Recommended Technical Components

These are architectural options, not mandatory vendor decisions.

  -----------------------------------------------------------------------
  Capability                          Suitable approach
  ----------------------------------- -----------------------------------
  Core application                    Existing MentorMaze application
                                      stack

  Relational records                  PostgreSQL

  Identity                            OIDC-compatible identity provider

  Authorization                       RBAC + resource-level permission
                                      checks

  Background jobs                     Queue / worker system

  Event delivery                      Versioned webhooks or message
                                      broker

  File storage                        Private object storage with signed
                                      access

  Search                              PostgreSQL full-text initially;
                                      dedicated search when justified

  Semantic retrieval                  Embeddings + vector search only
                                      when useful

  LLM orchestration                   Server-side service with strict
                                      tool allowlists

  Live sessions                       LiveKit or equivalent

  Analytics                           SQL aggregates initially; warehouse
                                      at scale

  Observability                       Structured logs, metrics, traces,
                                      alerting

  Evaluation                          Versioned test sets and offline /
                                      online evaluation
  -----------------------------------------------------------------------

### Architecture rule

Do not couple the application to one LLM provider. Use a provider
abstraction for model calls, but keep permissions, matching eligibility,
booking rules, and data access in application-controlled services.

------------------------------------------------------------------------

## 19. Core Intelligence APIs (Illustrative)

The following are logical API contracts; exact paths and schemas should
be finalized during implementation.

  --------------------------------------------------------------------------------------
  Capability                          Example operation
  ----------------------------------- --------------------------------------------------
  Student context                     `GET /students/{id}/intelligence-profile`

  Skill evidence                      `POST /students/{id}/skill-evidence`

  Goal decomposition                  `POST /intelligence/goals/decompose`

  Mentor recommendations              `POST /matching/mentors/recommend`

  Match explanation                   `GET /matching/recommendations/{id}/explanation`

  Interviewer recommendations         `POST /matching/interviewers/recommend`

  Session preparation                 `POST /sessions/{id}/prepare`

  Feedback structuring                `POST /sessions/{id}/feedback/draft`

  Progress summary                    `GET /students/{id}/progress`

  Consent scopes                      `GET /integrations/ai-tathastu/consents`

  Consent update                      `POST /integrations/ai-tathastu/consents`

  Context synchronization             `POST /integrations/ai-tathastu/sync`

  Sync status                         `GET /integrations/ai-tathastu/sync/{job_id}`
  --------------------------------------------------------------------------------------

All endpoints require authentication, authorization, input validation,
rate limits, and audit behavior appropriate to the data involved.

------------------------------------------------------------------------

## 20. Non-Functional Requirements

### Performance

-   Mentor discovery should feel responsive.
-   Use precomputed profile features where useful.
-   Keep booking confirmation transactional.
-   Run parsing, summarization, and synchronization asynchronously where
    appropriate.

### Reliability

-   Booking must prevent double allocation.
-   Event processing must be idempotent.
-   Failed context sync must be retryable.
-   Core platform use must not depend on LLM availability.
-   Preserve a safe fallback when AI services fail.

### Scalability

-   Separate high-volume asynchronous tasks from user-facing requests.
-   Cache only data whose freshness and permission rules allow it.
-   Recompute recommendations when relevant profile, availability, or
    policy data changes.

### Accessibility

-   Explain scores and statuses in text, not color alone.
-   Support keyboard and screen-reader navigation.
-   Provide clear validation and error messages.
-   Make consent choices understandable and accessible.

### Observability

Track: - API latency and error rates. - Matching latency and no-match
rate. - Booking conflicts. - LLM latency, token usage, and cost. -
Context-sync lag and failures. - Permission denials. - Event processing
failures.

------------------------------------------------------------------------

## 21. Acceptance Criteria

The intelligence foundation is ready for Phase 1 when:

1.  Each profile attribute has source and freshness metadata.
2.  User consent is separate from authentication.
3.  Unauthorized context cannot enter matching or assistant retrieval.
4.  Student and mentor profiles distinguish claims from verified
    evidence.
5.  Skill levels are supported by a documented rubric or labeled as
    self-reported.
6.  Matching filters ineligible mentors before ranking.
7.  Top-three recommendations are explainable and may contain fewer than
    three results.
8.  Availability is checked by the booking service, not guessed by the
    recommendation model.
9.  Human interview feedback is tied to a disclosed rubric.
10. Session outcomes distinguish mentor-private notes from
    student-visible summaries.
11. AI-generated drafts require human approval where appropriate.
12. Revoking consent stops future synchronization.
13. Two-way events are versioned, idempotent, and auditable.
14. AI Tathastu outages do not block alternative login or core
    MentorMaze features.
15. Admin intelligence does not make unreviewed consequential decisions.
16. Core booking, authorization, and role rules work without an LLM.
17. The system can explain why a recommendation was made.
18. Evaluation metrics measure quality and outcomes, not just clicks.

------------------------------------------------------------------------

## 22. Recommended Implementation Sequence

1.  Define canonical data models and skill taxonomy.
2.  Implement identity, roles, consent, and account linking.
3.  Implement provenance-aware student and mentor profiles.
4.  Build structured goals and skill evidence.
5.  Implement eligibility filtering and rules-based matching.
6.  Add match explanations and top-three presentation.
7.  Integrate availability with transactional booking.
8.  Add human mentorship session summaries and action items.
9.  Add human mock interview rubrics and reports.
10. Build progress and outcome tracking.
11. Add admin quality and operational analytics.
12. Build the AI Tathastu context bridge.
13. Add assistant capabilities behind permission-aware APIs.
14. Evaluate data quality, recommendation quality, fairness,
    reliability, and cost.
15. Introduce advanced models only when measured evidence justifies
    them.

------------------------------------------------------------------------

## 23. Final Architecture Decision

MentorMaze should begin as a **rules-first, evidence-driven mentorship
platform with an intelligence layer**, not as an LLM wrapper.

The defensible foundation is: - High-quality student and mentor
profiles. - Verified expertise and skill evidence. - Explainable mentor
matching. - Reliable booking and session workflows. - Structured human
feedback. - Measurable student progress. - Consent-based AI Tathastu
context exchange.

These foundations create the data quality required for later AI
mentorship and AI mock interviews. Building autonomous AI before these
foundations exist would produce impressive demonstrations but unreliable
product outcomes.
