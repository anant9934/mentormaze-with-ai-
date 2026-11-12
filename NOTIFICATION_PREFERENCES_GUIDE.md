# MentorMaze User Notification Preferences & Quiet Hours Guide
**Route:** `/settings/notifications`  
**Audience:** Students, Mentors & Administrators  
**Domain:** `https://mentormaze.aitathastu.com`  

---

## 1. Overview

MentorMaze empowers users with granular control over how, when, and where they receive alerts. Preferences are synchronized across all devices and evaluated on the server prior to every notification dispatch.

---

## 2. Preference Controls Breakdown

### A. Delivery Channels
* **In-App Notifications:** Displays badges, live header bell alerts, and dropdown activity.
* **Browser Push Notifications:** Delivers device-level notifications via Web Push even when MentorMaze tabs are closed. Includes interactive permission request and a live "Test Push" diagnostic trigger.
* **Email Notifications:** Delivers transactional email summaries for calendar bookings, invoices, and platform notices.

### B. Activity Alerts
Users can toggle notifications for specific activity categories:
1. **Session Reminders:** 24-hour, 1-hour, and 15-minute countdown reminders before scheduled mentorship sessions.
2. **Direct Messages:** Notifications when a mentor or student sends a chat message.
3. **Mentorship Status:** Updates on booking approvals, reschedules, and feedback reviews.
4. **Mock Interview Practice:** Alerts regarding interview room readiness, scorecards, and rubrics.
5. **Payments & Invoicing:** Cashfree transaction confirmations, tax invoices, and mentor payout settlements.
6. **Platform Announcements:** Optional product updates and career mentorship articles.

---

## 3. Quiet Hours & Timezone Handling

### How Quiet Hours Work:
1. When **Quiet Hours** are enabled, users specify a rest window (e.g., `22:00` to `08:00`).
2. The user selects their local timezone (default: `Asia/Kolkata (IST)`).
3. The server converts current UTC timestamps to the user's configured timezone using the `Intl.DateTimeFormat` API:
   * During quiet hours, non-urgent alerts are **silently persisted** in the in-app notification center.
   * Device push sounds and notifications are muted.
   * In the morning, all alerts are available in the Notification Center for review.

---

## 4. Mandatory Security Delivery Guarantee

> **Policy Guarantee:**
> Critical security alerts—such as single-use password resets, email verification requests, new logins from unrecognized devices, or session cancellations—**strictly bypass** quiet hours and category suppressions to guarantee account integrity and safety.

