# Career Intelligence & Job Description Ingestion Pipeline

**System:** MentorMaze AI Mentor  
**Component:** JD Normalization, Resume Analysis (Google XYZ), and Dynamic Roadmaps  
**Reference File:** `lib/ai-mentor/career-intelligence.ts`

---

## 1. Pipeline Overview

The Career Intelligence service processes industry job requirements, normalizes them against the Computer Science skill taxonomy, and performs gap analyses against candidate resumes.

---

## 2. Job Description Schema (`JobDescriptionRecord`)

```typescript
export interface JobDescriptionRecord {
  id: string;
  company: string;
  title: string;
  jobFamily: string;
  department?: string;
  location: string;
  experienceReq: string;
  educationReq?: string;
  mustHaveSkills: string[];
  preferredSkills: string[];
  toolsTech: string[];
  responsibilities: string[];
  seniority: "entry" | "mid" | "senior" | "lead";
  employmentType: string;
  salaryRange?: string;
  sourceUrl?: string;
  lastVerifiedDate: string;
  isVerified: boolean;
}
```

---

## 3. Resume-to-JD Matching & Google XYZ Formula

The system avoids automated superficial keyword matching and distinguishes between:
- **Verified Qualifications**: Evidence found in projects or work history.
- **Missing Qualifications**: Core engineering competencies absent from the profile.
- **Surface Keyword Gaps**: Tooling names that simply need to be added to the skills section.

### Google XYZ Formula Execution
For every weak or passive bullet point in a student's resume, the service generates an elite rewrite following Google's hiring standard:

$$\text{"Accomplished [X], as measured by [Y], by doing [Z]"}$$

**Example Transformation:**
- *Before*: ~"Worked on backend APIs and connected database for order management."~
- *After (Google XYZ)*: **"Architected 12 RESTful microservices in TypeScript & Node.js, reducing order processing latency by 42% (from 180ms to 105ms) across 15,000 daily transactions."**
- *Engineering Rationale*: Replaces passive verbs with active technical verbs, specifies production stack, and benchmarks quantifiable latency reductions.

---

## 4. Dynamic 24-Week Roadmaps

The service generates milestone roadmaps based on target role (e.g. SDE-1 vs AI Engineer) and current skill gaps:
- **Weeks 1–4**: Core DSA Patterns (Two Pointers, Sliding Window).
- **Weeks 5–8**: Advanced Structures & Dynamic Programming.
- **Weeks 9–14**: High-Scale Distributed Portfolio Project (Redis, PostgreSQL, WebRTC).
- **Weeks 15–18**: System Design & Distributed Scalability.
- **Weeks 19–24**: FAANG Mock Interviews & Engineering Referral Outreach.

