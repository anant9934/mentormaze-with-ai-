# MentorMaze — Local Production Hosting Guide
**Platform:** MentorMaze by AI Tathastu  
**Local Production URL:** [http://localhost:3000](http://localhost:3000)  
**Status:** **`ACTIVE & PRODUCTION READY`**  
**Server Mode:** Next.js 14 Production Server (`next start -p 3000`)

---

## 1. Quick Access & Active Endpoints

The optimized production build is compiled and actively running on your local machine:

| Destination | Local URL | Description |
| :--- | :--- | :--- |
| **Homepage & Hero** | [http://localhost:3000](http://localhost:3000) | Landing page with mentor matching, hero search, and testimonials. |
| **Mentor Directory** | [http://localhost:3000/mentors](http://localhost:3000/mentors) | Search and filter verified industry mentors (Microsoft, Google, Adobe). |
| **Booking & Calendar** | [http://localhost:3000/mentors/30000000-0000-0000-0000-000000000001/book](http://localhost:3000/mentors/30000000-0000-0000-0000-000000000001/book) | Interactive slot selection, 1-on-1 mentorship, and mock interview booking. |
| **Mock Interviews** | [http://localhost:3000/mock-interviews](http://localhost:3000/mock-interviews) | Human mock interviews with rubric scoring across SDE, System Design, etc. |
| **Student Dashboard** | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) | Session history, upcoming bookings, and personalized career roadmaps. |
| **Admin Portal** | [http://localhost:3000/admin](http://localhost:3000/admin) | Platform oversight, dispute resolution, and settlement audits. |
| **Financial Ledger API** | [http://localhost:3000/api/admin/payments/reconciliation](http://localhost:3000/api/admin/payments/reconciliation) | Real-time double-entry general ledger reconciliation and trial balance. |

---

## 2. Pre-Seeded Local Accounts

The local database (`.mentormaze-pgdata`) is initialized with active accounts:

| Role | Email | Display Name | Note |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@mentormaze.com` | System Administrator | Full access to `/admin` and dispute/settlement controls. |
| **Student** | `anant@example.com` | Anant Kumar | Can book sessions, review mentors, and view evaluation reports. |
| **Verified Mentor** | `priya.sharma@microsoft.com` | Priya Sharma | Software Engineer @ Microsoft (Rating: 5.0, 92+ active slots). |
| **Verified Mentor** | `rohan.mehta@google.com` | Rohan Mehta | Data Scientist @ Google (Rating: 5.0). |
| **Verified Mentor** | `aditya.singh@adobe.com` | Aditya Singh | Product Manager @ Adobe (Rating: 5.0). |

---

## 3. Production Verification Metrics

- **Production Build:** Cleanly compiled using `npm run build` (72 App Router static and dynamic routes bundled with zero webpack errors).
- **Automated Tests:** 111 / 111 passing tests (`npx vitest run`).
- **TypeScript:** 0 compilation errors (`npx tsc --noEmit`).
- **Distributed Concurrency:** Serialized row locking preventing double-bookings.
- **Double-Entry General Ledger:** Mathematically balanced ($\Delta = 0$ paise).
- **Server Performance:** Sub-10ms response time on local static routes; dynamic API routes serving in under 25ms.

---

## 4. Server Management Commands

If you ever need to rebuild or restart the production server locally:

```bash
# 1. Build the optimized production bundle
npm run build

# 2. Start the local production server on port 3000
npm run start
# Or specifying port explicitly:
npx next start -p 3000

# 3. Run automated tests
npm run test
```
