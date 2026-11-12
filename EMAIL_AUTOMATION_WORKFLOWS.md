# MentorMaze — Automated Email Workflows & Trigger Engine

The MentorMaze automation engine coordinates platform lifecycle events to ensure students, mentors, and administrators receive deterministic, timely notifications.

---

## 1. Automated Workflow Registry

| Automation Name | Event Identifier | Default Template | Recipient Scope | Default Delay | Quiet Hours | Max Retries |
|---|---|---|---|---|---|---|
| **Welcome Email** | `user.registered` | `auth.welcome_student` | Student | 0s | Disabled | 5 |
| **Email Verification** | `user.email_verification_requested` | `auth.email_verification` | User | 0s | Disabled | 5 |
| **Password Reset** | `user.password_reset_requested` | `auth.password_reset` | User | 0s | Disabled | 5 |
| **Password Changed** | `user.password_changed` | `auth.password_changed` | User | 0s | Disabled | 5 |
| **New Sign-In Alert** | `user.new_login_detected` | `auth.new_login_alert` | User | 0s | Disabled | 5 |
| **Profile Reminder** | `student.profile_incomplete` | `student.profile_reminder` | Student | 24 Hours | Enabled | 3 |
| **Mentor Recommendations** | `mentor.matches_generated` | `student.mentor_recommendations` | Student | 1 Hour | Enabled | 3 |
| **Booking Received** | `booking.requested` | `booking.requested_student` | Student | 0s | Disabled | 5 |
| **Mentor Booking Alert** | `booking.requested` | `booking.requested_mentor` | Mentor | 0s | Disabled | 5 |
| **Booking Confirmed** | `booking.confirmed` | `booking.confirmed_student` | Student | 0s | Disabled | 5 |
| **24-Hour Session Reminder** | `booking.reminder_due` | `booking.reminder_student` | Student | 0s | Disabled | 3 |
| **Mentor Session Reminder** | `booking.reminder_due` | `booking.reminder_mentor` | Mentor | 0s | Disabled | 3 |
| **Session Rescheduled** | `booking.rescheduled` | `booking.rescheduled_student` | Student | 0s | Disabled | 5 |
| **Session Cancelled** | `booking.cancelled` | `booking.cancelled_student` | Student | 0s | Disabled | 5 |
| **Session Completed** | `booking.completed` | `booking.completed_student` | Student | 15 Mins | Enabled | 3 |
| **Mock Interview Evaluated** | `mock_interview.completed` | `mock_interview.completed` | Student | 0s | Disabled | 5 |
| **Mentor App Received** | `mentor.application_submitted` | `mentor.application_received` | Mentor | 0s | Disabled | 5 |
| **Mentor App Approved** | `mentor.application_approved` | `mentor.application_approved` | Mentor | 0s | Disabled | 5 |
| **Payment Receipt** | `payment.succeeded` | `payment.successful` | Student | 0s | Disabled | 5 |
| **Payment Failed Alert** | `payment.failed` | `payment.failed` | Student | 0s | Disabled | 5 |
| **Refund Completed** | `payment.refund_completed` | `payment.refund_completed` | Student | 0s | Disabled | 5 |
| **Support Ticket Created** | `support.ticket_created` | `support.ticket_created` | User | 0s | Disabled | 5 |
| **Support Reply Dispatched** | `support.ticket_replied` | `support.ticket_reply` | User | 0s | Disabled | 5 |
| **Support Ticket Resolved** | `support.ticket_resolved` | `support.ticket_resolved` | User | 0s | Disabled | 5 |

---

## 2. Quiet Hours & Delivery Scheduling

- **Quiet Hours Policy**: When enabled on non-critical automations (e.g. Profile Reminders, Marketing Newsletters, Session Feedback Requests), the worker halts dispatches between 10:00 PM and 8:00 AM IST. Queued jobs are scheduled for the next morning.
- **Critical Exemption**: Security alerts, verification codes, password resets, and session reminders scheduled within 2 hours are exempt from quiet hours and fire immediately.

---

## 3. Retry Architecture & Exponential Backoff

When transient network errors or SMTP rate limits occur:
1. `Attempt 1`: Immediate dispatch.
2. `Attempt 2`: Retries after 5 seconds (`2^1 * 2.5s`).
3. `Attempt 3`: Retries after 10 seconds (`2^2 * 2.5s`).
4. `Attempt 4`: Retries after 20 seconds (`2^3 * 2.5s`).
5. `Attempt 5`: Retries after 40 seconds.
6. `Exhaustion`: Moves to `dead_letter` status in `outbox_events` and marks as `failed` in `email_delivery_logs`. Administrators can trigger manual retries with a single click from the Admin Email Management Center.
