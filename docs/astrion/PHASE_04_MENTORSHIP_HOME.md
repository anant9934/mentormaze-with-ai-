# MentorMaze — Phase 4: Student Mentorship Home Documentation
## Unified Personal Mentorship Portal & Next Step Guidance

**Platform:** MentorMaze by AI Tathastu  
**AI Mentor:** ASTRION (Adaptive Strategic Intelligence & Reasoning Network)  
**Primary Workspace:** `/ai-mentor`  
**Component:** `components/ai-mentor/ai-mentor-home.tsx`  
**Phase:** 4 — Personal AI Mentorship Experience & Continuous Student Guidance  
**Status:** `VERIFIED`

---

## 1. Product Philosophy & Purpose

The Student Mentorship Home is the central command center for every student interacting with ASTRION. Unlike generic chatbot interfaces that dump students into an empty text prompt without context, the Mentorship Home establishes immediate pedagogical orientation:

1. **Orientation:** Where do I stand today?
2. **Focus:** What is my primary goal and active milestone?
3. **Action:** What is the single highest-leverage task I should execute right now?
4. **Continuity:** How does this connect to my past progress and future milestones?

---

## 2. Architectural Blueprint & Layout Structure

The Mentorship Home is structured into five distinct, purposeful sections rendered on a responsive, distraction-free canvas:

```
+-----------------------------------------------------------------------------------+
|  [SECTION A] Context-Aware Welcome Banner                                          |
|  - Time-of-day greeting ("Good afternoon, Anant")                                 |
|  - ASTRION Unified Identity Badge (AI Tathastu Ecosystem)                         |
|  - Active goal & current milestone context summary                                |
|  - Daily / Weekly Check-In trigger button                                         |
+-----------------------------------------------------------------------------------+
|  [SECTION D] Recommended Next Step (Primary Action Card)                          |
|  - Derived from the active in-progress milestone in PostgreSQL                    |
|  - Key practical deliverable & success criteria                                   |
|  - Primary Action Button: "Execute with ASTRION"                                   |
|  - Secondary Action: "View Full Roadmap"                                          |
+-----------------------------------------------------------------------------------+
|  [SECTION B] Current Primary Goal      |  [SECTION C] Real Progress Overview     |
|  - Goal title & category badge         |  - Real milestone completion counts      |
|  - Target outcome & date               |  - Verified skills count from graph      |
|  - Real progress bar (%)               |  - Blockers / Needs review indicator     |
|  - "Manage Goals" direct link          |  - Roadmap status & timeline             |
+-----------------------------------------------------------------------------------+
|  [SECTION E] Talk to ASTRION (Unified Conversation Composer)                      |
|  - Natural input composer with multi-line auto-expand                             |
|  - Focus Area selector (Learn, Coding & DSA, System Design, Career, Projects)     |
|  - Language preference selector (English, Hindi, Hinglish)                        |
|  - Zero forced specialist switching; ASTRION CORE routes dynamically             |
+-----------------------------------------------------------------------------------+
```

---

## 3. Section-by-Section Implementation

### Section A: Context-Aware Welcome
- **Dynamic Greeting:** Evaluates client time to present natural human greeting (`Good morning`, `Good afternoon`, `Good evening`).
- **Student Identity:** Displays the authenticated student's display name (`user?.displayName` or initial prop).
- **Mentorship Summary:** When an active primary goal exists, ASTRION explains:
  > *"You are currently progressing on **[Milestone Title]** toward your goal of **[Primary Goal Title]**."*
- **Check-In Entry:** Includes a direct trigger for the student's opt-in mentorship check-in.

### Section B: Current Primary Goal
- Connected directly to `/api/ai-mentor/goals?userId=${userId}`.
- Displays only the student's primary active goal (or prompts goal creation if none exists).
- Shows category badge (`Career`, `Skill`, `Project`, `Academic`, `Certification`), target completion date, target outcome, and exact milestone progress percentage.
- Features a "Manage Goals" action linking directly to the Goals Manager.

### Section C: Real Persisted Progress Overview
- **Zero vanity metrics:** Does not display fabricated scores or static numbers.
- **Milestone Counts:** Real count of completed milestones (`roadmap.milestones.filter(m => m.status === 'completed').length`) vs total milestones.
- **Verified Skills:** Count of independently verified and assessed skills from `StudentSkillGraph`.
- **Roadmap Status:** Real timeline and status (`active`, `paused`, `completed`).

### Section D: Recommended Next Step (Primary Action Card)
- Identifies the earliest `in_progress` or `pending` milestone from the active roadmap.
- Formats the milestone's primary practical project and success criteria into a concrete action.
- "Execute with ASTRION" button immediately launches a focused mentorship session in `AIMentorConversation` with pre-filled guidance prompt.

### Section E: Talk to ASTRION
- Provides a clean, modern input composer powered by `AIMentorComposer`.
- Students can ask open-ended questions, request code reviews, or ask for conceptual explanations.
- ASTRION CORE coordinates the 8 specialist capabilities internally; students interact with one unified mentor.

---

## 4. Verification & Responsive Evidence

- **Desktop Viewport (1280x800):** Verified with full two-column layout for Sections B & C, clean typography, and 0 console errors. Screenshot saved to `public/brand/phase4-desktop.png`.
- **Mobile Viewport (390x844):** Verified with single-column vertical stack, touch-friendly tap targets (>44px), collapsible sidebar drawer, and responsive text sizing. Screenshot saved to `public/brand/phase4-mobile.png`.
