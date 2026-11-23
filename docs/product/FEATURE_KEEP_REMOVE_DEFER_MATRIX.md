# FEATURE KEEP / REMOVE / DEFER MATRIX

**Platform:** MentorMaze by AI Tathastu  
**Domain:** https://mentormaze.aitathastu.com  
**Audit Date:** November 2026

Every feature across the MentorMaze repository has been analyzed for dependencies, persistence, tests, and operational alignment with the dual AI + Human Mentoring mission.

---

## 1. Classification Definitions

| Category | Decision | Criteria |
|---|---|---|
| **CORE** | Directly supports AI or human mentoring | Retain and improve (P0) |
| **SUPPORTING** | Required for mentoring operations | Retain and simplify (P1) |
| **DUPLICATE** | Consolidate with authoritative feature | Merge into unified component/page |
| **NON-ESSENTIAL** | Clutters user experience; no mentoring value | Remove safely after dependency checks |
| **MOCKED/BROKEN** | Incomplete, misleading or fake UI | Replace with real functionality or remove |
| **INTERNAL** | Necessary backend/DB infrastructure | Preserve completely; keep hidden from student UI |
| **DEFERRED** | Valuable for future phase; unneeded now | Remove from current navigation; document in backlog |

---

## 2. Comprehensive Feature Matrix

| Feature / Subsystem | Current Location | Classification | Decision & Rationale | Implementation Action |
|---|---|---|---|---|
| **ASTRION Chat Workspace** | `/ai-mentor` | **CORE** | Primary AI mentoring environment. Enables 24/7 personalized mentoring, adaptive questions, real-time feedback. | Keep as primary workspace; hide provider switcher and model stats from student UI. |
| **8 Specialist Capabilities** | `lib/ai-mentor/specialists/*` | **INTERNAL** | SAGE, CIPHER, ATLAS, FORGE, VECTRA, PRISM, ORACLE, CHRONOS are internal reasoning engines. | Retain in orchestrator; remove 8 separate specialist cards from student UI. |
| **Approved Mentor Directory** | `/mentors` | **CORE** | Authoritative search and discovery engine for qualified human mentors. | Retain; streamline filter facets (domain, experience, rating, session mode). |
| **Mentor Public Profiles** | `/mentors/[id]` | **CORE** | Authentic mentor profiles with verifiable experience, reviews, and expertise. | Retain; clear CTA to book session. |
| **Session Booking & Hold Concurrency** | `/mentors/[id]/book`, `lib/calendar/*` | **CORE** | Critical transaction flow with double-booking prevention, 10-minute holds, Cashfree payment. | Retain without weakening any concurrency or policy rules. |
| **My Mentorship Hub** | `/dashboard/mentorship` | **CORE** | Consolidated single destination for the student's entire human mentorship journey. | Implement as target hub; combines Assigned Mentor, Sessions, Goals, Actions, and Bridge. |
| **Mentorship Intelligence Bridge** | `/api/mentorship-bridge/*`, UI modals | **CORE** | Connects ASTRION ongoing AI mentoring with human sessions through consent-governed structured summaries. | Implement end-to-end: generate summary, student preview/edit, share, mentor intake, post-session feedback sync. |
| **Human Mentor Messaging** | `/dashboard/messages` | **CORE** | Direct asynchronous communication between student and approved mentor. | Retain; keep separate from ASTRION conversation history. |
| **LiveKit Video Sessions** | `/sessions/[id]/live` | **CORE** | Real-time WebRTC audio/video meetings for 1:1 sessions and mock interviews. | Retain; integrate mentor intake briefing panel in side drawer. |
| **Session Notes & Action Items** | `/sessions/[id]/summary`, `api/sessions/[id]/notes` | **CORE** | Post-session notes with strict mentor-private vs student-visible isolation. | Retain; feed verified action items back to ASTRION memory loop. |
| **Student Home (Next Steps)** | `/dashboard` | **CORE** | Focuses student on active goal, next priority action, upcoming session, and ASTRION chat. | Simplify: remove decorative banners; display real data only. |
| **Mentor Workspace Overview** | `/mentor/dashboard` | **CORE** | Mentors manage incoming requests, today's schedule, session briefing, and feedback. | Retain; add Bridge student intake briefing. |
| **Mentor Availability Management** | `/mentor/availability` | **SUPPORTING** | Weekly recurring rules, dates-specific blocks, Google Calendar two-way sync. | Retain; preserve all conflict checks. |
| **Mentor Application & Onboarding** | `/mentor/apply` | **SUPPORTING** | Verification workflow with identity and professional credentials upload. | Retain; admin review preserves quality. |
| **Settings, Privacy & Consent Hub** | `/settings` | **SUPPORTING** | Consolidated student controls for account, AI Tathastu sync, memory, consent, notifications. | Consolidate into unified tabbed settings interface. |
| **AI Tathastu Two-Way Sync** | `lib/ai-mentor/integrations/*` | **CORE** | Authoritative student profile ingestion & mentorship outcome return sync. | Implement bidirectional connector service with provenance. |
| **Student Sessions Page** | `/dashboard/sessions` | **DUPLICATE** | Overlaps with My Mentorship. | Consolidate into `/dashboard/mentorship` (redirect seamlessly). |
| **Student Progress Page** | `/dashboard/progress` | **DUPLICATE** | Overlaps with Mentorship Goals and ASTRION memory. | Consolidate into `/dashboard/mentorship` (redirect seamlessly). |
| **Student Mock Interviews Tab** | `/dashboard/mock-interviews` | **DUPLICATE** | Mock interviews are a service mode within sessions. | Consolidate into `/dashboard/mentorship` session history. |
| **Mentor Matching Wizard** | `/match` | **DUPLICATE** | Secondary wizard redundant with directory filters. | Redirect `/match` to `/mentors` with query params. |
| **Standalone Mock Portal** | `/mock-interviews` | **DUPLICATE** | Separate marketing landing page for mocks. | Consolidate messaging into `/mentors` and `/how-it-works`. |
| **Mock Interview Practice** | `/mock-interviews/practice` | **DUPLICATE** | Standalone practice screen duplicates ASTRION ORACLE capability. | Redirect to `/ai-mentor` with interview focus. |
| **Programs Page** | `/programs` | **NON-ESSENTIAL** | Course marketplace style page incompatible with continuous mentoring identity. | Remove from primary navigation; explain methodology on `/how-it-works`. |
| **Resources Dashboard Tab** | `/dashboard/resources` | **NON-ESSENTIAL** | Static collection of placeholder links with zero persistence or mentoring value. | Remove from dashboard sidebar. |
| **AI Model Provider Switcher** | `components/ai-mentor/ai-mentor-model-panel.tsx` | **INTERNAL** | Exposing Gemini vs Grok vs Qwen to students violates seamless mentor persona. | Retain backend router; hide modal and switcher from student UI. |
| **API Usage & Token Counters** | AI Mentor UI badges | **NON-ESSENTIAL** | Technical billing metrics confuse students seeking mentoring guidance. | Remove from student workspace header. |
| **Disconnected Tool Tabs (Codework/Discover)** | AI Mentor sidebar tabs | **DEFERRED** | Standalone sandbox code editor and search cards fragment the conversation. | Defer; keep ASTRION markdown code execution inline within chat. |
| **Admin Backoffice Suite** | `/admin/*` | **INTERNAL** | Verification, payments, disputes, settlements, policy management. | Fully preserve backend administration routes and security checks. |
| **Notification Infrastructure** | `api/notifications/*`, outbox worker | **INTERNAL** | SSE push, transactional email outbox, reminder schedulers. | Fully preserve; ensure no breaking changes to reminder pipeline. |

---

## 3. Consolidation Summary

```text
BEFORE SIMPLIFICATION (14 Student & Public Navigation Items):
[Home, Programs, Mentors, Mock Practice, Resources, About, Dashboard, Mock Interviews, My Sessions, My Progress, Resources, Messages, Settings, Match]

AFTER SIMPLIFICATION (Clean Mentoring Architecture):
PUBLIC:
- AI Mentor (/ai-mentor)
- Find a Mentor (/mentors)
- How It Works (/how-it-works)
- Login / Dashboard

STUDENT:
- Home (/dashboard)
- AI Mentor (/ai-mentor)
- Find a Mentor (/mentors)
- My Mentorship (/dashboard/mentorship)
- Messages (/dashboard/messages)
- Profile & Settings (/settings)

MENTOR:
- Overview (/mentor/dashboard)
- Availability (/mentor/availability)
- Messages (/dashboard/messages)
- Profile (/mentor/apply)
```
