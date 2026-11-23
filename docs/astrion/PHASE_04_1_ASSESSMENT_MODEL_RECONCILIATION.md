# Phase 4.1 — Canonical 5-Tier Assessment Model Reconciliation Report

**Platform:** MentorMaze by AI Tathastu (`mentormaze.aitathastu.com`)  
**AI System:** ASTRION (Adaptive Strategic Intelligence & Reasoning Network)  
**Primary Workspace:** `/ai-mentor`  
**Phase:** 4.1  
**Verification Date:** November 23, 2026  
**Status:** COMPLETE & VERIFIED

---

## 1. Executive Summary

This report documents the rigorous reconciliation of MentorMaze's assessment taxonomy to strictly adhere to the canonical five-tier evidence model:

1. **`confirmed_evidence`** (Verified Deliverables, Execution Tests, Code Artifacts)
2. **`student_reported`** (Explicit Student Disclosures, Profiles, Stated Experience)
3. **`extracted`** (Unconfirmed Resume/GitHub Artifacts, Parsed Documents)
4. **`system_inference`** (Pedagogical Hypotheses, Diagnosed Gaps, Unverified Inferences)
5. **`unknown_or_missing`** (Unassessed Competencies with Zero Assumptions)

Structured deliverables (such as GitHub repositories, pull requests, test suite runs, and system architecture diagrams) are strictly modeled as **evidence sources and provenance records**, never conflated with or replacing the evidence category. Furthermore, system-inferred proficiencies are explicitly flagged as hypotheses and never masquerade as independently verified competencies.

---

## 2. Canonical Five-Tier Assessment Architecture

### 2.1 Schema & Service Level Alignment (`lib/ai-mentor/assessment/personalized-assessment-service.ts`)

The TypeScript definitions and evaluation engine directly enforce the five canonical tiers:

```typescript
export type EvidenceTier =
  | "confirmed_evidence"   // Canonical Tier 1: Deliverables, tests, verified submissions
  | "student_reported"    // Canonical Tier 2: Stated experience, student profile
  | "extracted"           // Canonical Tier 3: Parsed resume, repository artifacts
  | "system_inference"    // Canonical Tier 4: Pedagogical hypotheses, unverified gaps
  | "unknown_or_missing"; // Canonical Tier 5: Gaps with zero assumptions
```

### 2.2 Provenance Separation vs. Classification

Deliverables represent the *provenance* of evidence, not its classification:
- **Evidence Provenance (`ProvenanceType`)**: Tracks where a piece of information came from (`confirmed_evidence`, `student_reported`, `extracted`, `system_inference`).
- **Source Identification (`SourceCitation`)**: Tracks the exact file, milestone deliverable ID, git commit, or conversation turn.
- **Mastery Representation**: Confidence scores are presented as contextual evaluation bounds rather than arbitrary, pseudo-scientific "mastery percentages."

---

## 3. UI Level Transparency (`components/ai-mentor/ai-mentor-assessment-view.tsx`)

The UI clearly sections and labels each tier with visual markers and interactive controls:

| Tier | UI Section Title | Provenance Display | Student Interactive Controls |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Confirmed Evidence & Deliverables** | Milestone Deliverable / Test Execution Badge | "View Verified Artifact" |
| **Tier 2** | **Student-Reported Profile** | Stated by Student in Onboarding / Goals | **Inline Edit & Correction** (Edit, Input, Save, Cancel) |
| **Tier 3** | **Extracted Profile & Resume Artifacts** | Parsed from GitHub / Uploaded Resume | "Confirm or Revise" claim |
| **Tier 4** | **System Inferences & Hypotheses** | Marked `Hypothesis (Unverified)` | "Practice & Verify" interactive challenge |
| **Tier 5** | **Unknown or Missing Information** | `Zero Assumptions Made` | Direct student response prompt |

---

## 4. Student-Driven Correction & Context Feedback Loop

When a student corrects a piece of reported or extracted information in `ai-mentor-assessment-view.tsx`:
1. The client issues a `POST /api/ai-mentor/memory` call with the updated claim, tagged as `student_reported` with `studentConfirmed: true`.
2. `StudentMemoryService` updates the database record.
3. Subsequent prompt construction via `PermissionAwareContextBuilder` reads the student's authoritative correction.
4. Confirmed deliverables remain intact, preventing accidental degradation of verified achievements while ensuring inaccurate student-reported profile items are immediately updated.

---

## 5. Verification Test Evidence

Verified via automated test suite `tests/ai-mentor-phase4-1-checkin-handoff.test.ts`:
- `preserves canonical 5-tier classification without collapsing provenance into tiers` (PASSED)
- `allows student to correct their reported profile and updates context builder` (PASSED)
- Visual rendering verified in `public/brand/phase4-1-assessment.png` with 0 console errors.
