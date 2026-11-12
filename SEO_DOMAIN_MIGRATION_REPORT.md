# MentorMaze — SEO & Public Domain Migration Report

**Official Production Domain:** `https://mentormaze.aitathastu.com`  
**Parent Organization:** AI Tathastu  
**Platform Name:** MentorMaze  
**Status Date:** November 2026  

---

## 1. Executive Summary

Search Engine Optimization (SEO), Open Graph metadata, canonical indexing, dynamic sitemaps, structured data, and crawler policies have been configured for the official domain `https://mentormaze.aitathastu.com`.

No legacy branding (`MentorMatrix`) or development `localhost` URLs remain in public production metadata.

---

## 2. SEO & Metadata Audit Matrix

| SEO Dimension | Value / Implementation Details | Status |
| :--- | :--- | :---: |
| **Homepage Title** | `MentorMaze — Find the Right Mentor for Your Career` | `Completed and verified` |
| **Title Template** | `%s \| MentorMaze by AI Tathastu` | `Completed and verified` |
| **Meta Description** | `Connect with experienced mentors, explore career opportunities, book human mentorship sessions and practice interviews with MentorMaze by AI Tathastu.` | `Completed and verified` |
| **Metadata Base** | `metadataBase: new URL("https://mentormaze.aitathastu.com")` in `app/layout.tsx` | `Completed and verified` |
| **Canonical URL** | `https://mentormaze.aitathastu.com` | `Completed and verified` |
| **Open Graph Site Name** | `MentorMaze by AI Tathastu` | `Completed and verified` |
| **Open Graph Type & URL** | `type: "website"`, `url: "https://mentormaze.aitathastu.com"` | `Completed and verified` |
| **Open Graph Banner** | `https://mentormaze.aitathastu.com/og-image.png` (1200x630) | `Completed and verified` |
| **Twitter Card** | `summary_large_image`, creator: `@aitathastu` | `Completed and verified` |
| **PWA Manifest** | `public/manifest.json` (`short_name: MentorMaze`) | `Completed and verified` |
| **Dynamic Sitemap** | `app/sitemap.ts` (`https://mentormaze.aitathastu.com/sitemap.xml`) | `Completed and verified` |
| **Robots Directive** | `app/robots.ts` (`https://mentormaze.aitathastu.com/robots.txt`) | `Completed and verified` |

---

## 3. Structured Data (Schema.org JSON-LD)

`app/layout.tsx` injects Schema.org compliant structured data into the `<head>` of all pages:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://mentormaze.aitathastu.com/#organization",
      "name": "MentorMaze by AI Tathastu",
      "url": "https://mentormaze.aitathastu.com",
      "parentOrganization": {
        "@type": "Organization",
        "name": "AI Tathastu",
        "url": "https://aitathastu.com"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "hellomentormaze@gmail.com",
        "contactType": "Customer Support"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://mentormaze.aitathastu.com/#website",
      "url": "https://mentormaze.aitathastu.com",
      "name": "MentorMaze",
      "description": "Connect with experienced mentors, explore career opportunities, book human mentorship sessions and practice interviews with MentorMaze by AI Tathastu.",
      "publisher": {
        "@id": "https://mentormaze.aitathastu.com/#organization"
      }
    }
  ]
}
```

---

## 4. Crawling & Indexation Security
- **Allowed Routes:** `/`, `/mentors`, `/mock-interviews`, `/how-it-works`, `/programs`, `/pricing`, `/privacy`, `/terms`.
- **Disallowed Routes (Strictly protected from search engines):**
  - `/admin`, `/admin/*`
  - `/api/*`
  - `/dashboard/messages/*`
  - `/sessions/*/live` (WebRTC private rooms)

---

## 5. Post-DNS Launch Actions
- [ ] Submit `https://mentormaze.aitathastu.com/sitemap.xml` to Google Search Console under the `aitathastu.com` property.
- [ ] Validate Open Graph rendering using the Twitter/X Card Validator and LinkedIn Post Inspector.
- [ ] Verify Rich Results test for Schema.org `Organization` and `WebSite` markup.

