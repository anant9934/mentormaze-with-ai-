# MentorMaze — Deployment & Hosting Guide

**Deployment Target:** Vercel (Frontend / Edge) & Render (Backend / Outbox Worker) / Containerized Node.js  
**Database:** Neon PostgreSQL Serverless  
**Storage:** Cloudflare R2  
**RTC Media:** LiveKit Cloud  

> [!TIP]
> For detailed instructions on deploying the frontend to **Vercel** and the backend API & worker daemon to **Render**, see the dedicated [RENDER_VERCEL_DEPLOYMENT_GUIDE.md](file:///Users/quantum/Desktop/MENTOR%20MAZE/RENDER_VERCEL_DEPLOYMENT_GUIDE.md).

---

## 1. Hosting Architecture
MentorMaze is built with a dual-role Next.js App Router modular architecture:
- **Vercel:** Optimized for Frontend UI, edge caching, serverless actions, and CDN delivery.
- **Render:** Optimized for persistent Backend Web APIs and 24/7 background worker daemons (`render.yaml`).
- **Containerized / Docker:** Self-hosted via multi-stage `Dockerfile`.

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

