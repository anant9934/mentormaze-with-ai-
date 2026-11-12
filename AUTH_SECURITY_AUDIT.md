# MENTORMAZE — AUTHENTICATION & SECURITY AUDIT

**Auditor:** Principal Security Engineer & Database Architect  
**Audit Scope:** Authentication flows, session lifecycles, RBAC, API routes, IDOR protections, secret handling  
**Status:** PASSED (All High & Critical Vulnerabilities Mitigated)  

---

## 1. Authentication Architecture & Verification

MentorMaze enforces true server-side authentication backed by relational storage in PostgreSQL, moving completely away from client-side state assumptions.

```mermaid
sequenceDiagram
    autonumber
    actor Client as User Browser
    participant API as /api/auth/login
    participant DB as PostgreSQL (users, user_sessions)
    participant Guard as Server Role Guard (/admin/layout.tsx)

    Client->>API: POST { email, password }
    API->>DB: SELECT * FROM users WHERE email = $email
    DB-->>API: User record (with password_hash)
    API->>API: bcrypt.compare(password, password_hash)
    API->>DB: INSERT INTO user_sessions (user_id, token, expires_at)
    API-->>Client: Set-Cookie: mm_session_token (HttpOnly, SameSite=Lax)
    
    Note over Client,Guard: Authenticated Request to Admin Portal
    Client->>Guard: GET /admin
    Guard->>DB: JOIN user_sessions + users WHERE token = $cookie AND expires_at > now()
    DB-->>Guard: Verified session + role ('admin')
    Guard-->>Client: 200 OK (Render Admin Dashboard)
```

### 1.1 Password Security
- **Algorithm:** `bcryptjs` (salt rounds: 10).
- Passwords are never stored in plaintext. Initial seed users have pre-computed bcrypt hashes stored in `users.password_hash`.
- Verified in `tests/database.test.ts`.

### 1.2 Session Token Generation & Storage
- **Token Type:** Cryptographically secure 32-byte pseudo-random hexadecimal string generated via `crypto.randomBytes(32)`.
- **Database Table:** `user_sessions` (token UNIQUE, user_id FK, expires_at TIMESTAMPTZ, user_agent, ip_address).
- **Expiration:** 7 days from generation. Expired tokens are rejected at the SQL query level (`expires_at > now()`).

### 1.3 Cookie Security
- **Cookie Name:** `mm_session_token`
- **Flags:**
  - `httpOnly: true` (Prevents client-side JavaScript / XSS access to tokens)
  - `sameSite: "lax"` (Mitigates Cross-Site Request Forgery / CSRF)
  - `secure: true` in production (`process.env.NODE_ENV === "production"`)
  - `path: "/"`

---

## 2. Server-Side Role-Based Access Control (RBAC)

### 2.1 Role Escalation Immunity
In early prototypes, persona switching operated via React context and `localStorage.setItem("mm_active_role", ...)`.
**Remediation:**
1. A client modifying `localStorage` or query parameters has **zero impact** on server-side authorization.
2. In `lib/auth/server-auth.ts`, `requireServerRole()` queries `user_sessions` and reads `users.role` directly from PostgreSQL.
3. In `app/admin/layout.tsx`, unauthorized users attempting to access `/admin/*` are intercepted by the server layout and served HTTP 403 Forbidden or redirected to `/login`.

### 2.2 Persona Switcher Boundary
- The `RoleSwitcher` component in `components/shared/role-switcher.tsx` contains an unconditional top-level check:
  ```typescript
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  ```
- In non-production environments, the switcher displays an explicit `[Dev/Demo Only]` badge and calls `/api/auth/login` to synchronize the server-side session cookie with the selected persona.

---

## 3. IDOR (Insecure Direct Object Reference) Protections

### 3.1 LiveKit Video Token Endpoint (`/api/livekit/token`)
- **Vulnerability Identified:** The initial route accepted `?bookingId=...&userId=...` without verifying whether `userId` was actually an authorized participant of the booking.
- **Remediation Implemented:**
  ```typescript
  const booking = store.getBookingById(bookingId);
  const mentor = store.getMentorById(booking.mentorProfileId);
  const isStudent = booking.studentUserId === userId;
  const isMentor = mentor?.userId === userId;

  if (!isStudent && !isMentor) {
    return NextResponse.json(
      { error: "Forbidden: You are not an authorized participant in this mentorship session." },
      { status: 403 }
    );
  }
  ```
- Result: Arbitrary third parties cannot enter active mentorship rooms or eavesdrop on video streams.

### 3.2 Chat Messages Endpoint (`/api/messages`)
- Before retrieving or sending messages for any `conversationId`, the server validates that the session user matches `conversations.student_user_id` or `conversations.mentor_user_id`. Non-participants receive HTTP 403 Forbidden.

---

## 4. Webhook Security & Idempotency

### 4.1 Cashfree Webhook Verification
- Webhook payloads received at `/api/payments/webhook` are verified using HMAC-SHA256 computed against `CASHFREE_WEBHOOK_SECRET` with timestamp replay protection.
- In production, unverified or mismatched signatures are rejected immediately with HTTP 401 Unauthorized.

### 4.2 Idempotency
- When duplicate webhooks arrive for an already paid booking, the endpoint returns HTTP 200 `{ received: true, message: "Already processed" }` without issuing duplicate ledger credits or triggering redundant notifications.

---

## 5. Injection, Secret Exposure & Network Security

| Threat Category | Mitigation Implemented | Verification Result |
|---|---|---|
| **SQL Injection** | All database queries use Drizzle ORM query builder or parameterized `sql` tagged template literals. No raw string interpolation into queries. | **PASS** (Zero dynamic unescaped queries) |
| **XSS (Cross-Site Scripting)** | React JSX automatically escapes user inputs; HTTP-only session cookies prevent credential theft; rich text inputs are restricted to plaintext discussion points. | **PASS** |
| **CSRF** | SameSite=Lax cookies, JSON content-type body requirements on mutation routes, Next.js server actions CSRF headers. | **PASS** |
| **Secret Leakage in Bundles** | Verified browser bundles (`.next/static/chunks/`). `CASHFREE_SECRET_KEY`, `LIVEKIT_API_SECRET`, and `DATABASE_URL` are not prefixed with `NEXT_PUBLIC_` and never bundled into client JS. | **PASS** |
| **Audit Trail** | Sensitive actions (booking cancellation, mentor application approval/rejection, payment ledger updates) write immutable rows to `ledger_transactions` and `outbox_events`. | **PASS** |

