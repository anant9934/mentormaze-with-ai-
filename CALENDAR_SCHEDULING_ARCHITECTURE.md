# MentorMaze — Complete Calendar & Scheduling Engine Architecture

**Platform:** [MentorMaze](https://mentormaze.aitathastu.com)  
**Parent Organization:** AI Tathastu  
**Canonical Domain:** `https://mentormaze.aitathastu.com`  
**Document Classification:** Core Infrastructure & System Architecture  
**Status:** Production-Ready  

---

## 1. Executive Summary & Design Principles

The MentorMaze Calendar & Scheduling Engine provides an enterprise-grade, deterministic, and concurrency-safe scheduling infrastructure connecting students and industry mentors. The architecture guarantees zero double-bookings, strict timezone and Daylight Saving Time (DST) accuracy, privacy-preserving two-way external calendar synchronization (Google Calendar), standards-compliant RFC 5545 iCalendar (`.ics`) generation, and temporary slot holds during checkout.

### Core Architectural Axioms

1. **PostgreSQL as Single Source of Truth:** All bookings, holds, recurring availability rules, date exceptions, and external busy caches are persisted in PostgreSQL with absolute UTC timestamps (`TIMESTAMPTZ`).
2. **Two-Tier Concurrency Protection:** Combines an in-process per-mentor mutex queue (`MentorLockManager`) with database-level ACID transactions and row-level locking (`SELECT ... FOR UPDATE`), strictly enforcing `start < B.end AND end > B.start`.
3. **Atomic 10-Minute Checkout Holds:** Prevents cart-racing and checkout collisions by issuing exclusive, idempotent, time-bounded slot holds (`booking_holds`) with automatic expiration cleanup.
4. **Pluggable Calendar Provider Abstraction:** Decoupled `ICalendarProvider` interface allowing seamless addition of Google Calendar, Microsoft 365, and Apple iCloud without touching core booking logic.
5. **Non-Blocking Fault Tolerance:** External calendar failures (network timeout, rate limits, expired tokens) never degrade or block native MentorMaze bookings or user checkout.
6. **Privacy-Preserving Busy Masking:** External calendar events are imported solely as opaque busy intervals (`is_busy: true`); private titles, attendees, and notes from external calendars are never visible to students.

---

## 2. High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer["Client & User Interfaces"]
        StudentUI["Student Booking View<br/>/mentors/[id]/book<br/>BookingCalendar"]
        MentorUI["Mentor Availability Manager<br/>/mentor/availability"]
        AdminUI["Platform Calendar Audit<br/>/admin/calendar"]
        CalendarApps["External Calendar Apps<br/>(Google Cal, Apple Cal, Outlook)"]
    end

    subgraph APILayer["Next.js Route Handlers (Edge / Node)"]
        PublicAvailAPI["GET /api/mentors/[id]/availability"]
        HoldAPI["POST/DEL /api/calendar/holds"]
        MentorSchedAPI["GET/PUT /api/mentor/availability"]
        ExceptionAPI["POST/DEL /api/mentor/availability/exceptions"]
        IcsAPI["GET /api/calendar/bookings/[id]/ics"]
        GoogleAuthAPI["GET /api/calendar/google/auth & callback"]
        GoogleSyncAPI["POST /api/calendar/google/sync"]
        AdminAPI["GET /api/admin/calendar"]
    end

    subgraph EngineLayer["Core Calendar & Scheduling Engine (lib/calendar)"]
        SlotGen["SlotGenerator<br/>(Buffer, Notice, Limits, Timezone)"]
        HoldMgr["BookingHoldManager<br/>(10m Mutex Lock & Idempotency)"]
        AvailSvc["AvailabilityService<br/>(Rules, Exceptions, Conflict Warning)"]
        IcsGen["IcsGenerator<br/>(RFC 5545, VALARM, Escaping)"]
        CryptoUtil["Crypto Token Store<br/>(AES-256-GCM + SHA256 Tag)"]
        GCalAdapter["GoogleCalendarProvider<br/>(freeBusy, Event CRUD)"]
    end

    subgraph ConcurrencyLayer["Concurrency & Mutex Queue"]
        ProcMutex["MentorLockManager<br/>(Node.js Per-Mentor Mutex)"]
        DBTx["PostgreSQL ACID Transaction<br/>(SELECT ... FOR UPDATE)"]
    end

    subgraph StorageLayer["PostgreSQL Database (Neon / PGlite)"]
        T_Rules["availability_rules"]
        T_Exceptions["availability_exceptions"]
        T_Settings["mentor_availability_settings"]
        T_Holds["booking_holds"]
        T_Bookings["bookings"]
        T_Connections["calendar_connections"]
        T_ExtEvents["external_calendar_events"]
    end

    StudentUI --> PublicAvailAPI
    StudentUI --> HoldAPI
    MentorUI --> MentorSchedAPI
    MentorUI --> ExceptionAPI
    MentorUI --> GoogleAuthAPI
    AdminUI --> AdminAPI
    CalendarApps -.-> IcsAPI

    PublicAvailAPI --> SlotGen
    HoldAPI --> HoldMgr
    MentorSchedAPI --> AvailSvc
    ExceptionAPI --> AvailSvc
    IcsAPI --> IcsGen
    GoogleSyncAPI --> GCalAdapter

    HoldMgr --> ProcMutex
    ProcMutex --> DBTx
    SlotGen --> StorageLayer
    DBTx --> StorageLayer
    GCalAdapter --> CryptoUtil
    GCalAdapter --> StorageLayer
```

---

## 3. Database Schema Entity-Relationship Model (DDL)

```mermaid
erDiagram
    users ||--o{ mentor_profiles : owns
    mentor_profiles ||--o{ availability_rules : defines
    mentor_profiles ||--o{ availability_exceptions : overrides
    mentor_profiles ||--|| mentor_availability_settings : configures
    mentor_profiles ||--o{ booking_holds : locks
    mentor_profiles ||--o{ bookings : hosts
    mentor_profiles ||--o{ calendar_connections : links
    calendar_connections ||--o{ external_calendar_events : imports

    mentor_availability_settings {
        uuid id PK
        uuid mentor_profile_id FK "UNIQUE"
        integer buffer_time_minutes "Default 15"
        integer min_notice_hours "Default 2"
        integer max_advance_days "Default 30"
        integer daily_session_limit "Default 4"
        integer weekly_session_limit "Default 20"
        jsonb custom_session_durations "[15,30,45,60]"
        varchar timezone "IANA (Asia/Kolkata)"
        timestamptz updated_at
    }

    availability_rules {
        uuid id PK
        uuid mentor_profile_id FK
        integer day_of_week "0..6 (Sun..Sat)"
        time start_time "HH:MM:SS"
        time end_time "HH:MM:SS"
        boolean is_active "Default true"
    }

    availability_exceptions {
        uuid id PK
        uuid mentor_profile_id FK
        date exception_date "YYYY-MM-DD"
        boolean is_blocked "True = Holiday/Vacation"
        time start_time "Optional custom start"
        time end_time "Optional custom end"
        varchar reason "Reason description"
    }

    booking_holds {
        uuid id PK
        uuid mentor_profile_id FK
        uuid student_user_id FK
        varchar service_type
        integer session_duration_minutes
        timestamptz start_time_utc
        timestamptz end_time_utc
        timestamptz expires_at "NOW() + 10m"
        varchar status "active|converted|expired|released"
        varchar idempotency_key "UNIQUE"
    }

    calendar_connections {
        uuid id PK
        uuid user_id FK
        uuid mentor_profile_id FK
        varchar provider "google_calendar"
        varchar account_email
        text access_token_encrypted "AES-256-GCM"
        text refresh_token_encrypted "AES-256-GCM"
        timestamptz token_expires_at
        varchar status "connected|expired|error"
        timestamptz last_synced_at
    }

    external_calendar_events {
        uuid id PK
        uuid connection_id FK
        uuid mentor_profile_id FK
        varchar external_event_id
        timestamptz start_time_utc
        timestamptz end_time_utc
        boolean is_busy "Default true"
    }
```

---

## 4. Concurrency & Double-Booking Prevention Mechanics

The system guarantees that under high concurrency (e.g. 20 simultaneous students attempting to book the identical slot), exactly one request succeeds and all conflicting requests are rejected with a deterministic HTTP 409 Conflict.

### Two-Tier Concurrency Architecture

1. **Process-Level Mutex (`MentorLockManager`):**
   - Implemented in `lib/db/concurrency.ts`.
   - Uses an asynchronous promise-chaining queue keyed by `mentorProfileId`.
   - Serializes concurrent Node.js async operations targeting the same mentor, eliminating thread contention and race conditions before touching database connection pools.

2. **Database-Level Row Locking (`SELECT ... FOR UPDATE`):**
   - Inside an ACID transaction (`db.transaction`), the mentor profile row is locked with `FOR UPDATE`.
   - An interval overlap check executes in PostgreSQL:
     $$\text{Overlap} \iff (\text{newStart} < \text{existingEnd}) \land (\text{newEnd} > \text{existingStart})$$
   - Confirmed bookings (`status != 'cancelled'`), active unexpired holds (`status = 'active' AND expires_at > NOW()`), and external busy events (`is_busy = true`) are evaluated atomically.
   - If overlap occurs, transaction rolls back immediately with `{ success: false, collision: true }`.

---

## 5. Slot Generation Algorithm

The slot calculation workflow (`SlotGenerator.generateSlots`) executes in five distinct stages:

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant API as GET /api/mentors/[id]/availability
    participant SlotGen as SlotGenerator
    participant DB as PostgreSQL

    Student->>API: Request bookable slots (range, duration, timezone)
    API->>SlotGen: generateSlots(mentorProfileId, start, end, dur, tz)
    SlotGen->>DB: Fetch mentor settings (buffer, notice, limits)
    SlotGen->>DB: Fetch weekly recurring rules
    SlotGen->>DB: Fetch date exceptions (holidays & custom hours)
    SlotGen->>DB: Fetch confirmed bookings in range
    SlotGen->>DB: Fetch active holds in range
    SlotGen->>DB: Fetch external calendar busy intervals
    SlotGen->>SlotGen: Generate candidate windows per day
    SlotGen->>SlotGen: Slice windows into duration-sized slots
    SlotGen->>SlotGen: Enforce buffer time after existing sessions
    SlotGen->>SlotGen: Enforce minimum advance notice cutoff
    SlotGen->>SlotGen: Check daily session limits
    SlotGen->>SlotGen: Convert UTC times to student viewer timezone
    SlotGen-->>API: Return CalendarSlot[]
    API-->>Student: 200 OK JSON response
```

---

## 6. Temporary Booking Hold Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Student selects slot (POST /api/calendar/holds)
    Active --> Converted: Checkout completed within 10 min (createBookingInDb)
    Active --> Released: Student navigates away (DELETE /api/calendar/holds/[id])
    Active --> Expired: 10 minutes elapse without checkout
    Converted --> [*]
    Released --> [*]
    Expired --> [*]
```

1. **Reservation:** Student taps an available slot. The frontend initiates `POST /api/calendar/holds` with an idempotency key.
2. **Locking:** The backend creates a row in `booking_holds` with `status = 'active'` and `expires_at = NOW() + 10 minutes`.
3. **Countdown:** The frontend UI renders an active hold countdown pill (`Held for 09:45`). Other students see this slot as unavailable (`reason: 'held'`).
4. **Completion:** Upon successful payment or confirmation, `consumeHold` marks the hold as `'converted'` and links the confirmed booking.
5. **Expiration:** If the timer reaches zero, the background cleanup worker marks the hold as `'expired'`, automatically freeing the slot.

---

## 7. Google Calendar Integration & Cryptographic Storage

### Modular Interface (`ICalendarProvider`)
The core booking system interacts only with `ICalendarProvider`:
```typescript
export interface ICalendarProvider {
  readonly providerName: "google_calendar" | "microsoft_365";
  fetchFreeBusy(startTimeUtc: Date, endTimeUtc: Date): Promise<ExternalBusyInterval[]>;
  createEvent(booking: BookingCalendarPayload): Promise<{ externalEventId: string; htmlLink?: string } | null>;
  updateEvent(externalEventId: string, booking: BookingCalendarPayload): Promise<{ externalEventId: string } | null>;
  deleteEvent(externalEventId: string): Promise<boolean>;
}
```

### Cryptographic Security (AES-256-GCM)
- OAuth refresh tokens are sensitive secrets. Storing them in plaintext violates production security standards.
- Every token is encrypted via `encryptToken` in `lib/calendar/crypto.ts` using AES-256-GCM with a unique 96-bit random IV and 128-bit authentication tag.
- Formatted as `iv:tag:ciphertext`. Any tampering with the ciphertext causes decryption failure and authentication rejection.

---

## 8. RFC 5545 iCalendar (`.ics`) Implementation

The `.ics` generator (`lib/calendar/ics-generator.ts`) implements RFC 5545 standard calendar objects compatible with Google Calendar, Apple Calendar, and Microsoft Outlook:

- **MIME Type:** `text/calendar; charset=utf-8`
- **Content Disposition:** `attachment; filename="mentormaze-session-<id>.ics"`
- **Required Fields:** `BEGIN:VCALENDAR`, `VERSION:2.0`, `PRODID`, `METHOD:REQUEST`, `BEGIN:VEVENT`, `UID`, `STATUS`, `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`, `LOCATION`, `URL`, `ORGANIZER`, `ATTENDEE`.
- **Integrated Reminder Alarm:** Includes a `BEGIN:VALARM` component with `TRIGGER:-PT15M` alerting the student and mentor 15 minutes prior to the live video session.
- **Line Endings:** RFC 5545 requires CRLF (`\r\n`) line terminations.

