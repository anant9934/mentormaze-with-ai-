# MentorMaze — Email Template Catalog (31 Templates)

This catalog indexes all 31 registered, designed email templates supported in the MentorMaze communication engine. Each template features both high-fidelity responsive HTML (with table-based rendering for Outlook and Gmail) and clean plain-text alternatives.

---

## Category A: Authentication and Account (6 Templates)

| Template ID | Name | Trigger Condition | System Critical | Variables Supported |
|---|---|---|---|---|
| `auth.welcome_student` | Welcome Student | Registration as a student | Yes | `{{user_name}}`, `{{profile_url}}` |
| `auth.welcome_mentor` | Welcome Mentor | Registration / Mentor application initiation | Yes | `{{user_name}}`, `{{onboarding_url}}` |
| `auth.email_verification` | Email Verification | Registration or email change | Yes | `{{user_name}}`, `{{verification_url}}`, `{{expires_in}}` |
| `auth.password_reset` | Password Reset Request | Forgot password submission | Yes | `{{user_name}}`, `{{reset_url}}`, `{{expires_in}}` |
| `auth.password_changed` | Password Changed Alert | Password update success | Yes | `{{user_name}}`, `{{timestamp}}` |
| `auth.new_login_alert` | New Sign-In Alert | Sign-in from new device / IP | Yes | `{{user_name}}`, `{{device_browser}}`, `{{ip_address}}`, `{{login_time}}` |

---

## Category B: Student Communication (9 Templates)

| Template ID | Name | Trigger Condition | System Critical | Variables Supported |
|---|---|---|---|---|
| `student.profile_reminder` | Profile Completion Reminder | Incomplete profile after 24 hours | No | `{{user_name}}`, `{{completion_percentage}}`, `{{missing_fields}}` |
| `student.mentor_recommendations` | Mentor Recommendations | Matching engine generates valid matches | No | `{{user_name}}`, `{{target_role}}`, `{{mentor_names}}` |
| `booking.requested_student` | Booking Request Received | Student creates booking request | Yes | `{{user_name}}`, `{{mentor_name}}`, `{{session_type}}`, `{{session_date}}`, `{{session_time}}`, `{{booking_reference}}` |
| `booking.confirmed_student` | Booking Confirmed | Booking confirmed & room generated | Yes | `{{user_name}}`, `{{mentor_name}}`, `{{session_date}}`, `{{session_time}}`, `{{meeting_url}}`, `{{booking_reference}}` |
| `booking.reminder_student` | Upcoming Session Reminder | 24h, 1h, or 15m before confirmed session | Yes | `{{user_name}}`, `{{mentor_name}}`, `{{time_remaining}}`, `{{session_time}}`, `{{meeting_url}}` |
| `booking.rescheduled_student` | Session Rescheduled | Mentor or student modifies time | Yes | `{{user_name}}`, `{{mentor_name}}`, `{{previous_time}}`, `{{new_date}}`, `{{new_time}}`, `{{reason}}` |
| `booking.cancelled_student` | Session Cancelled | Booking cancelled by either party | Yes | `{{user_name}}`, `{{mentor_name}}`, `{{booking_reference}}`, `{{cancellation_initiator}}`, `{{refund_status}}` |
| `booking.completed_student` | Session Completed | Video session concluded | No | `{{user_name}}`, `{{mentor_name}}`, `{{session_notes_url}}` |
| `mock_interview.completed` | Mock Interview Completed | Mentor finalizes rubric evaluation | No | `{{user_name}}`, `{{mentor_name}}`, `{{target_role}}`, `{{overall_score}}`, `{{report_url}}` |

---

## Category C: Mentor Communication (6 Templates)

| Template ID | Name | Trigger Condition | System Critical | Variables Supported |
|---|---|---|---|---|
| `mentor.application_received` | Mentor Application Received | Application submitted by applicant | Yes | `{{user_name}}`, `{{application_id}}`, `{{turnaround_time}}` |
| `mentor.application_approved` | Mentor Application Approved | Admin approves application | Yes | `{{user_name}}`, `{{setup_url}}` |
| `mentor.application_status_update` | Mentor Application Update | Admin requests info / updates status | Yes | `{{user_name}}`, `{{status_title}}`, `{{admin_feedback}}`, `{{action_url}}` |
| `booking.requested_mentor` | New Booking Request | Student books slot with mentor | Yes | `{{mentor_name}}`, `{{student_name}}`, `{{session_type}}`, `{{session_date}}`, `{{session_time}}`, `{{discussion_points}}`, `{{action_url}}` |
| `booking.reminder_mentor` | Mentor Session Reminder | 15m before scheduled session | Yes | `{{mentor_name}}`, `{{student_name}}`, `{{time_remaining}}`, `{{session_time}}`, `{{meeting_url}}` |
| `mentor.earnings_summary` | Mentor Earnings Summary | Monthly or session payout reconciliation | No | `{{mentor_name}}`, `{{period}}`, `{{completed_sessions}}`, `{{gross_earnings}}`, `{{net_payout}}`, `{{settlement_status}}` |

---

## Category D: Payments, Support & System (10 Templates)

| Template ID | Name | Trigger Condition | System Critical | Variables Supported |
|---|---|---|---|---|
| `payment.successful` | Payment Receipt | Cashfree gateway confirms order | Yes | `{{user_name}}`, `{{order_id}}`, `{{amount}}`, `{{session_name}}`, `{{payment_method}}` |
| `payment.failed` | Payment Failed Alert | Payment declined or timed out | Yes | `{{user_name}}`, `{{order_id}}`, `{{failure_reason}}`, `{{retry_url}}` |
| `payment.refund_completed` | Refund Completed | Gateway settles refund | Yes | `{{user_name}}`, `{{order_id}}`, `{{refund_amount}}`, `{{refund_arn}}` |
| `support.ticket_created` | Support Ticket Created | Support ticket logged | Yes | `{{user_name}}`, `{{ticket_number}}`, `{{ticket_subject}}`, `{{category}}`, `{{ticket_url}}` |
| `support.ticket_reply` | Support Agent Reply | Staff posts customer reply | Yes | `{{user_name}}`, `{{ticket_number}}`, `{{ticket_subject}}`, `{{agent_name}}`, `{{reply_message}}`, `{{ticket_url}}` |
| `support.ticket_resolved` | Support Ticket Resolved | Staff marks ticket resolved | Yes | `{{user_name}}`, `{{ticket_number}}`, `{{ticket_subject}}` |
| `system.admin_announcement` | Admin Announcement | Broad community update | No | `{{user_name}}`, `{{announcement_title}}`, `{{announcement_body}}`, `{{action_url}}`, `{{action_label}}` |
| `newsletter.product_update` | Product Updates Digest | Monthly community newsletter | No | `{{user_name}}`, `{{newsletter_headline}}`, `{{newsletter_content}}` |
| `account.deletion_requested` | Account Deletion Request | User requests data erasure | Yes | `{{user_name}}`, `{{user_email}}`, `{{grace_period}}` |
| `privacy.consent_update` | Privacy & Consent Policy Update | Terms / Policy modification | Yes | `{{user_name}}`, `{{effective_date}}`, `{{summary_of_changes}}` |

