# MentorMaze — Production SMTP Configuration & Diagnostics Guide

## 1. Configured SMTP Provider Credentials

MentorMaze uses **Google Workspace / Gmail SMTP** with a dedicated 16-character Google App Password:

| Variable | Configured Production Value | Description |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | Google's primary SMTP mail gateway |
| `SMTP_PORT` | `465` | Direct SSL/TLS secure port |
| `SMTP_SECURE` | `true` | Enforces TLS encryption on socket open |
| `SMTP_USER` | `hellomentormaze@gmail.com` | Authenticated Google account identity |
| `SMTP_PASS` | `jypc xjyv tjdw vnln` | 16-character Google App Password (with spaces) |
| `SMTP_FROM_NAME` | `MentorMaze` | Official display name in mail clients |
| `SMTP_FROM_EMAIL`| `hellomentormaze@gmail.com` | Verified sender envelope address |

> [!IMPORTANT]
> Google App Passwords must preserve the exact whitespace pattern (`jypc xjyv tjdw vnln`) when communicating with `smtp.gmail.com:465`. The `lib/email/transport.ts` configuration layer automatically normalizes this format to prevent `535-5.7.8 BadCredentials` errors.

---

## 2. Transport Architecture & Pool Management

The mail transport in [`lib/email/transport.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/email/transport.ts) is configured for enterprise production:

```typescript
nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "hellomentormaze@gmail.com",
    pass: "jypc xjyv tjdw vnln",
  },
  pool: true,              // Reuses persistent TCP connections across requests
  maxConnections: 5,       // Prevents socket exhaustion
  maxMessages: 100,        // Rotates connection after 100 messages
  socketTimeout: 15000,    // 15-second network fail-safe timeout
});
```

---

## 3. Verifying SMTP Health via Admin Console

1. Navigate to `https://mentormaze.aitathastu.com/admin/communications/email`.
2. Click the **SMTP Diagnostics** tab.
3. Click **Run Connection Test**.
4. The system executes `transporter.verify()` against `smtp.gmail.com:465` and reports:
   - Status: `Authenticated & Active`
   - Host: `smtp.gmail.com`
   - Encryption: `SSL/TLS Direct`
5. To test end-to-end inbox delivery, use the **Send Real Test Email** form to send a live test message to any authorized email address.

