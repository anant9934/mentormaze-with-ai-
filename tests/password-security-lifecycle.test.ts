/**
 * MentorMaze — Password Lifecycle & Security Hardening Test Suite
 *
 * Verifies:
 * 1. Correct password verification (bcrypt-12)
 * 2. Incorrect password rejection (401)
 * 3. Transparent zero-downtime legacy hash migration (SHA-256 -> bcrypt-12)
 * 4. Cost-factor upgrade migration (bcrypt-10 -> bcrypt-12)
 * 5. Unsupported / corrupted hash handling (requires password reset, no string equality)
 * 6. OAuth accounts (null password_hash) block password bypass and return OAUTH_ACCOUNT
 * 7. Secure password reset request, single-use token consumption, and session invalidation
 * 8. Client role escalation blocking during registration
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getDb, initializeDatabaseSchema } from "@/lib/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import {
  hashPassword,
  verifyPassword,
  createPasswordResetToken,
  verifyAndConsumePasswordResetToken,
  DEFAULT_BCRYPT_ROUNDS,
} from "@/lib/auth/password";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as forgotPasswordHandler } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "@/app/api/auth/reset-password/route";

describe("Password Security & Complete Lifecycle Verification", () => {
  beforeEach(async () => {
    await initializeDatabaseSchema();
  });

  describe("1. Password Hashing & Verification Engine", () => {
    it("hashes passwords with bcrypt and default work factor 12", async () => {
      const hash = await hashPassword("SecurePass123!");
      expect(hash).toMatch(/^\$2[aby]\$12\$/);

      const verification = await verifyPassword("SecurePass123!", hash);
      expect(verification.isValid).toBe(true);
      expect(verification.needsRehash).toBe(false);
    });

    it("rejects incorrect password with isValid=false", async () => {
      const hash = await hashPassword("CorrectPassword123");
      const verification = await verifyPassword("WrongPassword456", hash);
      expect(verification.isValid).toBe(false);
      expect(verification.reason).toBe("mismatch");
    });

    it("detects and verifies legacy SHA-256 hashes and flags needsRehash=true", async () => {
      const plaintext = "LegacySecretPass789";
      const legacySha256 = crypto.createHash("sha256").update(plaintext).digest("hex");

      const verification = await verifyPassword(plaintext, legacySha256);
      expect(verification.isValid).toBe(true);
      expect(verification.needsRehash).toBe(true);
      expect(verification.reason).toBe("legacy_sha256");

      // Verify wrong password against legacy SHA-256
      const wrongVerification = await verifyPassword("IncorrectPass", legacySha256);
      expect(wrongVerification.isValid).toBe(false);
    });

    it("flags lower-cost bcrypt hashes (cost < 12) for upgrade", async () => {
      const lowerCostHash = await bcrypt.hash("OldBcryptPass", 10);
      const verification = await verifyPassword("OldBcryptPass", lowerCostHash);
      expect(verification.isValid).toBe(true);
      expect(verification.needsRehash).toBe(true);
      expect(verification.reason).toBe("cost_upgrade");
    });

    it("gracefully flags corrupted or plaintext hashes as unsupported without string comparison", async () => {
      const corruptedHash = "plain_text_password_not_a_hash";
      const verification = await verifyPassword("plain_text_password_not_a_hash", corruptedHash);
      expect(verification.isValid).toBe(false);
      expect(verification.requiresPasswordReset).toBe(true);
      expect(verification.reason).toBe("unsupported_hash");
    });

    it("flags OAuth accounts (null password_hash) as oauth_only", async () => {
      const verification = await verifyPassword("AnyPassword", null);
      expect(verification.isValid).toBe(false);
      expect(verification.isOAuthOnly).toBe(true);
      expect(verification.reason).toBe("oauth_only");
    });
  });

  describe("2. Login Flow: Migration, Escalation Defense, and OAuth Handling", () => {
    it("transparently migrates legacy SHA-256 account to bcrypt-12 on successful login", async () => {
      const db = getDb();
      const testEmail = `legacy_${Date.now()}@mentormaze.com`;
      const testPassword = "MyLegacyPassword123";
      const legacyHash = crypto.createHash("sha256").update(testPassword).digest("hex");

      // Seed user with legacy SHA-256 hash
      await db.execute(sql`
        INSERT INTO users (email, password_hash, display_name, role, account_status)
        VALUES (${testEmail}, ${legacyHash}, 'Legacy User', 'student', 'active');
      `);

      // Attempt login with valid password
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(200);

      // Verify in database that hash was upgraded to bcrypt-12
      const updatedUser: any = await db.execute(sql`
        SELECT password_hash FROM users WHERE email = ${testEmail} LIMIT 1;
      `);
      const newHash = updatedUser.rows?.[0]?.password_hash || updatedUser?.[0]?.password_hash;
      expect(newHash).toMatch(/^\$2[aby]\$12\$/);

      // Subsequent login verifies with new bcrypt hash without needing rehash
      const req2 = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      const res2 = await loginHandler(req2);
      expect(res2.status).toBe(200);
    });

    it("blocks password bypass on OAuth-only accounts and returns OAUTH_ACCOUNT code", async () => {
      const db = getDb();
      const oauthEmail = `oauth_${Date.now()}@mentormaze.com`;

      // Seed OAuth user with null password_hash
      await db.execute(sql`
        INSERT INTO users (email, password_hash, display_name, role, account_status)
        VALUES (${oauthEmail}, null, 'OAuth User', 'student', 'active');
      `);

      // Attempt login with arbitrary password
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: oauthEmail, password: "AttemptedPassword" }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe("OAUTH_ACCOUNT");
      expect(data.error).toContain("OAuth");
    });

    it("blocks client-side self-provisioning of admin or super_admin roles during signup", async () => {
      const db = getDb();
      const attackEmail = `escalation_${Date.now()}@mentormaze.com`;

      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: attackEmail,
          password: "SecurePass123",
          role: "admin", // Malicious escalation attempt
        }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      // Role must be clamped to student
      expect(data.user.role).toBe("student");
      expect(data.user.role).not.toBe("admin");

      const dbCheck: any = await db.execute(sql`
        SELECT role FROM users WHERE email = ${attackEmail} LIMIT 1;
      `);
      const storedRole = dbCheck.rows?.[0]?.role || dbCheck?.[0]?.role;
      expect(storedRole).toBe("student");
    });
  });

  describe("3. Password Reset Flow: Tokens, Invalidation, and Update", () => {
    it("requests password reset, verifies single-use token, resets password, and invalidates sessions", async () => {
      const db = getDb();
      const resetEmail = `reset_${Date.now()}@mentormaze.com`;
      const originalPassword = "InitialPassword123";
      const originalHash = await hashPassword(originalPassword);

      // Create test user
      const userRes: any = await db.execute(sql`
        INSERT INTO users (email, password_hash, display_name, role, account_status)
        VALUES (${resetEmail}, ${originalHash}, 'Reset Test User', 'student', 'active')
        RETURNING id;
      `);
      const userId = userRes.rows?.[0]?.id || userRes?.[0]?.id;

      // Seed an active session to test session revocation
      const sessionTokenHash = crypto.createHash("sha256").update("dummy_session_token").digest("hex");
      await db.execute(sql`
        INSERT INTO user_sessions (user_id, token, expires_at)
        VALUES (${userId}, ${sessionTokenHash}, now() + interval '1 day');
      `);

      // 1. Request Password Reset via API
      const forgotReq = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const forgotRes = await forgotPasswordHandler(forgotReq);
      expect(forgotRes.status).toBe(200);

      // 2. Programmatically generate a test token to execute the reset endpoint
      const { rawToken } = await createPasswordResetToken(userId);

      // 3. Reset password via API
      const newPassword = "BrandNewSecurePassword456!";
      const resetReq = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: rawToken, newPassword }),
      });

      const resetRes = await resetPasswordHandler(resetReq);
      expect(resetRes.status).toBe(200);

      // 4. Verify token cannot be reused (single-use)
      const reuseReq = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: rawToken, newPassword: "AnotherPassword789" }),
      });
      const reuseRes = await resetPasswordHandler(reuseReq);
      expect(reuseRes.status).toBe(400);

      // 5. Verify sessions were revoked
      const sessionsQuery: any = await db.execute(sql`
        SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ${userId};
      `);
      const sessionCount = Number(sessionsQuery.rows?.[0]?.count || 0);
      expect(sessionCount).toBe(0);

      // 6. Old password fails login
      const oldLoginReq = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, password: originalPassword }),
      });
      const oldLoginRes = await loginHandler(oldLoginReq);
      expect(oldLoginRes.status).toBe(401);

      // 7. New password succeeds login
      const newLoginReq = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, password: newPassword }),
      });
      const newLoginRes = await loginHandler(newLoginReq);
      expect(newLoginRes.status).toBe(200);
    });

    it("rejects reset requests with invalid or expired tokens", async () => {
      const resetReq = new NextRequest("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "invalid_nonexistent_token_12345678901234567890", newPassword: "ValidPassword123!" }),
      });
      const resetRes = await resetPasswordHandler(resetReq);
      expect(resetRes.status).toBe(400);
      const data = await resetRes.json();
      expect(data.error).toBeDefined();
      expect(typeof data.error).toBe("string");
    });
  });
});
