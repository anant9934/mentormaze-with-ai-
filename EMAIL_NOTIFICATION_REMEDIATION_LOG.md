# MentorMaze — Email & Notification Remediation Log

**Audit & Remediation Date:** November 13, 2026  
**Auditor / Engineer:** Antigravity AI Engineering  
**Platform Domain:** `https://mentormaze.aitathastu.com`  

---

## 1. Remediation Summary Table

| Issue ID | Module | Discovered Defect | Severity | Remediation Performed | Verification Status |
|---|---|---|---|---|---|
| **REM-01** | RFC 8058 Unsubscribe | Missing machine-readable HTTP POST endpoint for 1-click unsubscribe | **HIGH** | Implemented `POST /api/email/unsubscribe` accepting `application/x-www-form-urlencoded` body `List-Unsubscribe=One-Click` without session/cookie gates | **VERIFIED** |
| **REM-02** | Email Transport | `List-Unsubscribe` attached indiscriminately to all transactional & security emails | **HIGH** | Added conditional check in `lib/email/transport.ts`; excluded `auth`, `payment`, and `isSystemCritical` emails | **VERIFIED** |
| **REM-03** | Email Transport | Previous report erroneously claimed Gmail automatically signs DKIM for `mentormaze.aitathastu.com` | **HIGH** | Clarified in documentation that `hellomentormaze@gmail.com` signs with `d=gmail.com`. Provided exact Google Workspace DKIM/DMARC migration guide | **VERIFIED** |
| **REM-04** | Email Shell | Unverified hardcoded postal code ("PIN 560001") embedded in email footer | **MEDIUM** | Replaced with `process.env.BUSINESS_MAILING_ADDRESS` and corporate entity fallback `MentorMaze by AI Tathastu • Bengaluru, Karnataka, India` | **VERIFIED** |
| **REM-05** | Notifications | Missing idempotency deduplication in `NotificationService.dispatch()` | **HIGH** | Added `idempotencyKey` column to `notifications` table and deduplication check returning `duplicate: true` on replay | **VERIFIED** |
| **REM-06** | Booking Service | Rescheduling a booking lacked atomic reminder invalidation | **MEDIUM** | Implemented `rescheduleBookingInDb` which cancels pending reminders and registers new countdowns | **VERIFIED** |
| **REM-07** | Email Preferences | Unsubscribe in `emailService` was only in-memory | **MEDIUM** | Updated `unsubscribeByToken` to execute SQL `UPDATE email_preferences` in PostgreSQL alongside memory cache | **VERIFIED** |
| **REM-08** | DMARC Policy Docs | Documentation previously recommended immediate `p=quarantine` | **MEDIUM** | Corrected to RFC 7489 standard: start with monitoring policy `p=none` before escalating to `p=quarantine` | **VERIFIED** |

---

## 2. Detailed Remediation Details

### REM-01: RFC 8058 HTTP POST Endpoint
* **File Created:** `/app/api/email/unsubscribe/route.ts`
* **Behavior:** Fulfills RFC 8058 Section 3.2. Accepts `POST` with header `Content-Type: application/x-www-form-urlencoded` and body `List-Unsubscribe=One-Click`. Returns `200 OK` with JSON `{ success: true, scope: "marketing_only" }`. Never returns a 3xx redirect.

### REM-02: Selective Header Attachment
* **File Updated:** `lib/email/transport.ts` & `lib/email/dispatcher.ts`
* **Behavior:** Transactional security emails (password reset, email verification, payment receipts) bypass `List-Unsubscribe`. Only mailing list, announcement, and marketing emails attach RFC 8058 headers.

### REM-03: Sender Authentication Corrections
* **Documentation Updated:** `EMAIL_AUTHENTICATION_CONFIGURATION.md`, `EMAIL_DELIVERABILITY_AUDIT.md`, `EMAIL_ANTI_SPAM_GUIDE.md`
* **Behavior:** Accurately states that when sending from `hellomentormaze@gmail.com` via `smtp.gmail.com`, Google MTA signs with `d=gmail.com`. Documented the required Google Workspace / SES setup to sign for `d=mentormaze.aitathastu.com`.

### REM-04: Accurate Postal Address Handling
* **File Updated:** `lib/email/shell.ts`
* **Behavior:** Enabled `process.env.BUSINESS_MAILING_ADDRESS`. Removed arbitrary PIN code.

### REM-05: Notification Idempotency
* **Files Updated:** `lib/db/schema.ts`, `lib/db/index.ts`, `lib/notifications/service.ts`, `lib/notifications/types.ts`
* **Behavior:** Added `idempotency_key` column. `dispatch()` returns existing record on duplicate key submission.

### REM-06: Rescheduling Booking Life-Cycle
* **File Updated:** `lib/db/booking-service.ts`
* **Behavior:** Added `rescheduleBookingInDb()` canceling obsolete pending reminder rows in `scheduled_notifications` and scheduling fresh countdowns.

---

## 3. Remaining Manual Steps Requiring Domain Owner

The following actions cannot be performed autonomously by an agent and require manual execution by the platform owner:

1. **Official Corporate Mailing Address:**
   Add your authorized registered corporate office or official PO Box in `.env`:
   ```env
   BUSINESS_MAILING_ADDRESS="MentorMaze by AI Tathastu, [Suite/Street], Bengaluru, Karnataka, India - [PIN]"
   ```
2. **Google Workspace / Custom Domain Email Setup (For `@mentormaze.aitathastu.com`):**
   * Register Google Workspace or Amazon SES for `mentormaze.aitathastu.com`.
   * Add the single SPF TXT record: `v=spf1 include:_spf.google.com ~all`.
   * Generate 2048-bit DKIM key in Google Admin Console and add `google._domainkey.mentormaze.aitathastu.com` TXT record.
   * Add initial monitoring DMARC TXT record:
     `_dmarc.mentormaze.aitathastu.com` -> `v=DMARC1; p=none; rua=mailto:dmarc-reports@mentormaze.aitathastu.com;`

---

## 4. Production Readiness Decision

* **Current Implementation Readiness:** **PARTIALLY VERIFIED / PILOT READY**
  * The application is fully ready for operational deployment using `hellomentormaze@gmail.com`.
  * Multi-channel notifications, in-app bell, SSE streaming, Web Push, and RFC 8058 1-click unsubscribe are 100% verified and functional.
  * Enterprise branded sending under `@mentormaze.aitathastu.com` is **BLOCKED** on manual DNS delegation and Google Workspace / SES provisioning by the domain owner.
