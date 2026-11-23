# MentorMaze — Full Website Security & Governance Audit

**Generated:** 2026-11-23  
**Auditor:** Antigravity Security & Privacy Lead  
**Scope:** Complete Codebase Security Review (Auth, Authorization, Session Integrity, Rate Limiting, File Security, Data Governance)

---

## 1. Executive Summary & Threat Matrix

| Severity | Vulnerability Category | Instances Found | Impact |
|---|---|---|---|
| 🔴 **CRITICAL** | Hardcoded Secrets in Repository (`.env`) | 2 active secrets (Neon DB password, Google OAuth client secret) | Direct database compromise and impersonation risk |
| 🔴 **CRITICAL** | Broken Authorization on Admin Endpoints | 24 `/api/admin/*` routes unauthenticated | Full read/write access to financial settlements, bookings, disputes |
| 🔴 **CRITICAL** | Horizontal Privilege Escalation (IDOR) | `/api/bookings/[id]/cancel`, `/api/bookings/[id]/reschedule` | Any authenticated or unauthenticated client can cancel or alter any booking |
| 🟡 **HIGH** | Client-Side Mock Authentication Bypass | `lib/auth/context.tsx` uses localStorage role switching | UI can switch to admin without server-side validation |
| 🟡 **HIGH** | Missing Rate Limiting on State Mutation Endpoints | 74 of 75 API routes lack rate limits | Vulnerable to brute-force, resource exhaustion, and spam |
| 🟢 **LOW / MITIGATED** | SQL Injection | 0 raw string interpolations (Drizzle ORM parameterized queries) | Drizzle ORM provides reliable parameterized SQL defense |
| 🟢 **LOW / MITIGATED** | Multi-purpose Consent Architecture | 7 independent consent purposes in `student_purpose_consents` | Privacy controls implemented aligning with DPDP Act & GDPR minimization principles |

---

## 2. Authentication & Authorization Deep Dive

### 2.1 The Two-Auth-System Problem
The codebase currently contains **two distinct authentication architectures**:

1. **Server-Side Authentication (`lib/auth/server-auth.ts`)**:
   - Validates `mm_session` cookie against the PostgreSQL `user_sessions` table.
   - Checks session expiration (`expires_at > NOW()`).
   - Retrieves authentic user roles from `users` table.
   - **Status**: Implemented correctly for `/api/auth/session`, but **only invoked in ~8 out of 75 API routes**.

2. **Client-Side Simulation (`lib/auth/context.tsx` & `lib/auth/session.ts`)**:
   - `DEMO_USERS` dictionary provides instant mock access to `user-student-1`, `user-mentor-priya`, and `user-admin-1`.
   - `switchRole()` stores `"mm_active_role"` in `localStorage`.
   - **Status**: Completely bypasses server authentication; 20 UI pages rely on this in-memory mock.

### 2.2 Broken Access Control (OWASP Top 10: A01:2021)
The following administrative and financial API routes lack `getServerSession()` checks:
- `/api/admin/payments` (GET) — Exposes transaction revenue data.
- `/api/admin/payments/reconciliation` (GET) — Exposes payout calculations.
- `/api/admin/bookings` (GET, POST) — Allows unauthenticated creation/viewing of platform bookings.
- `/api/admin/settlements` (GET, POST) — Allows approving mentor payouts without credentials.
- `/api/admin/disputes` (GET, POST) — Allows altering dispute outcomes.
- `/api/admin/policies` (GET, POST, PATCH) — Allows altering commission percentages and cancellation policies.

**Remediation**:
```typescript
// Required on every protected API route:
const session = await getServerSession(req);
if (!session || session.role !== "admin") {
  return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
}
```

---

## 3. Secrets & Credential Audit

### 3.1 Exposed Credentials in `.env`
Inspection of `.env` revealed raw production credentials committed to the repository:
1. `DATABASE_URL`: `postgresql://neondb_owner:[REDACTED_DATABASE_SECRET]@ep-withered-heart-bebleio4-pooler.c-9.us-east-2.aws.neon.tech/neondb`
2. `GOOGLE_CLIENT_SECRET`: `[REDACTED_GOOGLE_CLIENT_SECRET]`
3. `GMAIL_APP_PASSWORD` / `SMTP_PASSWORD`: `jyp...nln`

> [!CAUTION]
> **Action Required**:
> 1. Add `.env` to `.gitignore` immediately.
> 2. Rotate the Neon database password in the Neon Console.
> 3. Rotate the Google OAuth client secret in Google Cloud Console.
> 4. Rotate the Gmail app password.

---

## 4. Rate Limiting & Denial of Service Protection

- **Implemented**: `lib/security/rate-limiter.ts` provides an in-memory sliding-window rate limiter.
- **Coverage**: Currently only utilized in `app/api/auth/login/route.ts` (10 requests/min).
- **Vulnerable Endpoints**:
  - `POST /api/newsletter` — No rate limiting (email spam risk).
  - `POST /api/payments/create-order` — No rate limiting (order flood risk).
  - `POST /api/messages` — No rate limiting (messaging flood risk).
  - `POST /api/ai-mentor` — No rate limiting (LLM quota drain risk).

---

## 5. File Upload & Attachment Security

Inspected `lib/security/file-security.ts`:
- **Allowed MIME types**: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`.
- **Size limit**: Enforced at 10 MB for resumes and deliverables.
- **File name sanitization**: Replaces non-alphanumeric characters with underscores.
- **Magic byte inspection**: Implemented for PDF (`%PDF-`) and PNG (`\x89PNG`).
- **Verdict**: ✅ File upload verification logic is well designed.

---

## 6. Privacy, Consent & DPDP Act Compliance

Inspected `lib/ai-mentor/student-consent-service.ts`:
- Supported purposes:
  1. `service_personalization`
  2. `student_memory`
  3. `mentorship_checkins`
  4. `external_data_integration`
  5. `external_llm_processing`
  6. `model_training` (Disabled by default)
  7. `human_mentor_sharing`
- Verification:
  - Revocation is checked server-side before attaching context.
  - No automatic model training from student conversations.
  - Zero raw PII sent to LLM prompt without explicit consent.
- **Verdict**: ✅ Best-in-class consent architecture.
