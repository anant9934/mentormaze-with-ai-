/**
 * System Design Specialist Capability — Dr. Aarav Mehta Internal Module
 * Focus: Distributed systems, high scalability, data partitioning, consensus, cache invalidation
 */

import {
  ISpecialistCapability,
  SpecialistExecutionInput,
  SpecialistExecutionOutput,
  TaskCategoryType,
} from "./specialist-interface";
import { FocusArea, SpecialistCapabilityInfo } from "../types";

export class SystemDesignSpecialist implements ISpecialistCapability {
  public readonly id: FocusArea = "system_design";
  public readonly name = "System Design & Architecture Specialist";
  public readonly badge = "Using System Design Expertise";
  public readonly domain = "Distributed Systems & Scalable Architecture";
  public readonly description = "Designs resilient, high-throughput architectures, evaluates CAP trade-offs, and analyzes partitioning and caching topologies.";

  public matchesIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const keywords = [
      "system design",
      "architecture",
      "distributed",
      "scale",
      "scalability",
      "microservice",
      "redis",
      "kafka",
      "database",
      "sharding",
      "partition",
      "load balancer",
      "cap theorem",
      "high availability",
      "throughput",
      "latency",
      "rate limiter",
      "url shortener",
      "cache-aside",
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
    return `### INTERNAL SPECIALIST ACTIVATION: System Design & Distributed Architecture
- Follow standard Senior/Staff engineering interview structure:
  1. Scope & Requirements: Functional vs Non-Functional requirements (DAU, QPS, Latency SLO, Availability).
  2. Capacity Estimation: Storage per day, Read/Write QPS ratio, Network bandwidth.
  3. High-Level Architecture Diagram (in ASCII or Mermaid block).
  4. Deep Dives: Data model, caching topology, replication, sharding key selection.
  5. Bottlenecks & Failure Modes: Single points of failure (SPOF), thundering herds, split-brain consensus.
- Provide explicit operational numbers and realistic hardware constraints.`;
  }

  public executeDeterministic(input: SpecialistExecutionInput): SpecialistExecutionOutput {
    const lower = input.userMessage.toLowerCase();

    let responseText = `### 🏗️ Distributed Architecture & System Design Analysis\n\n`;

    if (lower.includes("rate limit") || lower.includes("rate-limiter")) {
      responseText += `#### **System: Distributed Token Bucket Rate Limiter**\n\n`;
      responseText += `##### **1. Non-Functional Requirements**\n`;
      responseText += `- **Low Latency**: Limit check overhead $< 2\\text{ms}$.\n`;
      responseText += `- **High Availability**: Fallback to allow request if rate limiter tier becomes temporarily unavailable.\n`;
      responseText += `- **Distributed Accuracy**: Sync counts across globally distributed clusters.\n\n`;
      responseText += `##### **2. Architecture Topology**\n`;
      responseText += `\`\`\`\n`;
      responseText += `Client ---> [ API Gateway / Reverse Proxy ]\n`;
      responseText += `                      |\n`;
      responseText += `              (Token Bucket Check via Redis Lua Script)\n`;
      responseText += `                      v\n`;
      responseText += `             [ Redis Cluster ]\n`;
      responseText += `\`\`\`\n\n`;
      responseText += `##### **3. Atomic Lua Script Pattern**\n`;
      responseText += `To avoid race conditions between checking tokens and decrementing:\n`;
      responseText += `\`\`\`lua\n`;
      responseText += `-- Atomic token bucket evaluation in Redis\n`;
      responseText += `local key = KEYS[1]\n`;
      responseText += `local limit = tonumber(ARGV[1])\n`;
      responseText += `local current = tonumber(redis.call('get', key) or "0")\n`;
      responseText += `if current + 1 > limit then\n`;
      responseText += `  return 0 -- Rejected (HTTP 429)\n`;
      responseText += `else\n`;
      responseText += `  redis.call("INCRBY", key, 1)\n`;
      responseText += `  if current == 0 then redis.call("EXPIRE", key, 60) end\n`;
      responseText += `  return 1 -- Allowed\n`;
      responseText += `end\n`;
      responseText += `\`\`\`\n\n`;
      responseText += `##### **4. Crucial Trade-Off Check**\n`;
      responseText += `*Why is an atomic Redis Lua script superior to performing GET followed by INCR from the application server?*`;
    } else {
      responseText += `#### **System: Distributed Caching & Cache-Aside Invalidation**\n\n`;
      responseText += `##### **1. Core Architectural Overview**\n`;
      responseText += `Relational stores handle 1k-5k QPS before IOPS saturation. Redis clusters deliver 100k+ QPS with sub-millisecond p99 latency.\n\n`;
      responseText += `##### **2. Component Interaction**\n`;
      responseText += `\`\`\`\n`;
      responseText += `[ Client ] ---> [ Application Tier ]\n`;
      responseText += `                      |\n`;
      responseText += `       +--------------+--------------+\n`;
      responseText += `       | (1) Read Cache              | (2) Cache Miss / DB Read\n`;
      responseText += `       v                             v\n`;
      responseText += `  [ Redis Cluster ]            [ PostgreSQL Primary ]\n`;
      responseText += `\`\`\`\n\n`;
      responseText += `##### **3. The Thundering Herd / Cache Stampede Invariant**\n`;
      responseText += `- **The Problem**: A high-traffic key (e.g., celebrity profile) expires. 20,000 requests miss cache simultaneously and hit Postgres, inducing cascading connection exhaustion.\n`;
      responseText += `- **Production Resolution**: Probabilistic Early Expiration (XFetch algorithm) or Distributed Mutex with Redis \`SET NX EX\`.\n\n`;
      responseText += `##### **4. Understanding Check**\n`;
      responseText += `*Why is it standard industry practice to delete the cache key rather than update it when mutating state in the database?*`;
    }

    const voiceText = "In distributed systems design, we evaluate latency, throughput, and consistency. Notice the trade-off between atomic execution and cluster replication latency.";

    return {
      responseText,
      voiceText,
      recommendedActions: [
        { id: "act-sd-tradeoff", title: "Document CAP Theorem & consistency guarantees", category: "Architecture", priority: "high" },
        { id: "act-sd-redis", title: "Practice Redis Lua script atomicity in playground", category: "System Design", priority: "medium" },
      ],
      skillUpdates: [
        {
          skillId: "system_design_scaling",
          skillName: "Distributed Systems & Scalability",
          previousState: "developing",
          newState: "demonstrated",
          score: 8.8,
          confidence: 0.92,
          evidence: "Demonstrated understanding of distributed caching topologies, race condition prevention, and thundering herd mitigations",
        },
      ],
      postInteractionCheck: {
        question: "How does an atomic Redis Lua script prevent race conditions during rate limiting?",
        options: [
          "It compiles Python bytecode into machine code",
          "Redis executes Lua scripts single-threaded without intervening commands between read and write",
          "It forces Redis to replicate synchronously to all replicas",
          "It locks the entire operating system kernel",
        ],
        correctOptionIndex: 1,
        explanation: "Redis runs single-threaded for command execution. A Lua script executes as a single uninterruptible atomic transaction.",
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
        { id: "act-sd-diagram", title: "Draw high-level data flow diagram with SPOF analysis", category: "Architecture", priority: "high" },
        { id: "act-sd-load", title: "Estimate storage and network bandwidth for 10M DAU", category: "Capacity Planning", priority: "medium" },
      ],
      skillUpdates: [],
    };
  }
}
