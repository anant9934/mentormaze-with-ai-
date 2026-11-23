# MENTORMAZE — FINAL HUMAN MENTOR JOURNEY SPECIFICATION

**Product:** MentorMaze by AI Tathastu  
**Domain:** https://mentormaze.aitathastu.com  
**Target User:** Qualified, Approved Industry Mentors  
**Status:** Implemented & Verified  

---

## 1. Executive Summary & Mentor Experience Principles

Mentors on MentorMaze are senior software engineers, engineering managers, systems architects, and technical leaders who guide students toward engineering competence and career success.

### Guiding Principles
1. **Zero Busywork**: The mentor workspace is uncluttered, actionable, and focused on sessions, availability, messaging, and student outcomes.
2. **Context-Rich Intake**: Mentors never walk into a session blind. Via the **Mentorship Intelligence Bridge**, mentors review an authorized briefing detailing the student's background, current technical hurdles, and prepared questions before the call.
3. **In-Call Focus**: During the LiveKit video call, the mentor has immediate access to the student briefing, shared code sandbox, shared action items, and a confidential private scratchpad that is never exposed to the student.
4. **Structured Feedback Return**: After the call, the mentor logs high-signal feedback (observed strengths, gaps, recommended actions). This directly updates the student's learning roadmap and feeds into ASTRION's continuous AI guidance.

---

## 2. End-to-End Mentor Journey Map

```text
Application & Verification (/mentor/apply)
       │
       ▼
Mentor Overview (/mentor/dashboard)
 ├── Today's Scheduled Sessions (One-Click Live Room & Briefing)
 ├── Incoming Booking Requests (Inspect Briefing -> Accept / Decline)
 ├── Session Metrics (Upcoming, Total Conducted, Student Rating)
 └── Sub-Navigation: Overview | Availability | Messages | Earnings | Profile
       │
       ├────────────────────────────────────────┬──────────────────────────────────────┐
       ▼                                        ▼                                      ▼
Manage Availability                     Intake Briefing Drawer                Live Session Room
(/mentor/availability)                  (Embedded & Slide-over)               (/sessions/[id]/live)
 - Weekly Recurring Rules                - Student Background                  - WebRTC / LiveKit SFU
 - Date-Specific Overrides               - Session Objectives                  - Shared Code Editor
 - Buffer Times & Notice Period          - Questions for Mentor                - Embedded Briefing Tab
 - Instant Calendar Block Sync           - Provenance-Tagged Evidence          - Confidential Scratchpad
                                                                                       │
       ┌───────────────────────────────────────────────────────────────────────────────┘
       ▼
Post-Session Feedback & Intelligence Return
 ├── Observed Strengths & Development Gaps
 ├── Concrete Recommended Next Actions
 ├── Agreed Milestones & Next Session Focus
 ├── Shared with Student (Transparent Outcomes)
 └── Dispatched to ASTRION Context & AI Tathastu Bus
```

---

## 3. Screen Breakdown & Operational Workflows

### 3.1 Mentor Overview Dashboard (`/mentor/dashboard`)
The command center for active mentors:
- **Header & Verification Badge**: Clearly indicates verification status (`Verified Mentor`) with quick links to public profile and availability.
- **Sub-Navigation Bar**:
  - `Overview` (`/mentor/dashboard`)
  - `Availability` (`/mentor/availability`)
  - `Messages` (`/messages`)
  - `Earnings` (`/mentor/earnings`)
  - `Public Profile` (`/mentors/[id]`)
- **Key Metrics**:
  - *Upcoming Sessions* (Next 7 days).
  - *Total Conducted* (With verified attendance rate).
  - *Student Rating* (Based on verified student reviews).
- **Today's Sessions Spotlight**:
  - Mentee name, avatar, session topic, and scheduled start time.
  - `View Student Briefing` button: Opens the **Mentor Intake Drawer** to inspect student goals, questions, and background.
  - `Join Live Room` button: Directly enters `/sessions/[id]/live`.
- **Student Booking Requests**:
  - Pending booking cards with student details, topic, and requested duration.
  - `Briefing` button: Allows inspecting the student's shared briefing before accepting or declining.
  - `Accept` / `Decline` action buttons with immediate status feedback.

### 3.2 Managing Availability (`/mentor/availability`)
- **Recurring Schedule**: Set weekly available slots (e.g., Monday & Wednesday 6:00 PM – 9:00 PM IST).
- **Date-Specific Overrides**: Block holidays, vacations, or add ad-hoc availability.
- **Booking Constraints**:
  - Minimum advance notice (e.g., at least 12 hours before booking).
  - Buffer time between sessions (e.g., 15 minutes).
  - Maximum daily sessions limit.
- **Calendar Synchronization**: Automated ICS and Google Calendar sync to prevent overlapping commitments.

### 3.3 The Mentor Intake Briefing Experience
Accessed via `View Student Briefing` in the dashboard or inside the live room:
- **Authorized Student Background**: Institution, degree, target role (e.g., "Distributed Systems Engineer"), and current technical level.
- **Session Objectives**: Specific goals the student wants to achieve during the call.
- **Student Questions**: Pre-submitted technical or career questions so the mentor can prepare targeted advice.
- **Evidence-Tagged Context**: Verified technical skills, completed projects, and active milestones tagged with provenance badges (`[Independently Verified]`, `[Assessed]`, `[Student Reported]`).
- **Student Note**: Personal note from the mentee explaining their context.
- **Audit Logging**: Every access by the mentor records a tamper-evident entry in `auditLogs` with timestamp and IP address.

### 3.4 Live Mentoring Session (`/sessions/[id]/live`)
The in-session environment:
- **Video & Audio**: Ultra-low latency video powered by LiveKit Cloud SFU with automatic fallback to WebRTC P2P.
- **Live Tab Navigation**:
  1. `Chat`: In-session instant messaging (< 5ms latency).
  2. `Code`: Collaborative sandbox with syntax highlighting for JavaScript, Python, TypeScript, and Go.
  3. `Plan`: Shared session agenda and real-time checklist.
  4. `Notes`: Shared notes visible to both mentor and student after the session.
  5. `Private (Confidential)`: Mentor-only scratchpad for raw candidate evaluation; strictly never exposed to the student.
  6. `Briefing`: Live embedded intake briefing drawer, allowing the mentor to reference the student's questions and evidence without leaving the call.
- **Session Completion**: Mentor clicks `Conclude Session`, transitioning booking to `completed` and prompting post-session feedback.

### 3.5 Post-Session Feedback & Intelligence Return
Mentors complete structured feedback immediately following the call:
- **Observed Strengths**: Concrete technical or behavioral proficiencies observed (e.g., "Strong grasp of binary tree traversal and edge case analysis").
- **Development Gaps**: Areas requiring focused practice (e.g., "Needs to improve concurrent thread-safety in cache eviction").
- **Recommended Actions**: 1–3 actionable next steps for the student (e.g., "Implement write-through cache in Go", "Read Chapter 4 of DDIA").
- **Agreed Milestones**: Target deadlines agreed upon for the next check-in.
- **Return to Ecosystem**:
  - Saved to `session_notes` table in the database.
  - Automatically ingested into `PermissionAwareContextBuilder` so ASTRION references the mentor's recommendations in the student's next AI session.
  - Dispatched to AI Tathastu Central Event Bus via `AITathastuSyncService`.

### 3.6 Earnings & Settlements (`/mentor/earnings`)
- **Completed Sessions Ledger**: Transparent log of all completed calls with session fees.
- **Escrow Settlement Rules**: Funds held securely during session execution and settled to the mentor's registered bank account according to standard settlement schedules.
- **Payout Statements**: Downloadable monthly summaries for tax and accounting records.

---

## 4. Verification Checkpoints

| Checkpoint | Expected Behavior | Failure Action |
|---|---|---|
| Mentor logs in | Routed to `/mentor/dashboard`; sees real scheduled sessions and pending requests. | If non-mentor role, show prompt to apply. |
| Mentor views briefing | Returns authorized briefing data; logs access audit event. | If no share exists, display prompt to mentee. |
| Mentor joins live room | Connects to LiveKit SFU; briefing tab accessible in right panel. | P2P fallback activated automatically. |
| Mentor submits feedback | Saves to `session_notes`; updates `outbox_events`; available to ASTRION. | Retry submission; persist locally in session cache. |
