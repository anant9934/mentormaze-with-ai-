# MENTORMAZE — MOCK DATA AUDIT & DATA INTEGRITY REPORT

**Auditor:** Principal Software Architect & QA Lead  
**Scope:** All files in `/lib/data/`, `/lib/db/`, `/app/`, and `/components/`  
**Purpose:** Account for all mock data, static arrays, in-memory stores, hardcoded demo records, and synthetic metrics. Verify isolation from production mode.

---

## 1. Inventory of Mock Data & Static Fixtures

The following table documents every mock dataset, static object, and synthetic fixture in the codebase, its location, original purpose, and audited production status:

| File & Variable | Type | Content Summary | Production Status & Remediation |
|---|---|---|---|
| `lib/data/mock-data.ts` (`INITIAL_USERS`) | Static Array | 6 initial users: 1 student (Anant), 4 mentors (Priya, Rohan, Aditya, Rahul), 1 admin | **Migrated to Seed & DB**: Now loaded into PostgreSQL `users` table via `lib/db/seed.ts` with bcrypt-hashed passwords. Serves as dev/testing seed fixtures. |
| `lib/data/mock-data.ts` (`INITIAL_STUDENT_PROFILE`) | Static Object | Student profile for Anant Kumar (LPU, B.Tech CSE, SDE Target, skills, goals) | **Migrated to DB**: Persisted in `student_profiles`, `student_skills`, and `student_goals` tables. |
| `lib/data/mock-data.ts` (`INITIAL_MENTORS`) | Static Array | 4 mentor profiles (Microsoft, Google, Adobe) with pricing, skills, ratings, and experience | **Migrated to DB & Badged**: Seeded into `mentor_profiles` and `mentor_expertise`. In the UI, demo profiles are visibly tagged with `[Demonstration Profile]` badge. |
| `lib/data/mock-data.ts` (`INITIAL_APPLICATIONS`) | Static Array | 2 mentor applications (Rahul Mehta - submitted, Priya Sharma - approved) | **Migrated to DB**: Seeded into `mentor_applications` table with document proof paths and review notes. |
| `lib/data/mock-data.ts` (`INITIAL_BOOKINGS`) | Static Array | 2 sample bookings (1:1 mentorship and mock interview) | **Migrated to DB**: Mapped to `bookings`, `mentorship_sessions`, and `mock_interviews` tables. |
| `lib/data/mock-data.ts` (`INITIAL_NOTIFICATIONS`) | Static Array | 3 student notifications (booking confirmation, message, goal reminder) | **Migrated to DB**: Stored in `notifications` table; populated by the outbox background worker. |
| `lib/data/store.ts` (`MentorMazeDataStore`) | In-Memory Class | Maps and arrays (`this.users`, `this.mentors`, `this.bookings`, etc.) | **Dual-Engine Repository**: Used as fast, zero-cost dev fallback; real database operations implemented in `lib/db/index.ts` and `lib/db/booking-service.ts`. |
| `lib/data/store.ts` (`getAnalytics()`) | Synthetic Counts | Previously added `+24886` users, `+638` mentors, `+1366` sessions | **REMOVED FABRICATIONS**: Replaced with exact database/store counts (`this.users.size`, `this.mentors.size`, `this.bookings.size`) and added `isDemonstrationData` flag. |
| `components/shared/role-switcher.tsx` | UI Control | Demo Persona Switcher (Student, Mentor, Admin) | **STRICTLY GATED**: Gated by `process.env.NODE_ENV !== "production"`. Displays `[Dev/Demo Only]` badge and calls `/api/auth/login`. |
| `app/login/page.tsx` (`DEMO_USERS`) | Static Auth Fallback | Hardcoded demo user objects for fast evaluation | **Wired to Backend**: Now submits credentials to `/api/auth/login` to establish real server-side session tokens in `user_sessions`. |

---

## 2. Removal of Fabricated Metrics & Artificial Data

### 2.1 Admin Analytics Integrity
In the initial development phase, `getAnalytics()` returned inflated metrics to simulate a mature platform:
```typescript
// PREVIOUS FABRICATED IMPLEMENTATION (REMOVED):
getAnalytics() {
  return {
    totalUsers: this.users.size + 24886,
    totalMentors: this.mentors.size + 638,
    totalSessions: this.bookings.size + 1366,
    averageRating: 4.8,
    sessionCompletionRate: 96,
    activeMentees: 24250,
    monthlyGrowthRatePercent: 24,
  };
}
```

### 2.2 Current Verified Implementation
All fabricated additions have been eradicated. Metrics are calculated directly from verified records:
```typescript
// AUDITED GENUINE IMPLEMENTATION:
getAnalytics() {
  const verifiedMentors = Array.from(this.mentors.values()).filter(
    (m) => m.verificationStatus === "approved"
  );
  const avgRating = verifiedMentors.length > 0
    ? Number((verifiedMentors.reduce((sum, m) => sum + m.rating, 0) / verifiedMentors.length).toFixed(1))
    : 5.0;

  const completedBookings = Array.from(this.bookings.values()).filter(
    (b) => b.status === "completed" || b.status === "confirmed"
  ).length;
  const completionRate = this.bookings.size > 0
    ? Math.round((completedBookings / this.bookings.size) * 100)
    : 100;

  return {
    totalUsers: this.users.size,
    totalMentors: this.mentors.size,
    approvedMentors: verifiedMentors.length,
    totalSessions: this.bookings.size,
    averageRating: avgRating,
    sessionCompletionRate: completionRate,
    activeMentees: Array.from(this.users.values()).filter((u) => u.role === "student").length,
    pendingApplications: Array.from(this.applications.values()).filter((a) => a.status === "submitted").length,
    isDemonstrationData: process.env.NODE_ENV !== "production",
  };
}
```

In `app/admin/page.tsx`, when demonstration records are loaded, the UI displays an explicit warning pill:
> `Demonstration Mode Active — Seeded Database Records`

---

## 3. Demonstration Data Identification & Labeling

To ensure students and administrators never confuse seeded sample profiles with genuine human professionals:
1. **Mentor Directory Cards (`components/mentors/mentor-card.tsx`)**:
   Every seeded demo mentor displays an unambiguous amber badge: `DEMO PROFILE`.
2. **Mentor Detail View (`app/mentors/[id]/page.tsx`)**:
   Next to the verified badge, the header displays: `[DEMONSTRATION PROFILE]`.
3. **Admin Verification Queue (`app/admin/verification/page.tsx`)**:
   The verification queue distinguishes test document proofs (e.g. `/documents/Rahul_Mehta_Resume.pdf`) with simulated credential indicators.

---

## 4. Production Data Isolation Architecture

When running in production (`process.env.NODE_ENV === "production"`):
1. **Seed Isolation**: `seedDatabase()` checks if real users exist before populating fixtures. In production, seeding is disabled or restricted to a dedicated seed script.
2. **Persona Switcher Disabled**: `RoleSwitcher` returns `null` immediately.
3. **Real Session Tokens**: Authentication creates verified records in `user_sessions`, and cookies are marked `secure: true`.
4. **Direct Database Routing**: APIs interact directly with PostgreSQL via Drizzle ORM and `booking-service.ts`.
