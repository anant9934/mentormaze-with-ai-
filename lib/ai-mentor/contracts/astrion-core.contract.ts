/**
 * ASTRION CORE Domain Contract
 * Master technical contract for ASTRION intelligence orchestration.
 * Brand: ASTRION by MentorMaze (AI Tathastu)
 */

export interface AstrionCoreIdentityContract {
  id: "astrion-core";
  brandName: "ASTRION";
  expansion: "Adaptive Strategic Intelligence & Reasoning Network";
  parentProduct: "MentorMaze";
  parentEcosystem: "AI Tathastu";
  version: "1.0.0";
  canonicalDomain: "https://mentormaze.aitathastu.com";
  defaultLocale: "en";
  supportedLocales: readonly ["en", "hi", "hinglish"];
}

export const ASTRION_CORE_IDENTITY: AstrionCoreIdentityContract = {
  id: "astrion-core",
  brandName: "ASTRION",
  expansion: "Adaptive Strategic Intelligence & Reasoning Network",
  parentProduct: "MentorMaze",
  parentEcosystem: "AI Tathastu",
  version: "1.0.0",
  canonicalDomain: "https://mentormaze.aitathastu.com",
  defaultLocale: "en",
  supportedLocales: ["en", "hi", "hinglish"] as const,
};

export type AstrionCoreStatus = "ready" | "degraded" | "maintenance" | "offline";

export interface AstrionHealthStatus {
  core: AstrionCoreIdentityContract;
  status: AstrionCoreStatus;
  activeProvider: string;
  databaseConnected: boolean;
  registeredSpecialistsCount: number;
  timestamp: string;
}
