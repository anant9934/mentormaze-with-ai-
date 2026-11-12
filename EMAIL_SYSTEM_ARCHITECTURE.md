# MentorMaze — Email System Architecture & Technical Specification

## 1. System Overview

The MentorMaze Email Communication System is an enterprise-grade, event-driven notification infrastructure built to power transactional security communications, student & mentor scheduling workflows, payment accounting, customer support tickets, and marketing digests under the **MentorMaze by AI Tathastu** brand identity.

```
                     ┌──────────────────────────────────────────────┐
                     │         Application Lifecycle Events         │
                     │ (user.registered, booking.confirmed, etc.)  │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │          Event-Driven Dispatcher             │
                     │          (lib/email/dispatcher.ts)           │
                     └──────┬───────────────────────┬───────────────┘
                            │                       │
                Idempotency & Deduplication     Preference & Suppression
                (SHA-256 event fingerprint)     (Transactional vs Marketing)
                            │                       │
                            └───────────┬───────────┘
                                        │
                                        ▼
                     ┌──────────────────────────────────────────────┐
                     │         Template Compiler & Registry         │
                     │         (31 Designed Premium Templates)       │
                     │  - Variable Injection & HTML Escaping        │
                     │  - XSS & Script Tag Sanitization             │
                     │  - Outlook/Gmail Compatible Table Shell      │
                     └──────────────────┬───────────────────────────┘
                                        │
                                        ▼
                     ┌──────────────────────────────────────────────┐
                     │    Persistent Queue & Outbox Storage         │
                     │  - PostgreSQL 'email_delivery_logs'          │
                     │  - PostgreSQL 'outbox_events'                │
                     │  - Exponential Backoff & Max Retry Policy    │
                     └──────────────────┬───────────────────────────┘
                                        │
                                        ▼
                     ┌──────────────────────────────────────────────┐
                     │          Production SMTP Transport           │
                     │  - Gmail SMTP Gateway (SSL/TLS direct :465) │
                     │  - Connection Pooling (5 max connections)    │
                     │  - Redacted Secret & Error Logging           │
                     └──────────────────────────────────────────────┘
```

---

## 2. Core Architecture Principles

1. **Non-Blocking Host Transactions**: Email dispatches are strictly asynchronous. Temporary network timeouts or SMTP interruptions never cause booking transactions, mentor approvals, or payment settlements to fail or roll back.
2. **Deterministic Idempotency**: Every dispatch computes a SHA-256 fingerprint based on the event type, recipient email, and payload variables. Duplicate event triggers within the delivery window are safely suppressed.
3. **Strict Transactional Non-Suppression**: Critical security and operational communications (verification tokens, password resets, live video room links, payment receipts) bypass marketing unsubscribe lists in compliance with privacy mandates.
4. **Resilient Dual Storage**: The system logs to PostgreSQL tables (`email_delivery_logs`, `outbox_events`, `support_tickets`) while maintaining an in-memory fallback layer for seamless offline testing and high-speed dashboard analytics.

---

## 3. Design System & Visual Tokens

The email shell follows the MentorMaze visual design system:

| Token | Hex Value | Semantic Usage |
|---|---|---|
| **Forest 900** | `#123B2E` | Brand header background, primary CTA button, primary title text |
| **Forest 800** | `#174B39` | Secondary accents, announcement pills, hover states |
| **Forest 700** | `#21634A` | Header border accents, category badges |
| **Sage 200** | `#DDE6D7` | Card borders, secondary dividers |
| **Sage 100** | `#EDF1E8` | Support note background, announcement pill highlights |
| **Cream 50** | `#FBF8F1` | Outer page canvas, footer background |
| **Cream 100** | `#F4EFE4` | Key-value summary cards, quotation boxes |
| **Sand 200** | `#DED2BF` | Structural borders, card outlines |
| **Ink 950** | `#17211E` | Primary body text, headings |
| **Ink 700** | `#46514B` | Supporting descriptions, metadata labels |
| **White** | `#FFFFFF` | Main email container background |

### Typography & Layout Fallbacks
- **Editorial Heading**: `Georgia, 'Times New Roman', Cambria, serif` (editorial aesthetic matching MentorMaze brand)
- **Body & Controls**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Shell Layout**: Nested table layout with `max-width: 600px`, MSO conditionals for Outlook compatibility, and high-contrast accessibility.

---

## 4. Module Map & Source Code Inventory

- [`lib/email/design-tokens.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/email/design-tokens.ts): Brand color and typography tokens.
- [`lib/email/shell.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/email/shell.ts): Table-based HTML shell and plain-text generator.
- [`lib/email/compiler.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/email/compiler.ts): HTML escaping, sanitization, and variable interpolator.
- [`lib/email/templates/registry.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/email/templates/registry.ts): 31 registered email templates across 6 categories.
- [`lib/email/transport.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/email/transport.ts): Nodemailer pool, live connection verifier, and sender wrapper.
- [`lib/email/dispatcher.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/email/dispatcher.ts): Event handler, deduplication, suppression filters, and queue logger.
- [`lib/email/service.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/email/service.ts): Template editor, automation controls, delivery stats, support tickets, and audit trails.
- [`app/admin/communications/email/page.tsx`](file:///Users/quantum/Desktop/MENTOR%20MAZE/app/admin/communications/email/page.tsx): Admin Email Management Center.
- [`app/admin/support/page.tsx`](file:///Users/quantum/Desktop/MENTOR%20MAZE/app/admin/support/page.tsx): Admin Support Ticket & Inquiry Management.
- [`app/support/page.tsx`](file:///Users/quantum/Desktop/MENTOR%20MAZE/app/support/page.tsx): User-facing support ticket portal.
- [`app/settings/email-preferences/page.tsx`](file:///Users/quantum/Desktop/MENTOR%20MAZE/app/settings/email-preferences/page.tsx): User email preferences.
- [`app/unsubscribe/page.tsx`](file:///Users/quantum/Desktop/MENTOR%20MAZE/app/unsubscribe/page.tsx): 1-click unsubscribe endpoint.

