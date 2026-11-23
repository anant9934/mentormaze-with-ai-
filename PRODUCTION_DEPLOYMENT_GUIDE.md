# MentorMaze — Production Deployment Guide

**Target Domain:** `https://mentormaze.aitathastu.com`  
**Parent Domain:** `aitathastu.com`  
**Hosting Compatibility:** Vercel / Render / AWS / Docker  
**Status Date:** November 2026  

---

## 1. DNS Configuration Requirements

To point `mentormaze.aitathastu.com` to the production hosting deployment, configure the following DNS record on the authoritative DNS management panel for `aitathastu.com` (e.g., Cloudflare, Route53, GoDaddy, or Namecheap):

### Standard Vercel DNS Record
| Type | Name / Subdomain | Target / Value | TTL | Proxy Status |
| :---: | :---: | :---: | :---: | :---: |
| **CNAME** | `mentormaze` | `cname.vercel-dns.com` | `Auto` (or `300`) | DNS Only (Gray Cloud) initially for SSL issuance |

### Standard Render DNS Record (if deployed on Render)
| Type | Name / Subdomain | Target / Value | TTL |
| :---: | :---: | :---: | :---: |
| **CNAME** | `mentormaze` | `<service-name>.onrender.com` | `Auto` |

> [!IMPORTANT]
> **Safety Notice:** Do not modify the apex domain `aitathastu.com` or existing subdomains (`auth.aitathastu.com`, `app.aitathastu.com`). Only add the single dedicated subdomain record for `mentormaze`.

---

## 2. Production Environment Variables Checklist

Set the following environment variables in the hosting dashboard (e.g., Vercel Project Settings $\rightarrow$ Environment Variables):

| Variable Name | Production Value / Instruction | Classification |
| :--- | :--- | :---: |
| `NODE_ENV` | `production` | `Completed and verified` |
| `NEXT_PUBLIC_APP_NAME` | `MentorMaze` | `Completed and verified` |
| `NEXT_PUBLIC_APP_URL` | `https://mentormaze.aitathastu.com` | `Completed and verified` |
| `NEXTAUTH_URL` | `https://mentormaze.aitathastu.com` | `Completed and verified` |
| `DATABASE_URL` | `postgresql://neondb_owner:[REDACTED_DATABASE_SECRET]@ep-withered-heart-bebleio4-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | `Completed and verified` |
| `DIRECT_DATABASE_URL` | `postgresql://neondb_owner:[REDACTED_DATABASE_SECRET]@ep-withered-heart-bebleio4.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | `Completed and verified` |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` | `Requires hosting dashboard configuration` |
| `GOOGLE_CLIENT_ID` | `65716802967-bm744m2d0m39o08i960tm6q4m07ubfi0.apps.googleusercontent.com` | `Completed and verified` |
| `GOOGLE_CLIENT_SECRET` | `[REDACTED_GOOGLE_CLIENT_SECRET]` | `Completed and verified` |
| `GOOGLE_REDIRECT_URI` | `https://mentormaze.aitathastu.com/api/auth/callback/google` | `Completed and verified` |
| `SMTP_HOST` | `smtp.gmail.com` | `Completed and verified` |
| `SMTP_PORT` | `465` | `Completed and verified` |
| `SMTP_USER` | `hellomentormaze@gmail.com` | `Completed and verified` |
| `SMTP_PASSWORD` | Google App Password | `Completed and verified` |
| `EMAIL_FROM` | `MentorMaze <hellomentormaze@gmail.com>` | `Completed and verified` |
| `LIVEKIT_PRIMARY_PROVIDER_ID` | `meet-2uq83g48` | `Completed and verified` |
| `LIVEKIT_PRIMARY_URL` | `wss://meet-2uq83g48.livekit.cloud` | `Completed and verified` |
| `LIVEKIT_PRIMARY_API_KEY` | `APIjJRP4kUctuJB` | `Completed and verified` |
| `LIVEKIT_PRIMARY_API_SECRET` | Configured in `.env` | `Completed and verified` |
| `LIVEKIT_PRIMARY_WEIGHT` | `80` | `Completed and verified` |
| `LIVEKIT_SECONDARY_PROVIDER_ID`| `meet-q81ufsro` | `Completed and verified` |
| `LIVEKIT_SECONDARY_URL` | `wss://meet-q81ufsro.livekit.cloud` | `Completed and verified` |
| `LIVEKIT_SECONDARY_API_KEY` | `APIUDsvVePTLiJi` | `Completed and verified` |
| `LIVEKIT_SECONDARY_API_SECRET` | Configured in `.env` | `Completed and verified` |
| `LIVEKIT_SECONDARY_WEIGHT` | `20` | `Completed and verified` |

---

## 3. Hosting Custom Domain Verification Steps

1. In the Vercel (or Render) dashboard, navigate to **Settings** $\rightarrow$ **Domains**.
2. Add `mentormaze.aitathastu.com`.
3. Vercel will verify the CNAME record (`cname.vercel-dns.com`).
4. Automatic Let's Encrypt SSL/TLS certificate will be provisioned.
5. Once marked **Valid Configuration** with a green checkmark, the domain is live.

---

## 4. Post-Deployment Verification Checklist

- [ ] Execute `curl -I https://mentormaze.aitathastu.com` $\rightarrow$ Expect `HTTP 200 OK` with valid TLS certificate.
- [ ] Visit `https://mentormaze.aitathastu.com/api/auth/google` $\rightarrow$ Verify redirection to Google OAuth consent screen.
- [ ] Test student sign-in with Google $\rightarrow$ Verify profile creation and redirect to `/dashboard`.
- [ ] Inspect session cookie in browser DevTools $\rightarrow$ Confirm `Secure`, `HttpOnly`, and `SameSite=Lax`.
- [ ] Check `https://mentormaze.aitathastu.com/sitemap.xml` $\rightarrow$ Confirm dynamic generation of all 39+ routes.
- [ ] Check `https://mentormaze.aitathastu.com/robots.txt` $\rightarrow$ Confirm proper crawler directives.

