# MentorMaze Notification Event Catalog
**Platform:** MentorMaze by AI Tathastu  
**Domain:** `https://mentormaze.aitathastu.com`  

---

## 1. Overview

This catalog enumerates all notification events across MentorMaze, detailing default delivery channels, priority levels, payload variables, and trigger points.

---

## 2. Event Inventory

### Category: Bookings & Sessions (`bookings`)

| Event Name | Trigger Condition | Default Channels | Priority | Action URL |
|---|---|---|---|---|
| `booking.created` | Student books a session with a mentor | In-App, SSE, Push, Email | `high` | `/dashboard/sessions` |
| `booking.confirmed` | Mentor confirms slot or payment succeeds | In-App, SSE, Push, Email | `high` | `/dashboard/sessions` |
| `booking.cancelled` | Session cancelled by student, mentor, or admin | In-App, SSE, Push, Email | `urgent` | `/dashboard/sessions` |
| `booking.rescheduled` | Session time slot moved | In-App, SSE, Push, Email | `high` | `/dashboard/sessions` |
| `session.reminder_24h` | 24 hours prior to session start | In-App, Push, Email | `normal` | `/dashboard/sessions` |
| `session.reminder_1h` | 1 hour prior to session start | In-App, Push, Email | `high` | `/dashboard/sessions` |
| `session.reminder_15m` | 15 minutes prior to session start | In-App, SSE, Push | `urgent` | `/sessions/:id/live` |
| `session.live_starting` | Meeting room opened and live | In-App, SSE, Push | `urgent` | `/sessions/:id/live` |

---

### Category: Messages & Communication (`messages`)

| Event Name | Trigger Condition | Default Channels | Priority | Action URL |
|---|---|---|---|---|
| `chat.message_received` | New direct chat message from mentor/student | In-App, SSE, Push | `normal` | `/dashboard/messages` |
| `support.ticket_created` | Support inquiry submitted | In-App, Email | `normal` | `/support?ticket=:id` |
| `support.ticket_replied` | Support agent responds to ticket | In-App, SSE, Push, Email | `high` | `/support?ticket=:id` |
| `support.ticket_resolved` | Support ticket marked resolved | In-App, Email | `normal` | `/support?ticket=:id` |

---

### Category: Mentorship & Applications (`mentorship`)

| Event Name | Trigger Condition | Default Channels | Priority | Action URL |
|---|---|---|---|---|
| `mentor.application_submitted` | New mentor application filed | In-App, Email | `normal` | `/admin/verification` |
| `mentor.application_approved` | Admin approves mentor profile | In-App, SSE, Push, Email | `high` | `/mentor/dashboard` |
| `mentor.application_rejected` | Admin requests changes or rejects | In-App, Email | `normal` | `/mentor/application` |
| `mentor.feedback_submitted` | Student writes session review | In-App, SSE | `normal` | `/mentor/dashboard/reviews` |

---

### Category: Mock Interviews (`mock_interviews`)

| Event Name | Trigger Condition | Default Channels | Priority | Action URL |
|---|---|---|---|---|
| `mock_interview.booked` | Interview slot reserved | In-App, SSE, Push, Email | `high` | `/dashboard/mock-interviews` |
| `mock_interview.scorecard_ready`| Mentor publishes interview rubric & score | In-App, SSE, Push, Email | `high` | `/dashboard/mock-interviews` |
| `mock_interview.recording_ready`| LiveKit recording processed | In-App | `normal` | `/dashboard/mock-interviews` |

---

### Category: Payments & Ledger (`payments`)

| Event Name | Trigger Condition | Default Channels | Priority | Action URL |
|---|---|---|---|---|
| `payment.success` | Student checkout completed via Cashfree | In-App, SSE, Email | `high` | `/dashboard/sessions` |
| `payment.refund_processed` | Refund issued for cancelled booking | In-App, Email | `high` | `/dashboard/sessions` |
| `payment.mentor_payout` | Admin settles 85% mentor payable | In-App, Email | `high` | `/mentor/dashboard/payouts` |

---

### Category: Account & Security (`account_security`)
> **Note:** Account security alerts **strictly bypass** quiet hours and user channel suppressions.

| Event Name | Trigger Condition | Default Channels | Priority | Action URL |
|---|---|---|---|---|
| `security.password_changed` | User changes password | In-App, Email | `urgent` | `/settings/security` |
| `security.new_login` | Login from unrecognized browser or IP | In-App, Email | `urgent` | `/settings/security` |
| `security.account_locked` | Multiple failed authentication attempts | In-App, Email | `urgent` | `/login` |

---

### Category: Platform Announcements (`announcements`)

| Event Name | Trigger Condition | Default Channels | Priority | Action URL |
|---|---|---|---|---|
| `announcement.published` | Admin publishes announcement | In-App, Push, Email (Optional) | `normal`/`high` | Target Action URL |

