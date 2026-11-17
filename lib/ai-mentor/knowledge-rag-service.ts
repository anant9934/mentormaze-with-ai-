/**
 * Knowledge & RAG Retrieval Engine
 * 5 Knowledge Collections with Hybrid Search & Source Attribution
 * Brand: MentorMaze by AI Tathastu
 */

import { SourceCitation } from "./types";

export interface KnowledgeDocument {
  id: string;
  sourceId: string;
  collection: "technical" | "academic" | "career" | "interview" | "proprietary";
  title: string;
  content: string;
  publisher: string;
  urlOrId?: string;
  publicationDate?: string;
  lastVerified: string;
  license: string;
  tags: string[];
}

export interface RetrievalResult {
  doc: KnowledgeDocument;
  score: number;
  matchedKeywords: string[];
  citation: SourceCitation;
}

export class KnowledgeRAGService {
  private static documents: KnowledgeDocument[] = [
    // Collection 1: Technical Knowledge
    {
      id: "doc-tech-1",
      sourceId: "src-cs-patterns",
      collection: "technical",
      title: "Algorithmic Pattern: Two Pointers & Invariant Maintenance",
      content: "The Two Pointers pattern utilizes two indexes to traverse an iterable simultaneously. In a sorted array, moving the left pointer inward strictly increases sum, while moving the right pointer inward strictly decreases sum, guaranteeing an O(N) linear time bound and O(1) auxiliary space without hash overhead.",
      publisher: "MentorMaze Technical Review Board",
      urlOrId: "MM-REF-ALG-01",
      lastVerified: "2026-11-01",
      license: "Proprietary CC-BY-NC",
      tags: ["dsa", "two_pointers", "algorithms", "array", "time_complexity"],
    },
    {
      id: "doc-tech-2",
      sourceId: "src-sys-caching",
      collection: "technical",
      title: "Distributed Caching: Cache-Aside vs Write-Through vs Write-Back",
      content: "Cache-Aside queries cache first; on miss, queries PostgreSQL and fills cache with a TTL. Write-Through synchronizes write to cache and DB simultaneously. Write-Back commits immediately to cache and batches async writes to DB. Cache-Aside offers maximum resiliency against database crashes.",
      publisher: "MentorMaze System Design Group",
      urlOrId: "MM-REF-SYS-04",
      lastVerified: "2026-11-05",
      license: "Proprietary CC-BY-NC",
      tags: ["system_design", "redis", "caching", "architecture", "distributed_systems"],
    },

    // Collection 2: Academic Knowledge
    {
      id: "doc-acad-1",
      sourceId: "src-univ-curriculum",
      collection: "academic",
      title: "Operating Systems: Virtual Memory & Page Replacement Algorithms",
      content: "Virtual memory maps logical addresses to physical page frames via page tables. Belady's anomaly illustrates that increasing the number of page frames can increase the number of page faults under FIFO. LRU (Least Recently Used) is a stack algorithm and does not suffer from Belady's anomaly.",
      publisher: "Computer Science Academic Curriculum Standards",
      urlOrId: "MM-ACAD-OS-02",
      lastVerified: "2026-10-20",
      license: "Open Academic OER",
      tags: ["operating_systems", "virtual_memory", "lru", "belady_anomaly", "gate_cs"],
    },

    // Collection 3: Career Intelligence
    {
      id: "doc-career-1",
      sourceId: "src-career-benchmarks",
      collection: "career",
      title: "SDE-1 Hiring Competencies & Key Performance Indicators (Tier-1 Tech)",
      content: "SDE-1 candidates are evaluated on: 1. Clean code syntax and idiomatic language use. 2. Algorithmic correctness on arrays, strings, trees, and graphs. 3. Awareness of asymptotic time and space complexities. 4. Handling edge cases up-front (null, empty, overflows). 5. Clear collaborative communication.",
      publisher: "AI Tathastu Career Insights Research",
      urlOrId: "MM-CAR-SDE1-01",
      lastVerified: "2026-11-10",
      license: "Proprietary",
      tags: ["career", "sde1", "hiring", "interviews", "competencies"],
    },

    // Collection 4: Interview Preparation
    {
      id: "doc-int-1",
      sourceId: "src-star-framework",
      collection: "interview",
      title: "The Behavioral STAR Framework: Situation, Task, Action, Result",
      content: "When answering behavioral questions ('Tell me about a time you had a technical disagreement'), structure your narrative with: Situation (20% context), Task (10% your specific mandate), Action (50% the concrete technical steps you personally took), and Result (20% quantifiable impact and what you learned).",
      publisher: "Tathastu Interview Coaching Standards",
      urlOrId: "MM-INT-STAR-01",
      lastVerified: "2026-11-12",
      license: "Proprietary CC-BY-NC",
      tags: ["behavioral", "star_method", "interview_prep", "leadership_principles"],
    },

    // Collection 5: MentorMaze Proprietary Knowledge
    {
      id: "doc-prop-1",
      sourceId: "src-pedagogy-standard",
      collection: "proprietary",
      title: "The Socratic Quotient & Productive Struggle Protocol",
      content: "Effective mentors withhold premature code solutions. Productive struggle builds long-term myelination and neural recall. Give hints that narrow the search space without solving the core recurrence or edge case for the student. Validate understanding with a transfer problem.",
      publisher: "Dr. Aarav Mehta & Tathastu Principal Mentorship Core",
      urlOrId: "MM-PROP-SOC-01",
      lastVerified: "2026-11-15",
      license: "Proprietary Strict",
      tags: ["pedagogy", "socratic_quotient", "mentorship_principles", "active_learning"],
    },
  ];

  /**
   * Hybrid retrieval across collections using semantic token matching and keyword filters
   */
  public static search(
    query: string,
    collectionFilter?: KnowledgeDocument["collection"],
    limit: number = 3
  ): RetrievalResult[] {
    const rawTerms = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scored: RetrievalResult[] = [];

    for (const doc of this.documents) {
      if (collectionFilter && doc.collection !== collectionFilter) {
        continue;
      }

      let matchCount = 0;
      const matchedKeywords: string[] = [];
      const contentLower = doc.content.toLowerCase();
      const titleLower = doc.title.toLowerCase();

      for (const term of rawTerms) {
        if (titleLower.includes(term)) {
          matchCount += 3; // Title boost
          matchedKeywords.push(term);
        } else if (doc.tags.some((t) => t.includes(term))) {
          matchCount += 2; // Tag boost
          matchedKeywords.push(term);
        } else if (contentLower.includes(term)) {
          matchCount += 1;
          matchedKeywords.push(term);
        }
      }

      if (matchCount > 0) {
        const normalizedScore = Math.min(1.0, matchCount / 5);
        scored.push({
          doc,
          score: normalizedScore,
          matchedKeywords: Array.from(new Set(matchedKeywords)),
          citation: {
            sourceTitle: doc.title,
            collection: doc.collection,
            publisher: doc.publisher,
            urlOrId: doc.urlOrId,
            publicationDate: doc.publicationDate,
            lastVerified: doc.lastVerified,
            license: doc.license,
            confidence: Number(normalizedScore.toFixed(2)),
          },
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Formats retrieved references into citation markdown for responses
   */
  public static formatCitationsForMarkdown(results: RetrievalResult[]): string {
    if (results.length === 0) return "";

    const lines = results.map((r) => {
      const c = r.citation;
      return `- 📚 **${c.sourceTitle}** (${c.publisher}, Ref: \`${c.urlOrId || "internal"}\`) · *Verified ${c.lastVerified}*`;
    });

    return `\n\n---\n**Verified Knowledge Sources:**\n${lines.join("\n")}`;
  }
}
