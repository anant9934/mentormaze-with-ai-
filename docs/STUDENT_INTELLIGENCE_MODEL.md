# Student Intelligence Model & Context Architecture

**System:** MentorMaze AI Mentor  
**Specification:** Student Context Profile & Ecosystem Provenance  
**Reference File:** `lib/ai-mentor/student-context-builder.ts`

---

## 1. Objective

The Student Intelligence Model provides the AI Mentor with verified, permission-aware understanding of an individual student's capabilities, academic status, learning interactions, and career aspirations without relying on ungrounded conversational hallucinations.

---

## 2. Multi-System Provenance Model

Every piece of context consumed by the AI Mentor tracks four essential attributes:
1. **Source System**: Originating platform (`MentorMaze`, `AITathastu`, `Collaborate`, `Avsar`, `IRIS`).
2. **Provenance Type**:
   - `student_reported`: Self-declared by the student (e.g. "I know Python"). Calibrated with lower initial confidence ($0.5$).
   - `institution_provided`: Verified university transcript or syllabus milestone ($0.95$).
   - `mentor_assessed`: Direct observation and feedback by a verified MentorMaze human mentor ($0.90$).
   - `ai_inferred`: Derived from assessment performance or code execution logs ($0.75$).
3. **Consent Scope**: Explicit permissions configured by the student:
   - `shareWithMentors` (boolean)
   - `useForPersonalization` (boolean)
   - `retentionDays` (e.g. 365)
4. **Collection & Last Verified Timestamps**: Enforces freshness boundaries.

---

## 3. Context Profile Schema (`StudentProfileContext`)

```typescript
export interface StudentProfileContext {
  userId: string;
  displayName: string;
  email: string;
  currentRoleOrLevel: string;
  targetRole: string;
  graduationYear?: number;
  verifiedSkills: {
    skillId: string;
    skillName: string;
    masteryState: MasteryState;
    masteryScore: number;       // 0.0 to 10.0
    confidence: number;         // 0.0 to 1.0
    provenance: ProvenanceType;
    lastAssessedAt?: string;
  }[];
  weakSkills: string[];
  recentMistakes: string[];
  activeProjects: {
    id: string;
    title: string;
    techStack: string[];
    sourceSystem: "MentorMaze" | "Collaborate" | "Avsar" | "IRIS";
  }[];
  humanMentorshipHistory: {
    sessionId: string;
    mentorName: string;
    topic: string;
    actionItemsCount: number;
    mentorFeedbackSummary?: string;
  }[];
  mockInterviewScorecard?: {
    overallScore: number;
    rubricHighlights: string[];
  };
  preferredLanguage: "en" | "hi" | "hinglish";
  consentScope: {
    shareWithMentors: boolean;
    useForPersonalization: boolean;
    retentionDays: number;
  };
}
```

---

## 4. Privacy & Personal Data Isolation Rules

1. **Zero External Leakage**: Student context profile data is used strictly on-premises or within approved model provider API contracts where data retention for model training is disabled.
2. **Revocation Support**: If a student toggles `useForPersonalization: false`, the context builder immediately returns a de-identified, un-personalized baseline profile.
3. **Cross-Tenant Isolation**: Database queries enforce row-level tenant keys on `student_user_id`. No student can access or inspect another learner's memories, skill graph, or mentorship briefs.
