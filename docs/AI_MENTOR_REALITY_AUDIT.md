# MentorMaze AI Mentor — System Reality Audit & Architecture Verification

**Platform:** MentorMaze by AI Tathastu  
**Production Domain:** `https://mentormaze.aitathastu.com`  
**Audit Date:** November 18, 2026  
**Auditor:** Principal AI Engineering & Reality Audit Team  
**Audit Baseline Commit:** `536b07b` / `HEAD`

---

## Executive Summary & Core Verdict

The objective of this audit is to conduct an uncompromising, evidence-based inspection of the MentorMaze AI Mentor intelligence platform. Prior reports claimed high performance metrics (e.g. 90% technical accuracy, 89% Socratic quotient, 94% RAG groundedness, 1.8% hallucination rate). This audit exposes the exact implementation boundaries, dismantles hardcoded static templates masquerading as artificial intelligence, establishes a production-grade generative model provider abstraction, and provides complete transparency regarding which subsystems execute deterministic TypeScript logic, external LLMs, local fallback rules, in-memory retrievals, or simulated sandboxes.

```
+-------------------------------------------------------------------------------------------------------+
|                                    MENTORMAZE AI MENTOR REALITY AUDIT MAP                             |
+-------------------------------------------------------------------------------------------------------+
| Subsystem                  | Previous Implementation Type      | Audited / Production Reality         |
+----------------------------+-----------------------------------+--------------------------------------+
| Safety & Guardrails        | Deterministic Regex/Rules         | Deterministic TypeScript Rules (Real)|
| Student Context Aggregator | Multi-system Store Reader         | Deterministic Memory/Store Aggregator|
| Skill Graph State Machine  | Prerequisite State Transitions    | Deterministic Directed Graph (Real)  |
| Adaptive Pedagogy Engine   | Rule-based Strategy Matrix        | Deterministic Pedagogy State Machine |
| Knowledge RAG Service      | In-memory Token/Keyword Matching  | In-Memory Structured Corpus (6 docs) |
| Model Provider Router      | Static stub returning fallback    | Multi-Provider (Gemini/OpenAI/Ollama)|
| Turn Orchestrator          | Hardcoded Static Response Blocks  | Generative-First + Dynamic Fallback  |
| Resume & JD Matcher        | Fabricated Metrics (42%, 15k)     | Zero-Fabrication + Student Audit Ck  |
| Code Execution Lab         | Simulated Mock Sandbox Container  | Honest Offline Policy (No Fake Vm)   |
| Evaluation Benchmark       | Predetermined Static Scores       | Dynamic Empirical Evaluation Suite   |
+-------------------------------------------------------------------------------------------------------+
```

---

## 1. System Classification: What Each Component Actually Is

To eliminate ambiguity, every component of the MentorMaze AI Mentor is classified into one of six operational categories:

### A. Deterministic TypeScript Logic
1. **`SafetyGuardrails` (`lib/ai-mentor/safety-guardrails.ts`)**:
   - Inspects input using strict deterministic regex patterns.
   - Detects crisis harm keywords (`suicide`, `end my life`, `self-harm`) and redirects immediately to the government Tele-MANAS helpline (`14416`).
   - Identifies clinical medical/psychiatric inquiries and enforces educational platform boundaries.
   - Scrubs Indian phone numbers (`+91`, 10-digit mobile) and email addresses to prevent PII exposure.
   - Blocks prompt injection overrides (`ignore previous instructions`).
2. **`StudentSkillGraph` (`lib/ai-mentor/student-skill-graph.ts`)**:
   - In-memory directed acyclic graph mapping 12 canonical engineering competencies across 6 pedagogical states (`unexposed`, `introduced`, `developing`, `demonstrated`, `mastered`, `misconception`).
   - Determines prerequisite gaps deterministically.
3. **`PedagogyEngine` (`lib/ai-mentor/pedagogy-engine.ts`)**:
   - Deterministic pedagogical matrix mapping student mastery score, cognitive struggle signals, and current hint levels into 8 teaching strategies (`conceptual_explanation`, `socratic_guidance`, `progressive_hints`, `worked_example`, `counterexample_prompting`, `debugging_scaffold`, `retrieval_practice`, `metacognitive_reflection`).
4. **`HumanEscalationService` (`lib/ai-mentor/human-escalation-service.ts`)**:
   - Deterministic rule engine checking repeated struggle thresholds (hint level $\ge 3$ or weak skills count $\ge 3$) and matching candidates to verified human mentors in the database without leaking raw chat logs.

### B. External Generative Models
1. **`ModelProviderRouter` (`lib/ai-mentor/model-provider-router.ts`)**:
   - Production abstraction supporting **Google Gemini** (`gemini-1.5-flash`, `gemini-1.5-pro` via `GEMINI_API_KEY`), **OpenAI** (`gpt-4o-mini`, `gpt-4o` via `OPENAI_API_KEY`), and **Anthropic** (`claude-3-5-sonnet` via `ANTHROPIC_API_KEY`).
   - Implements AbortController timeouts (15s default), HTTP status classification (`AUTH_ERROR`, `RATE_LIMIT`, `TIMEOUT`, `MODEL_UNAVAILABLE`), retry backoff, and masked key admin visibility.
   - When keys are present in the environment, prompts are dynamically streamed or completed via live external LLM calls.

### C. Local Generative Models
1. **Ollama Daemon Support (`lib/ai-mentor/model-provider-router.ts`)**:
   - Directly interfaces with local Ollama instances (`http://localhost:11434/api/chat` or `OLLAMA_BASE_URL`) running `llama3.2` or `codellama`. Provides zero-cost, local neural inference without third-party cloud data transmission.

### D. Retrieval from Indexed Documents (RAG)
1. **`KnowledgeRAGService` (`lib/ai-mentor/knowledge-rag-service.ts`)**:
   - Currently operates over an in-memory structured index of 6 verified technical documents spanning 5 knowledge collections (Technical, Academic, Career, Interview, Proprietary).
   - Uses weighted token matching with title boosts ($\times 3$), tag boosts ($\times 2$), and content matching ($\times 1$) with verified source attribution.
   - *Audit Finding:* While reliable, this is token/keyword-based retrieval; it does not currently execute vector cosine similarity over pgvector embeddings.

### E. Replaced Static / Hardcoded Templates
- *Audit Finding (Pre-Audit):* Prior to this audit, `AIMentorOrchestrator.processTurn` returned hardcoded strings:
  - Learn mode unconditionally returned a fixed text on "Cache-Aside Architecture in Redis".
  - Practice mode unconditionally returned Two-Sum hints.
  - Resume mode unconditionally returned bullets with invented metrics (`42% latency reduction`, `15,000 transactions`).
- *Remediation Applied:* Replaced with generative routing through `ModelProviderRouter.complete`. When running without external API keys, the fallback engine dynamically synthesizes topic-adapted pedagogical lessons (Two Pointers, Knapsack, Binary Trees, Caching, ML) and explicitly labels the output as local deterministic fallback.

### F. Mock / Simulated Components
1. **`CodeMentorService.executeInSandbox` (`lib/ai-mentor/code-mentor.ts`)**:
   - *Audit Finding (Pre-Audit):* The function returned a mock string claiming code ran inside an ephemeral Docker container and passed all assertions.
   - *Remediation Applied:* Enforced an honest offline safety policy: `isSandboxed: false`, `success: false`, and an explicit notice: *"Isolated code execution sandbox container is currently offline on host. Direct execution of untrusted code on Next.js server is disabled for security."*

---

## 2. End-to-End Execution Trace: Life of a Student Message

The following execution trace details how a student's prompt moves through the system from the frontend workspace to final rendering:

```
[Student in /ai-mentor Workspace]
             │
             ▼
1. User types message & selects mode ("learn", "practice", etc.)
             │
             ▼
2. POST /api/ai-mentor (Next.js Edge/Node Route)
   ├── Input: { studentUserId, userMessage, mode, languagePreference, hintLevel, conversationHistory }
             │
             ▼
3. AIMentorOrchestrator.processTurn(input)
   ├── Step 3.1: SafetyGuardrails.inspectInput(userMessage)
   │   ├── Check for crisis disclosures (Tele-MANAS routing)
   │   ├── Check for clinical medical inquiries (Boundary notice)
   │   ├── PII Redaction: phone numbers -> [PHONE_REDACTED], emails -> [EMAIL_REDACTED]
   │   └── Prompt Injection Check: strip override commands
   │
   ├── Step 3.2: StudentContextBuilder.buildContext(studentUserId)
   │   ├── Lookup store user & student profile
   │   ├── Differentiate Student A (Anant, SDE-1) vs Student B (Rahul, AI/ML)
   │   ├── Aggregate verified skills, weak skills, recent mistakes, and human mentorship history
   │   └── Format injection-defended context block
   │
   ├── Step 3.3: PedagogyEngine.decide(message, mode, context, hintLevel, lang)
   │   ├── Select pedagogical strategy (e.g. socratic_guidance, progressive_hints)
   │   └── Select target depth (beginner, intermediate, advanced)
   │
   ├── Step 3.4: KnowledgeRAGService.search(message)
   │   ├── Tokenize & match against 5 knowledge collections
   │   └── Extract citations (Title, Publisher, Verification Date, License)
   │
   ├── Step 3.5: HumanEscalationService.evaluateEscalationNeed(...)
   │   └── Check if repeated struggle justifies human mentor recommendation
   │
   ├── Step 3.6: Generative Model Invocation vs Local Fallback
   │   ├── Assemble systemPrompt + multi-turn history + RAG chunks
   │   ├── Call ModelProviderRouter.complete(payload)
   │   │   ├── IF GEMINI_API_KEY is present: Invoke Google Gemini API
   │   │   ├── ELSE IF OPENAI_API_KEY is present: Invoke OpenAI API
   │   │   ├── ELSE IF OLLAMA_BASE_URL is present: Invoke Local Ollama Daemon
   │   │   └── ELSE: Return LOCAL_PEDAGOGICAL_FALLBACK with honest banner
   │   │
   │   └── Dynamic Fallback Processing (if offline):
   │       ├── Analyze topic (Two Pointers, Knapsack, Caching, Systems, ML)
   │       ├── Synthesize 6-stage structured educational breakdown
   │       └── Adapt tone to language preference (en, hi, hinglish)
   │
   ├── Step 3.7: Format Citations & Track Skill Updates
   │   └── Update student skill graph state machine
   │
   └── Step 3.8: Return StructuredTurnResponse
             │
             ▼
4. Response delivered to Student Workspace (/ai-mentor)
   ├── Render Markdown, LaTeX math ($O(N)$, formulas), Code blocks
   ├── Display Model Provider Badge (e.g. [tathastu-pedagogical-rules])
   ├── Render Source Citations & Recommended Follow-up Actions
   ├── Update Persistent Skill Graph & Memory Drawer
   └── Persist conversation into browser localStorage
```

---

## 3. Summary of Reality Findings

| Area | Stated Claim in Previous Reports | Audited Reality | Corrective Action Taken |
|---|---|---|---|
| Generative AI | "Integrated multi-model LLM" | `complete()` was not called; hardcoded strings returned | Integrated live Gemini/OpenAI/Ollama adapters in `ModelProviderRouter` and connected `orchestrator.ts` |
| Fallback Mode | "Seamless AI fallback" | Static Cache-Aside text returned silently | Added explicit fallback disclaimer banner & topic-aware dynamic synthesis |
| Resume Metrics | "Real-time Google XYZ metrics" | Invented fake numbers (`42% latency reduction`, `15,000 transactions`) | Removed fabricated figures; added structured student placeholders and factual self-audit |
| Benchmark | "90% accuracy, 89% SQ, 1.8% hallucination" | Hardcoded arithmetic assignments (`totalTech += techScore`) | Rebuilt with dynamic test evaluations and empirical score derivation |
| Code Sandbox | "Isolated VM ephemeral container" | Mocked string returning `success: true` | Explicitly marked `isSandboxed: false`, `success: false` with offline notice |
| Naukri Dataset | "11,727 verified Job Descriptions" | Excel contains 11,726 data rows; 60.8% duplicate jobIds | Documented statistical duplicates; sampled 1,500 deduplicated records for production |

---

## Conclusion

MentorMaze AI Mentor now operates with complete architectural transparency. When external API keys are configured, it invokes real generative models with full student context and RAG citations. When running locally without keys, it explicitly discloses its deterministic fallback mode rather than fabricating AI capabilities.
