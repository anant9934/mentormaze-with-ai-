# MentorMaze Notification Operations Center — Admin Guide
**Portal Route:** `/admin/communications/notifications`  
**Required Role:** `admin` or `super_admin`  
**Domain:** `https://mentormaze.aitathastu.com`  

---

## 1. Executive Overview

The Notification Operations Center provides platform administrators with real-time visibility into multi-channel communications, system-wide announcement broadcasting, and delivery audit logs.

---

## 2. Key Capabilities & Metrics

### Live Operational Metrics
1. **Dispatched:** Cumulative count of in-app notifications generated across all user workflows.
2. **Channel Deliveries:** Total dispatches across In-App, Real-Time SSE, Browser Push, and Email.
3. **Push Subscriptions:** Number of active verified browser device endpoints registered in the database.
4. **Live Connections:** Real-time count of active user sessions and open browser tabs currently listening to the SSE stream bus (`/api/notifications/stream`).
5. **Announcements:** Total platform announcements broadcasted.

---

## 3. Broadcasting an Announcement

Administrators can broadcast announcements to all users or specific roles with audience segmentation:

### Step-by-Step Instructions:
1. Navigate to `/admin/communications/notifications`.
2. Locate the **"Broadcast Platform Announcement"** panel.
3. Fill in the fields:
   * **Announcement Title:** Brief, high-impact headline (e.g. `System Design Track 2.0 Released`).
   * **Announcement Message:** Detailed update description or markdown body.
   * **Target Audience:**
     * `All Registered Users` — Dispatches to students, mentors, and staff.
     * `Students Only` — Dispatches only to student accounts.
     * `Mentors Only` — Dispatches only to approved mentors.
     * `Platform Admins` — Dispatches internal notices to administrative personnel.
   * **Priority Level:** `normal`, `high`, or `urgent`.
   * **Action Destination URL & Label:** Optional CTA button (e.g. Label: `Explore Features`, URL: `/programs`).
   * **Active Channels:** Select any combination of `in_app`, `push`, and `email`.
4. Click **"Review & Broadcast"**.
5. A confirmation modal will appear showing the estimated recipient count.
6. Click **"Confirm & Send"** to execute the broadcast.

---

## 4. Multi-Channel Delivery Audit Logs

The audit log table tracks every individual delivery attempt across all dispatch channels:

* **Title / Message:** Subject and preview.
* **Channel:** `IN_APP`, `SSE`, `PUSH`, or `EMAIL`.
* **Status:**
  * `delivered` — Successful transmission.
  * `queued` — Enqueued for delivery when the recipient next establishes an active session.
  * `suppressed` — Muted by the recipient's quiet hours or category preferences.
  * `failed` — Transmission error (e.g., expired push endpoint, network failure).
* **Recipient ID:** Masked user UUID.
* **Delivered At:** Exact timestamp.
* **Details:** Verbose error or diagnostic response.

Administrators can filter logs by channel (`All`, `In-App`, `SSE`, `Push`, `Email`) and search by title, user ID, or status.

