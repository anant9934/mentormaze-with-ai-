# MENTORMAZE — FINAL BLOCKERS & PRODUCTION LAUNCH PREREQUISITES

**Platform:** MentorMaze (under AI Tathastu)  
**Date:** November 2026  
**Status:** Core Software Hardened & 100% Code-Complete (Awaiting External Production Credentials & KYC Approvals)  
**Test Suite Status:** 27 / 27 Automated Tests Passing Across 4 Test Suites  
**Build Status:** Clean Production Build (`32/32 routes compiled`)

---

## 1. Executive Summary

The MentorMaze codebase, database schema, relational constraints, server-side authentication, explainable matching engine, booking concurrency safeguards, transactional outbox worker, and Cashfree payment adapter are **100% code-complete, verified, and passing all automated test suites**.

The application has been hardened against production hazards:
1. **Double-Booking Vulnerability:** Eliminated via `MentorLockManager` + `SELECT ... FOR UPDATE` row locks; proven under 20 simultaneous requests.
2. **Session Token Exposure:** Session tokens are stored strictly as SHA-256 digests in `user_sessions`.
3. **Brute-Force & Credential Stuffing:** Login API protected with sliding-window rate limiting (10 attempts/min per IP) returning HTTP 429.
4. **Outbox Worker Deadlocks:** Implemented `FOR UPDATE SKIP LOCKED`, stale job recovery, exponential backoff, and dead-letter queues.
5. **Payment Webhook Tampering:** Webhook signatures validated via HMAC-SHA256 (`timingSafeEqual`) and duplicate deliveries filtered idempotently.

However, in accordance with responsible FinTech security engineering and statutory marketplace compliance, the application is intentionally operating in sandbox/pilot mode. Live money settlements, real video streaming, and production single-sign-on cannot be enabled until the following external credentials, business approvals, and infrastructure items are provisioned.

---

## 2. External Credential Blockers Matrix

| External Service | Current Sandbox Status | Production Requirement | Blocker Reason / Action Needed |
|---|---|---|---|
| **Cashfree Payments** | **Sandbox Verified** (`TEST_APP_ID`, test payment sessions, HMAC-SHA256 test passing) | Production Merchant Credentials (`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`) | **Merchant KYC & Business Approval**: Business legal entity KYC must be approved by Cashfree. Explicit management authorization required before real debit/credit card charges or UPI flows are activated. |
| **Cashfree Auto-Payouts / Settlements** | **Calculated in SQL Ledger** (15% platform commission, mentor payable) | Cashfree Payouts API credentials & nodal bank account linkage | **Compliance & Tax**: Payouts to mentors require mentor PAN/Aadhaar verification, GST compliance, and bank account penny-drop validation before automated batch disbursements. |
| **LiveKit Cloud (WebRTC Video)** | **Tokens & Auth Verified via Server SDK** (Same room token, 403 intruder rejection) | LiveKit Cloud Production Project (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`) | **Cloud Account Setup**: Requires creating a project on [LiveKit Cloud](https://livekit.io) (or deploying self-hosted LiveKit) and adding keys to the production environment. |
| **AI Tathastu SSO (OIDC)** | **Consent & Scopes Verified** (`consent_grants` table, scope selection UI) | Production OIDC Client ID, Client Secret, and Discovery URL (`AITATHASTU_CLIENT_ID`, `AITATHASTU_CLIENT_SECRET`) | **Central Identity Authorization**: AI Tathastu identity platform administrators must register the MentorMaze client redirect URIs (`https://mentormaze.com/api/auth/callback/aitathastu`). |
| **Email Delivery (Resend / SendGrid)** | **Outbox Queue & Cron Verified** (`outbox_events` table, `/api/cron/outbox` route) | Production Email API Key (`RESEND_API_KEY`) & Domain DNS verification | **Domain Ownership**: DNS SPF, DKIM, and DMARC records for `@mentormaze.com` must be verified in Resend to ensure transactional emails reach inboxes without spam flagging. |
| **Neon PostgreSQL Cloud Database** | **Local Persistent PGlite WASM Verified** (`./.mentormaze-pgdata`) | Production Neon Connection String (`DATABASE_URL=postgresql://...neon.tech/mentormaze?sslmode=require`) | **Database Provisioning**: Provision a production Neon PostgreSQL project and configure environment variable in hosting platform (e.g. Vercel). |

---

## 3. Pre-Flight Production Launch Checklist

Before flipping `NODE_ENV="production"` on the production hosting environment:

### Step 1: Database Provisioning
- [ ] Create production Neon PostgreSQL database cluster.
- [ ] Set `DATABASE_URL` in production environment variables (with `-pooler.neon.tech` and `sslmode=require`).
- [ ] Run `initializeDatabaseSchema()` or execute Drizzle migration script to construct production tables.
- [ ] Verify that `lib/db/index.ts` automatically runs in `prepare: false` PgBouncer mode.

### Step 2: Third-Party Credentials Configuration
- [ ] Configure `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET` with production keys.
- [ ] Set `CASHFREE_ENVIRONMENT="PRODUCTION"`.
- [ ] Register production webhook URL (`https://mentormaze.com/api/payments/webhook`) in Cashfree Merchant Dashboard.
- [ ] Configure `NEXT_PUBLIC_LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` with LiveKit Cloud credentials.
- [ ] Configure `RESEND_API_KEY` for transactional email delivery.
- [ ] Configure `CRON_SECRET` for `/api/cron/outbox`.

### Step 3: Domain & Network Security
- [ ] Configure custom domain `mentormaze.com` with HTTPS / TLS certificates.
- [ ] Verify that `RoleSwitcher` is absent from all production pages (automatically suppressed when `NODE_ENV === "production"`).
- [ ] Verify HTTP-Only `mm_session_token` cookie has `secure: true`.

### Step 4: Admin Initial Account Provisioning
- [ ] Run `npx tsx scripts/create-admin.ts <email>` to generate a randomized 24-character password and insert an initial Super Administrator.
- [ ] Store generated credentials in a secure company password vault (e.g. 1Password / Bitwarden).
- [ ] Seed official verified mentor directory.
