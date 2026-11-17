/**
 * Project Specialist Capability — Dr. Aarav Mehta Internal Module
 * Focus: Production architecture, portfolio engineering, tech stack selection, API contracts
 */

import {
  ISpecialistCapability,
  SpecialistExecutionInput,
  SpecialistExecutionOutput,
  TaskCategoryType,
} from "./specialist-interface";
import { FocusArea, SpecialistCapabilityInfo } from "../types";

export class ProjectSpecialist implements ISpecialistCapability {
  public readonly id: FocusArea = "projects";
  public readonly name = "Portfolio Project & Architecture Specialist";
  public readonly badge = "Using Project Architecture Expertise";
  public readonly domain = "Production Software Engineering & Portfolio Systems";
  public readonly description = "Designs comprehensive, non-trivial engineering projects with production-grade backend architectures, database schemas, and CI/CD pipelines.";

  public matchesIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const keywords = [
      "project",
      "portfolio",
      "build",
      "tech stack",
      "schema",
      "api design",
      "rest api",
      "graphql",
      "docker",
      "fullstack",
      "side project",
      "crud",
    ];
    return keywords.some((kw) => lower.includes(kw));
  }

  public getTaskCategory(): TaskCategoryType {
    return "reasoning";
  }

  public getMetadata(): SpecialistCapabilityInfo {
    return {
      id: this.id,
      name: this.name,
      badge: this.badge,
      domain: this.domain,
      description: this.description,
    };
  }

  public getSystemPromptEnrichment(input: SpecialistExecutionInput): string {
    return `### INTERNAL SPECIALIST ACTIVATION: Portfolio Project Architecture
- Avoid recommending generic tutorial clones (e.g. basic Todo app, generic Netflix clone).
- Guide the student to build non-trivial systems that solve real distributed engineering challenges:
  1. Real-time collaboration (WebSockets, CRDTs / Operational Transformation).
  2. Asynchronous job queues with BullMQ/Redis and dead-letter queues.
  3. Relational modeling with transactional integrity, foreign keys, and indexes.
  4. Observability: Structured logging, Prometheus metrics, OpenTelemetry tracing.
- Provide a concrete schema, API contract, and deployment architecture blueprint.`;
  }

  public executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput {
    let responseText = `### 🚀 Production Portfolio Project Architecture\n\n`;
    responseText += `#### **Recommended Project: Distributed Collaborative Workspace with Operational Transformation**\n\n`;
    responseText += `##### **1. Why This Stands Out to Hiring Committees**\n`;
    responseText += `Most student portfolios contain generic CRUD applications with basic REST endpoints. Building an asynchronous, event-driven collaborative engine demonstrates mastery of network protocols, concurrency control, and distributed consistency.\n\n`;

    responseText += `##### **2. Suggested Tech Stack**\n`;
    responseText += `- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand.\n`;
    responseText += `- **Real-time Synchronization**: WebSockets with Node.js / Go or Yjs CRDT providers.\n`;
    responseText += `- **Data Layer**: PostgreSQL with Prisma / Drizzle ORM, Redis for session cache and pub/sub.\n`;
    responseText += `- **Queue & Background Jobs**: BullMQ on Redis for document snapshotting and export tasks.\n`;
    responseText += `- **Deployment**: Docker containerization, AWS ECS / Fly.io, GitHub Actions CI/CD.\n\n`;

    responseText += `##### **3. Core Database Schema Design**\n`;
    responseText += `\`\`\`sql\n`;
    responseText += `-- Relational integrity with audit trail\n`;
    responseText += `CREATE TABLE documents (\n`;
    responseText += `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    responseText += `    title VARCHAR(255) NOT NULL,\n`;
    responseText += `    content TEXT NOT NULL DEFAULT '',\n`;
    responseText += `    version INT NOT NULL DEFAULT 1,\n`;
    responseText += `    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,\n`;
    responseText += `    created_at TIMESTAMPTZ DEFAULT NOW(),\n`;
    responseText += `    updated_at TIMESTAMPTZ DEFAULT NOW()\n`;
    responseText += `);\n`;
    responseText += `CREATE INDEX idx_documents_owner ON documents(owner_id);\n`;
    responseText += `\`\`\`\n\n`;

    responseText += `##### **4. Engineering Trade-Off Check**\n`;
    responseText += `*When implementing real-time document editing across 50 simultaneous users, what are the primary trade-offs between Conflict-Free Replicated Data Types (CRDTs) and central Operational Transformation (OT)?*`;

    const voiceText = "To stand out to recruiters, build an event-driven system with real-time concurrency. Notice how relational schema constraints guarantee data integrity.";

    return {
      responseText,
      voiceText,
      recommendedActions: [
        { id: "act-proj-repo", title: "Initialize monorepo with TypeScript and Docker Compose", category: "Project", priority: "high" },
        { id: "act-proj-crdt", title: "Review Yjs vs Automerge CRDT benchmarks", category: "Architecture", priority: "medium" },
      ],
      skillUpdates: [
        {
          skillId: "system_design_scaling",
          skillName: "Distributed Systems & Scalability",
          previousState: "developing",
          newState: "demonstrated",
          score: 8.2,
          confidence: 0.86,
          evidence: "Selected production-grade fullstack architecture with relational indexing and background job queues",
        },
      ],
      postInteractionCheck: {
        question: "Why is a central message broker or Redis Pub/Sub needed when scaling WebSocket connections across multiple application servers?",
        options: [
          "WebSockets cannot run over TCP without Redis",
          "A client connected to Server A cannot directly emit packets to a client connected to Server B without a shared pub/sub layer",
          "Browsers reject WebSocket packets without Redis auth tokens",
          "It reduces client-side memory footprint",
        ],
        correctOptionIndex: 1,
        explanation: "In multi-instance deployments, client sockets are pinned to individual servers. A shared pub/sub broker relays broadcast events between all server nodes.",
      },
      systemPromptEnrichment: this.getSystemPromptEnrichment(input),
      taskCategory: this.getTaskCategory(),
    };
  }

  public postProcessGenerative(
    content: string,
    input: SpecialistExecutionInput
  ): Partial<SpecialistExecutionOutput> {
    return {
      recommendedActions: [
        { id: "act-proj-milestones", title: "Create GitHub milestone issues for v1 release", category: "Project", priority: "high" },
      ],
      skillUpdates: [],
    };
  }
}
