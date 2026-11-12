# MentorMaze — LiveKit WebRTC Session Lifecycle & Attendance

**Official Platform:** MentorMaze by AI Tathastu  
**Official Production Domain:** `https://mentormaze.aitathastu.com`  
**WebRTC Protocol:** LiveKit Cloud & Self-Hosted Mesh / SFU with circuit-breaker routing  

---

## 1. Session Lifecycle Overview

MentorMaze connects students and mentors through encrypted, peer-to-peer / SFU WebRTC sessions powered by LiveKit.

To maintain platform safety, privacy, and infrastructure cost-efficiency:
1. **Short-Lived Access Tokens:** Tokens have a strict 1-hour TTL and grant access only to the assigned room.
2. **Strict Join Eligibility Window:** Tokens are only minted between **15 minutes before scheduled start** and **30 minutes after scheduled end**.
3. **Attendance Event Auditing:** Presence events (`joined`, `left`, `ping`) are captured in `session_attendance_events`.
4. **Automated State Progression:** When the first participant joins within the eligibility window, the booking status automatically transitions from `confirmed` to `in_progress`.
5. **Session Conclusion:** Concluding the session records `actual_end_time_utc`, marks the booking `completed`, and triggers notes / evaluation storage.

---

## 2. Join Eligibility Window Enforcement

The `LiveKitTokenService.generateTokenForBooking` method enforces strict temporal boundaries:

```
                          [ Scheduled Session Interval ]
                                [ start to end ]
                                       |
    <--- Window Opens                  |                  Window Closes --->
   [ start_time - 15m ]                |                [ end_time + 30m ]
------------|--------------------------|------------------------|------------
  Blocked   |       Eligible to Mint Token & Join Room          |   Blocked
 (Too Early)|                                                   | (Expired)
```

### Response Status Matrix

| Scenario | Condition | System Action | Error Code |
|---|---|---|---|
| Early Attempt | $t < \text{startTime} - 15\text{m}$ | Token generation rejected | `JOIN_WINDOW_NOT_OPEN` (includes `opensAt`, `minutesUntilOpen`) |
| Valid Join | $\text{startTime} - 15\text{m} \le t \le \text{endTime} + 30\text{m}$ | Token minted with least privilege | `200 OK` (signed JWT) |
| Late Attempt | $t > \text{endTime} + 30\text{m}$ | Token generation rejected | `SESSION_WINDOW_EXPIRED` |
| Cancelled Booking | `status === 'cancelled'` | Token generation rejected | `BOOKING_CANCELLED` |
| Unpaid Booking | `status === 'pending_payment'` | Token generation rejected | `PAYMENT_REQUIRED` |
| Unauthorized User | `userId !== student && userId !== mentor && !admin` | Token generation rejected | `UNAUTHORIZED_PARTICIPANT` |

---

## 3. Least-Privilege LiveKit Access Token Grants

LiveKit tokens are minted using `livekit-server-sdk` with restricted room-level permissions:

```typescript
const tokenGenerator = new AccessToken(provider.apiKey, provider.apiSecret, {
  identity: userId,
  name: userName || (isMentor ? "Mentor" : "Student Participant"),
  ttl: "3600s",
});

// Least-privilege grant: strictly locked to assigned room name
tokenGenerator.addGrant({
  roomJoin: true,
  room: assignment.roomName,
  canPublish: true,
  canSubscribe: true,
  canPublishData: true,
});
```

---

## 4. Participant Attendance Logging (`session_attendance_events`)

```sql
CREATE TABLE IF NOT EXISTS session_attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(32) NOT NULL, -- student, mentor, admin
  event_type VARCHAR(32) NOT NULL, -- joined, left, ping
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  metadata JSONB
);
```

### Automated State Transition on Join
When `/api/sessions/[id]/attendance` receives an event with `eventType === 'joined'`:
1. Checks the booking status.
2. If `status === 'confirmed'`, invokes `BookingStateMachine.transition(bookingId, 'in_progress', { ... })`.
3. Records `actual_start_time_utc = NOW()`.
4. Appends audit event to `booking_events`.

---

## 5. LiveKit Provider Circuit Breaking & Session Pinning

MentorMaze features a multi-provider LiveKit routing architecture (`LiveKitRouter` and `LiveKitRegistry`):
- Sessions are pinned to an assigned provider on first token minting to prevent split-brain WebRTC rooms.
- Providers maintain circuit-breaker states (`CLOSED`, `HALF_OPEN`, `OPEN`).
- Health checks run periodically. If a provider degrades, incoming new sessions failover to healthy alternatives while existing pinned sessions remain undisturbed.

