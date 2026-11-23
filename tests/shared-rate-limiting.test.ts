import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { initializeDatabaseSchema } from "@/lib/db";
import { SharedRateLimiter, sharedRateLimiter } from "@/lib/security/shared-rate-limiter";

describe("Shared Distributed Rate Limiting Across Multi-Instance Topologies", () => {
  beforeAll(async () => {
    await initializeDatabaseSchema();
  });

  beforeEach(async () => {
    await sharedRateLimiter.reset("test-client-ip-1");
    await sharedRateLimiter.reset("test-client-ip-2");
    await sharedRateLimiter.reset("multi-instance-ip");
  });

  it("enforces rate limits within a single instance", async () => {
    const key = "test-client-ip-1";
    const limit = 5;
    const windowSeconds = 60;

    // Send 5 requests -> all must succeed
    for (let i = 1; i <= limit; i++) {
      const res = await sharedRateLimiter.check(key, limit, windowSeconds);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(limit - i);
    }

    // 6th request must exceed limit
    const exceeded = await sharedRateLimiter.check(key, limit, windowSeconds);
    expect(exceeded.success).toBe(false);
    expect(exceeded.remaining).toBe(0);
    expect(exceeded.resetInSeconds).toBeGreaterThan(0);
  });

  it("coordinates rate limits across multiple concurrent application instances", async () => {
    const sharedKey = "multi-instance-ip";
    const totalLimit = 10;
    const windowSeconds = 60;

    // Simulate 4 distinct application instances / serverless containers
    const instanceA = new SharedRateLimiter();
    const instanceB = new SharedRateLimiter();
    const instanceC = new SharedRateLimiter();
    const instanceD = new SharedRateLimiter();

    // Fire 20 concurrent requests evenly distributed across all 4 instances
    const requests = Array.from({ length: 20 }, (_, i) => {
      const instances = [instanceA, instanceB, instanceC, instanceD];
      const instance = instances[i % 4];
      return instance.check(sharedKey, totalLimit, windowSeconds);
    });

    const results = await Promise.all(requests);

    const successful = results.filter((r) => r.success);
    const rejected = results.filter((r) => !r.success);

    // Across all 4 independent instances, exactly totalLimit (10) requests succeeded
    expect(successful.length).toBe(totalLimit);
    expect(rejected.length).toBe(10);

    for (const rej of rejected) {
      expect(rej.remaining).toBe(0);
      expect(rej.resetInSeconds).toBeGreaterThan(0);
    }
  });

  it("resets limits when window duration expires", async () => {
    const key = "test-client-ip-2";
    const limit = 2;
    // 1-second window
    const windowSeconds = 1;

    await sharedRateLimiter.check(key, limit, windowSeconds);
    await sharedRateLimiter.check(key, limit, windowSeconds);

    const third = await sharedRateLimiter.check(key, limit, windowSeconds);
    expect(third.success).toBe(false);

    // Wait 1.1s for window expiration
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const fresh = await sharedRateLimiter.check(key, limit, windowSeconds);
    expect(fresh.success).toBe(true);
    expect(fresh.remaining).toBe(limit - 1);
  });

  it("enforces fail-closed behavior for sensitive endpoints during database outage", async () => {
    const sensitiveKey = "inbound_m2m_outage_ip";
    const outageLimiter = new SharedRateLimiter(false, () => {
      throw new Error("Neon cloud DB connection timed out: 503");
    });

    const result = await outageLimiter.check(sensitiveKey, 10, 60, { policy: "fail-closed" });

    // Under fail-closed policy, authoritative rate check failure must reject rather than silently allow
    expect(result.success).toBe(false);
    expect(result.authoritative).toBe(false);
    expect(result.degraded).toBe(true);
    expect(result.error).toBe("limiter_unavailable");
    expect(result.remaining).toBe(0);
  });

  it("permits graceful fail-open with degraded status for non-critical endpoints during outage", async () => {
    const nonCriticalKey = "public_browse_ip";
    const outageLimiter = new SharedRateLimiter(false, () => {
      throw new Error("Neon cloud DB connection timed out: 503");
    });

    // Default or explicit fail-open policy
    const result = await outageLimiter.check(nonCriticalKey, 5, 60, { policy: "fail-open" });

    // Under fail-open policy, degraded memory fallback permits the request but flags non-authoritative status
    expect(result.success).toBe(true);
    expect(result.authoritative).toBe(false);
    expect(result.degraded).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("handles multi-instance database outage and subsequent recovery seamlessly", async () => {
    const clusterKey = "multi_instance_recovery_test";
    let isDbHealthy = false;

    // Simulate 3 application instances in a containerized cluster
    const clusterInstance1 = new SharedRateLimiter(false, () => {
      if (!isDbHealthy) throw new Error("DB connection pool exhausted");
      return null; // Will trigger getDb() or normal flow
    });
    const clusterInstance2 = new SharedRateLimiter(false, () => {
      if (!isDbHealthy) throw new Error("DB connection pool exhausted");
      return null;
    });
    const clusterInstance3 = new SharedRateLimiter(false, () => {
      if (!isDbHealthy) throw new Error("DB connection pool exhausted");
      return null;
    });

    // 1. During database outage, fail-closed requests across all instances are rejected
    const outageResults = await Promise.all([
      clusterInstance1.check(clusterKey, 5, 60, { policy: "fail-closed" }),
      clusterInstance2.check(clusterKey, 5, 60, { policy: "fail-closed" }),
      clusterInstance3.check(clusterKey, 5, 60, { policy: "fail-closed" }),
    ]);

    for (const res of outageResults) {
      expect(res.success).toBe(false);
      expect(res.degraded).toBe(true);
      expect(res.error).toBe("limiter_unavailable");
    }

    // 2. Database recovers
    isDbHealthy = true;
    clusterInstance1.setDbOverride(undefined);
    clusterInstance2.setDbOverride(undefined);
    clusterInstance3.setDbOverride(undefined);
    await sharedRateLimiter.reset(clusterKey);

    // 3. All instances resume coordinated authoritative distributed rate limiting
    const totalLimit = 6;
    const reqs = [
      clusterInstance1.check(clusterKey, totalLimit, 60, { policy: "fail-closed" }),
      clusterInstance2.check(clusterKey, totalLimit, 60, { policy: "fail-closed" }),
      clusterInstance3.check(clusterKey, totalLimit, 60, { policy: "fail-closed" }),
      clusterInstance1.check(clusterKey, totalLimit, 60, { policy: "fail-closed" }),
      clusterInstance2.check(clusterKey, totalLimit, 60, { policy: "fail-closed" }),
      clusterInstance3.check(clusterKey, totalLimit, 60, { policy: "fail-closed" }),
      clusterInstance1.check(clusterKey, totalLimit, 60, { policy: "fail-closed" }), // 7th request -> should exceed
    ];

    const postRecoveryResults = await Promise.all(reqs);
    const approved = postRecoveryResults.filter((r) => r.success);
    const blocked = postRecoveryResults.filter((r) => !r.success);

    expect(approved.length).toBe(totalLimit); // exactly 6 succeeded
    expect(blocked.length).toBe(1); // 7th was blocked
    expect(approved[0].authoritative).toBe(true);
    expect(approved[0].degraded).toBe(false);
  });
});
