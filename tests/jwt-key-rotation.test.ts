import { describe, it, expect, beforeEach } from "vitest";
import * as jose from "jose";
import { JWTKeyRotationService } from "@/lib/security/jwt-key-rotation-service";
import { AITathastuInboundAuthService } from "@/lib/ai-mentor/integrations/inbound-auth";

describe("JWT Key Rotation, Overlap Lifecycle & Asymmetric Signing", () => {
  beforeEach(() => {
    JWTKeyRotationService.resetRegistry();
  });

  it("authenticates token signed with current active key (v1)", async () => {
    const token = await AITathastuInboundAuthService.createSignedServiceToken({
      kid: "aitathastu-m2m-2026-v1",
    });

    const verified = await AITathastuInboundAuthService.verifyServiceToken(`Bearer ${token}`);
    expect(verified.serviceId).toBe("svc-tathastu-central");
    expect(verified.claims.iss).toBe("ai-tathastu");
  });

  it("rotates to a new key (v2) and accepts both v1 and v2 during overlap period", async () => {
    const secretV2 = "aitathastu-new-production-secret-2026-v2-32bytes!";
    
    // Rotate to v2 with a 24-hour overlap grace period
    JWTKeyRotationService.rotateKey({
      kid: "aitathastu-m2m-2026-v2",
      alg: "HS256",
      secretOrPublicKey: secretV2,
    }, 24 * 60 * 60 * 1000);

    // Metadata audit inspection (never exposes secrets)
    const metadata = JWTKeyRotationService.listKeyMetadata();
    const v1Meta = metadata.find((m) => m.kid === "aitathastu-m2m-2026-v1");
    const v2Meta = metadata.find((m) => m.kid === "aitathastu-m2m-2026-v2");

    expect(v1Meta?.status).toBe("retiring");
    expect(v1Meta?.retiresAt).toBeDefined();
    expect(v2Meta?.status).toBe("active");

    // 1. Token signed with new active key (v2) verifies
    const tokenV2 = await AITathastuInboundAuthService.createSignedServiceToken({
      kid: "aitathastu-m2m-2026-v2",
      secret: secretV2,
    });
    const verifiedV2 = await AITathastuInboundAuthService.verifyServiceToken(`Bearer ${tokenV2}`);
    expect(verifiedV2.serviceId).toBe("svc-tathastu-central");

    // 2. Token signed with old retiring key (v1) STILL verifies during overlap period!
    const tokenV1 = await AITathastuInboundAuthService.createSignedServiceToken({
      kid: "aitathastu-m2m-2026-v1",
      secret: "aitathastu-shared-inbound-secret-2026",
    });
    const verifiedV1 = await AITathastuInboundAuthService.verifyServiceToken(`Bearer ${tokenV1}`);
    expect(verifiedV1.serviceId).toBe("svc-tathastu-central");
  });

  it("rejects token signed with retired key after overlap period has expired", async () => {
    const secretV2 = "aitathastu-new-production-secret-2026-v2-32bytes!";
    
    // Rotate with an expired overlap period (-1 millisecond)
    JWTKeyRotationService.rotateKey({
      kid: "aitathastu-m2m-2026-v2",
      alg: "HS256",
      secretOrPublicKey: secretV2,
    }, -1000);

    // Token signed with retired v1 key must be rejected
    const tokenV1 = await AITathastuInboundAuthService.createSignedServiceToken({
      kid: "aitathastu-m2m-2026-v1",
      secret: "aitathastu-shared-inbound-secret-2026",
    });

    await expect(
      AITathastuInboundAuthService.verifyServiceToken(`Bearer ${tokenV1}`)
    ).rejects.toThrow("401_UNAUTHORIZED: Key 'aitathastu-m2m-2026-v1' is retired. Overlap rotation period has expired.");
  });

  it("immediately rejects token signed with an emergency-revoked key", async () => {
    const compromisedKey = "aitathastu-compromised-2026";
    const compromisedSecret = "compromised-secret-key-material-32chars!";

    JWTKeyRotationService.registerKey({
      kid: compromisedKey,
      alg: "HS256",
      status: "active",
      secretOrPublicKey: compromisedSecret,
      activatedAt: new Date(),
    });

    // Create a token before revocation
    const token = await AITathastuInboundAuthService.createSignedServiceToken({
      kid: compromisedKey,
      secret: compromisedSecret,
    });

    // Emergency Revocation triggered!
    JWTKeyRotationService.emergencyRevoke(
      compromisedKey,
      "Key compromised via security disclosure incident SEC-2026-09"
    );

    // Verification must immediately reject without waiting for expiry
    await expect(
      AITathastuInboundAuthService.verifyServiceToken(`Bearer ${token}`)
    ).rejects.toThrow("401_UNAUTHORIZED: Key 'aitathastu-compromised-2026' has been revoked: Key compromised via security disclosure incident SEC-2026-09.");
  });

  it("verifies asymmetric RS256 token ensuring true issuer/verifier separation", async () => {
    // Generate RSA key pair: Central holds private key, MentorMaze holds public key
    const { publicKey, privateKey } = await jose.generateKeyPair("RS256", { extractable: true });
    const spkiPem = await jose.exportSPKI(publicKey);
    const pkcs8Pem = await jose.exportPKCS8(privateKey);

    const asymKid = "aitathastu-asym-2026-v1";

    // MentorMaze registers only the PUBLIC key
    JWTKeyRotationService.registerKey({
      kid: asymKid,
      alg: "RS256",
      status: "active",
      secretOrPublicKey: spkiPem,
      activatedAt: new Date(),
      isAsymmetric: true,
    });

    // AI Tathastu Central signs token using its PRIVATE key
    const privateKeyObj = await jose.importPKCS8(pkcs8Pem, "RS256");
    const token = await new jose.SignJWT({
      sub: "svc-tathastu-asymmetric-sender",
      serviceId: "svc-tathastu-asymmetric-sender",
      scope: "ecosystem:student_intelligence:sync",
    })
      .setProtectedHeader({ alg: "RS256", kid: asymKid })
      .setIssuedAt()
      .setIssuer("ai-tathastu")
      .setAudience("mentormaze")
      .setJti(`jti-asym-${Date.now()}`)
      .setExpirationTime("5m")
      .sign(privateKeyObj);

    // MentorMaze verifies using only the PUBLIC key
    const verified = await AITathastuInboundAuthService.verifyServiceToken(`Bearer ${token}`);
    expect(verified.serviceId).toBe("svc-tathastu-asymmetric-sender");
    expect(verified.claims.iss).toBe("ai-tathastu");

    // Negative test: Token signed with a rogue/different private key is rejected
    const rogueKeys = await jose.generateKeyPair("RS256");
    const rogueToken = await new jose.SignJWT({
      sub: "rogue-sender",
      scope: "ecosystem:student_intelligence:sync",
    })
      .setProtectedHeader({ alg: "RS256", kid: asymKid })
      .setIssuedAt()
      .setIssuer("ai-tathastu")
      .setAudience("mentormaze")
      .setExpirationTime("5m")
      .sign(rogueKeys.privateKey);

    await expect(
      AITathastuInboundAuthService.verifyServiceToken(`Bearer ${rogueToken}`)
    ).rejects.toThrow("401_UNAUTHORIZED: Invalid service token signature");
  });
});
