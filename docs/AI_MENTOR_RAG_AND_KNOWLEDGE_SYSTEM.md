# AI Mentor Knowledge & RAG Architecture

**System:** MentorMaze AI Mentor  
**Component:** Hybrid Retrieval, Multi-Collection Knowledge & Source Attribution  
**Reference File:** `lib/ai-mentor/knowledge-rag-service.ts`

---

## 1. Multi-Collection Knowledge Structure

MentorMaze partitions knowledge into five verified, license-governed collections:

```
[Knowledge Collections]
├── Collection 1: Technical Knowledge (Algorithms, DSA, System Design, Caching, DBs)
├── Collection 2: Academic Knowledge (University syllabus, Operating Systems, Networks)
├── Collection 3: Career Intelligence (SDE-1 Hiring Competencies, Tier-1 Job Profiles)
├── Collection 4: Interview Preparation (Technical Questions, Behavioral STAR Framework)
└── Collection 5: MentorMaze Proprietary (Socratic Quotient Scaffolding, Mentorship Standards)
```

---

## 2. Ingestion & Retrieval Pipeline

1. **Chunking**: Technical documents are chunked along semantic markdown headers (`###`, code blocks, lists) rather than arbitrary character splits, preserving code syntax context.
2. **Hybrid Search**: Evaluates lexical keyword matches against titles and tags (with $3\times$ boost on title tokens) combined with semantic token relevance.
3. **Source Attribution Contract**: Every retrieved chunk returned to the user or prompt includes:
   - `sourceTitle`: Canonical document title.
   - `collection`: Target partition.
   - `publisher`: Organization or review board.
   - `urlOrId`: Reference accession code (e.g., `MM-REF-SYS-04`).
   - `lastVerified`: Date of last factual audit.
   - `license`: Intellectual property classification (`Proprietary CC-BY-NC`, `Open Academic OER`, etc.).
   - `confidence`: Calibrated retrieval score ($0.0 - 1.0$).

---

## 3. Strict Truthfulness Policy

- **No Inferred Question Fabrication**: The AI Mentor will never claim an interview question was asked by a specific company unless that fact is established in a dated, verified source record.
- **Unestablished Knowledge Handling**: If a retrieval query returns zero verified chunks from the curriculum, the AI Mentor states: *"Our verified knowledge collection does not establish this specific data point; here is the standard engineering convention..."*
