/**
 * MentorMaze Human Mock Interview Rubric Constants & Types
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Client-safe definitions for categories, weighted rubrics, and score calculation.
 */

export type InterviewCategory =
  | "sde_frontend"
  | "sde_backend"
  | "system_design"
  | "behavioral"
  | "data_science"
  | "product_management";

export interface RubricDimensionWeight {
  key: string;
  label: string;
  weight: number; // percentage, e.g. 25
  description: string;
}

export const CATEGORY_RUBRICS: Record<InterviewCategory, RubricDimensionWeight[]> = {
  sde_backend: [
    { key: "technical", label: "Data Structures & Algorithms", weight: 25, description: "Correctness of algorithmic approach, asymptotic complexity, optimality" },
    { key: "problem_solving", label: "Problem Decomposition", weight: 25, description: "Breaking down complex specifications, asking clarifying questions" },
    { key: "code_quality", label: "Clean Code & Modularity", weight: 20, description: "Idiomatic syntax, naming conventions, separation of concerns" },
    { key: "edge_cases", label: "Edge Cases & Testing", weight: 15, description: "Handling nulls, boundary constraints, overflow, unit test readiness" },
    { key: "communication", label: "Technical Articulation", weight: 15, description: "Explaining thought process clearly while coding" },
  ],
  sde_frontend: [
    { key: "technical", label: "DOM, JavaScript & Frameworks", weight: 25, description: "React / modern JS core knowledge, state management, lifecycle" },
    { key: "ui_ux", label: "UI Layout & Styling Architecture", weight: 25, description: "CSS/Tailwind proficiency, responsive design, visual hierarchy" },
    { key: "performance", label: "Web Performance & Accessibility", weight: 20, description: "Render optimization, memoization, WCAG accessibility compliance" },
    { key: "problem_solving", label: "Interactive Component Design", weight: 15, description: "Managing asynchronous flows, form validation, error states" },
    { key: "communication", label: "Articulation & Collaboration", weight: 15, description: "Clear explanation of architectural tradeoffs" },
  ],
  system_design: [
    { key: "architecture", label: "High-Level Architecture", weight: 30, description: "Microservices vs monolith, load balancers, API gateways, database choices" },
    { key: "scalability", label: "Scalability & Fault Tolerance", weight: 25, description: "Horizontal partitioning, caching (Redis), replication, failover" },
    { key: "data_modeling", label: "Data Modeling & Schema", weight: 20, description: "Relational vs NoSQL, indexing, consistency models (CAP theorem)" },
    { key: "estimations", label: "Back-of-the-Envelope Math", weight: 15, description: "QPS, storage, throughput, bandwidth calculations" },
    { key: "communication", label: "Design Tradeoff Defense", weight: 10, description: "Defending design choices under changing load constraints" },
  ],
  behavioral: [
    { key: "star_method", label: "STAR Structure & Storytelling", weight: 30, description: "Situation, Task, Action, and Result framing" },
    { key: "leadership", label: "Ownership & Initiative", weight: 25, description: "Going above and beyond, leading through ambiguity" },
    { key: "conflict_resolution", label: "Conflict & Disagreement", weight: 20, description: "Handling stakeholder conflicts constructively" },
    { key: "culture_fit", label: "Culture & Value Alignment", weight: 15, description: "Teamwork, empathy, growth mindset, ethical grounding" },
    { key: "communication", label: "Executive Presence & Clarity", weight: 10, description: "Concise, articulate, high-confidence delivery" },
  ],
  data_science: [
    { key: "ml_fundamentals", label: "Machine Learning Theory", weight: 25, description: "Supervised/unsupervised, loss functions, overfitting mitigation" },
    { key: "statistics", label: "Applied Statistics & Probability", weight: 25, description: "Hypothesis testing, A/B experimentation, metrics selection" },
    { key: "feature_engineering", label: "Feature Engineering & Data Pipeline", weight: 20, description: "Transformations, handling missing data, scalability" },
    { key: "model_evaluation", label: "Model Evaluation & Tradeoffs", weight: 15, description: "Precision, Recall, ROC-AUC, bias-variance balance" },
    { key: "communication", label: "Translating Data to Business Impact", weight: 15, description: "Explaining ML concepts clearly to stakeholders" },
  ],
  product_management: [
    { key: "product_sense", label: "Product Sense & Vision", weight: 30, description: "User persona empathy, pain point identification, problem framing" },
    { key: "execution", label: "Execution & Metrics", weight: 25, description: "North Star metric, guardrail metrics, feature prioritization frameworks" },
    { key: "strategy", label: "Strategic Thinking & Moats", weight: 20, description: "Competitive landscape, go-to-market, pricing, ecosystem impact" },
    { key: "leadership", label: "Cross-Functional Influence", weight: 15, description: "Rallying engineering, design, and executive stakeholders" },
    { key: "communication", label: "Crisp Articulation", weight: 10, description: "Structured, concise, defensible presentation" },
  ],
};

/**
 * Computes weighted overall score (0.00 to 10.00) based on dimension scores.
 */
export function calculateOverallScore(
  category: InterviewCategory,
  dimensionScores: Record<string, number>
): number {
  const dimensions = CATEGORY_RUBRICS[category] || CATEGORY_RUBRICS.sde_backend;
  let weightedSum = 0;
  let totalWeight = 0;

  for (const dim of dimensions) {
    const score = Number(dimensionScores[dim.key] ?? 5.0);
    const clampedScore = Math.min(10.0, Math.max(0.0, score));
    weightedSum += clampedScore * dim.weight;
    totalWeight += dim.weight;
  }

  const overall = totalWeight > 0 ? weightedSum / totalWeight : 5.0;
  return Number(overall.toFixed(2));
}
