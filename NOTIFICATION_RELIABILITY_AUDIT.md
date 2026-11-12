# MentorMaze — Notification Reliability & Multi-Channel Audit Report

**Date of Audit:** November 13, 2026  
**Auditor:** Antigravity AI Engineering  
**Platform Domain:** `https://mentormaze.aitathastu.com`  
**Classification:** **VERIFIED**  

---

## 1. Executive Summary

This audit evaluated the resilience, data integrity, user isolation, and multi-channel delivery guarantees of the MentorMaze Real-Time Notification System.

All 10 reliability constraints defined in the engineering audit specifications were tested and verified.

---

## 2. Notification Reliability Verification Matrix

| Reliability Constraint | Implementation Mechanism | Verification Evidence | Audit Verdict |
|---|---|---|---|
| **Persistence Before Broadcast** | Notification record is committed to PostgreSQL `notifications` table before SSE streaming or Web Push | `lib/notifications/service.ts:203` commits row before calling `broadcastToUser` | **VERIFIED** |
| **Non-Destructive Failures** | Failure of SSE, Web Push, or Email logs failure in `notification_deliveries` without deleting or corrupting in-app record | In-app record remains intact even when Web Push fails or returns 410 Gone | **VERIFIED** |
| **Idempotency Deduplication** | Dispatches accepting `idempotencyKey` check existing keys before inserting | Tested in `tests/notifications.test.ts` (returns `duplicate: true`, identical ID) | **VERIFIED** |
| **Dead-Letter Audit Trail** | Failed delivery attempts log exact error strings in `notification_deliveries` with status `failed` | Inspectable in `/admin/communications/notifications` logs table | **VERIFIED** |
| **Expired Push Auto-Pruning** | If push gateway returns HTTP 404 or 410, subscription row is deleted from `push_subscriptions` | Handled in `sendWebPushNotification` and pruned in `service.ts:262` | **VERIFIED** |
| **Multi-User Isolation** | Queries and mutations enforce `AND user_id = :userId` | User B cannot view, mark read, or delete User A's alerts | **VERIFIED** |
| **Timezone-Aware Quiet Hours** | `isWithinQuietHours` converts current UTC time to user's configured timezone using `Intl.DateTimeFormat` | Tested across day, night, and cross-midnight schedules | **VERIFIED** |
| **Security Alert Guarantee** | Priority `urgent` and category `account_security` strictly bypass quiet hours and category suppressions | Tested in `tests/notifications.test.ts` with disabled marketing prefs | **VERIFIED** |
| **Reschedule Invalidation** | Rescheduling or cancelling a booking cancels pending scheduled reminders | `cancelBookingReminders(bookingId)` marks records `cancelled` | **VERIFIED** |
| **Multi-Tab Sync** | Event bus broadcasts `read_status` and `read_all` across open SSE tabs of the authenticated user | Tested with multiple concurrent mock SSE controllers | **VERIFIED** |

---

## 3. Detailed Reliability Deep-Dives

### A. Idempotency & Deduplication
When upstream systems (such as payment webhooks or background workers) re-fire events due to transient network retries, `NotificationService.dispatch()` evaluates the unique `idempotencyKey`:
```typescript
if (input.idempotencyKey) {
  const existing = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.idempotencyKey, input.idempotencyKey))
    .limit(1);

  if (existing && existing.length > 0) {
    return {
      success: true,
      notification: existing[0],
      duplicate: true,
      delivery: { inApp: true, sse: false, pushCount: 0, quietHoursApplied: false },
    };
  }
}
```
* **Verified Result:** The existing notification is returned immediately; no duplicate notification rows, SSE packets, or push bursts are emitted.

### B. User Isolation Security Perimeter
A dedicated test was executed across two distinct user IDs:
* User A: `550e8400-e29b-41d4-a716-446655440000`
* User B: `660e8400-e29b-41d4-a716-446655440001`

**Test Results:**
1. A notification dispatched to User A is never returned in `getNotifications(userB)`.
2. Invoking `markAsRead(notificationA.id, userB)` returns `undefined` and leaves the notification unread.
3. Invoking `deleteNotification(notificationA.id, userB)` does not delete the notification from User A's mailbox.

### C. Booking Rescheduling & Reminder Life-Cycle
In `lib/db/booking-service.ts`, `rescheduleBookingInDb` updates the start time and executes:
```typescript
await notificationService.cancelBookingReminders(bookingId);
await notificationService.scheduleBookingReminders({
  id: bookingId,
  studentUserId: booking.student_user_id,
  mentorUserId: booking.mentor_user_id,
  startTime: new Date(newStartTimeUtc),
  title: booking.service_type || "Mentorship Session",
});
```
* **Verified Result:** Stale countdown reminders for the old slot are marked `cancelled` and will not trigger; fresh 24h, 1h, and 15m reminders are registered against the updated start timestamp.

