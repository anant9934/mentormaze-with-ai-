# MentorMaze — RAG Knowledge System & Retrieval Verification Report

**Platform:** MentorMaze by AI Tathastu  
**Domain:** `https://mentormaze.aitathastu.com`  
**Document Code:** `MM-ENG-RAG-06`  
**Service:** `lib/ai-mentor/knowledge-rag-service.ts`

---

## 1. Executive Summary & Knowledge Collections Inventory

The MentorMaze Retrieval-Augmented Generation (RAG) system grounds AI Mentor responses in verified technical, academic, and career knowledge. Rather than allowing general-purpose LLMs to hallucinate architectural patterns or university prerequisites, the RAG service matches user prompts against five structured knowledge collections.

### Summary of Collections and Documents

| Collection ID | Domain | Document Title | Publisher / Authority | License |
|---|---|---|---|---|
| `technical` | Algorithms & Patterns | *Algorithmic Pattern: Two Pointers & Invariant Maintenance* (`MM-REF-ALG-01`) | MentorMaze Technical Review Board | CC-BY-NC |
| `technical` | System Design | *Distributed Caching: Cache-Aside vs Write-Through vs Write-Back* (`MM-REF-SYS-04`) | MentorMaze System Design Group | CC-BY-NC |
| `academic` | Computer Science Core | *Operating Systems: Virtual Memory & Page Replacement Algorithms* (`MM-ACAD-OS-02`) | Computer Science Academic Standards | Open Academic OER |
| `career` | SDE Placement Competencies | *SDE-1 Hiring Competencies & Key Performance Indicators* (`MM-CAR-SDE1-01`) | AI Tathastu Career Insights Research | Proprietary |
| `interview` | Behavioral Methodologies | *The Behavioral STAR Framework: Situation, Task, Action, Result* (`MM-INT-STAR-01`) | Tathastu Interview Coaching Standards | CC-BY-NC |
| `proprietary`| Mentorship Pedagogy | *The Socratic Quotient & Productive Struggle Protocol* (`MM-PROP-SOC-01`) | Dr. Aarav Mehta & Tathastu Principal Core | Proprietary Strict |

---

## 2. Retrieval Mechanics: In-Memory Token & Keyword Matching

### Current Implementation Reality
In the current production build, `KnowledgeRAGService` utilizes an in-memory tokenized scoring algorithm designed for sub-millisecond latency without requiring external vector database connections.

```
[Student Query] ──▶ Sanitize & Tokenize (strip punct, filter terms > 2 chars)
                                  │
                                  ▼
                Iterate Structured Documents Corpus
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       ▼                          ▼                          ▼
 Title Boost (×3)           Tag Boost (×2)            Content Match (×1)
       │                          │                          │
       └──────────────────────────┼──────────────────────────┘
                                  ▼
                      Match Score Accumulation
                                  │
                                  ▼
                  Normalized Confidence Score (0.0 – 1.0)
                                  │
                                  ▼
                     Rank, Sort & Slice Top-K
```

### Mathematical Scoring Function
For a query token set $T = \{t_1, t_2, \dots, t_m\}$ and document $D$:

$$\text{RawScore}(D, T) = \sum_{t \in T} \left( 3 \cdot \mathbb{I}_{t \in \text{Title}} + 2 \cdot \mathbb{I}_{t \in \text{Tags}} + 1 \cdot \mathbb{I}_{t \in \text{Content}} \right)$$

$$\text{Confidence}(D, T) = \min\left(1.0, \frac{\text{RawScore}(D, T)}{5}\right)$$

Only documents with $\text{RawScore} > 0$ are returned, sorted descending by confidence, capped at `limit = 3`.

---

## 3. Grounded Citation Rendering Format

When documents match a query, the citation metadata is formatted and appended to the mentor's markdown response:

```markdown
---
**Verified Knowledge Sources:**
- 📚 **Distributed Caching: Cache-Aside vs Write-Through vs Write-Back** (MentorMaze System Design Group, Ref: `MM-REF-SYS-04`) · *Verified 2026-11-05*
- 📚 **Algorithmic Pattern: Two Pointers & Invariant Maintenance** (MentorMaze Technical Review Board, Ref: `MM-REF-ALG-01`) · *Verified 2026-11-01*
```

Each citation preserves:
1. Canonical Source Title.
2. Publishing Entity / Board.
3. Verification Audit Date.
4. License & Copyright Scope.
5. Numerical Groundedness Confidence.

---

## 4. Verification & Automated Test Evidence

Automated verification is maintained in `tests/ai-mentor-intelligence.test.ts` (Test 4: Knowledge & RAG Retrieval):
1. **Relevant Match Verification**: A query for `"How does Cache-Aside work in Redis?"` successfully retrieves `doc-tech-2` (*Distributed Caching*) with confidence score $\ge 0.60$ and complete citation metadata.
2. **Gibberish / Noise Rejection**: A query for `"xyzzyqwer12349999"` returns an empty result set (`results.length === 0`), verifying that irrelevant documents are never forced into the context.

---

## 5. Architectural Roadmap: Path to pgvector Semantic Embeddings

While the current token-matching engine provides fast, deterministic retrieval with zero database overhead, the database schema already includes the required `ai_mentor_knowledge_documents` table with `vector` embedding column support (via Neon PostgreSQL pgvector).

### Planned Phase 2 Migration:
1. **Embedding Generation**: Generate 1536-dimensional embeddings using `text-embedding-3-small` or `text-embedding-gecko` upon document ingestion.
2. **Hybrid Search Execution**:
   $$\text{FinalScore} = \alpha \cdot \text{DenseCosineSimilarity} + (1 - \alpha) \cdot \text{SparseKeywordMatch}$$
3. **Dynamic Corpus Expansion**: Ingest university syllabus chapters and SDE interview question banks directly into PostgreSQL.

