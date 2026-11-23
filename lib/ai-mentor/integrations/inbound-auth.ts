/**
 * AI Tathastu Inbound Service-to-Service (M2M) Authentication Boundary
 * 
 * Enforces cryptographic service authentication, issuer/audience validation,
 * token expiry, replay protection, tenant ownership, student consent, and
 * schema category safety.
 */

import * as jose from "jose";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { users, inboundEventLedger } from "@/lib/db/schema";
import { studentSkillNodes } from "@/lib/db/ai-mentor-schema";
import { eq } from "drizzle-orm";
import { StudentConsentService } from "../student-consent-service";
import { JWTKeyRotationService } from "@/lib/security/jwt-key-rotation-service";

export interface InboundSkillPayload {
  skillName: string;
  category: "DSA" | "System Design" | "Programming" | "Soft Skills" | "Core CS";
  masteryScore: number;
  masteryState?: "unassessed" | "novice" | "practicing" | "competent" | "advanced" | "expert";
  evidenceSource?: string;
  verificationConfidence?: number;
}

export interface InboundTathastuPayload {
  eventId: string;
  eventVersion?: number;
  eventType: string;
  sourceSystem: "ai-tathastu";
  targetTenant: "mentormaze";
  studentUserId: string;
  timestamp: string;
  data: {
    verifiedSkills?: InboundSkillPayload[];
    academicRecords?: {
      university?: string;
      degree?: string;
      gpa?: number;
      graduationYear?: number;
    };
    curriculumMilestones?: {
      trackName: string;
      completedModules?: string[];
      assessmentsPassed?: number;
    };
    [key: string]: any;
  };
}

export interface InboundProcessingResult {
  success: boolean;
  eventId: string;
  receiptId: string;
  studentUserId: string;
  skillsIngested: number;
  processedAt: string;
  message: string;
}

export class AITathastuInboundAuthService {
  public static readonly DEFAULT_SECRET = "aitathastu-shared-inbound-secret-2026";
  public static readonly EXPECTED_ISSUER = "ai-tathastu";
  public static readonly EXPECTED_AUDIENCE = "mentormaze";

  // Replay cache: stores JTI / event IDs mapped to timestamp
  private static replayCache: Map<string, number> = new Map();
  private static readonly REPLAY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Helper to clear replay cache (useful for testing)
   */
  public static resetReplayCache(): void {
    this.replayCache.clear();
  }

  /**
   * Generates a signed M2M JWT service token (used by external sender or tests)
   */
  public static async createSignedServiceToken(options?: {
    issuer?: string;
    audience?: string;
    serviceId?: string;
    expiresInSeconds?: number;
    jti?: string;
    secret?: string;
    alg?: string;
    kid?: string;
    scope?: string;
    nbf?: number;
  }): Promise<string> {
    const issuer = options?.issuer ?? this.EXPECTED_ISSUER;
    const audience = options?.audience ?? this.EXPECTED_AUDIENCE;
    const serviceId = options?.serviceId ?? "svc-tathastu-central";
    const expiresIn = options?.expiresInSeconds ?? 300;
    const jti = options?.jti ?? `jti-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const secretKey = options?.secret || process.env.AI_TATHASTU_SERVICE_SECRET || process.env.AITATHASTU_SERVICE_SECRET || this.DEFAULT_SECRET;
    const secret = new TextEncoder().encode(secretKey);
    const alg = options?.alg ?? "HS256";
    const kid = options?.kid ?? "aitathastu-m2m-2026-v1";
    const scope = options?.scope ?? "ecosystem:student_intelligence:sync";

    const jwt = new jose.SignJWT({
      sub: serviceId,
      serviceId,
      scope,
    })
      .setProtectedHeader({ alg, kid })
      .setIssuedAt()
      .setIssuer(issuer)
      .setAudience(audience)
      .setJti(jti)
      .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn);

    if (options?.nbf !== undefined) {
      jwt.setNotBefore(options.nbf);
    }

    return jwt.sign(secret);
  }

  /**
   * Authenticates and verifies the inbound M2M Bearer token.
   */
  public static async verifyServiceToken(authHeader: string | null): Promise<{
    serviceId: string;
    jti: string;
    claims: Record<string, any>;
  }> {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("401_UNAUTHORIZED: Missing or malformed Authorization header. Expected Bearer <token>");
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // 1. Decode & Verify Header Parameters (Algorithm & Key ID)
    let protectedHeader: jose.ProtectedHeaderParameters;
    try {
      protectedHeader = jose.decodeProtectedHeader(token);
    } catch (headerErr: any) {
      throw new Error(`401_UNAUTHORIZED: Malformed JWT header: ${headerErr.message}`);
    }

    // Resolve key from Key Rotation Service
    const kid = protectedHeader.kid || "aitathastu-m2m-2026-v1";
    const keyDef = JWTKeyRotationService.getVerificationKey(kid);

    if (protectedHeader.alg !== keyDef.alg) {
      throw new Error(`401_UNAUTHORIZED: Unsupported or insecure signing algorithm '${protectedHeader.alg}'. Only ${keyDef.alg} is permitted.`);
    }

    let verificationKey: any;
    if (keyDef.isAsymmetric || keyDef.alg === "RS256") {
      verificationKey = typeof keyDef.secretOrPublicKey === "string"
        ? await jose.importSPKI(keyDef.secretOrPublicKey, "RS256")
        : keyDef.secretOrPublicKey;
    } else {
      const secretStr = typeof keyDef.secretOrPublicKey === "string" ? keyDef.secretOrPublicKey : Buffer.from(keyDef.secretOrPublicKey).toString();
      if (secretStr.length < 32 && process.env.NODE_ENV === "production") {
        throw new Error("500_INTERNAL_SERVER_ERROR: Inbound service secret must have at least 256 bits of entropy.");
      }
      verificationKey = new TextEncoder().encode(secretStr);
    }

    let verified: jose.JWTVerifyResult;
    try {
      verified = await jose.jwtVerify(token, verificationKey, {
        issuer: this.EXPECTED_ISSUER,
        audience: this.EXPECTED_AUDIENCE,
        algorithms: [keyDef.alg],
        clockTolerance: "30s",
        maxTokenAge: "1h",
      });
    } catch (err: any) {
      if (err?.code === "ERR_JWT_EXPIRED") {
        throw new Error("401_UNAUTHORIZED: Service token has expired.");
      }
      if (err?.code === "ERR_JWT_CLAIM_VALIDATION_FAILED") {
        throw new Error(`401_UNAUTHORIZED: Token claim validation failed: ${err.message}`);
      }
      throw new Error(`401_UNAUTHORIZED: Invalid service token signature or format (${err.message}).`);
    }

    const payload = verified.payload;
    const jti = payload.jti as string;
    const serviceId = (payload.sub || payload.serviceId || "unknown-service") as string;

    // 2. Validate Token Scope
    const scope = (payload.scope as string) || "";
    const allowedScopes = ["ecosystem:student_intelligence:sync", "sync:inbound"];
    const hasValidScope = allowedScopes.some((s) => scope.split(" ").includes(s) || scope === s);
    if (!hasValidScope) {
      throw new Error(`403_FORBIDDEN: Insufficient token scope '${scope}'. Required: ecosystem:student_intelligence:sync or sync:inbound.`);
    }

    // 3. Replay Protection on JTI
    if (jti) {
      this.checkAndRecordReplay(jti);
    }

    return {
      serviceId,
      jti,
      claims: payload,
    };
  }

  /**
   * Replay attack defense
   */
  private static checkAndRecordReplay(identifier: string): void {
    const now = Date.now();
    // Prune stale entries
    for (const [key, timestamp] of this.replayCache.entries()) {
      if (now - timestamp > this.REPLAY_WINDOW_MS) {
        this.replayCache.delete(key);
      }
    }

    if (this.replayCache.has(identifier)) {
      throw new Error(`409_CONFLICT: Replay attack detected. Event ID or token JTI (${identifier}) has already been processed.`);
    }

    this.replayCache.set(identifier, now);
  }

  /**
   * Complete inbound processing pipeline:
   * 1. Service Token Authentication
   * 2. Event Replay Check (Memory & Database)
   * 3. Tenant Boundary Verification
   * 4. Student Identity Lookup
   * 5. Student Consent Verification
   * 6. Payload Schema & Category Safety
   * 7. Idempotent Ingestion with Anti-Overwrite & Confidence Checks
   */
  public static async processInboundEvent(
    authHeader: string | null,
    payload: InboundTathastuPayload
  ): Promise<InboundProcessingResult> {
    // 1. Authenticate Service Caller
    const auth = await this.verifyServiceToken(authHeader);

    // 2. Validate Event Identity & Replay Protection
    if (!payload.eventId) {
      throw new Error("400_BAD_REQUEST: Missing required eventId in payload.");
    }
    this.checkAndRecordReplay(`event:${payload.eventId}`);

    // 3. Verify Tenant Ownership
    if (payload.targetTenant !== "mentormaze") {
      throw new Error(`403_FORBIDDEN: Tenant mismatch. Event targetTenant '${payload.targetTenant}' does not match 'mentormaze'.`);
    }

    if (payload.sourceSystem !== "ai-tathastu") {
      throw new Error(`400_BAD_REQUEST: Invalid sourceSystem '${payload.sourceSystem}'. Expected 'ai-tathastu'.`);
    }

    // 4. Verify Student Exists in Local Directory
    const db = getDb();
    let studentUser: any = null;
    if (db) {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.studentUserId))
        .limit(1);
      studentUser = rows[0] || null;
    }

    if (!studentUser) {
      throw new Error(`404_NOT_FOUND: Student record '${payload.studentUserId}' does not exist in MentorMaze directory.`);
    }

    if (studentUser.accountStatus !== "active") {
      throw new Error(`403_FORBIDDEN: Target student account is inactive or suspended.`);
    }

    // 5. Verify Student Purpose Consent for External Ingestion
    const hasConsent = await StudentConsentService.hasConsent(
      payload.studentUserId,
      "external_data_integration",
      payload.studentUserId
    );

    if (!hasConsent) {
      throw new Error("403_FORBIDDEN: Inbound ingestion blocked: student has not granted or has revoked external_data_integration consent.");
    }

    // 6. Schema & Data Category Safety Check
    const PERMITTED_CATEGORIES = new Set(["verifiedSkills", "academicRecords", "curriculumMilestones"]);
    const payloadKeys = Object.keys(payload.data || {});
    const unauthorizedKeys = payloadKeys.filter((k) => !PERMITTED_CATEGORIES.has(k));

    if (unauthorizedKeys.length > 0) {
      throw new Error(`400_BAD_REQUEST: Payload contains unauthorized data categories: [${unauthorizedKeys.join(", ")}]. Permitted: [verifiedSkills, academicRecords, curriculumMilestones].`);
    }

    // 7. Transactionally Couple Replay Ledger and Skill Node Ingestion
    let skillsIngested = 0;
    if (db) {
      try {
        await db.transaction(async (tx: any) => {
          // 7a. Atomic durable replay protection in database
          await tx.insert(inboundEventLedger).values({
            eventId: payload.eventId,
            jti: auth.jti || null,
            sourceSystem: payload.sourceSystem || "ai-tathastu",
            processedAt: new Date(),
          });

          // 7b. Idempotent Ingestion of Verified Skills with Anti-Overwrite & Confidence Preservation
          if (Array.isArray(payload.data.verifiedSkills)) {
            for (const item of payload.data.verifiedSkills) {
              const skillId = item.skillName.toLowerCase().replace(/[^a-z0-9]/g, "-");
              const skillHash = crypto.createHash("md5").update(`${payload.studentUserId}:${skillId}`).digest("hex");
              const nodeId = `skn-${skillHash}`;

              // Check existing node for freshness and confidence
              const existingNodes = await tx
                .select()
                .from(studentSkillNodes)
                .where(eq(studentSkillNodes.id, nodeId))
                .limit(1);
              const existing = existingNodes[0];

              if (existing) {
                const incomingTime = payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now();
                const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                if (!isNaN(incomingTime) && incomingTime < existingTime) {
                  console.info(`[InboundAuth] Stale skill update ignored for ${item.skillName} (incoming: ${payload.timestamp}, existing: ${existing.updatedAt?.toISOString()})`);
                  continue;
                }

                const incomingConfidence = item.verificationConfidence ?? 0.95;
                const existingConfidence = existing.confidence ?? 0.95;
                if (incomingConfidence < existingConfidence) {
                  console.info(`[InboundAuth] Lower-confidence skill update ignored for ${item.skillName} (incoming: ${incomingConfidence}, existing: ${existingConfidence})`);
                  continue;
                }
              }

              await tx
                .insert(studentSkillNodes)
                .values({
                  id: nodeId,
                  studentUserId: payload.studentUserId,
                  skillId,
                  skillName: item.skillName,
                  category: item.category || "Programming",
                  masteryState: item.masteryState || "practicing",
                  masteryScore: item.masteryScore || 7.0,
                  confidence: item.verificationConfidence || 0.95,
                  evidenceType: "independently_verified",
                  isIndependentlyVerified: true,
                  evidenceSource: item.evidenceSource || "AI Tathastu Inbound Ingestion",
                  evidenceId: `inbound-${payload.eventId}`,
                  knownWeaknesses: [],
                  commonMisconceptions: [],
                  lastAssessedAt: new Date(payload.timestamp || Date.now()),
                  updatedAt: new Date(payload.timestamp || Date.now()),
                })
                .onConflictDoUpdate({
                  target: studentSkillNodes.id,
                  set: {
                    masteryScore: item.masteryScore || 7.0,
                    masteryState: item.masteryState || "practicing",
                    confidence: item.verificationConfidence || 0.95,
                    updatedAt: new Date(payload.timestamp || Date.now()),
                  },
                });
              skillsIngested++;
            }
          }
        });
      } catch (dbErr: any) {
        if (
          dbErr?.code === "23505" ||
          dbErr?.message?.includes("unique") ||
          dbErr?.message?.includes("duplicate key") ||
          dbErr?.message?.includes("idx_inbound_event_ledger_jti")
        ) {
          throw new Error(`409_CONFLICT: Replay attack detected. Event ID or token JTI (${payload.eventId}) has already been processed.`);
        }
        throw dbErr;
      }
    }

    const receiptId = `receipt-inbound-${Date.now()}-${payload.eventId.slice(0, 8)}`;

    return {
      success: true,
      eventId: payload.eventId,
      receiptId,
      studentUserId: payload.studentUserId,
      skillsIngested,
      processedAt: new Date().toISOString(),
      message: `Successfully ingested ${skillsIngested} ecosystem-verified skills for ${studentUser.displayName} via service ${auth.serviceId}.`,
    };
  }
}
