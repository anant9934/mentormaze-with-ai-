# FINAL MENTORMAZE INFORMATION ARCHITECTURE

**Product:** MentorMaze by AI Tathastu  
**Domain:** https://mentormaze.aitathastu.com  
**AI Mentor:** ASTRION  
**Product Category:** AI and Human Mentoring Platform  

---

## 1. Global Sitemap & Portal Hierarchy

```text
MENTORMAZE ECOSYSTEM
│
├── PUBLIC WEBSITE
│   ├── Home (/)
│   ├── Find a Mentor (/mentors)
│   │   ├── Filter & Search
│   │   └── Mentor Profile (/mentors/[id])
│   │       └── Book Session (/mentors/[id]/book)
│   ├── How It Works (/how-it-works)
│   ├── Pricing (/pricing)
│   ├── Legal (Privacy /terms, /privacy)
│   └── Sign In / Register (/login)
│
├── STUDENT PORTAL
│   ├── Home (/dashboard)
│   │   ├── Current Development Goal
│   │   ├── One Useful Next Action
│   │   ├── Next Upcoming Mentoring Session
│   │   ├── Evidence-Based Progress Summary
│   │   └── Continue ASTRION Conversation
│   │
│   ├── AI Mentor (/ai-mentor)
│   │   ├── ASTRION Identity & Continuity
│   │   ├── Unified Conversation Workspace
│   │   ├── Conversation History (Today / Yesterday / 7 Days / Older)
│   │   ├── Active Mentoring Focus (Dynamic Orchestration)
│   │   ├── Personalization, Goals & Memory Inspection
│   │   └── Mentorship Intelligence Bridge Launcher
│   │
│   ├── Find a Mentor (/mentors)
│   │   └── Verified Human Mentor Directory & Profiles
│   │
│   ├── My Mentorship (/dashboard/mentorship)
│   │   ├── My Mentor (Assigned/Active Mentors)
│   │   ├── Upcoming Sessions (Join Video CTA, Reschedule/Cancel)
│   │   ├── Past Sessions & Summaries
│   │   ├── Mentorship Goals (Real Milestones)
│   │   ├── Action Items (Tracked Checklists)
│   │   └── Mentorship Intelligence Bridge (Summary Generator, Review, Share & Revoke)
│   │
│   ├── Messages (/dashboard/messages)
│   │   └── 1:1 Human Mentor Conversations
│   │
│   └── Profile & Settings (/settings)
│       ├── Account Details
│       ├── AI Tathastu Connection Status
│       ├── Privacy & Purpose Consent Grants
│       ├── Personalization & Memory Management
│       └── Notification Preferences
│
├── MENTOR PORTAL
│   ├── Overview (/mentor/dashboard)
│   │   ├── Today's Schedule & Upcoming Sessions
│   │   ├── Pending Booking Requests (Accept/Decline)
│   │   ├── Student Briefings (Mentorship Intelligence Bridge Intake)
│   │   ├── Students Requiring Follow-Up
│   │   └── Profile Approval Status
│   │
│   ├── Availability (/mentor/availability)
│   │   ├── Weekly Operating Hours
│   │   ├── Date-Specific Overrides & Exceptions
│   │   ├── Buffer, Notice & Advance Booking Rules
│   │   └── Google Calendar Sync
│   │
│   ├── Messages (/dashboard/messages?role=mentor)
│   │   └── Mentee Communication Channels
│   │
│   ├── Earnings & Settlements (/mentor/earnings)
│   │   └── Transparent Payout Ledger
│   │
│   └── Mentor Profile (/mentor/apply)
│       └── Professional Bio, Domains, Verification Proofs
│
├── LIVE SESSION WORKSPACE (/sessions/[id]/live)
│   ├── LiveKit WebRTC Video & Audio
│   ├── Screen Sharing
│   ├── In-Call Collaboration Chat
│   ├── Mentor Briefing Drawer (Bridge Summary)
│   └── Post-Session Feedback & Action Item Form
│
└── ADMIN PORTAL (/admin/*)
    ├── Mentor Approvals & Verification
    ├── Booking Management & Concurrency Audit
    ├── Financial Settlements & Reconciliation
    ├── Disputes & Refunds
    ├── Policy Administration
    └── Outbox & Communications Health
```

---

## 2. Navigation Consistency Rules

1. **Light & Warm-Neutral Forest Theme**:
   - Backgrounds: `#FBF8F1` (cream-50) and white.
   - Accents: `#123B2E` / `#174B39` (deep forest green) and `#27875E` (restrained sage).
   - Text: High contrast `#17211E` / `#1F2937` with accessible line heights.
   - Clean borders: `#DCE5D5` / `#E5E7EB`.
   - Strictly no neon, no decorative gradients, no overloaded analytics.
2. **Predictable URL Mapping**:
   - Legacy routes (`/dashboard/sessions`, `/dashboard/progress`, `/dashboard/mock-interviews`) automatically resolve into `/dashboard/mentorship`.
   - `/match` automatically resolves into `/mentors`.
   - `/mock-interviews/practice` resolves into `/ai-mentor`.
3. **Strict Authorization Boundaries**:
   - Students cannot view mentor private session notes.
   - Mentors cannot view student unshared chats or unassigned student data.
   - Public visitors only see approved mentors and active availability windows.
