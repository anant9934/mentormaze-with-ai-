# MENTORMAZE — FULL WEBSITE SIMPLIFICATION AUDIT

**Product:** MentorMaze by AI Tathastu  
**Domain:** https://mentormaze.aitathastu.com  
**AI Mentor:** ASTRION (Adaptive Strategic Intelligence & Reasoning Network)  
**Product Category:** AI and Human Mentoring Platform  
**Mission:** Help every student understand themselves, make better decisions, develop capabilities and achieve meaningful goals through continuous personalized AI and human mentoring.

---

## 1. Executive Summary & Audit Baseline

MentorMaze was inspected across all frontend routes, backend APIs, database schemas, AI orchestration engines, mentor workspaces, and integration layers. The existing codebase possesses robust core infrastructure built over previous phases:
- **Relational PostgreSQL Persistence**: PGlite in development and Neon/PostgreSQL in production, featuring 40+ relational tables across identity, mentor profiles, booking state machines, calendar holds, payments (Cashfree), LiveKit video rooms, notification deliveries, and audit trails.
- **AI Intelligence Stack**: ASTRION with hybrid model routing (Local Fine-Tuned Qwen 2B on Oracle Cloud, Google Gemini 2.5, xAI Grok, OpenRouter, Groq), safety guardrails, student intelligence graph, purpose-specific consent ledger, and goal-centric roadmaps.
- **Human Mentorship Stack**: Approved mentor directory, real-time availability rules, calendar hold concurrency locks, session video (LiveKit), and session notes with student/mentor isolation.

### Identified Complexity & Deficiencies
1. **Navigation Clutter**: Disconnected navigation entries across public and student portals (e.g., redundant mock interview sub-pages `/mock-interviews`, `/mock-interviews/practice`, `/dashboard/mock-interviews`, `/dashboard/resources`, `/match`).
2. **AI Workspace Exposure**: The ASTRION workspace exposed internal infrastructure details: provider switcher models, token statistics, API usage counters, and 10 separate tool panels (Codework, Discover, Specialists cards) rather than a single, unified mentor conversation.
3. **Missing Mentorship Bridge**: While handoff briefing prototypes existed, a fully connected, student-governed **Mentorship Intelligence Bridge** (allowing timeframe selection, preview/edit, explicit mentor authorization, mentor-side briefing, post-session mentor notes, and return intelligence loop to ASTRION) required complete, first-class implementation.
4. **Scattered Student Mentorship Context**: Student sessions, goals, action items, and progress were divided across `/dashboard/sessions` and `/dashboard/progress`, creating cognitive friction.
5. **Two-Way Ecosystem Sync**: External connector stubs for AI Tathastu needed standardized inbound profile consumption and outbound mentorship outcome synchronization with verifiable provenance.

---

## 2. Complete Source Route Inventory

Reconstructed directly from active filesystem paths in `app/`:

### 2.1 Public Pages
| Route | Purpose | Audit Assessment | Action |
|---|---|---|---|
| `/` (`app/page.tsx`) | Landing Page | Clear mentoring value, hero, features, testimonials | Retain & align branding with ASTRION + Human Mentors |
| `/mentors` (`app/mentors/page.tsx`) | Approved Mentor Directory | Core discovery engine for verified human mentors | Retain & optimize filters |
| `/mentors/[id]` (`app/mentors/[id]/page.tsx`) | Public Mentor Profile | Real mentor credentials, domains, pricing | Retain & connect to booking |
| `/mentors/[id]/book` (`app/mentors/[id]/book/page.tsx`) | Session Booking Flow | Real-time availability, hold creation, checkout | Retain (Critical Core) |
| `/how-it-works` (`app/how-it-works/page.tsx`) | Explanatory Guide | Dual mentoring model explanation | Retain & simplify |
| `/pricing` (`app/pricing/page.tsx`) | Pricing Information | Transparent session pricing | Retain |
| `/login` (`app/login/page.tsx`) | Authentication | Email/password, OAuth callbacks | Retain |
| `/privacy` (`app/privacy/page.tsx`) | Privacy Policy | Regulatory compliance | Retain |
| `/terms` (`app/terms/page.tsx`) | Terms of Service | Legal compliance | Retain |
| `/match` (`app/match/page.tsx`) | Mentor Matching Wizard | Duplicate with Mentor Directory search | Consolidate into `/mentors` |
| `/programs` (`app/programs/page.tsx`) | Fixed Programs Catalog | Legacy static course-like cards | Consolidate into `/how-it-works` |
| `/mock-interviews` (`app/mock-interviews/page.tsx`) | Standalone Mock Interview Portal | Redundant catalog; mock interview is a session mode | Consolidate into `/mentors` & ASTRION ORACLE |
| `/mock-interviews/practice` (`app/mock-interviews/practice/page.tsx`) | Mock Interview Practice Launcher | Redundant with AI Mentor ORACLE mode | Defer & redirect to `/ai-mentor` |

### 2.2 Student Dashboard Routes
| Route | Purpose | Audit Assessment | Action |
|---|---|---|---|
| `/dashboard` (`app/dashboard/page.tsx`) | Student Home | Primary overview of student goals, next actions, upcoming sessions | Simplify: evidence-based summary, ASTRION CTA |
| `/ai-mentor` (`app/ai-mentor/page.tsx`) | ASTRION AI Mentor Workspace | Dedicated full-viewport AI mentorship interface | Streamline: 1 conversation, hidden internal specialists |
| `/dashboard/mentorship` (`app/dashboard/mentorship/page.tsx`) | My Mentorship Hub | Consolidated hub for sessions, mentors, goals, action items, bridge | **New Core Consolidated Route** |
| `/dashboard/sessions` (`app/dashboard/sessions/page.tsx`) | Session List & Calendar | Disconnected session list | Consolidate into `/dashboard/mentorship` |
| `/dashboard/progress` (`app/dashboard/progress/page.tsx`) | Goals & Action Items | Disconnected goals page | Consolidate into `/dashboard/mentorship` |
| `/dashboard/messages` (`app/dashboard/messages/page.tsx`) | Human Mentor Messaging | 1:1 direct messaging with verified mentors | Retain & preserve auth boundaries |
| `/dashboard/mock-interviews` (`app/dashboard/mock-interviews/page.tsx`) | Student Mock History | Subsumed by My Mentorship sessions & reports | Consolidate into `/dashboard/mentorship` |
| `/dashboard/resources` (`app/dashboard/resources/page.tsx`) | External Resource Links | Static and non-essential | Remove from navigation |
| `/settings` (`app/settings/page.tsx`) | Profile & Settings Hub | Account, AI Tathastu, consent, memory, notifications | Consolidate & simplify |

### 2.3 Mentor Portal Routes
| Route | Purpose | Audit Assessment | Action |
|---|---|---|---|
| `/mentor/dashboard` (`app/mentor/dashboard/page.tsx`) | Mentor Overview & Sessions | Incoming requests, today's schedule, session management | Retain & add Bridge intake briefing |
| `/mentor/availability` (`app/mentor/availability/page.tsx`) | Weekly Rules & Exceptions | Real-time scheduling rules, calendar sync | Retain (Critical Supporting) |
| `/mentor/apply` (`app/mentor/apply/page.tsx`) | Application & Verification | Profile submission, credentials upload | Retain (Critical Supporting) |
| `/mentor/earnings` (`app/mentor/earnings/page.tsx`) | Financial Settlements | Payout history, ledger tracking | Retain under Mentor Space |

### 2.4 Live Session & Execution Routes
| Route | Purpose | Audit Assessment | Action |
|---|---|---|---|
| `/sessions/[id]/live` | LiveKit Video Room | WebRTC 1:1 video, screen share, session chat | Retain (Critical Core) |
| `/sessions/[id]/summary` | Post-Session Summary | Shared action items, notes review | Retain & feed into ASTRION loop |
| `/sessions/[id]/confirmation` | Booking Confirmation | Meeting join details, ics export | Retain |

---

## 3. Database Schema Audit & Invariants

The database schema (`lib/db/schema.ts` and `lib/db/ai-mentor-schema.ts`) contains 42 production-grade tables. No tables are dropped. All relational foreign keys, cascade deletes, and constraints are preserved:

1. **Identity & Auth**: `users`, `userIdentities`, `userSessions`, `passwordResetTokens`.
2. **Mentorship & Booking Core**: `mentorProfiles`, `mentorExpertise`, `mentorApplications`, `availabilityRules`, `availabilityExceptions`, `mentorAvailabilitySettings`, `bookingHolds`, `calendarConnections`, `externalCalendarEvents`, `bookings`, `bookingEvents`, `bookingPolicies`, `mentorshipSessions`, `sessionNotes`, `interviewEvaluations`.
3. **Payments & Ledger**: `ledgerTransactions`, `journalEntries`, `webhookEvents`, `mentorSettlements`, `disputes`.
4. **Realtime & Communications**: `conversations`, `messages`, `sessionChatMessages`, `notifications`, `notificationPreferences`, `pushSubscriptions`, `notificationDeliveries`, `emailTemplates`, `emailAutomations`, `emailDeliveryLogs`, `supportTickets`.
5. **ASTRION AI & Student Intelligence**: `aiMentorConversations`, `aiMentorMessages`, `studentLearningProfiles`, `studentSkillNodes`, `studentSkillDependencies`, `studentSkillEvidence`, `studentMemory`, `aiMentorRoadmaps`, `aiMentorRoadmapMilestones`, `knowledgeSources`, `knowledgeDocuments`, `knowledgeChunks`, `studentProjects`, `studentIntelligenceEvidence`, `studentPurposeConsents`, `aiMentorGoals`, `aiMentorCheckinPreferences`, `aiMentorCheckinRecords`.
6. **Mentorship Bridge Schema**: Addition of `mentorship_bridge_shares` to manage student-governed summary generation, previews, selective mentor sharing, expiration, and revocation.

---

## 4. AI & Infrastructure Audit

1. **ASTRION Unified Identity**:
   - 8 internal capabilities: SAGE (Learning), CIPHER (Programming), ATLAS (Systems), FORGE (Projects), VECTRA (Career), PRISM (Resume), ORACLE (Interviews), CHRONOS (Planning).
   - Orchestrated seamlessly under one conversation model (`lib/ai-mentor/orchestrator.ts`).
   - Provider switcher and token analytics removed from the student user interface.
2. **Student Memory & Context**:
   - 5-layer context architecture with strict privacy barriers.
   - Purpose consent verification on every access attempt.
   - Traceable provenance: student-reported, assessment-verified, mentor-recorded, AI-inferred, external ecosystem data.
3. **Mentorship Intelligence Bridge**:
   - Structured summaries generated over specified timeframes (single session, 7 days, 30 days, or custom).
   - Student preview and editing before sharing.
   - Mentor intake panel before/during session.
   - Post-session notes update ASTRION context for immediate continuity in subsequent conversations.
