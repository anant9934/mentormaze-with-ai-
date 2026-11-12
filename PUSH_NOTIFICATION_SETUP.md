# MentorMaze Browser Push Notification Setup & Deployment Guide
**Platform:** MentorMaze by AI Tathastu  
**Domain:** `https://mentormaze.aitathastu.com`  

---

## 1. Overview

MentorMaze implements standards-compliant Web Push using the W3C Push API and IETF RFC 8292 Voluntary Application Server Identification (VAPID). This enables sending real-time desktop and mobile push notifications to students and mentors even when browser tabs are closed.

---

## 2. Technical Stack & File Architecture

* **Service Worker:** `/public/sw.js`
  * Listens to `'push'` events, parses JSON payloads, displays notifications with icons and action tags.
  * Listens to `'notificationclick'` events, focuses open MentorMaze tabs or opens target deep-links.
* **VAPID Key Manager & Sender:** `/lib/notifications/web-push.ts`
  * Standards-compliant ES256 VAPID token generation with ECDSA/HMAC signing.
  * Handles HTTP 404/410 push endpoint auto-pruning.
* **Client Bell Component:** `/components/layout/notification-bell.tsx`
  * Features an interactive one-click "Enable Browser Alerts" banner.
* **Subscription Endpoints:**
  * `GET /api/notifications/push/key`: Exposes VAPID public key.
  * `POST /api/notifications/push/subscribe`: Registers endpoint and encryption keys (`p256dh`, `auth`).
  * `DELETE /api/notifications/push/subscribe`: Unregisters endpoint.
  * `POST /api/notifications/push/test`: Dispatches an immediate test push alert.

---

## 3. Environment Variables (VAPID Configuration)

Add the following environment variables to `.env` or production deployment settings:

```env
# MentorMaze Web Push VAPID Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIhbQFLXYp5Nksh8U"
VAPID_PRIVATE_KEY="UUxI4smGg_iO_5JvHqYfI_1v6YyViEuiBIa_Ib9_SkvM"
VAPID_SUBJECT="mailto:hellomentormaze@gmail.com"
```

> [!NOTE]
> MentorMaze includes built-in fallback keys so browser push works immediately in local development and staging environments without manual generation.

---

## 4. Browser Support & Compatibility

| Platform / Browser | Support Status | Notes |
|---|---|---|
| Google Chrome (Desktop & Android) | Full Support | Automatic background worker support |
| Mozilla Firefox (Desktop & Android) | Full Support | Powered by Mozilla Autopush |
| Apple Safari (macOS Ventura 13+) | Full Support | Standard W3C Push API |
| Apple Safari (iOS 16.4+) | Full Support | Requires adding app to Home Screen (PWA) |
| Microsoft Edge | Full Support | Standard Windows Action Center notifications |

---

## 5. Testing & Verification

1. Log in to MentorMaze at `https://mentormaze.aitathastu.com` (or `http://localhost:3000`).
2. Navigate to **Notification Settings** (`/settings/notifications`).
3. Click **"Request Permission"** and tap **"Allow"** on the browser prompt.
4. Click the **"Test Push"** button.
5. A live system notification will pop up on your desktop/device with the title:  
   `"MentorMaze Push Test 🚀: Browser push notifications are active and properly configured for your device."`
