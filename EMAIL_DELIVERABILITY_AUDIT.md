# MentorMaze — Email Deliverability Audit & Technical Verification Report

**Date of Audit:** November 13, 2026  
**Auditor:** Antigravity AI Engineering & Security Audit Agent  
**Domain Under Audit:** `https://mentormaze.aitathastu.com`  
**Current Sender Address:** `hellomentormaze@gmail.com` (Display: `MentorMaze <hellomentormaze@gmail.com>`)  
**Overall Readiness Classification:** **PARTIALLY VERIFIED** (Transport functional via Gmail SMTP; long-term custom-domain DKIM/DMARC alignment requires Google Workspace or transactional provider setup).

---

## 1. Executive Summary & Objective

Previous documentation claimed "production-grade anti-spam engineering and 100% inbox placement." Under this evidence-based audit, all such claims were marked **UNVERIFIED** and subjected to direct technical inspection, code analysis, cryptographic review, and automated testing.

The findings establish that:
1. SMTP transmission over `smtp.gmail.com:465` (SSL) is operational and accepts mail.
2. Messages sent from `hellomentormaze@gmail.com` receive Google's own DKIM signature (`d=gmail.com`) and align with Google's SPF (`_spf.google.com`).
3. Previous assertions that Gmail automatically signs for `d=mentormaze.aitathastu.com` were **FALSE**. A personal/free `@gmail.com` account cannot and will not DKIM-sign for a third-party custom domain.
4. Setting a custom domain in `Message-ID` does not grant SPF, DKIM, or DMARC alignment to `mentormaze.aitathastu.com`.
5. RFC 8058 One-Click Unsubscribe headers were erroneously attached to all emails indiscriminately; this has now been remediated to target only mailing list and marketing communications while leaving transactional security alerts unburdened.
6. A compliant RFC 8058 HTTP POST endpoint has been built and verified at `/api/email/unsubscribe`.

---

## 2. Authentication & Alignment Inspection

| Authentication Metric | Actual Observed State | Alignment Status | Audit Verdict |
|---|---|---|---|
| **Visible `From` Header** | `"MentorMaze" <hellomentormaze@gmail.com>` | Domain: `gmail.com` | **VERIFIED** |
| **Envelope Sender (`MAIL FROM`)** | `hellomentormaze@gmail.com` | Domain: `gmail.com` | **VERIFIED** |
| **Authenticating Account** | `hellomentormaze@gmail.com` | Matches Envelope | **VERIFIED** |
| **DKIM Signing Domain** | `d=gmail.com`, selector: Google production | Aligns with visible `From` (`gmail.com`) | **VERIFIED** (for gmail.com) |
| **SPF Result** | Google MTA IP authorized by `_spf.google.com` | Aligns with visible `From` (`gmail.com`) | **VERIFIED** (for gmail.com) |
| **DMARC Result** | `gmail.com` DMARC policy evaluated (`p=reject`) | Both SPF and DKIM pass and align | **VERIFIED** (for gmail.com) |
| **Custom Domain DKIM (`mentormaze.aitathastu.com`)** | No DKIM key published on `mentormaze.aitathastu.com` | Does NOT align with custom domain | **UNVERIFIED / BLOCKED** (Requires Workspace or SES) |
| **Custom Domain DMARC (`mentormaze.aitathastu.com`)** | No DMARC TXT record on subdomain | Unmonitored | **BLOCKED** (Requires DNS setup) |

### Key Technical Finding:
Because the visible `From` is currently `hellomentormaze@gmail.com`, Google's servers sign and authenticate the message as `gmail.com`.
* If a sender attempts to spoof or overwrite the visible `From` to `noreply@mentormaze.aitathastu.com` while routing through `smtp.gmail.com` using a free Gmail App Password:
  * Google SMTP will reject the message or rewrite the sender header with `Sender: hellomentormaze@gmail.com`.
  * Recipient mail filters (Outlook, Yahoo, iCloud) will evaluate DMARC for `mentormaze.aitathastu.com` and flag or drop the message due to lack of DKIM signature for `mentormaze.aitathastu.com`.
* **Remediation Plan:** Maintain `hellomentormaze@gmail.com` as the verified temporary sender until the domain owner provisions Google Workspace or Amazon SES/Postmark for `mentormaze.aitathastu.com`.

---

## 3. RFC 8058 One-Click Unsubscribe Audit

### What Was Inspected:
* `lib/email/transport.ts`
* `lib/email/dispatcher.ts`
* `app/api/email/unsubscribe/route.ts` (created to fulfill RFC 8058)
* `app/unsubscribe/page.tsx`

### Defects Discovered & Remediated:
1. **Defect:** No API route existed to accept the machine-to-machine `POST` request with body `List-Unsubscribe=One-Click`. The previous URL pointed to `/unsubscribe`, which was a browser-only client page.
   * **Fix:** Implemented `/api/email/unsubscribe/route.ts` supporting RFC 8058 `POST` requests without cookies, redirects, or sessions.
2. **Defect:** `List-Unsubscribe` headers were being added to transactional emails (e.g. password resets, email verification, booking receipts).
   * **Fix:** Added conditional logic in `sendEmailDirect`: only templates classified as marketing, announcements, or newsletters receive `List-Unsubscribe` and `List-Unsubscribe-Post`.
3. **Defect:** Unsubscribing risk of muting booking reminders.
   * **Fix:** Verified that `emailService.unsubscribeByToken()` strictly revokes `marketingConsent`, `newsletterConsent`, and `recommendationsConsent`, leaving `bookingRemindersConsent` and security alert routing 100% active.

---

## 4. Physical Postal Address & Privacy Claims Audit

### What Was Inspected:
* `lib/email/shell.ts` footer markup and text rendering.
* Previous claims claiming "100% CAN-SPAM and GDPR legal certification."

### Defects Discovered & Remediated:
1. **Defect:** An unverified placeholder postal PIN code ("PIN 560001") was hardcoded in `lib/email/shell.ts`.
   * **Fix:** Removed arbitrary PIN code. Implemented `process.env.BUSINESS_MAILING_ADDRESS` with an accurate corporate entity fallback: `MentorMaze by AI Tathastu • Bengaluru, Karnataka, India`.
2. **Defect:** Overstated legal compliance claims.
   * **Fix:** Clarified that the codebase implements technical opt-out and header mechanisms, but legal certification under GDPR/CAN-SPAM requires corporate review by qualified legal counsel.

---

## 5. Verification Classification Summary

* **Gmail SMTP Gateway Connectivity:** **VERIFIED** (Port 465 SSL, connected OK).
* **RFC 8058 POST Unsubscribe Execution:** **VERIFIED** (HTTP 200 OK, idempotent, non-redirecting).
* **Security Template Exemption from Unsubscribe:** **VERIFIED** (Password resets and receipts exclude `List-Unsubscribe`).
* **Custom Domain DKIM/DMARC Alignment:** **BLOCKED** (Requires domain DNS record additions and Google Workspace or transactional provider setup).
* **Production Readiness:** **PARTIALLY VERIFIED** (Ready for testing and operational pilot under `hellomentormaze@gmail.com`; requires custom-domain DNS delegation for enterprise-scale launch).

