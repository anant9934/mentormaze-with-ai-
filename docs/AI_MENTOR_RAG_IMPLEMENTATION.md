# AI MENTOR RAG IMPLEMENTATION
**MentorMaze by AI Tathastu** · Production Domain: `https://mentormaze.aitathastu.com`  
**Service:** [`lib/ai-mentor/knowledge-rag-service.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/ai-mentor/knowledge-rag-service.ts)

---

## 1. Modular Retrieval Pipeline

The MentorMaze Retrieval-Augmented Generation (RAG) system grounds every technical mentorship session in verified academic and engineering literature.

```
[Raw Document] ──► [SHA-256 Hash Deduplication] ──► [Collection Partitioning (8 Collections)]
                                                                   │
[Student Turn Query] ──► [Stop Word Filtering] ───────────────────┤
                                                                   ▼
                                                       [Hybrid Ranking Engine]
                                                       - Title match (3x weight)
                                                       - Tag match (2x weight)
                                                       - Content match (1x weight)
                                                                   │
                                                                   ▼
                                                     [Confidence Filter (Threshold >= 0.20)]
                                                                   │
                       ┌───────────────────────────────────────────┴───────────────────────────────────────────┐
                       ▼                                                                                       ▼
           Score >= 0.40 (Evidence Sufficient)                                                 Score < 0.40 (Insufficient)
                       │                                                                                       │
         [Canonical Source Attribution]                                                        [Missing Information Notice]
     (Title, Publisher, Canonical URL, Date)                                             (Explicit disclosure; no hallucinated citations)
```

---

## 2. Ingestion & Deduplication

Each ingested document passes through SHA-256 cryptographic hashing to ensure absolute deduplication across re-index operations:

```typescript
const hash = crypto.createHash("sha256").update(doc.content).digest("hex").slice(0, 16);
const existing = this.documents.find((d) => d.contentHash === hash);
if (existing) {
  return { documentId: existing.id, contentHash: existing.contentHash, status: existing.verificationStatus };
}
```

Standardized document metadata fields include:
- `id`: Globally unique identifier (`doc-[collection]-[hash]`)
- `sourceId`: Parent syllabus or curriculum source code
- `collection`: Target knowledge collection identifier
- `title`: Canonical reference title
- `content`: Extracted pedagogical text
- `authorOrPublisher`: Verified author or academic institution
- `sourceUrlOrId`: Authoritative HTTPS URL
- `license`: Explicit licensing tier (`Proprietary CC-BY-NC`, `Academic OER`, etc.)
- `publicationDate` & `ingestionDate`: ISO timestamps
- `contentHash`: SHA-256 fingerprint
- `verificationStatus`: `verified`, `community_curated`, or `unverified`
- `tags`: Indexed keyword tokens

---

## 3. Hybrid Ranking Algorithm

Queries are tokenized, normalized, and stripped of common English stop words. The scoring algorithm applies tiered weighting:
$$\text{Score} = \min\left(1.0, \frac{3 \cdot N_{\text{title}} + 2 \cdot N_{\text{tags}} + 1 \cdot N_{\text{content}}}{5}\right)$$

Results are sorted descending by score and filtered against `minConfidenceThreshold` (default `0.20`).

---

## 4. Insufficient Evidence Disclosure

When no indexed document meets the `0.40` sufficiency threshold, the RAG service sets `isEvidenceSufficient: false` and injects an explicit disclaimer notice into the orchestrator prompt:

> *"Notice: MentorMaze knowledge collections contain insufficient indexed evidence for this specific inquiry. Explaining based on canonical computer science principles without verified citation claims."*

This strictly prevents the AI from inventing non-existent papers, links, or statistics.

---

## 5. Source Attribution & Citations

Verified results format into Markdown citations attached to mentor responses:
```markdown
---
**Verified Knowledge Sources:**
- 📚 **Operating Systems: Virtual Memory, TLB Paging, and Page Faults** (Computer Science Academic Curriculum Standards) · [Reference Link](https://mentormaze.aitathastu.com/curriculum/cs/virtual-memory) · *Verified 2026-10-20*
- 📚 **Distributed Caching: Cache-Aside vs Write-Through vs Write-Back** (MentorMaze System Design Group) · [Reference Link](https://mentormaze.aitathastu.com/curriculum/system-design/caching) · *Verified 2026-11-05*
```

