# MentorMaze — Human Mock Interview Rubric Evaluation Workflow

**Official Platform:** MentorMaze by AI Tathastu  
**Official Production Domain:** `https://mentormaze.aitathastu.com`  
**Evaluation Standard:** Standardized, category-weighted rubrics on a 0.0 to 10.0 scale  

---

## 1. Overview & Pedagogical Purpose

MentorMaze human mock interviews provide engineering and product students with authentic interview simulations conducted by verified industry leaders from Microsoft, Google, Adobe, and top tech firms.

To eliminate subjective grading and deliver high-value candidate feedback:
1. **Weighted Category Rubrics:** Each technical or behavioral track defines distinct weighted dimensions.
2. **Normalized 0.0 to 10.0 Scale:** Every dimension is scored between `0.0` (unprepared) and `10.0` (exceptional), with `8.0+` indicating readiness for hiring bar.
3. **Draft vs. Published Isolation:** Mentors can save evaluations as in-progress drafts. Candidates cannot view scorecards until the mentor formally publishes them.
4. **Actionable Recommendations:** Scorecards split narrative into strengths, growth areas, detailed analysis, and a step-by-step study plan.

---

## 2. Category Rubric Specifications

### 1. Software Engineering — Backend & DSA (`sde_backend`)
| Dimension | Key | Weight | Criteria |
|---|---|---|---|
| **Data Structures & Algorithms** | `technical` | 25% | Algorithmic correctness, asymptotic time/space complexity ($O(N)$ analysis), optimal approach |
| **Problem Decomposition** | `problem_solving` | 25% | Asking clarifying questions, breaking problem into sub-problems, handling ambiguities |
| **Clean Code & Modularity** | `code_quality` | 20% | Idiomatic syntax, naming conventions, separation of concerns, readability |
| **Edge Cases & Testing** | `edge_cases` | 15% | Handling null, empty, negative, boundary constraints, and unit test verification |
| **Technical Articulation** | `communication` | 15% | Thinking out loud while writing code, crisp explanation of data structure choices |

### 2. Software Engineering — Frontend & Web (`sde_frontend`)
| Dimension | Key | Weight | Criteria |
|---|---|---|---|
| **DOM & Frameworks** | `technical` | 25% | React / modern JS core knowledge, state management, component lifecycle, hooks |
| **UI Layout & Styling** | `ui_ux` | 25% | CSS/Tailwind proficiency, responsive layout, visual hierarchy, mobile-first design |
| **Performance & Accessibility** | `performance` | 20% | Web vitals, render memoization, bundle splitting, WCAG accessibility compliance |
| **Interactive Component Design**| `problem_solving`| 15% | Asynchronous flows, form validation, error boundaries, optimistic UI |
| **Collaboration & Articulation**| `communication` | 15% | Explaining architectural tradeoffs, design system alignment |

### 3. System Design & Cloud Architecture (`system_design`)
| Dimension | Key | Weight | Criteria |
|---|---|---|---|
| **High-Level Architecture** | `architecture` | 30% | Microservices, API gateways, load balancers, caching layers (Redis), database choice |
| **Scalability & Resilience** | `scalability` | 25% | Horizontal partitioning, replication, failover, circuit breaking, rate limiting |
| **Data Modeling & Schema** | `data_modeling` | 20% | SQL vs NoSQL, indexing strategy, consistency models (CAP / PACELC theorem) |
| **Back-of-Envelope Math** | `estimations` | 15% | Throughput (QPS), memory, storage, bandwidth, and IOPS requirements |
| **Tradeoff Defense** | `communication` | 10% | Defending architecture under extreme traffic spikes and partial outages |

### 4. Behavioral & Leadership (`behavioral`)
| Dimension | Key | Weight | Criteria |
|---|---|---|---|
| **STAR Method Structure** | `star_method` | 30% | Concise Situation, Task, Action, and Measurable Result framing |
| **Ownership & Initiative** | `leadership` | 25% | Driving impact beyond immediate scope, navigating organizational ambiguity |
| **Conflict Resolution** | `conflict_resolution`| 20% | Handling team disagreements and difficult stakeholders constructively |
| **Culture & Values** | `culture_fit` | 15% | Empathy, curiosity, ethical integrity, growth mindset, mentorship of peers |
| **Executive Presence** | `communication` | 10% | Confidence, succinct delivery, listening skills |

---

## 3. Weighted Composite Scoring Algorithm

The overall score is computed as:

$$\text{OverallScore} = \frac{\sum_{i=1}^{n} (\text{score}_i \times \text{weight}_i)}{\sum_{i=1}^{n} \text{weight}_i}$$

Where $\text{score}_i \in [0.0, 10.0]$ and $\sum \text{weight}_i = 100$.

### Benchmark Rating Bands
- **9.0 – 10.0:** Exceptional / Senior Bar Exceeded
- **8.0 – 8.9:** Strong Hire / Bar Met (Ready for top tier product company interviews)
- **6.5 – 7.9:** Developing / Conditional Hire (Solid foundation with specific gaps)
- **Below 6.5:** Needs Substantial Preparation (Core fundamentals require revision)

---

## 4. Evaluation Lifecycle & Draft Isolation

```
1. Interview Concludes
      |
      v
2. Mentor Opens Evaluation Workspace (/mock-interviews/[id]/evaluate)
   - Category-specific sliders loaded
   - Inputs dimension scores (0.0 - 10.0)
   - Enters observed strengths and growth areas
   - Writes detailed narrative and study roadmap
      |
      +---> [ Save as Draft ] ---> Saved in DB (is_draft = true)
      |                             - Candidate sees: "Evaluation in progress"
      |                             - overall_score strictly omitted from candidate API
      |
      +---> [ Publish Scorecard ] -> Saved in DB (is_draft = false, published_at = NOW())
                                    - Notification dispatched to candidate
                                    - Full scorecard accessible at /mock-interviews/[id]/report
```

---

## 5. Candidate Scorecard View (`/mock-interviews/[id]/report`)

The candidate scorecard features:
- **Circular Overall Score Widget:** High-impact visual indicator showing composite score.
- **Competency Dimension Cards:** Detailed breakdown of each rubric axis.
- **Strengths & Growth Areas:** Clearly tagged actionable highlights.
- **Narrative Assessment:** Mentor's qualitative review.
- **Recommended Study Roadmap:** Step-by-step next steps to prepare for actual company interviews.
- **PDF Export:** Printable, shareable verification document.

