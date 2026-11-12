# MentorMaze — Deployment & Hosting Guide

**Deployment Target:** Vercel / Cloudflare Pages / Containerized Node.js  
**Database:** Neon PostgreSQL Serverless  
**Storage:** Cloudflare R2  
**RTC Media:** LiveKit Cloud  

---

## 1. Hosting Architecture
MentorMaze is built as a Next.js App Router modular monolith. It can be deployed with zero code modification to:
- **Vercel** (Standard Next.js edge & node runtimes)
- **Render / Railway / Fly.io** (Docker containerized)
- **Cloudflare Pages / OpenNext**

---

## 2. Step-by-Step Vercel Deployment

1. **Connect Repository:** Import the `MENTOR MAZE` Git repository in the Vercel dashboard.
2. **Framework Preset:** Select `Next.js`.
3. **Environment Variables:** Populate production values for:
   - `DATABASE_URL` (From your Neon console)
   - `AUTH_SECRET` (Run `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (`https://mentormaze.com`)
   - `LIVEKIT_API_KEY` & `LIVEKIT_API_SECRET`
   - `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_ENVIRONMENT=TEST`
4. **Build Command:** `npm run build`
5. **Output Directory:** `.next` (default)
6. **Deploy:** Click Deploy.

---

## 3. Database Migration Run
Run migrations against production Neon database:
```bash
npx drizzle-kit push
```
All tables, constraints, foreign keys, and indexes are automatically applied.
