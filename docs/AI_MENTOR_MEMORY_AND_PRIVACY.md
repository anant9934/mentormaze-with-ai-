# AI MENTOR MEMORY & PRIVACY ARCHITECTURE
**MentorMaze by AI Tathastu** · Production Domain: `https://mentormaze.aitathastu.com`  
**Services:** [`lib/ai-mentor/student-memory-service.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/ai-mentor/student-memory-service.ts), [`lib/ai-mentor/conversation-store.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/ai-mentor/conversation-store.ts)

---

## 1. Structured Student Memory Model

The MentorMaze AI Mentor maintains structured, verified memory for each student across 8 distinct pedagogical categories:

1. `learning_preferences`: Modality (Socratic vs direct), code language, explanation pacing.
2. `current_goals`: Active placement milestones (e.g., "Pass Google SDE-1 phone screen by Dec 2026").
3. `confirmed_strengths`: Verified concepts with assessment score $\ge 8.0/10$.
4. `confirmed_weaknesses`: Diagnosed conceptual gaps with active remediation plans.
5. `active_projects`: Portfolio projects pulled with provenance from Collaborate or Avsar.
6. `career_objectives`: Target companies, compensation expectations, relocation preference.
7. `interview_prep_progress`: Completed mock interviews, STAR stories, behavioral scores.
8. `saved_facts`: Student-created learning notes and formulas.

### Memory Item Schema
```typescript
export interface StudentMemoryItem {
  id: string;
  studentUserId: string;
  category: MemoryCategory;
  key: string;
  value: string;
  source: "user_explicit" | "mentor_inferred" | "assessment_result";
  confidence: number;            // 0.0 to 1.0
  studentConfirmed: boolean;     // Requires student confirmation if inferred
  isTemporary: boolean;
  expiresAt?: string;
  createdAt: string;
  lastUpdated: string;
}
```

---

## 2. Multi-Tenant Cross-User Isolation (Security Guarantees)

Every read, write, update, or delete operation on conversation history and student memory requires strict identity matching:

```typescript
// Enforced in StudentMemoryService & ConversationStore
if (requestingUserId !== targetStudentUserId) {
  throw new Error("403_FORBIDDEN: You do not have permission to access or modify this student's private memory.");
}
```

- **Student A cannot read Student B's conversations or memories.**
- **Student A cannot delete Student B's saved facts.**
- **Admin routes operate under separate staff role authentication.**

---

## 3. Student Ownership & Consent Controls

Through the **Memory & Privacy** tab in `/ai-mentor`, students exercise complete sovereignty over their data:
- **Review:** View all facts remembered by the AI.
- **Confirm:** Inferred facts (confidence < 1.0) can be validated or corrected.
- **Delete:** Instant, permanent erasure of any memory item.
- **Consent Revocation:** When a student sets `useForPersonalization: false`, the system strips all historical projects, previous session notes, and weak-skill flags from the LLM prompt, providing a zero-context vanilla session.

---

## 4. Zero Data Leakage Policy

- **No Third-Party Model Training:** Prompts sent to external provider APIs (Google Gemini, OpenAI, Anthropic) utilize enterprise API endpoints governed by zero-retention data agreements. Student chats are never used to train public foundational models.
- **PII Scrubbing:** The safety layer automatically scrubs Indian phone numbers, Aadhaar numbers, and email addresses before prompt assembly.
- **No Secret Exposure:** API credentials remain strictly confined to the server environment.

