# MentorMaze Real-Time Notification & Alert Management System — Architecture
**Platform:** MentorMaze by AI Tathastu  
**Domain:** `https://mentormaze.aitathastu.com`  

---

## 1. System Overview

MentorMaze's notification infrastructure is built as a unified, multi-channel alert delivery pipeline that guarantees message persistence in PostgreSQL before dispatching across real-time channels:

```
[ Application Events / User Actions / Cron Scheduler ]
                         │
                         ▼
             [ NotificationService ]
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
[ User Preferences ] [ Quiet Hours ] [ Suppression Engine ]
        │                │                │
        └────────────────┼────────────────┘
                         │ (Validates recipient rules)
                         ▼
             [ PostgreSQL Persistence ]
         (notifications, deliveries, audit)
                         │
      ┌───────────┬──────┴───────┬────────────┐
      ▼           ▼              ▼            ▼
 [ In-App ] [ Real-Time SSE ] [ Web Push ] [ Email Engine ]
(Header bell (Multi-tab sync  (VAPID RFC   (RFC 8058,
 & /notifs)   stream bus)      8292 & SW)   Postmaster)
```

---

## 2. Core Architecture Principles

1. **PostgreSQL as the Single Source of Truth:**
   Real-time channels (SSE, Web Push, WebSockets) are delivery transports, never data stores. Every notification is first committed to the `notifications` table with an idempotent UUID before being enqueued or streamed.
2. **Multi-Tab Real-Time Synchronization:**
   The `notificationEventBus` manages open Server-Sent Events (SSE) connections. When a notification is marked read in Tab 1, an event is broadcast to all active connections for that `userId`, updating the unread badge across Tab 2 and Tab 3 instantaneously without requiring page reloads.
3. **Graceful Push Subscription Lifecycle:**
   Browser Web Push uses RFC 8292 VAPID encryption. If a browser returns HTTP 404 or 410 (indicating the user cleared browser data or revoked permission), the service automatically deletes the dead subscription from `push_subscriptions`.
4. **Timezone-Aware Quiet Hours:**
   Users can configure rest schedules (e.g. 10:00 PM to 8:00 AM in their local timezone like `Asia/Kolkata` or `America/New_York`). Non-urgent notifications are silently saved in-app and muted on push/sound.
5. **Mandatory Security Delivery:**
   Critical security notices (password resets, unrecognized logins, account status changes) strictly bypass quiet hours and preference suppressions.

---

## 3. Database Schema Reference

### `notifications` Table
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key (gen_random_uuid) |
| `user_id` | UUID | Recipient user ID (foreign key -> users.id) |
| `title` | VARCHAR(255) | Notification title |
| `message` | TEXT | Description or markdown body |
| `type` | VARCHAR(64) | Event type (booking, session, chat, system) |
| `category` | VARCHAR(64) | Category (bookings, messages, payments, mentorship, etc.) |
| `priority` | VARCHAR(32) | Priority (low, normal, high, urgent) |
| `action_url` | TEXT | Destination URL on click |
| `action_label` | VARCHAR(120) | Button text (e.g., "Join Session") |
| `is_read` | BOOLEAN | Read status (default: false) |
| `read_at` | TIMESTAMPTZ | Timestamp when marked as read |
| `metadata` | JSONB | Supplementary contextual data |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `notification_preferences` Table
Stores channel toggles (`in_app_enabled`, `push_enabled`, `email_enabled`), category switches (`booking_reminders`, `chat_messages`, etc.), and quiet hours configuration (`quiet_hours_enabled`, `quiet_hours_start`, `quiet_hours_end`, `timezone`).

### `push_subscriptions` Table
Stores browser push endpoints and authentication keys (`endpoint`, `p256dh`, `auth`, `user_agent`).

### `notification_deliveries` Table
Audit logs for every dispatch across `in_app`, `sse`, `push`, and `email` channels with status (`delivered`, `queued`, `failed`, `suppressed`).

### `notification_announcements` Table
Stores admin broadcast notices with audience targeting (`all`, `students`, `mentors`, `admins`).

### `scheduled_notifications` Table
Stores future reminders (24h, 1h, 15m) tied to confirmed bookings. Automatically invalidated if a booking is rescheduled or cancelled.

