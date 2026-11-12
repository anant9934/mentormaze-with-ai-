# MentorMaze

> **Real People. Real Guidance. Grow Faster.**  
> A production-minded human mentorship and mock interview platform under **AI Tathastu**.

MentorMaze connects university students, fresh graduates, and career switchers with verified human mentors and senior industry engineers for 1-on-1 career guidance, portfolio reviews, and structured mock interviews.

---

## 🌟 Key Product Capabilities

### 1. Intelligent, Explainable Mentor Matching
- Deterministic, multi-signal matching algorithm combining career goal alignment (30%), skill gap overlap (25%), domain expertise (20%), and availability fit (10%).
- Top-3 recommendation cards with data-grounded match reasons (e.g., *"Matches your career goal of Software Engineer"*, *"Relevant tech expertise in System Design"*) and calibrated match percentages.
- Hard filters guarantee unapproved, suspended, or unavailable mentors are never recommended.

### 2. Live WebRTC Audio/Video Sessions
- LiveKit WebRTC room token minting with short-lived TTL (`1h`) and server-side booking authorization.
- In-call collaborative session checklist, mentor private vs. student-visible notes, and downloadable PDF roadmap resources.
- Complete pre-join device check, camera/microphone toggles, and screen-sharing controls.

### 3. Human-Led Mock Interviews with Rubric Evaluations
- Dedicated mock tracks: **Technical SDE**, **System Design**, **HR & Behavioral**, and **Product Management**.
- Structured 1–10 scoring across 4 core dimensions: *Technical Accuracy*, *Problem Solving*, *Communication*, and *Confidence*.
- Comprehensive written reports highlighting strengths, areas to improve, and custom problem sets.

### 4. Marketplace Economics & Payments Ledger
- Provider-agnostic payment gateway adapter with **Cashfree Payments** (Sandbox mode).
- HMAC-SHA256 webhook signature verification with idempotency protection.
- Double-entry marketplace ledger deducting configurable platform commission (15%) and tracking mentor payable balances.
- Evidence-based pilot pricing ladder:
  - 15-min call: **₹149**
  - 30-min call: **₹249**
  - 60-min call: **₹449**
  - Starter Mock: **₹299**
  - Standard Mock: **₹399**
  - Detailed Mock + Report: **₹499**

### 5. Administrative Control Center
- Verification queue to audit submitted government IDs, corporate employment badges, and resumes.
- Interactive matching parameter weight tuning with live student recommendation preview.
- Platform settings for pricing, commission rates, and AI Tathastu SSO integration boundaries.

---

## 🛠️ Technology Stack (Free-Tier-First)

- **Frontend & App Framework:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React
- **Design System:** MentorMaze Warm Editorial Palette (Forest 900 `#123B2E`, Cream `#FBF8F1`, Sage `#EDF1E8`, Ink `#17211E`)
- **Database & ORM:** PostgreSQL (Neon compatible) with Drizzle ORM and hybrid offline zero-cost data store
- **Real-Time Video:** LiveKit Cloud SDK
- **Payments:** Cashfree Payment Gateway Adapter (Sandbox mode)
- **Automated Testing:** Vitest

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Build optimized production bundle
npm run build

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the application.

---

## 🧭 Persona Fast-Track (Demo Switcher)

MentorMaze includes an interactive top bar to test all user journeys instantly:
- **Student Persona (Anant Kumar):** Explore mentors, book slots, join live video rooms, track goals and action items.
- **Mentor Persona (Priya Sharma):** Manage weekly availability, review session requests, conduct calls, and review mentee history.
- **Administrator Persona:** Audit pending mentor verification queues, tune matching algorithm weights, and configure marketplace commission.

---

## 📚 Complete Project Documentation

- [IMPLEMENTATION_STATUS.md](file:///Users/quantum/Desktop/MENTOR%20MAZE/IMPLEMENTATION_STATUS.md) — Requirements traceability & milestone completion
- [ARCHITECTURE_DECISIONS.md](file:///Users/quantum/Desktop/MENTOR%20MAZE/ARCHITECTURE_DECISIONS.md) — Architecture decisions record (ADRs 001–008)
- [DATABASE_SCHEMA.md](file:///Users/quantum/Desktop/MENTOR%20MAZE/DATABASE_SCHEMA.md) — Detailed relational entity specifications & constraints
- [API_DOCUMENTATION.md](file:///Users/quantum/Desktop/MENTOR%20MAZE/API_DOCUMENTATION.md) — REST & webhook API endpoints
- [ENVIRONMENT_SETUP.md](file:///Users/quantum/Desktop/MENTOR%20MAZE/ENVIRONMENT_SETUP.md) — Environment variables & local installation
- [DEPLOYMENT_GUIDE.md](file:///Users/quantum/Desktop/MENTOR%20MAZE/DEPLOYMENT_GUIDE.md) — Vercel & Neon production deployment
- [SECURITY_CHECKLIST.md](file:///Users/quantum/Desktop/MENTOR%20MAZE/SECURITY_CHECKLIST.md) — Audit of security & authorization controls
- [TESTING_REPORT.md](file:///Users/quantum/Desktop/MENTOR%20MAZE/TESTING_REPORT.md) — Automated test suite execution results
- [KNOWN_LIMITATIONS.md](file:///Users/quantum/Desktop/MENTOR%20MAZE/KNOWN_LIMITATIONS.md) — Phase 1 boundaries & Phase 2 roadmap

