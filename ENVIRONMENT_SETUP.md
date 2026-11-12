# MentorMaze — Environment Setup & Configuration

This guide explains how to configure and run MentorMaze locally or in production.

---

## 1. Prerequisites
- **Node.js:** v20.x or v24.x (`node -v`)
- **Package Manager:** npm v10+ or pnpm
- **Git**

---

## 2. Environment Variables (`.env`)

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Required in Dev | Description | Default / Example |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Public origin URL | `http://localhost:3000` |
| `DATABASE_URL` | Optional in local dev | Neon PostgreSQL connection string | `postgresql://...` |
| `AUTH_SECRET` | Yes | 32-character secret for sessions | `mentormaze_dev_jwt_secret...` |
| `AI_TATHASTU_SSO_URL` | Optional | Identity Provider endpoint | `https://auth.aitathastu.com` |
| `LIVEKIT_API_KEY` | Optional in dev | LiveKit WebRTC Key | `devkey` |
| `LIVEKIT_API_SECRET` | Optional in dev | LiveKit WebRTC Secret | `secret_livekit_key_placeholder` |
| `NEXT_PUBLIC_LIVEKIT_URL` | Optional in dev | LiveKit WebRTC WebSocket URL | `wss://mentormaze-dev.livekit.cloud` |
| `CASHFREE_ENVIRONMENT` | Yes | Gateway mode (`TEST` or `PRODUCTION`) | `TEST` |
| `CASHFREE_APP_ID` | Optional in dev | Cashfree API App ID | `CF_TEST_APP_ID` |
| `CASHFREE_SECRET_KEY` | Optional in dev | Cashfree API Secret | `CF_TEST_SECRET_KEY` |
| `CASHFREE_WEBHOOK_SECRET` | Optional in dev | Webhook HMAC secret | `CF_TEST_WEBHOOK_SECRET` |

---

## 3. Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Build production bundle
npm run build

# 4. Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.
Use the top **Role Switcher** bar to toggle instantly between:
- **Student:** Anant Kumar
- **Mentor:** Priya Sharma
- **Admin:** Platform Admin
