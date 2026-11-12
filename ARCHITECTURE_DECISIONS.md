# MentorMaze — Architecture Decisions Record (ADR)

**Product:** MentorMaze  
**Parent Ecosystem:** AI Tathastu  
**Scope:** Phase 1 Architecture, Database, Security, and Integrations  
**Date:** November 2026  

---

## ADR 001: Next.js App Router Modular Monolith
- **Decision:** Build MentorMaze as a modular monolith using Next.js 14+ with TypeScript and the App Router.
- **Context:** Avoid premature microservice decomposition. A modular monolith allows shared type safety between frontend, server actions, and backend domain services while maintaining clean domain boundaries (`/lib/modules/...`).
- **Consequences:** Simplified local development, zero inter-service network overhead, shared database transactions, and easy deployment to Vercel, Cloudflare, or Docker.

## ADR 002: Free-Tier-First Multi-Engine Database Architecture
- **Decision:** Use PostgreSQL (Neon PostgreSQL in production / connection string, with robust local PostgreSQL / SQLite-compatible Drizzle ORM fallback for offline development & tests).
- **Context:** Free tiers have connection limits, cold-start pauses, and network dependency during automated test runs. The application layer must support standard Neon PostgreSQL via `DATABASE_URL` while allowing instantaneous automated test runs via an in-memory/file SQLite or local PostgreSQL driver.
- **Consequences:** Unbreakable CI/CD and test execution, zero cost for local dev, instant test isolation, and seamless production deployment on Neon.

## ADR 003: Deterministic Explainable Matching Engine (Phase 1)
- **Decision:** Do NOT use LLM calls for mentor matching. Use a deterministic multi-signal ranking engine with transparent explanation generators.
- **Context:** Matching must be predictable, auditable, explainable, and cost-free. LLMs introduce latency (3-5s), non-determinism, and recurring API costs.
- **Algorithm:**
  $$\text{Score} = w_{goal} S_{goal} + w_{skill} S_{skill} + w_{domain} S_{domain} + w_{acad} S_{acad} + w_{avail} S_{avail} + w_{pref} S_{pref}$$
  Where default weights are configurable by Admin: Goal (30%), Skill (25%), Domain (20%), Academic (10%), Availability (10%), Preference (5%). Hard eligibility filters eliminate unapproved, suspended, or unavailable mentors. Explanations map directly to matched criteria.

## ADR 004: Concurrency-Safe Booking Transactions
- **Decision:** Enforce booking slot reservations at the database layer with transactions and unique slot constraints `(mentor_profile_id, start_time_utc)`.
- **Context:** Double-booking is a critical integrity failure. Client-side checks alone are subject to race conditions.
- **Consequences:** Any concurrent attempt to book an overlapping or identical slot fails immediately with a conflict error (`409 Conflict`), preserving calendar integrity.

## ADR 005: Decoupled Payment Gateway Adapter with Marketplace Ledger
- **Decision:** Create a provider-agnostic `PaymentGateway` interface with an initial `CashfreePaymentAdapter` (Sandbox default) and mock provider for offline testing.
- **Context:** Direct dependence on live payment APIs breaks local environments and CI pipelines. Real payments require merchant verification and marketplace onboarding.
- **Consequences:** All transactions generate immutable ledger entries (`ledger_transactions`: Gross, Commission %, Platform Fee, Mentor Payable, Refundable). Webhook verification validates HMAC SHA256 signatures before mutating booking state.

## ADR 006: LiveKit Real-Time Audio/Video Sessions
- **Decision:** Integrate LiveKit for WebRTC 1:1 sessions. LiveKit room tokens are generated strictly on the server with short expiration (e.g. 15-30 minutes) and verified against the user's booking ID and role.
- **Context:** Video secrets must never leak to client browsers. In Phase 1, recording is disabled by default for privacy compliance.
- **Consequences:** Secure WebRTC media with device selection, mute/video toggles, screen share, and session duration tracking.

## ADR 007: AI Tathastu OIDC SSO & Scoped Context Gateway
- **Decision:** Support AI Tathastu SSO as the primary authentication route with explicit, granular, revocable consent scopes (`academic`, `skills`, `projects`, `goals`, `learning_activity`).
- **Context:** Users must retain full control over imported data. Authentication does not imply blank-check data harvesting.
- **Consequences:** Stored facts retain provenance metadata (source system, timestamp, verification status). When external SSO is unavailable, independent email/OAuth authentication provides complete functional continuity.

## ADR 008: Editorial & Trustworthy UI/UX System
- **Decision:** Adhere strictly to the MentorMaze design system: Forest Green (`#123B2E`), Soft Sage (`#EDF1E8`), Warm Cream (`#FBF8F1`), Charcoal Ink (`#17211E`), and dual typography (Editorial Serif headings + Inter sans body).
- **Context:** The product must convey warmth, human credibility, and seriousness, avoiding generic AI neon gradients or bloated decorative animations.
