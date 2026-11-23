# Meeting Intelligence UI/UX Specification
**Subsystem**: MentorMaze Live Meeting Intelligence Interface  
**Location**: `/sessions/[id]/live`  
**Ecosystem**: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)  
**Date**: November 2026  
**Status**: APPROVED UI SPECIFICATION  

---

## 1. Visual Design Principles & Aesthetics

The Meeting Intelligence interface is integrated seamlessly into MentorMaze's existing LiveKit WebRTC session environment (`/sessions/[id]/live`), strictly adhering to the MentorMaze design language:

1. **Color Palette**:
   - Backgrounds: Crisp clean whites (`bg-white`) and warm-neutral cards (`bg-neutral-50`, `border-neutral-200/80`).
   - Accents: Subtle forest and sage greens (`text-emerald-700`, `bg-emerald-50`, `border-emerald-200`, `bg-emerald-600` primary buttons).
   - Role Badges: Mentor in deep indigo/slate (`bg-indigo-50 text-indigo-700 border-indigo-200`); Student in warm emerald/teal (`bg-emerald-50 text-emerald-700 border-emerald-200`).
   - Strictly **no neon lights**, **no dark heavy glassmorphism**, and **no distracting animated widgets**.
2. **Typography**:
   - Clean sans-serif hierarchy with high legibility.
   - Distinct visual treatments for verbatim speech (`src`), translated subtitles (`dst`), and evidence citations (`[L1 00:15]`).
3. **Responsive Geometry**:
   - **Desktop Layout**: Collapsible side drawer (380px–420px width) positioned alongside the WebRTC video feeds and live coding canvas.
   - **Mobile / Tablet Layout**: Bottom slide-up drawer with sticky tab header and touch-friendly scrollable panels.

---

## 2. Meeting Intelligence Panel Structure

The panel is toggled via a dedicated **"Meeting Intelligence"** action pill in the session toolbar featuring a live recording status indicator.

```
+-----------------------------------------------------------------------------------------+
| [LIVE] Meeting Intelligence Active  |  Language: Hindi <-> English  |  [Pause]  [Stop]  |
+-----------------------------------------------------------------------------------------+
|  [ Live Transcript ]  |  [ Translation ]  |  [ AI Notes (Live) ]  |  [ Action Items ]   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [TAB 1: LIVE TRANSCRIPT]                                                               |
|  ------------------------                                                               |
|  [14:02] [Mentor: Sarah Chen]                                                           |
|  "Let's look at the recursive branch. Notice how we are recalculating subproblems?"    |
|                                                                                         |
|  [14:18] [Student: Anant Kumar]                                                         |
|  "Haan, samajh gaya. We should memoize using a map or a 2D array."                      |
|                                                                                         |
|  -------------------------------------------------------------------------------------  |
|                                                                                         |
|  [TAB 2: TRANSLATION]                                                                   |
|  --------------------                                                                   |
|  [14:18] [Student: Anant Kumar]                                                         |
|  Original (Hinglish): "Haan, samajh gaya. We should memoize using a map or a 2D array." |
|  Translation (English): "Yes, I understand. We should memoize using a map or 2D array."|
|                                                                                         |
|  -------------------------------------------------------------------------------------  |
|                                                                                         |
|  [TAB 3: AI NOTES]                                                                      |
|  -----------------                                                                      |
|  Executive Summary:                                                                     |
|  Discussion on dynamic programming optimization for graph paths. Mentor guided student  |
|  from exponential recursion to top-down memoization with time complexity reduction.    |
|                                                                                         |
|  Topic 1: 00:00 - 05:30 [Dynamic Programming Fundamentals]                             |
|  - Overlapping subproblems identified in recursion tree (L4, L7)                        |
|  - Space vs time tradeoff of top-down memoization vs bottom-up tabulation (L12)         |
|                                                                                         |
|  -------------------------------------------------------------------------------------  |
|                                                                                         |
|  [TAB 4: ACTION ITEMS]                                                                  |
|  ---------------------                                                                  |
|  [x] Student: Implement memoized solution for Problem 3 by Thursday (L18)               |
|  [ ] Mentor: Share Stanford CS161 lecture notes on interval graphs (L24)                |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 3. End-of-Session Review & Redaction Screen

When the session concludes or when the mentor clicks **"End Session & Generate Report"**, the session navigates to the **Mentorship Intelligence Report Review** view:

1. **Role-Aware Banner**: Shows student and mentor identities with verified authentication badges.
2. **Review & Redaction Tools**:
   - Each transcript segment and extracted note item features a **"Redact / Exclude"** toggle. If a student discussed sensitive personal topics, they can remove that item before the report is finalized.
   - Text editing input allowing participants to provide inline corrections (e.g., correcting an acronym or technical project name).
3. **Five-Tier Provenance Badges**:
   - `student_reported`: Highlighted in soft blue (`bg-blue-50 text-blue-700`).
   - `mentor_recorded`: Highlighted in soft purple (`bg-purple-50 text-purple-700`).
   - `transcript_extracted`: Highlighted in soft amber (`bg-amber-50 text-amber-700`).
   - `assessment_verified`: Highlighted in emerald green (`bg-emerald-50 text-emerald-700`).
   - `ai_inferred`: Highlighted in neutral slate with an advisory notice (`bg-slate-100 text-slate-600`).
4. **Explicit Approval Gate**:
   - Clear action buttons: **"Approve & Add to Mentorship Timeline"** vs. **"Contest / Request Revision"**.
   - No data is permanently stored in ASTRION long-term memory or synced to external AI Tathastu servers without explicit student and mentor sign-off.
