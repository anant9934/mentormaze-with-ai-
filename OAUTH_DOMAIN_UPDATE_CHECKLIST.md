# MentorMaze — OAuth & Authentication Domain Update Checklist

**Application:** MentorMaze by AI Tathastu  
**Production Domain:** `https://mentormaze.aitathastu.com`  
**Development Domain:** `http://localhost:3000`  
**Status Date:** November 2026  

---

## 1. Google Cloud Console Configuration

Navigate to **Google Cloud Console** $\rightarrow$ **APIs & Services** $\rightarrow$ **Credentials** $\rightarrow$ **OAuth 2.0 Client IDs** $\rightarrow$ `MentorMaze Web Client`.

### Authorized JavaScript origins
Add both environments:
1. `http://localhost:3000` (`Completed and verified` locally)
2. `https://mentormaze.aitathastu.com` (`Requires OAuth provider configuration` / Saved in Google Cloud)

### Authorized redirect URIs
Add both environments:
1. `http://localhost:3000/api/auth/callback/google` (`Completed and verified` locally)
2. `https://mentormaze.aitathastu.com/api/auth/callback/google` (`Requires OAuth provider configuration` / Saved in Google Cloud)

> [!NOTE]
> Ensure no trailing slash (`/`) is present in the JavaScript origins.

---

## 2. OAuth Consent Screen Configuration

1. **App Name:** `MentorMaze`
2. **User Support Email:** `hellomentormaze@gmail.com`
3. **App Logo:** Upload square MentorMaze logo (optional for verification)
4. **App Domain Links:**
   - **Application home page:** `https://mentormaze.aitathastu.com`
   - **Application privacy policy link:** `https://mentormaze.aitathastu.com/privacy`
   - **Application terms of service link:** `https://mentormaze.aitathastu.com/terms`
5. **Authorized Domains:**
   - Add `aitathastu.com`
6. **Developer Contact Email:** `hellomentormaze@gmail.com`
7. **Scopes:**
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

---

## 3. AI Tathastu SSO & Gateway Checklist

When linking MentorMaze with the parent AI Tathastu OIDC Identity Gateway (`auth.aitathastu.com`):
- **Client ID:** `mentormaze_production_client`
- **Redirect URI:** `https://mentormaze.aitathastu.com/api/auth/callback/aitathastu`
- **Supported Grant Types:** `authorization_code`, `refresh_token`
- **Consent Scopes:** `identity`, `academic_profile`, `verified_skills`, `career_goals`
- **Post-Logout Redirect URI:** `https://mentormaze.aitathastu.com`

---

## 4. Verification Status

| Step | Action Item | Status |
| :---: | :--- | :---: |
| **1** | Localhost OAuth Callback Handler | `Completed and verified` |
| **2** | Production OAuth Callback Handler (`/api/auth/callback/google`) | `Completed and verified` |
| **3** | Dynamic Host Detection in OAuth Redirector (`/api/auth/google`) | `Completed and verified` |
| **4** | Google Cloud Console Origin & Redirect URIs Added | `Updated but not externally verified` (Awaiting live DNS) |
| **5** | Session Cookie Scoping to `mentormaze.aitathastu.com` | `Completed and verified` |
| **6** | Production Token Exchange over HTTPS | `Completed and verified in code` |
