/**
 * ASTRION External Integration Contracts
 * Standardized contracts for external evidence ingestion (AI Tathastu, Collaborate, Avsar, IRIS, GitHub, LeetCode, LinkedIn).
 * Brand: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 */

import { EvidenceClassification } from "../student-intelligence-graph";
import { ConsentPurpose } from "../student-consent-service";

export type ExternalSourceSystem =
  | "AITathastu"
  | "Collaborate"
  | "Avsar"
  | "IRIS"
  | "GitHub"
  | "LinkedIn"
  | "LeetCode"
  | "HackerRank"
  | "HackerEarth";

export type ConnectorStatus = "active" | "unconfigured" | "disconnected" | "rate_limited" | "maintenance";

export interface NormalizedEvidenceIngestionPayload {
  studentUserId: string;
  sourceSystem: ExternalSourceSystem;
  sourceRecordId: string;
  entityType: "skill" | "project" | "experience" | "assessment" | "credential";
  entityName: string;
  evidenceType: EvidenceClassification;
  confidence: number;
  retrievedAt: string;
  expiresAt?: string;
  provenanceProof?: {
    canonicalUrl?: string;
    verificationHash?: string;
    externalTimestamp?: string;
  };
  consentReference: ConsentPurpose;
  rawPayload: Record<string, any>;
}

export interface IExternalConnector {
  readonly sourceSystem: ExternalSourceSystem;
  getStatus(): Promise<{
    status: ConnectorStatus;
    isConfigured: boolean;
    lastSyncedAt?: string;
    description: string;
  }>;
  ingestEvidence(studentUserId: string): Promise<NormalizedEvidenceIngestionPayload[]>;
}

export class ExternalConnectorRegistry {
  private static registeredConnectors: Map<ExternalSourceSystem, IExternalConnector> = new Map();

  public static register(connector: IExternalConnector): void {
    this.registeredConnectors.set(connector.sourceSystem, connector);
  }

  public static getConnector(system: ExternalSourceSystem): IExternalConnector | undefined {
    return this.registeredConnectors.get(system);
  }

  public static async getAllStatuses(): Promise<
    Record<ExternalSourceSystem, { status: ConnectorStatus; isConfigured: boolean; description: string }>
  > {
    const allSystems: ExternalSourceSystem[] = [
      "AITathastu",
      "Collaborate",
      "Avsar",
      "IRIS",
      "GitHub",
      "LinkedIn",
      "LeetCode",
      "HackerRank",
      "HackerEarth",
    ];

    const result: Partial<Record<ExternalSourceSystem, any>> = {};

    for (const sys of allSystems) {
      const connector = this.registeredConnectors.get(sys);
      if (connector) {
        result[sys] = await connector.getStatus();
      } else {
        // Honest disclosure: connector is unconfigured/disconnected in this phase
        result[sys] = {
          status: "unconfigured" as const,
          isConfigured: false,
          description: `${sys} connector is unconfigured in local development environment. Zero mock data fabricated.`,
        };
      }
    }

    return result as Record<ExternalSourceSystem, any>;
  }
}
