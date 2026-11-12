# MentorMaze — Support Communication Guide & Ticket Workflows

## 1. Overview

MentorMaze provides an integrated, dual-interface support communication system that connects users directly with platform support specialists:
- **User Portal**: [`/support`](file:///Users/quantum/Desktop/MENTOR%20MAZE/app/support/page.tsx)
- **Admin Center**: [`/admin/support`](file:///Users/quantum/Desktop/MENTOR%20MAZE/app/admin/support/page.tsx)

---

## 2. Supported Support Categories

1. **Account and Login**: Password reset issues, MFA problems, SSO identity linking.
2. **Mentor Booking**: Rescheduling requests, slot availability questions, confirmation issues.
3. **Mock Interview**: Rubric inquiries, feedback clarifications, recording questions.
4. **Payment and Refund**: Double-charge checks, Cashfree transaction status, refund timelines.
5. **Mentor Application**: Application status questions, identity document uploads.
6. **Technical Problem**: Video room connectivity (LiveKit), audio/video device permissions.
7. **Other**: General inquiries and partnership requests.

---

## 3. Communication Thread Architecture

```
User Submits Ticket (POST /api/support/tickets)
    │
    ├─► Saves Ticket Record with Unique ID (MM-2026-XXXX)
    ├─► Dispatches Automated Email: 'support.ticket_created' to User
    │
    ▼
Admin Reviews in Support Queue (/admin/support)
    │
    ├─► Option A: Internal Staff Note (isInternalNote: true)
    │     └─► Yellow banner in thread; STRICTLY NEVER EMAILED to user
    │
    └─► Option B: Customer Reply (isInternalNote: false)
          └─► Updates ticket to 'waiting_on_user'
          └─► Dispatches Automated Email: 'support.ticket_replied' with agent response
```

---

## 4. Internal Note Security Guarantee

The system strictly enforces role-based message filtering:
- Non-admin callers to `GET /api/support/tickets/:id` receive only customer-visible messages (`isInternalNote: false`).
- Internal notes are visually styled with amber background and lock iconography in the Admin portal.
- The email dispatcher intercepts `isInternalNote: true` and aborts email transmission to safeguard internal triage notes from ever reaching customers.

---

## 5. Automated Resolution Emails

When an administrator changes a ticket's status to `Resolved`:
1. The ticket's `resolvedAt` timestamp is recorded in PostgreSQL.
2. An automated email (`support.ticket_resolved`) is dispatched informing the user that their inquiry is complete.
3. If the user replies to the email, the ticket automatically transitions back to `Open`.
