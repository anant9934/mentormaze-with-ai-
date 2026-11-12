# MENTORMAZE — FINAL BLOCKERS & PRODUCTION LAUNCH PREREQUISITES

**Platform:** MentorMaze (under AI Tathastu)  
**Date:** November 2026  
**Status:** Software Implementation Complete (Awaiting External Production Credentials & Business Approvals)  

---

## 1. Executive Summary

The MentorMaze codebase, database schema, relational constraints, server-side authentication, explainable matching engine, booking concurrency safeguards, and background outbox worker are **100% code-complete, verified, and passing all automated test suites**.

However, in accordance with responsible security engineering and marketplace compliance, the application is intentionally running in sandbox/pilot mode. Live money settlements, real video streaming, and production single-sign-on cannot be enabled until the following external credentials, business approvals, and infrastructure items are provisioned.

---

## 2. External Credential Blockers Matrix

| External Service | Current Sandbox Status | Production Requirement | Blocker Reason / Action Needed |
|---|---|---|---|
| **Cashfree Payments** | **Sandbox Verified** (`TEST_APP_ID`, test payment sessions, webhook signature test) | Production Merchant Credentials (`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`) | **Merchant KYC & Business Approval**: Business legal entity KYC must be verified by Cashfree. Explicit management authorization required before real debit/credit card charges or UPI flows are activated. |
| **Cashfree Auto-Payouts / Settlements** | **Calculated in SQL Ledger** (15% platform commission, mentor payable) | Cashfree Payouts API credentials & nodal bank account linkage | **Compliance**: Payouts to mentors require mentor PAN/Aadhaar verification and bank account validation before automated batch disbursements. |
| **LiveKit Cloud (WebRTC Video)** | **Tokens Verified via Server SDK** (`livekit-server-sdk`) | LiveKit Cloud Production Project (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`) | **Cloud Account Setup**: Requires creating a project on [LiveKit Cloud](https://livekit.io) (or deploying self-hosted LiveKit) and adding keys to the production `.env`. |
| **AI Tathastu SSO (OIDC)** | **Consent & Scopes Verified** (`consent_grants` table, scope selection UI) | Production OIDC Client ID, Client Secret, and Discovery URL (`AITATHASTU_CLIENT_ID`, `AITATHASTU_CLIENT_SECRET`) | **Central Identity Authorization**: AI Tathastu identity platform administrators must register the MentorMaze client redirect URIs (`https://mentormaze.com/api/auth/callback/aitathastu`). |
| **Email Delivery (Resend / SendGrid)** | **Outbox Queue Verified** (`outbox_events` table batch processor) | Production Email API Key (`RESEND_API_KEY`) & Domain DNS verification | **Domain Ownership**: DNS MX/DKIM records for `@mentormaze.com` must be verified in Resend to ensure transactional emails reach inboxes without spam flagging. |
| **Neon PostgreSQL Cloud Database** | **Local Persistent PGlite WASM Verified** (`./.mentormaze-pgdata`) | Production Neon Connection String (`DATABASE_URL=postgresql://...neon.tech/mentormaze?sslmode=require`) | **Database Provisioning**: Provision a production Neon PostgreSQL project and configure environment variable in hosting platform (e.g. Vercel). |

---

## 3. Pre-Flight Production Launch Checklist

Before flipping `NODE_ENV="production"` on the production hosting environment:

### Step 1: Database Provisioning
- [ ] Create production Neon PostgreSQL database cluster.
- [ ] Set `DATABASE_URL` in production environment variables.
- [ ] Run `initializeDatabaseSchema()` or execute Drizzle migration script to construct production tables.

### Step 2: Third-Party Credentials Configuration
- [ ] Configure `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET` with production keys.
- [ ] Set `CASHFREE_ENVIRONMENT="PRODUCTION"`.
- [ ] Register production webhook URL (`https://mentormaze.com/api/payments/webhook`) in Cashfree Merchant Dashboard.
- [ ] Configure `NEXT_PUBLIC_LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` with LiveKit Cloud credentials.
- [ ] Configure `RESEND_API_KEY` for transactional email delivery.

### Step 3: Domain & Network Security
- [ ] Configure custom domain `mentormaze.com` with HTTPS / TLS certificates.
- [ ] Verify that `RoleSwitcher` is absent from all production pages (automatically suppressed when `NODE_ENV === "production"`).
- [ ] Verify HTTP-Only `mm_session_token` cookie has `secure: true`.

### Step 4: Admin Initial Account Provisioning
- [ ] Create initial Super Administrator account using a strong, unique password.
- [ ] Seed official verified mentor directory.
