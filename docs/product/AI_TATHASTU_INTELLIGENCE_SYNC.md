# AI TATHASTU STUDENT INTELLIGENCE ECOSYSTEM SYNCHRONIZATION

**Product:** MentorMaze by AI Tathastu  
**Domain:** https://mentormaze.aitathastu.com  
**Subsystem:** Two-Way Ecosystem Intelligence Sync  
**Status:** Implemented & Verified  

---

## 1. Architectural Role & Ecosystem Position

**AI Tathastu** operates as the authoritative central intelligence plane for students across education, career, and mentorship products. 

MentorMaze is the dedicated **mentoring-first product** within this ecosystem. Rather than implementing an isolated, competing student intelligence system, MentorMaze adheres to a strict **two-way synchronization contract**:

```text
       ┌────────────────────────────────────────────────────────┐
       │                AI TATHASTU CENTRAL                     │
       │       Central Student Intelligence Directory           │
       └──────────────────────────┬─────────────────────────────┘
                                  │
          ▲                       │ Inbound Sync:
          │ Outbound Sync:        │ - Academic Records
          │ - Verified Milestones │ - Baseline Skill Graph
          │ - Human Mentor Notes  │ - Target Role & Direction
          │ - Interview Rubrics   │ - Standardized Curriculum
          │                       ▼
       ┌──┴─────────────────────────────────────────────────────┐
       │                     MENTORMAZE                         │
       │                                                        │
       │   ASTRION AI Mentor  ◄──►  Human Mentor Network        │
       │              ▲                  ▲                      │
       │              └─────── Bridge ───┘                      │
       └────────────────────────────────────────────────────────┘
```

---

## 2. Inbound Intelligence Synchronization

### 2.1 Consumed Schemas
MentorMaze consumes authorized student information from AI Tathastu Central to bootstrap the student's learning profile:
1. **Academic Baseline**: University/institution, degree program, graduation year, current semester/year.
2. **Verified Skill Nodes**: Evaluated technical competencies from AI Tathastu coding labs, rated on a 0–10 scale and tagged as `independently_verified`.
3. **Career Target**: Target engineering profile (e.g., *Backend Systems Engineer*, *AI/ML Engineer*), target company tiers, and preferred tech stacks.
4. **Curriculum Alignment**: Current academic curriculum track, ensuring ASTRION aligns its problem sets with the student's ongoing university coursework.

### 2.2 Ingestion Engine (`AITathastuSyncService`)
- Implements the standard `IExternalConnector` interface.
- Automatically registered in `ExternalConnectorRegistry`.
- Updates `StudentIntelligenceGraph` and `SkillGraph` without overwriting existing, self-demonstrated progress.
- Strictly honors the `external_data_integration` consent scope. If revoked, external inbound data is sanitized from the active context.

---

## 3. Outbound Mentorship Synchronization

### 3.1 Contributed Schemas
MentorMaze contributes unique, high-signal mentorship outcomes back to AI Tathastu Central:
1. **Completed Mentorship Sessions**: Timestamps, duration, topics discussed, and mentor verification tags.
2. **Human Mentor Observed Strengths**: Qualitative and technical competencies observed by approved senior engineers during 1:1 sessions.
3. **Development Gaps & Action Items**: Clear development bottlenecks identified by mentors, preventing duplicate diagnostic efforts across other Tathastu tools.
4. **Agreed Milestones & Deadlines**: Target completion dates for engineering projects and technical roadmaps.
5. **Interview Readiness Rubrics**: Structured mock interview scoring (Problem Solving, System Architecture, Code Quality, Behavioral Communication).

### 3.2 Outbox Event Pattern
To guarantee delivery across network partitions and system maintenance, outbound synchronization uses the transactional outbox pattern:
```sql
INSERT INTO outbox_events (
  event_type,
  payload,
  target_system,
  status,
  processed_at
) VALUES (
  'mentorship.outcomes.synced',
  '{ "studentUserId": "...", "completedMentorshipSessions": 3, "mentorFeedbackSummaries": [...] }',
  'aitathastu',
  'completed',
  NOW()
);
```

---

## 4. Consent, Security & User Controls

1. **Granular Student Consent**: Outbound syncing requires `share_with_mentors` consent; inbound ingestion requires `external_data_integration` consent.
2. **On-Demand Synchronization**: Students can trigger manual re-syncing at any time from `/settings` > *AI Tathastu Connection* > *Sync Intelligence Now*.
3. **Tamper-Evident Audit Logging**: Every synchronization operation records an immutable entry in the `audit_logs` table with actor ID, resource type, and payload hash.
4. **Zero Fabrication**: In local development and disconnected environments, the service behaves deterministically using authoritative database records rather than fabricating fake mock numbers or synthetic scores.
