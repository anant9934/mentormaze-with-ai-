# MentorMaze — Known Limitations & Phase 2 Roadmap

**Phase:** Phase 1 (Human Mentorship + Human-Led Mock Interviews)  
**Parent Ecosystem:** AI Tathastu  

---

## 1. Phase 1 Boundaries (By Design)

1. **AI Mentorship is Out of Scope for Phase 1:**
   - Mentorship and mock interviews are conducted exclusively by verified human professionals.
   - An AI Mock Interviewer radio button is visible in the interface labeled `AI Interviewer (Phase 2 Beta)` to reflect the planned ecosystem evolution, but is disabled in accordance with the PRD.

2. **Cashfree Payments Sandbox Mode:**
   - Live settlement payouts require verified RBI marketplace escrow approval and business KYC. All transactions run safely in test sandbox mode.

3. **LiveKit Cloud Credentials:**
   - Production LiveKit Cloud instances require active organization API keys. The application mints standard RFC-compliant JWT room tokens and falls back cleanly in development mode.

4. **Private Document Storage:**
   - Uploaded resumes and identity proofs in dev mode use mock document references. In production, configure Cloudflare R2 bucket credentials (`CLOUDFLARE_R2_BUCKET`).

---

## 2. Phase 2 Future Capabilities
- Autonomous AI mentor chat for 24/7 conceptual queries
- AI resume analysis and automated JD matching
- Real-time AI code evaluator during mock interviews
- Voice synthesis for automated behavioral practice

