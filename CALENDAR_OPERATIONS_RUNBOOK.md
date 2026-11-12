# MentorMaze — Calendar & Scheduling Engine Operations Runbook

**Platform:** [MentorMaze](https://mentormaze.aitathastu.com)  
**Parent Organization:** AI Tathastu  
**Target Audience:** SRE, Platform Engineers & Operations On-Call  
**Canonical Domain:** `https://mentormaze.aitathastu.com`  
**Document Classification:** SRE Runbook & Operational Procedures  
**Status:** Active  

---

## 1. Automated Background Cron Jobs & Maintenance

The calendar and scheduling engine relies on three recurring maintenance tasks:

### 1.1 Hold Expiration Cleanup Job
- **Purpose:** Marks holds older than 10 minutes as `'expired'`, restoring abandoned checkout slots to public availability.
- **Method:** `BookingHoldManager.cleanupExpiredHolds()`
- **SQL Executed:**
  ```sql
  UPDATE booking_holds
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at <= NOW();
  ```
- **Frequency:** Every 2 minutes via `app/api/cron/outbox` or external cron dispatcher.

### 1.2 Google Calendar FreeBusy Sync Job
- **Purpose:** Refreshes external busy intervals for active calendar connections (`calendar_connections.status = 'connected'`).
- **Endpoint:** `POST /api/calendar/google/sync`
- **Frequency:** Every 15 minutes.
- **Timeout Budget:** 10 seconds per mentor; non-blocking.

### 1.3 Outbox Notification & Calendar Event Dispatcher
- **Purpose:** Processes `booking.created`, `booking.rescheduled`, and `booking.cancelled` events, updating external calendar entries and dispatching confirmation emails.
- **Route:** `GET /api/cron/outbox`
- **Frequency:** Every 60 seconds.

---

## 2. Key Monitoring Metrics & Alert Thresholds

| Metric | Source | Normal Range | Alert Threshold | Action |
|---|---|---|---|---|
| **Slot Hold Collision Rate** | `/api/calendar/holds` (409 status) | < 2% of requests | > 10% sustained for 5m | Investigate high-demand mentor or bot traffic |
| **Active Holds Count** | `booking_holds` table | 0 – 50 concurrent | > 500 concurrent | Check for stuck holds; run cleanup job |
| **API Latency (p95)** | `/api/mentors/[id]/availability` | < 120ms | > 500ms | Inspect database connection pool & indexes |
| **Google Sync Errors** | `calendar_connections.last_error` | 0 errors | > 5 failures / hour | Check Google OAuth quota or refresh token revocation |
| **Double Bookings Count** | Integrity audit query | **STRICTLY 0** | **> 0 (P0 Critical)** | Page on-call immediately; run concurrency diagnostic |

---

## 3. SQL Diagnostic & Health Check Queries

Run these queries on PostgreSQL (via CLI or Neon console) to inspect system health:

### 3.1 Verify Zero Double-Bookings (P0 Invariant Check)
```sql
SELECT 
  b1.mentor_profile_id,
  b1.id AS booking_1_id,
  b2.id AS booking_2_id,
  b1.start_time_utc AS b1_start,
  b1.end_time_utc AS b1_end,
  b2.start_time_utc AS b2_start,
  b2.end_time_utc AS b2_end
FROM bookings b1
JOIN bookings b2 ON b1.mentor_profile_id = b2.mentor_profile_id
  AND b1.id != b2.id
  AND b1.status != 'cancelled'
  AND b2.status != 'cancelled'
  AND b1.start_time_utc < b2.end_time_utc
  AND b1.end_time_utc > b2.start_time_utc;
-- MUST ALWAYS RETURN 0 ROWS
```

### 3.2 Inspect Stale Active Holds
```sql
SELECT id, mentor_profile_id, student_user_id, start_time_utc, expires_at, NOW() - expires_at AS overdue_by
FROM booking_holds
WHERE status = 'active'
  AND expires_at < NOW() - INTERVAL '5 minutes';
```

### 3.3 Check Google Calendar Connection Health
```sql
SELECT 
  id, 
  mentor_profile_id, 
  account_email, 
  status, 
  last_synced_at, 
  NOW() - last_synced_at AS time_since_sync, 
  last_error
FROM calendar_connections
ORDER BY last_synced_at ASC NULLS FIRST
LIMIT 20;
```

---

## 4. Incident Troubleshooting Runbooks

### Runbook A: Double-Booking Report
1. **Acknowledge P0 Incident:** Notify engineering leadership.
2. **Execute Diagnostic Query 3.1:** Verify if an overlap genuinely exists in PostgreSQL.
3. **Inspect Cancellation Status:** Often one of the bookings was cancelled (`status = 'cancelled'`) but client-side cache showed it as active.
4. **Inspect Transaction Logs:** If an actual overlap occurred, inspect `lib/db/booking-service.ts` transaction isolation level. Verify whether `MentorLockManager` was bypassed.
5. **Customer Resolution:** Offer immediate priority reschedule to the later-booking student with full platform credit.

### Runbook B: Google Calendar Synchronization Failure
1. **Symptoms:** Mentor reports external Google meetings are not blocking slots on MentorMaze.
2. **Check Connection Status:** Query `calendar_connections` for mentor's profile.
3. **Inspect Error Column:**
   - If `invalid_grant`: Refresh token was revoked by user or expired (Google test credentials expire after 7 days if project is unverified). Instruct mentor to disconnect and reconnect on `/mentor/availability`.
   - If `rateLimitExceeded`: Google Calendar v3 API rate limit reached (10 queries/second per user). Adjust sync interval.
4. **Trigger Manual Sync:** Call `POST /api/calendar/google/sync` with `{ "mentorProfileId": "..." }`.

### Runbook C: Slot Display Offset / Timezone Discrepancy
1. **Symptoms:** Student in US complains session displays at wrong time.
2. **Verify Mentor Timezone:** Check `mentor_availability_settings.timezone` (e.g. `Asia/Kolkata`).
3. **Verify Student Request Timezone:** Verify the student's browser sent `?timezone=America/New_York`.
4. **Verify Database UTC Storage:** Confirm `bookings.start_time_utc` ends in `Z` and matches expected UTC instant.
5. **Explain Offset to User:** Clarify that times displayed on `/mentors/[id]/book` are local to the student's browser.

---

## 5. Disaster Recovery & Data Consistency Procedures

### Manual Hold Force-Release
If an active hold is stuck and blocking a slot:
```sql
UPDATE booking_holds
SET status = 'released'
WHERE id = '<hold_uuid>';
```

### Reset Mentor Weekly Schedule to Defaults
If a mentor's schedule configuration becomes corrupted:
```sql
DELETE FROM availability_rules WHERE mentor_profile_id = '<mentor_uuid>';

INSERT INTO availability_rules (mentor_profile_id, day_of_week, start_time, end_time, is_active)
VALUES 
  ('<mentor_uuid>', 1, '10:00', '13:00', true),
  ('<mentor_uuid>', 1, '14:00', '18:00', true),
  ('<mentor_uuid>', 2, '10:00', '13:00', true),
  ('<mentor_uuid>', 2, '14:00', '18:00', true),
  ('<mentor_uuid>', 3, '10:00', '13:00', true),
  ('<mentor_uuid>', 3, '14:00', '18:00', true),
  ('<mentor_uuid>', 4, '10:00', '13:00', true),
  ('<mentor_uuid>', 4, '14:00', '18:00', true),
  ('<mentor_uuid>', 5, '10:00', '13:00', true),
  ('<mentor_uuid>', 5, '14:00', '18:00', true);
```

