# MENTORMAZE — FINAL STUDENT JOURNEY SPECIFICATION

**Product:** MentorMaze by AI Tathastu  
**Domain:** https://mentormaze.aitathastu.com  
**AI Mentor:** ASTRION (Adaptive Strategic Intelligence & Reasoning Network)  
**Status:** Implemented & Verified  

---

## 1. Executive Summary & Journey Principles

The student journey in MentorMaze is built on the philosophy of a **continuous mentoring ecosystem** rather than a transactional course marketplace, a generic chatbot, or a cluttered analytics board.

### Core Tenets
1. **Unified AI Mentorship (ASTRION)**: The student interacts with a single, coherent AI mentor identity that learns, challenges, teaches, guides, and reviews. Specialization (DSA, Systems, Projects, Career, Resume, Interviews, Planning) is handled internally without forcing the student to choose models or switch chatbot windows.
2. **Seamless Human Mentorship**: When a student reaches technical complexity, behavioral nuance, or career milestone gates, they transition effortlessly to qualified, verified human mentors.
3. **The Mentorship Intelligence Bridge**: The ongoing ASTRION conversation and verified milestones are synthesized with strict provenance badges into an intake briefing that the student reviews, edits, and selectively shares with their human mentor.
4. **Honest, Zero-Fabrication Interface**: The dashboard displays real, evidence-backed goals and actions. No static mock numbers, fake completion rings, or synthetic percentages.

---

## 2. End-to-End Student Journey Map

```text
Discovery & Auth
       │
       ▼
Student Home (/dashboard)
 ├── Current Development Goal (Persistent)
 ├── Single Priority Next Action
 ├── Next Upcoming Human Mentoring Session
 ├── Verified Evidence & Progress Summary
 └── Continue ASTRION Conversation
       │
       ├────────────────────────────────────────┬──────────────────────────────────────┐
       ▼                                        ▼                                      ▼
AI Mentor: ASTRION                      Find a Mentor                         My Mentorship
(/ai-mentor)                            (/mentors)                            (/dashboard/mentorship)
 - Unified Conversational Flow           - Verified Profiles                   - Assigned Mentors
 - Internal SAGE/CIPHER/ATLAS            - Authentic Experience                - Upcoming & Past Calls
 - Grounded Code & System Pedagogy       - Slot Booking & Holds                - Active Goals & Milestones
 - Memory Inspection & Erasure           - Concurrency Protected               - Action Items Tracker
 - Generate Bridge Briefing ──────────►  - Live WebRTC / LiveKit ─────────►    - Intelligence Bridge Shares
                                                                                       │
       ┌───────────────────────────────────────────────────────────────────────────────┘
       ▼
Messages (/messages) & Settings (/settings)
 - Real-Time Mentor Messaging (isolated from AI)
 - Two-Way AI Tathastu Synchronization
 - Granular Purpose Consent Ledger (GDPR/DPDP)
 - Personalization Memory Store
```

---

## 3. Journey Phases & Screen Breakdown

### 3.1 Onboarding & Authentication (`/login`, `/signup`)
- **Single Sign-On & Email Authentication**: Auth tokens issued with HttpOnly secure cookies.
- **Ecosystem Account Linking**: Students logging in with AI Tathastu credentials immediately synchronize their verified academic profile, skill nodes, and target role without manual re-entry.
- **Immediate Goal Setting**: If no active goal exists, the student is prompted by ASTRION to define their primary objective (e.g., "Full-Stack Backend Role at Tier-1 Tech Firm").

### 3.2 Student Home (`/dashboard`)
Designed strictly to avoid cognitive overload and decorative widgets:
1. **Welcome & Identity**: Displays real student name and active ecosystem status.
2. **Continue ASTRION Mentoring Card**: Direct one-click return to the active AI mentoring dialogue, previewing the last discussed topic and pedagogical mode.
3. **Priority Next Action**: Exactly one concrete, unblocked task (e.g., "Implement LRU Cache eviction logic in TypeScript" or "Review System Design notes before Thursday session").
4. **Current Development Goal & Evidence**: Shows verified skill mastery scores (0–10) with provenance tags (`[Independently Verified]`, `[Assessed]`, `[Student Reported]`).
5. **Next Upcoming Session**: Displays date, time, mentor name, session topic, and a direct button to "Prepare & Share Bridge Briefing".

### 3.3 AI Mentor Workspace (`/ai-mentor`)
The primary continuous learning hub:
- **Clean Conversation Canvas**: Centered on continuous student-mentor dialogue.
- **Unified ASTRION Persona**: No switches for Gemini/OpenAI/Claude, no token counters, and no multi-bot selector tiles. ASTRION internally orchestrates its 8 cognitive capabilities:
  - *SAGE* (Learning & Concepts)
  - *CIPHER* (Algorithms & Coding)
  - *ATLAS* (System Architecture)
  - *FORGE* (Full-Stack Projects)
  - *VECTRA* (Career Strategy)
  - *PRISM* (Resume Critique)
  - *ORACLE* (Mock Interviews)
  - *CHRONOS* (Roadmaps & Scheduling)
- **Pedagogical Integrity**: ASTRION uses Socratic guidance, gives progressive hints, validates edge cases, and remembers previous student struggles.
- **Student Privacy Banner**: Real-time badge indicating that memories are editable and consent-controlled.

### 3.4 Find a Mentor (`/mentors`) & Booking Journey
- **Mentor Directory**: Displays genuine mentor profiles, verified companies, domains of expertise, hourly session fees, and authentic ratings.
- **Mentor Profile (`/mentors/[id]`)**: Detailed biography, career history, technical focus, and dynamic availability calendar.
- **Booking Flow (`/mentors/[id]/book`)**:
  - Time slot selection backed by a deterministic reservation hold manager (`calendar_holds` with a 10-minute expiry to eliminate double bookings).
  - Explicit topic and goal definition.
  - Cashfree payment gateway integration with webhooks and atomic transaction recording.
  - ICS calendar invite generation and email outbox delivery.

### 3.5 My Mentorship Hub (`/dashboard/mentorship`)
The authoritative center for human mentorship:
- **Active Mentors**: List of verified mentors with whom the student has conducted or scheduled sessions.
- **Session Management**: Direct entry point to join LiveKit video calls, review past session summaries, and inspect shared mentor notes.
- **Mentorship Intelligence Bridge Tab**:
  - Direct trigger to "Generate New Bridge Briefing".
  - Timeframe selector: *Single Session*, *Last 7 Days*, *Last 30 Days*, or *Custom Conversations*.
  - Full preview and editing modal before any mentor can see the data.
  - Active shares table with revocation button and audit log of who accessed the summary.

### 3.6 Human Mentor Messaging (`/messages`)
- Completely segregated from AI chat history.
- Direct peer-to-peer and WebSocket messaging with assigned mentors.
- Read receipts, unread badges, and attachment support.

### 3.7 Profile & Settings (`/settings`)
Consolidated into 5 focused tabs:
1. **Account**: Display name, verified email, student ID, and role.
2. **AI Tathastu Connection**: Real-time two-way sync indicator with on-demand synchronization button.
3. **Privacy & Consent Ledger**: Granular toggles for `service_personalization`, `student_memory`, `share_with_mentors`, and `external_data_integration`.
4. **Personalization & Memory**: Comprehensive list of facts, preferences, and goals ASTRION has retained, with individual "Forget This Memory" buttons.
5. **Notifications**: Preferences for email reminders, session alerts, and calendar notifications.

---

## 4. Verification Checkpoints

| Checkpoint | Expected Behavior | Failure Action |
|---|---|---|
| New student lands on `/dashboard` | Displays un-fabricated goal state; prompts ASTRION goal discovery if empty. | Redirect to `/ai-mentor` with onboarding goal prompt. |
| Student opens `/ai-mentor` | Single unified ASTRION workspace; no provider/token toggles; memory badge visible. | Enforce single-identity shell layout. |
| Student books mentor session | 10-minute hold acquired; payment verified; ICS emailed; booking appears in My Mentorship. | Release hold; report error to user. |
| Student generates Bridge Briefing | Summary populated with provenance badges; student can add custom questions; explicit consent prompt before sharing. | Require student confirmation before persisting share. |
| Student revokes Bridge Share | Status changes to `revoked`; mentor access immediately returns 403 Forbidden. | Audit log records revocation event. |
