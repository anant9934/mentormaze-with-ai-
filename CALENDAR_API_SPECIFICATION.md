# MentorMaze — Calendar & Scheduling Engine REST API Specification

**Platform:** [MentorMaze](https://mentormaze.aitathastu.com)  
**Parent Organization:** AI Tathastu  
**Base URL:** `https://mentormaze.aitathastu.com` (Production) / `http://localhost:3000` (Local)  
**Specification Standard:** REST / JSON (RFC 8259) & iCalendar (RFC 5545)  
**Document Classification:** Technical API Reference  
**Status:** Active  

---

## 1. Authentication & Common Headers

- **Public Endpoints:** Read-only slot availability (`GET /api/mentors/[id]/availability`) and ICS download (`GET /api/calendar/bookings/[id]/ics`) require no authentication cookies.
- **Mentor Endpoints:** Require active session cookie `mm_session_token` or administrative clearance.
- **Content-Type:** `application/json` (except ICS download which returns `text/calendar; charset=utf-8`).

---

## 2. Public / Student Booking Endpoints

### 2.1 Calculate Bookable Slots
`GET /api/mentors/{id}/availability`

Dynamically calculates available mentorship slots within a date range, taking into account mentor weekly rules, buffer times, minimum notice, date exceptions, confirmed bookings, active holds, and external Google Calendar busy intervals. Automatically formats times in the requested viewer timezone.

#### Parameters
| Name | Type | In | Required | Description |
|---|---|---|---|---|
| `id` | string | path | Yes | Mentor Profile UUID or slug (e.g. `mentor-priya`) |
| `startDate` | string | query | No | Start date `YYYY-MM-DD` (default: today) |
| `endDate` | string | query | No | End date `YYYY-MM-DD` (default: +14 days) |
| `duration` | integer | query | No | Duration in minutes: 15, 30, 45, 60 (default: 30) |
| `timezone` | string | query | No | Viewer IANA timezone (default: `Asia/Kolkata`) |

#### cURL Example
```bash
curl -X GET "https://mentormaze.aitathastu.com/api/mentors/mentor-priya/availability?duration=30&timezone=Asia/Kolkata" \
  -H "Accept: application/json"
```

#### Response (200 OK)
```json
{
  "success": true,
  "mentorProfileId": "30000000-0000-0000-0000-000000000001",
  "requestedMentorId": "mentor-priya",
  "startDate": "2026-11-15",
  "endDate": "2026-11-29",
  "durationMinutes": 30,
  "viewerTimezone": "Asia/Kolkata",
  "totalSlots": 96,
  "availableSlotsCount": 84,
  "slots": [
    {
      "startTimeUtc": "2026-11-16T04:30:00.000Z",
      "endTimeUtc": "2026-11-16T05:00:00.000Z",
      "startTimeLocal": "10:00 AM",
      "endTimeLocal": "10:30 AM",
      "durationMinutes": 30,
      "available": true
    },
    {
      "startTimeUtc": "2026-11-16T05:00:00.000Z",
      "endTimeUtc": "2026-11-16T05:30:00.000Z",
      "startTimeLocal": "10:30 AM",
      "endTimeLocal": "11:00 AM",
      "durationMinutes": 30,
      "available": false,
      "reason": "booked"
    }
  ]
}
```

---

## 3. Booking Holds (10-Minute Concurrency Locks)

### 3.1 Reserve Slot Hold
`POST /api/calendar/holds`

Atomically acquires an exclusive 10-minute hold for an available slot. Prevents other students from selecting or booking the slot while the reserving user enters payment information.

#### Request Body Schema
```json
{
  "mentorProfileId": "mentor-priya",
  "studentUserId": "00000000-0000-0000-0000-000000000001",
  "serviceType": "1on1_mentorship",
  "sessionDurationMinutes": 30,
  "startTimeUtc": "2026-11-20T10:00:00.000Z",
  "endTimeUtc": "2026-11-20T10:30:00.000Z",
  "idempotencyKey": "hold-student1-1773489200000",
  "holdDurationMinutes": 10
}
```

#### cURL Example
```bash
curl -X POST "https://mentormaze.aitathastu.com/api/calendar/holds" \
  -H "Content-Type: application/json" \
  -d '{
    "mentorProfileId": "mentor-priya",
    "startTimeUtc": "2026-11-20T10:00:00.000Z",
    "endTimeUtc": "2026-11-20T10:30:00.000Z",
    "sessionDurationMinutes": 30,
    "idempotencyKey": "unique-hold-key-101"
  }'
```

#### Response (200 OK)
```json
{
  "success": true,
  "hold": {
    "id": "c1f77d8a-939e-4db9-8df0-1081a29304bd",
    "mentor_profile_id": "30000000-0000-0000-0000-000000000001",
    "student_user_id": "00000000-0000-0000-0000-000000000001",
    "start_time_utc": "2026-11-20 10:00:00+00",
    "end_time_utc": "2026-11-20 10:30:00+00",
    "expires_at": "2026-11-12 20:25:00+00",
    "status": "active"
  },
  "expiresAt": "2026-11-12 20:25:00+00",
  "holdDurationMinutes": 10,
  "message": "Slot held successfully for 10 minutes."
}
```

#### Error Response (409 Conflict)
```json
{
  "success": false,
  "collision": true,
  "error": "Selected slot is currently held by another user completing checkout."
}
```

---

### 3.2 Inspect Hold Status
`GET /api/calendar/holds/{id}`

Returns current validity, remaining time, and active state of a slot hold.

---

### 3.3 Release Slot Hold Manually
`DELETE /api/calendar/holds/{id}`

Releases an active hold immediately when a student navigates away or abandons checkout, restoring the slot to public availability.

---

## 4. RFC 5545 iCalendar (`.ics`) Download

### 4.1 Download Session Calendar Event
`GET /api/calendar/bookings/{id}/ics`

Generates and streams a standards-compliant RFC 5545 `.ics` file containing `VEVENT`, `UID`, `STATUS`, `DTSTART`, `DTEND`, meeting URL, and a `VALARM` 15-minute advance reminder alarm.

#### Response Headers
```http
HTTP/1.1 200 OK
Content-Type: text/calendar; charset=utf-8
Content-Disposition: attachment; filename="mentormaze-session-booking-1.ics"
Cache-Control: no-cache, no-store, must-revalidate
```

#### Response Body
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MentorMaze by AI Tathastu//Scheduling Engine//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:booking-1@mentormaze.aitathastu.com
SEQUENCE:0
STATUS:CONFIRMED
DTSTAMP:20261112T200505Z
DTSTART:20261115T140000Z
DTEND:20261115T150000Z
SUMMARY:MentorMaze Session: 1:1 Mentorship
DESCRIPTION:MentorMaze Mentorship Session by AI Tathastu.\n\nJoin Live Room: https://mentormaze.aitathastu.com/sessions/booking-1/live\nRoom ID: mm-room-priya-anant-101\nOfficial Site: https://mentormaze.aitathastu.com
LOCATION:https://mentormaze.aitathastu.com/sessions/booking-1/live
URL;VALUE=URI:https://mentormaze.aitathastu.com/sessions/booking-1/live
ORGANIZER;CN="MentorMaze by AI Tathastu":mailto:hellomentormaze@gmail.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="Anant Kumar":mailto:anant@example.com
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:MentorMaze Mentorship Session starts in 15 minutes
TRIGGER:-PT15M
END:VALARM
END:VEVENT
END:VCALENDAR
```

---

## 5. Mentor Availability & Schedule Management Endpoints

### 5.1 Get Mentor Schedule Configuration
`GET /api/mentor/availability`

Returns mentor's settings (buffer time, minimum notice, limits, timezone), weekly recurring rules, upcoming 90-day date exceptions, confirmed bookings, and Google Calendar connection status.

---

### 5.2 Update Weekly Recurring Rules & Settings
`PUT /api/mentor/availability`

Updates weekly recurring rules and constraints. Evaluates pre-save conflicts against confirmed bookings unless `forceOverrideConflicts: true` is passed.

#### Request Body Schema
```json
{
  "settings": {
    "bufferTimeMinutes": 15,
    "minNoticeHours": 2,
    "maxAdvanceDays": 30,
    "dailySessionLimit": 4,
    "timezone": "Asia/Kolkata"
  },
  "rules": [
    {
      "dayOfWeek": 1,
      "isActive": true,
      "windows": [
        { "startTime": "10:00", "endTime": "13:00" },
        { "startTime": "18:00", "endTime": "21:00" }
      ]
    }
  ],
  "forceOverrideConflicts": false
}
```

#### Conflict Response (409 Conflict)
```json
{
  "success": false,
  "conflict": true,
  "conflictingBookings": [
    {
      "id": "e87114e0-4e7f-4fe3-b75a-3396abb59456",
      "startTimeUtc": "2026-11-16T14:00:00.000Z"
    }
  ],
  "error": "Cannot update schedule: 1 confirmed student booking(s) fall outside your new hours."
}
```

---

### 5.3 Add Date Exception (Holiday / Custom Hours)
`POST /api/mentor/availability/exceptions`

#### Request Body Schema
```json
{
  "exceptionDate": "2026-12-25",
  "isBlocked": true,
  "reason": "Christmas Holiday Vacation"
}
```

---

### 5.4 Remove Date Exception
`DELETE /api/mentor/availability/exceptions/{id}`

Removes a date override, restoring standard weekly rules for that calendar date.

---

## 6. Google Calendar OAuth & Synchronization Endpoints

### 6.1 Initiate Google Calendar Authorization
`GET /api/calendar/google/auth`

Redirects mentor to Google Identity OAuth 2.0 consent screen requesting `calendar.events` and `calendar.readonly` scopes.

---

### 6.2 Google OAuth Callback
`GET /api/calendar/google/callback?code=...&state=...`

Exchanges authorization code for access & refresh tokens, encrypts tokens via AES-256-GCM, stores in `calendar_connections`, and redirects back to `/mentor/availability?calendar_connected=google`.

---

### 6.3 Synchronize External Busy Periods On-Demand
`POST /api/calendar/google/sync`

Calls Google Calendar `freeBusy` API for the next 30 days, clears old cache, and updates `external_calendar_events`. Non-blocking.

---

## 7. Administrative Oversight Endpoint

### 7.1 Admin Calendar & Hold Overview
`GET /api/admin/calendar`

#### Parameters
| Parameter | Type | In | Description |
|---|---|---|---|
| `startDate` | string | query | Optional start date filter `YYYY-MM-DD` |
| `endDate` | string | query | Optional end date filter `YYYY-MM-DD` |
| `mentorId` | string | query | Optional mentor UUID |
| `status` | string | query | `confirmed`, `completed`, `cancelled` |
| `serviceType` | string | query | `1on1_mentorship`, `group_mentorship`, `mock_interview` |

#### Response (200 OK)
```json
{
  "success": true,
  "totalSessions": 25,
  "activeHoldsCount": 2,
  "sessions": [...],
  "activeHolds": [...]
}
```

