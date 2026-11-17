/**
 * Comprehensive 100-Query Retrieval Benchmark Suite
 * Evaluates KnowledgeRAGService across all 8 Collections + 10 Out-of-Domain queries
 * Computes Empirical Recall@5, Precision@5, and Mean Reciprocal Rank (MRR)
 */

import { describe, it, expect } from "vitest";
import { KnowledgeRAGService } from "../lib/ai-mentor/knowledge-rag-service";

interface LabeledRetrievalQuery {
  id: string;
  query: string;
  expectedCollection?: string;
  expectedDocId?: string;
  isOutOfDomain?: boolean;
}

export const LABELED_RETRIEVAL_BENCHMARK_100: LabeledRetrievalQuery[] = [
  // 1. Programming & DSA (15 queries)
  { id: "q-dsa-01", query: "Two pointers algorithm monotonic invariant", expectedDocId: "doc-dsa-01", expectedCollection: "programming_dsa" },
  { id: "q-dsa-02", query: "Sorted array sum two pointers linear time", expectedDocId: "doc-dsa-01", expectedCollection: "programming_dsa" },
  { id: "q-dsa-03", query: "Why does two pointers fail on unsorted array?", expectedDocId: "doc-dsa-01", expectedCollection: "programming_dsa" },
  { id: "q-dsa-02b", query: "Left pointer inward right pointer inward sum change", expectedDocId: "doc-dsa-01", expectedCollection: "programming_dsa" },
  { id: "q-dsa-04", query: "O(1) auxiliary space array two pointer traversal", expectedDocId: "doc-dsa-01", expectedCollection: "programming_dsa" },
  { id: "q-dsa-05", query: "0/1 Knapsack optimal substructure recurrence relation", expectedDocId: "doc-dsa-02", expectedCollection: "programming_dsa" },
  { id: "q-dsa-06", query: "Knapsack dynamic programming dp[i][w] state transition", expectedDocId: "doc-dsa-02", expectedCollection: "programming_dsa" },
  { id: "q-dsa-07", query: "Why does 1D space optimized knapsack loop iterate backward?", expectedDocId: "doc-dsa-02", expectedCollection: "programming_dsa" },
  { id: "q-dsa-08", query: "Prevent item from being counted multiple times in knapsack", expectedDocId: "doc-dsa-02", expectedCollection: "programming_dsa" },
  { id: "q-dsa-09", query: "Dynamic programming auxiliary memory matrix compression 1D array", expectedDocId: "doc-dsa-02", expectedCollection: "programming_dsa" },
  { id: "q-dsa-10", query: "Combinatorial subset optimization under capacity constraint W", expectedDocId: "doc-dsa-02", expectedCollection: "programming_dsa" },
  { id: "q-dsa-11", query: "Two pointers O(N log N) sorting prerequisite", expectedDocId: "doc-dsa-01", expectedCollection: "programming_dsa" },
  { id: "q-dsa-12", query: "Directional step guarantee collapsing on unsorted data", expectedDocId: "doc-dsa-01", expectedCollection: "programming_dsa" },
  { id: "q-dsa-13", query: "Knapsack weight w_i value v_i recurrence formula", expectedDocId: "doc-dsa-02", expectedCollection: "programming_dsa" },
  { id: "q-dsa-14", query: "Hash map complement lookup vs two pointers trade-off", expectedDocId: "doc-dsa-01", expectedCollection: "programming_dsa" },

  // 2. CS Fundamentals (15 queries)
  { id: "q-cs-01", query: "Virtual memory MMU logical address page table translation", expectedDocId: "doc-cs-01", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-02", query: "Translation Lookaside Buffer TLB caching hot translations", expectedDocId: "doc-cs-01", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-03", query: "Page fault trap loading page from swap disk into RAM", expectedDocId: "doc-cs-01", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-04", query: "FIFO page replacement Belady anomaly increasing page faults", expectedDocId: "doc-cs-01", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-05", query: "Least Recently Used LRU stack algorithm immunity Belady", expectedDocId: "doc-cs-01", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-06", query: "Database ACID guarantees atomicity consistency isolation durability", expectedDocId: "doc-cs-02", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-07", query: "Write-Ahead Logging WAL append-only disk log durability", expectedDocId: "doc-cs-02", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-08", query: "Dirty buffer pool pages flush after WAL commit", expectedDocId: "doc-cs-02", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-09", query: "Transaction isolation levels Read Committed Repeatable Read Serializable", expectedDocId: "doc-cs-02", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-10", query: "Dirty Reads Non-Repeatable Reads Phantom Rows database anomalies", expectedDocId: "doc-cs-02", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-11", query: "Multi-Version Concurrency Control MVCC Two-Phase Locking 2PL", expectedDocId: "doc-cs-02", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-12", query: "Decoupling contiguous logical address space from physical RAM frames", expectedDocId: "doc-cs-01", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-13", query: "Why does adding more frames cause more page faults in FIFO?", expectedDocId: "doc-cs-01", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-14", query: "Database commit protocol WAL disk flush before ACK", expectedDocId: "doc-cs-02", expectedCollection: "cs_fundamentals" },
  { id: "q-cs-15", query: "Operating systems paging hardware interrupt trap service routine", expectedDocId: "doc-cs-01", expectedCollection: "cs_fundamentals" },

  // 3. AI and Machine Learning (15 queries)
  { id: "q-ai-01", query: "PyTorch dynamic computational graphs autograd loss.backward()", expectedDocId: "doc-aiml-01", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-02", query: "PyTorch GPU VRAM memory leak total_loss += loss autograd graph", expectedDocId: "doc-aiml-01", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-03", query: "How to fix loss accumulation memory leak using loss.item() or tensor.detach()", expectedDocId: "doc-aiml-01", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-04", query: "model.eval() torch.no_grad() disable gradient graph construction", expectedDocId: "doc-aiml-01", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-05", query: "Dense vector embeddings continuous high-dimensional vector spaces", expectedDocId: "doc-aiml-02", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-06", query: "Cosine similarity directional alignment inner dot product", expectedDocId: "doc-aiml-02", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-07", query: "Euclidean distance L2 norm vs cosine similarity embeddings", expectedDocId: "doc-aiml-02", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-08", query: "Approximate Nearest Neighbor ANN search HNSW IVFFlat pgvector", expectedDocId: "doc-aiml-02", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-09", query: "Sub-10ms semantic search over millions of vectors 95% recall", expectedDocId: "doc-aiml-02", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-10", query: "PyTorch requires_grad forward pass reverse graph traversal", expectedDocId: "doc-aiml-01", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-11", query: "CUDA Out-Of-Memory OOM crash multi-epoch scalar tensor loss", expectedDocId: "doc-aiml-01", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-12", query: "Hierarchical Navigable Small World HNSW graph indexing vector database", expectedDocId: "doc-aiml-02", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-13", query: "pgvector PostgreSQL extension semantic vector retrieval", expectedDocId: "doc-aiml-02", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-14", query: "Evaluation mode disabling gradient tracking PyTorch", expectedDocId: "doc-aiml-01", expectedCollection: "ai_machine_learning" },
  { id: "q-ai-15", query: "Normalized embeddings 768 1536 dimensions cosine similarity", expectedDocId: "doc-aiml-02", expectedCollection: "ai_machine_learning" },

  // 4. Software System Design (15 queries)
  { id: "q-sys-01", query: "Cache-Aside pattern Redis PostgreSQL query sequence", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-02", query: "Cache miss query database write Redis TTL", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-03", query: "Why delete invalidate cache key on database update instead of overwrite", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-04", query: "Race conditions concurrent DB updates and cache writes", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-05", query: "Cache Stampede concurrent threads querying DB on key expiration", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-06", query: "Mitigating cache stampede using distributed mutex locking", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-07", query: "Cache Penetration queries for non-existent keys Bloom filters", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-08", query: "Cache-Aside vs Write-Through vs Write-Back architecture", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-09", query: "Redis key time-to-live TTL invalidation strategy", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-10", query: "Distributed caching high-scale database connection exhaustion", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-11", query: "Bloom filter cache penetration protection", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-12", query: "Stale data mitigation distributed cache invalidation", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-13", query: "Concurrent updates interleaving database and Redis cache", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-14", query: "Distributed mutex locking key expiration thundering herd", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },
  { id: "q-sys-15", query: "Cache mutation update delete Redis PostgreSQL transactional consistency", expectedDocId: "doc-sys-01", expectedCollection: "software_system_design" },

  // 5. Career & Job Descriptions (10 queries)
  { id: "q-car-01", query: "Tier-1 tech firm SDE-1 university graduate hiring competencies", expectedDocId: "doc-car-01", expectedCollection: "career_job_descriptions" },
  { id: "q-car-02", query: "Google Microsoft Amazon Swiggy five core evaluation axes", expectedDocId: "doc-car-01", expectedCollection: "career_job_descriptions" },
  { id: "q-car-03", query: "Algorithmic problem solving and rigorous asymptotic Big-O analysis rubric", expectedDocId: "doc-car-01", expectedCollection: "career_job_descriptions" },
  { id: "q-car-04", query: "Boundary and edge case handling nulls empty collections integer overflow", expectedDocId: "doc-car-01", expectedCollection: "career_job_descriptions" },
  { id: "q-car-05", query: "Low-level design modularity clean interface separation SDE-1", expectedDocId: "doc-car-01", expectedCollection: "career_job_descriptions" },
  { id: "q-car-06", query: "Collaborative communication and responsiveness to hints in coding interviews", expectedDocId: "doc-car-01", expectedCollection: "career_job_descriptions" },
  { id: "q-car-07", query: "Clean code syntax idiomatic programming language usage assessment", expectedDocId: "doc-car-01", expectedCollection: "career_job_descriptions" },
  { id: "q-car-08", query: "SDE-1 hiring key performance indicators technical interview benchmarks", expectedDocId: "doc-car-01", expectedCollection: "career_job_descriptions" },
  { id: "q-car-09", query: "Software engineer entry level interview expectations tier-1 tech", expectedDocId: "doc-car-01", expectedCollection: "career_job_descriptions" },
  { id: "q-car-10", query: "Technical competency rubric computer science graduate placement", expectedDocId: "doc-car-01", expectedCollection: "career_job_descriptions" },

  // 6. Interview Preparation (10 queries)
  { id: "q-int-01", query: "Behavioral STAR framework Situation Task Action Result", expectedDocId: "doc-int-01", expectedCollection: "interview_preparation" },
  { id: "q-int-02", query: "Technical conflict behavioral interview prompt structure", expectedDocId: "doc-int-01", expectedCollection: "interview_preparation" },
  { id: "q-int-03", query: "STAR methodology percentage distribution 15% Situation 50% Action", expectedDocId: "doc-int-01", expectedCollection: "interview_preparation" },
  { id: "q-int-04", query: "Highlighting individual agency vs passive 'we did' phrasing", expectedDocId: "doc-int-01", expectedCollection: "interview_preparation" },
  { id: "q-int-05", query: "Quantifiable impact metrics retrospective takeaways behavioral story", expectedDocId: "doc-int-01", expectedCollection: "interview_preparation" },
  { id: "q-int-06", query: "Leadership and behavioral interview response structure Amazon Google", expectedDocId: "doc-int-01", expectedCollection: "interview_preparation" },
  { id: "q-int-07", query: "Delivering engineering decisions personally taken in STAR response", expectedDocId: "doc-int-01", expectedCollection: "interview_preparation" },
  { id: "q-int-08", query: "Concise context setting vs detailed technical action steps", expectedDocId: "doc-int-01", expectedCollection: "interview_preparation" },
  { id: "q-int-09", query: "STAR interview format personal responsibility Task definition", expectedDocId: "doc-int-01", expectedCollection: "interview_preparation" },
  { id: "q-int-10", query: "Behavioral rubric answering difficult conflict questions with STAR", expectedDocId: "doc-int-01", expectedCollection: "interview_preparation" },

  // 7. Academic Learning Resources (10 queries)
  { id: "q-acad-01", query: "Relational Algebra procedural query language Select Project Join", expectedDocId: "doc-acad-01", expectedCollection: "academic_resources" },
  { id: "q-acad-02", query: "Relational Calculus non-procedural declarative TRC DRC", expectedDocId: "doc-acad-01", expectedCollection: "academic_resources" },
  { id: "q-acad-03", query: "Tuple Relational Calculus vs Domain Relational Calculus", expectedDocId: "doc-acad-01", expectedCollection: "academic_resources" },
  { id: "q-acad-04", query: "Codd Theorem equivalence between relational algebra and calculus", expectedDocId: "doc-acad-01", expectedCollection: "academic_resources" },
  { id: "q-acad-05", query: "University GATE CS core curriculum relational query languages", expectedDocId: "doc-acad-01", expectedCollection: "academic_resources" },
  { id: "q-acad-06", query: "Cartesian Product Join Union procedural operational sequence", expectedDocId: "doc-acad-01", expectedCollection: "academic_resources" },
  { id: "q-acad-07", query: "Declarative what information is retrieved without evaluation algorithm", expectedDocId: "doc-acad-01", expectedCollection: "academic_resources" },
  { id: "q-acad-08", query: "Expressive power equivalence Codd theorem relational completeness", expectedDocId: "doc-acad-01", expectedCollection: "academic_resources" },
  { id: "q-acad-09", query: "DBMS theory procedural vs declarative query language differences", expectedDocId: "doc-acad-01", expectedCollection: "academic_resources" },
  { id: "q-acad-10", query: "Safe relational calculus relational algebra evaluation algorithm", expectedDocId: "doc-acad-01", expectedCollection: "academic_resources" },

  // 8. MentorMaze Platform Documentation (5 queries)
  { id: "q-plat-01", query: "MentorMaze pedagogical doctrine Socratic Quotient productive struggle", expectedDocId: "doc-plat-01", expectedCollection: "mentormaze_platform" },
  { id: "q-plat-02", query: "Withholding premature answers neural myelination cognitive struggle", expectedDocId: "doc-plat-01", expectedCollection: "mentormaze_platform" },
  { id: "q-plat-03", query: "Progressive hints narrowing search space transfer concept questions", expectedDocId: "doc-plat-01", expectedCollection: "mentormaze_platform" },
  { id: "q-plat-04", query: "Zero-fabrication of student resume metrics policy MentorMaze", expectedDocId: "doc-plat-01", expectedCollection: "mentormaze_platform" },
  { id: "q-plat-05", query: "Consensual human escalation repeated struggle threshold protocol", expectedDocId: "doc-plat-01", expectedCollection: "mentormaze_platform" },

  // 9. Out-of-Domain Unindexed Queries (10 queries - Expected insufficient evidence)
  { id: "q-ood-01", query: "Quantum teleportation across Martian orbital relays using antimatter", isOutOfDomain: true },
  { id: "q-ood-02", query: "French culinary recipe for lamination in puff pastry dough", isOutOfDomain: true },
  { id: "q-ood-03", query: "Medieval European feudalism vassal lords and agrarian serfdom", isOutOfDomain: true },
  { id: "q-ood-04", query: "Photosynthesis Calvin cycle carbon fixation ribulose bisphosphate", isOutOfDomain: true },
  { id: "q-ood-05", query: "Mariana Trench abyssal zone benthic marine biological adaptations", isOutOfDomain: true },
  { id: "q-ood-06", query: "Internal combustion engine crankshaft stroke firing order timing", isOutOfDomain: true },
  { id: "q-ood-07", query: "Himalayan tectonic continental plate subduction orogeny rates", isOutOfDomain: true },
  { id: "q-ood-08", query: "Baroque classical music counterpoint fugue Johann Sebastian Bach", isOutOfDomain: true },
  { id: "q-ood-09", query: "Dental orthodontic brackets archwires biomechanical tooth movement", isOutOfDomain: true },
  { id: "q-ood-10", query: "Aviation flight control rudder elevators ailerons aerodynamic yaw", isOutOfDomain: true },
];

describe("Knowledge Base 100-Query Retrieval Benchmark", () => {
  it("executes the 100-query benchmark, records empirical metrics, and validates classification", () => {
    let top5Hits = 0;
    let totalPrecisionAt5Sum = 0;
    let reciprocalRankSum = 0;
    let inDomainCount = 0;
    let oodHandledCount = 0;
    const oodTotal = 10;

    const evaluationLogs: any[] = [];

    for (const item of LABELED_RETRIEVAL_BENCHMARK_100) {
      const retrieval = KnowledgeRAGService.retrieve(item.query, { limit: 5 });

      if (item.isOutOfDomain) {
        // Out-of-domain queries must report insufficient evidence
        const handledCorrectly = retrieval.isEvidenceSufficient === false && retrieval.missingInformationNotice !== undefined;
        if (handledCorrectly) {
          oodHandledCount++;
        } else {
          console.log("FAILED OOD:", item.query, retrieval.results.map((r) => r.doc.title + " (score " + r.score + ")"));
        }
        evaluationLogs.push({
          id: item.id,
          query: item.query,
          type: "out_of_domain",
          isEvidenceSufficient: retrieval.isEvidenceSufficient,
          missingInformationNoticeReported: Boolean(retrieval.missingInformationNotice),
          status: handledCorrectly ? "PASS" : "FAIL",
        });
      } else {
        inDomainCount++;
        const retrievedDocIds = retrieval.results.map((r) => r.doc.id);
        const rank = retrievedDocIds.indexOf(item.expectedDocId!) + 1; // 1-based index or 0 if not found

        const isHitInTop5 = rank > 0 && rank <= 5;
        if (isHitInTop5) {
          top5Hits++;
          reciprocalRankSum += 1.0 / rank;
        }

        const relevantInTop5 = retrievedDocIds.filter((id) => id === item.expectedDocId).length;
        const precisionAt5 = relevantInTop5 / 5.0;
        totalPrecisionAt5Sum += precisionAt5;

        evaluationLogs.push({
          id: item.id,
          query: item.query,
          expectedDocId: item.expectedDocId,
          retrievedDocIds,
          rank: rank > 0 ? rank : "NOT_IN_TOP_5",
          reciprocalRank: rank > 0 ? Number((1.0 / rank).toFixed(3)) : 0,
          citationAttributionVerified: retrieval.results.length > 0 && retrieval.results[0].doc.sourceUrlOrId.startsWith("http"),
        });
      }
    }

    const recallAt5 = Number(((top5Hits / inDomainCount) * 100).toFixed(2));
    const meanPrecisionAt5 = Number(((totalPrecisionAt5Sum / inDomainCount) * 100).toFixed(2));
    const mrr = Number((reciprocalRankSum / inDomainCount).toFixed(4));
    const oodAccuracy = Number(((oodHandledCount / oodTotal) * 100).toFixed(2));

    console.log("=== 100-QUERY EMPIRICAL RETRIEVAL BENCHMARK RESULTS ===");
    console.log(`Total Queries Evaluated: ${LABELED_RETRIEVAL_BENCHMARK_100.length}`);
    console.log(`In-Domain Queries: ${inDomainCount}`);
    console.log(`Recall@5: ${recallAt5}% (${top5Hits}/${inDomainCount})`);
    console.log(`Precision@5: ${meanPrecisionAt5}%`);
    console.log(`Mean Reciprocal Rank (MRR): ${mrr}`);
    console.log(`Out-of-Domain Detection Accuracy: ${oodAccuracy}% (${oodHandledCount}/${oodTotal})`);
    console.log(`Explicit Retrieval Classification: Keyword-Based Inverted Index Hybrid Search (Non-vector)`);

    expect(inDomainCount).toBe(95);
    expect(oodTotal).toBe(10);
    expect(recallAt5).toBeGreaterThanOrEqual(90.0);
    expect(mrr).toBeGreaterThanOrEqual(0.85);
    expect(oodAccuracy).toBe(100.0);
  });
});
