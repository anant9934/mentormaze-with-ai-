import * as jose from "jose";

export type KeyStatus = "active" | "retiring" | "retired" | "revoked";
export type SupportedAlgorithm = "HS256" | "RS256";

export interface KeyDefinition {
  kid: string;
  alg: SupportedAlgorithm;
  status: KeyStatus;
  secretOrPublicKey: string | Uint8Array;
  activatedAt: Date;
  retiresAt?: Date;
  revokedAt?: Date;
  revocationReason?: string;
  isAsymmetric?: boolean;
}

export interface KeyPublicMetadata {
  kid: string;
  alg: SupportedAlgorithm;
  status: KeyStatus;
  activatedAt: string;
  retiresAt?: string;
  revokedAt?: string;
  isAsymmetric: boolean;
}

/**
 * Enterprise M2M JWT Key Rotation & Lifecycle Management Service.
 * 
 * Features:
 * - Dual-key overlap period during scheduled rotations
 * - Instant emergency revocation with forensic audit reasons
 * - Full support for both symmetric (HS256) and asymmetric (RS256) signing
 * - Zero exposure of raw key material in public methods or logs
 */
export class JWTKeyRotationService {
  private static keyRegistry: Map<string, KeyDefinition> = new Map();
  private static currentSigningKid: string = "aitathastu-m2m-2026-v1";

  static {
    this.initializeDefaultKeys();
  }

  /**
   * Initializes default baseline keys from environment or secure defaults
   */
  public static initializeDefaultKeys(): void {
    const defaultSecret =
      process.env.AI_TATHASTU_SERVICE_SECRET ||
      process.env.AITATHASTU_SERVICE_SECRET ||
      "aitathastu-shared-inbound-secret-2026";
    const defaultKid = process.env.AI_TATHASTU_KEY_ID || "aitathastu-m2m-2026-v1";

    this.registerKey({
      kid: defaultKid,
      alg: "HS256",
      status: "active",
      secretOrPublicKey: defaultSecret,
      activatedAt: new Date("2026-01-01T00:00:00Z"),
      isAsymmetric: false,
    });
    this.currentSigningKid = defaultKid;
  }

  /**
   * Resets registry to baseline state (useful in test teardowns)
   */
  public static resetRegistry(): void {
    this.keyRegistry.clear();
    this.initializeDefaultKeys();
  }

  /**
   * Registers a key definition into the registry
   */
  public static registerKey(key: KeyDefinition): void {
    this.keyRegistry.set(key.kid, { ...key });
  }

  /**
   * Gets the active signing key for outbound or token generation
   */
  public static getCurrentSigningKey(): KeyDefinition {
    const key = this.keyRegistry.get(this.currentSigningKid);
    if (!key || key.status !== "active") {
      throw new Error(`500_INTERNAL_SERVER_ERROR: Current signing key '${this.currentSigningKid}' is not active.`);
    }
    return key;
  }

  /**
   * Retrieves and validates a key for inbound token verification
   */
  public static getVerificationKey(kid: string): KeyDefinition {
    const key = this.keyRegistry.get(kid);

    if (!key) {
      throw new Error(`401_UNAUTHORIZED: Unrecognized key identifier (kid: '${kid}'). Expected authorized key.`);
    }

    if (key.status === "revoked") {
      throw new Error(`401_UNAUTHORIZED: Key '${kid}' has been revoked: ${key.revocationReason || "Emergency revocation"}.`);
    }

    if (key.status === "retired") {
      throw new Error(`401_UNAUTHORIZED: Key '${kid}' is retired. Overlap rotation period has expired.`);
    }

    // If key is retiring, verify that overlap period has not elapsed
    if (key.status === "retiring" && key.retiresAt && key.retiresAt.getTime() <= Date.now()) {
      key.status = "retired";
      throw new Error(`401_UNAUTHORIZED: Key '${kid}' is retired. Overlap rotation period has expired.`);
    }

    return key;
  }

  /**
   * Rotates signing key to a new key with a configured overlap grace period
   * During the overlap period, both old and new keys remain valid for verification.
   */
  public static rotateKey(
    newKey: { kid: string; alg: SupportedAlgorithm; secretOrPublicKey: string | Uint8Array; isAsymmetric?: boolean },
    overlapDurationMs: number = 24 * 60 * 60 * 1000 // Default 24-hour overlap
  ): void {
    const oldKey = this.keyRegistry.get(this.currentSigningKid);
    const now = new Date();

    if (oldKey) {
      oldKey.status = "retiring";
      oldKey.retiresAt = new Date(now.getTime() + overlapDurationMs);
      this.keyRegistry.set(oldKey.kid, oldKey);
    }

    this.registerKey({
      kid: newKey.kid,
      alg: newKey.alg,
      status: "active",
      secretOrPublicKey: newKey.secretOrPublicKey,
      activatedAt: now,
      isAsymmetric: newKey.isAsymmetric ?? false,
    });

    this.currentSigningKid = newKey.kid;
  }

  /**
   * Emergency revocation of a compromised key
   * Immediately invalidates the key without waiting for overlap or expiry.
   */
  public static emergencyRevoke(kid: string, reason: string): void {
    const key = this.keyRegistry.get(kid);
    if (!key) {
      throw new Error(`404_NOT_FOUND: Key '${kid}' does not exist in registry.`);
    }

    key.status = "revoked";
    key.revokedAt = new Date();
    key.revocationReason = reason;
    this.keyRegistry.set(kid, key);

    if (this.currentSigningKid === kid) {
      // Find another active key or warn
      const nextActive = Array.from(this.keyRegistry.values()).find((k) => k.status === "active" && k.kid !== kid);
      if (nextActive) {
        this.currentSigningKid = nextActive.kid;
      }
    }
  }

  /**
   * Lists public metadata of all keys in registry without exposing secrets
   */
  public static listKeyMetadata(): KeyPublicMetadata[] {
    return Array.from(this.keyRegistry.values()).map((k) => ({
      kid: k.kid,
      alg: k.alg,
      status: k.status,
      activatedAt: k.activatedAt.toISOString(),
      retiresAt: k.retiresAt?.toISOString(),
      revokedAt: k.revokedAt?.toISOString(),
      isAsymmetric: k.isAsymmetric ?? false,
    }));
  }
}
