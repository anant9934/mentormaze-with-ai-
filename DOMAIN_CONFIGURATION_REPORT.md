# MentorMaze — Official Domain Configuration Report

**Official Production Domain:** `https://mentormaze.aitathastu.com`  
**Parent Organization:** AI Tathastu (`https://aitathastu.com`)  
**Status Date:** November 2026  

---

## 1. Domain Configuration Overview

All application components, authentication handlers, external callback paths, calendar integrations, and metadata engines have been unified around the official domain `https://mentormaze.aitathastu.com`.

---

## 2. Configuration Inventory

| Component / Layer | Configured Location / Value | Classification |
| :--- | :--- | :---: |
| **Next.js Metadata Base** | `metadataBase: new URL("https://mentormaze.aitathastu.com")` in `app/layout.tsx` | `Completed and verified` |
| **Canonical Site URL** | `alternates: { canonical: "https://mentormaze.aitathastu.com" }` in `app/layout.tsx` | `Completed and verified` |
| **Dynamic Sitemap** | `app/sitemap.ts` generates absolute URLs starting with `https://mentormaze.aitathastu.com` | `Completed and verified` |
| **Robots Rules** | `app/robots.ts` publishes sitemap reference to `https://mentormaze.aitathastu.com/sitemap.xml` | `Completed and verified` |
| **PWA Manifest** | `public/manifest.json` configured for standalone installation | `Completed and verified` |
| **Google OAuth Redirect** | `https://mentormaze.aitathastu.com/api/auth/callback/google` in `app/api/auth/callback/google/route.ts` | `Updated but not externally verified` (Requires DNS/Domain live) |
| **AI Tathastu SSO Callback** | `https://mentormaze.aitathastu.com/api/auth/callback/aitathastu` in `.env.production.example` | `Updated but not externally verified` |
| **Cashfree Payment Return** | `https://mentormaze.aitathastu.com/sessions/{id}/confirmation?order_id={order_id}` in `lib/payments/adapter.ts` | `Completed and verified` |
| **Cashfree Webhook Notify** | `https://mentormaze.aitathastu.com/api/payments/webhook` in `lib/payments/adapter.ts` | `Completed and verified` |
| **Calendar (ICS / Google)** | `UID: mm-{id}@mentormaze.aitathastu.com` and dynamic live links in `app/sessions/[id]/confirmation/page.tsx` | `Completed and verified` |

---

## 3. Cookie & Session Security Architecture

Session cookies (`mm_session_token`) are strictly scoped:
- **Cookie Name:** `mm_session_token`
- **Path:** `/`
- **HttpOnly:** `true` (Inaccessible to client-side JavaScript, defeating XSS token theft)
- **SameSite:** `lax` (Guards against CSRF attacks while allowing top-level navigation)
- **Secure:** `true` automatically enforced in `production` environments (`NODE_ENV === "production"`)
- **Domain Scoping:** The cookie is scoped specifically to `mentormaze.aitathastu.com` (not wildcard `.aitathastu.com`), preventing cross-subdomain credential leakage.

---

## 4. Local Development vs. Production Isolation

Local development at `http://localhost:3000` remains fully intact and functional:
- Dynamic fallback checks: `process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")`.
- When running locally, authentication, callbacks, and calendar generation automatically use `localhost:3000`.
- When deployed to production with `NODE_ENV=production` and `NEXT_PUBLIC_APP_URL=https://mentormaze.aitathastu.com`, the official domain takes full precedence.

