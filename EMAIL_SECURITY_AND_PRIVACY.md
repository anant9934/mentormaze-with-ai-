# MentorMaze — Email Security, Anti-Spam & Privacy Architecture

## 1. Compliance & Anti-Spam Framework

MentorMaze complies with applicable Indian data protection principles (DPDP Act) and international email standards (CAN-SPAM, GDPR):

### Distinction: Transactional vs. Promotional Communications

| Characteristic | Transactional / Service Communications | Promotional / Community Communications |
|---|---|---|
| **Examples** | Verification links, password resets, booking confirmations, video room access, payment receipts, refund notes | Newsletters, new mentor spotlights, workshop invitations, career tips |
| **Legal Basis** | Contractual necessity & account security | Explicit user consent (Opt-In) |
| **Unsubscribe Policy** | **Cannot be disabled** while the account is active | **1-Click Unsubscribe** honored immediately via signed HMAC token |
| **Suppression Override**| Bypasses suppression list | Blocked if recipient is on suppression list |

---

## 2. Cryptographic 1-Click Unsubscribe Architecture

Every promotional email embeds a secure, tamper-proof unsubscribe link:
- **Format**: `https://mentormaze.aitathastu.com/unsubscribe?token=<hmac_token>`
- **Token Generation**: Derived via `SHA-256(email + secret_salt + timestamp)`.
- **Handling**: Handled by [`app/unsubscribe/page.tsx`](file:///Users/quantum/Desktop/MENTOR%20MAZE/app/unsubscribe/page.tsx). Visiting the link immediately marks `marketingConsent: false` and `newsletterConsent: false` without forcing users to sign in.

---

## 3. XSS Prevention & HTML Injection Defense

All dynamic user-supplied variables (such as student names, mentor headlines, discussion points, and ticket summaries) undergo mandatory HTML entity escaping in [`lib/email/compiler.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/email/compiler.ts):
- `<` $\rightarrow$ `&lt;`
- `>` $\rightarrow$ `&gt;`
- `"` $\rightarrow$ `&quot;`
- `'` $\rightarrow$ `&#039;`
- `&` $\rightarrow$ `&amp;`

Custom template bodies edited via the Admin Console are sanitized with `sanitizeHtml()`, which strips `<script>`, `<iframe>`, `on*=` event handlers, and `javascript:` URIs.

---

## 4. Sensitive Data Protection

- **No Passwords or Secrets in Email**: Temporary passwords, API keys, LiveKit admin secrets, and credit card numbers are strictly forbidden from template variables.
- **Single-Use Expiring Tokens**: Verification and password reset tokens expire within 24 hours and 1 hour respectively, and are invalidated immediately upon use.
- **Redacted Error Logs**: Delivery logs in `email_delivery_logs` redact authorization headers, passwords, and sensitive query tokens before persisting to PostgreSQL.

