import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { rateLimiter as memoryFallback } from "./rate-limiter";

export type RateLimiterPolicy = "fail-closed" | "fail-open";

export interface RateLimitOptions {
  policy?: RateLimiterPolicy;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
  authoritative: boolean;
  degraded?: boolean;
  error?: "limiter_unavailable";
}

/**
 * Enterprise Shared Rate Limiter for Multi-Instance and Serverless Topologies.
 * 
 * Uses atomic PostgreSQL upsert (with configurable fail-closed or fail-open policies)
 * to guarantee consistent rate limiting across multiple application nodes, worker processes,
 * and edge containers without requiring an external Redis cluster.
 */
export class SharedRateLimiter {
  private memoryFallbackOnly: boolean;
  private dbOverride?: () => any;

  constructor(memoryFallbackOnly: boolean = false, dbOverride?: () => any) {
    this.memoryFallbackOnly = memoryFallbackOnly;
    this.dbOverride = dbOverride;
  }

  /**
   * Sets or clears a database override provider (useful for simulating outages in tests)
   */
  public setDbOverride(override?: () => any): void {
    this.dbOverride = override;
  }

  /**
   * Logs degraded security status without logging sensitive request parameters or keys
   */
  private logDegradedStatus(key: string, reason: string, policy: RateLimiterPolicy): void {
    const keyPrefix = key.split("_")[0] || "rate_key";
    console.warn(JSON.stringify({
      level: "warn",
      event: "shared_rate_limiter_degraded",
      keyPrefix,
      policy,
      reason: reason.slice(0, 100),
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Checks whether the request identified by `key` is within allowed limits.
   * Atomic across all database connections and distributed workers.
   * 
   * @param key Unique rate limiting identifier (e.g. `inbound_m2m_1.2.3.4`)
   * @param limit Maximum requests permitted in window
   * @param windowSeconds Duration of window in seconds
   * @param options Configuration options including `policy` ('fail-closed' | 'fail-open')
   */
  public async check(
    key: string,
    limit: number = 60,
    windowSeconds: number = 60,
    options?: RateLimitOptions
  ): Promise<RateLimitResult> {
    const policy: RateLimiterPolicy = options?.policy ?? "fail-open";

    if (this.memoryFallbackOnly) {
      const mem = memoryFallback.check(key, limit, windowSeconds);
      return {
        ...mem,
        authoritative: false,
        degraded: false,
      };
    }

    try {
      const db = this.dbOverride ? this.dbOverride() : getDb();
      if (!db) {
        if (policy === "fail-closed") {
          this.logDegradedStatus(key, "database_unconfigured", policy);
          return {
            success: false,
            remaining: 0,
            resetInSeconds: windowSeconds,
            authoritative: false,
            degraded: true,
            error: "limiter_unavailable",
          };
        }
        this.logDegradedStatus(key, "database_unconfigured", policy);
        const mem = memoryFallback.check(key, limit, windowSeconds);
        return {
          ...mem,
          authoritative: false,
          degraded: true,
        };
      }

      // Single-roundtrip atomic upsert in PostgreSQL:
      // If the current window has expired, reset count to 1 and advance reset_at.
      // Otherwise increment count.
      const result: any = await db.execute(sql`
        INSERT INTO shared_rate_limits (key, count, reset_at, updated_at)
        VALUES (
          ${key},
          1,
          now() + (interval '1 second' * ${windowSeconds}),
          now()
        )
        ON CONFLICT (key) DO UPDATE
        SET count = CASE
              WHEN shared_rate_limits.reset_at < now() THEN 1
              ELSE shared_rate_limits.count + 1
            END,
            reset_at = CASE
              WHEN shared_rate_limits.reset_at < now() THEN now() + (interval '1 second' * ${windowSeconds})
              ELSE shared_rate_limits.reset_at
            END,
            updated_at = now()
        RETURNING count, CEIL(EXTRACT(EPOCH FROM (reset_at - now())))::int AS reset_in_seconds;
      `);

      const row = result.rows?.[0] || result?.[0];
      if (!row) {
        if (policy === "fail-closed") {
          this.logDegradedStatus(key, "empty_upsert_row", policy);
          return {
            success: false,
            remaining: 0,
            resetInSeconds: windowSeconds,
            authoritative: false,
            degraded: true,
            error: "limiter_unavailable",
          };
        }
        this.logDegradedStatus(key, "empty_upsert_row", policy);
        const mem = memoryFallback.check(key, limit, windowSeconds);
        return {
          ...mem,
          authoritative: false,
          degraded: true,
        };
      }

      const count = Number(row.count ?? 1);
      const resetInSeconds = Math.max(1, Number(row.reset_in_seconds ?? windowSeconds));
      const success = count <= limit;
      const remaining = Math.max(0, limit - count);

      return {
        success,
        remaining,
        resetInSeconds,
        authoritative: true,
        degraded: false,
      };
    } catch (err: any) {
      if (policy === "fail-closed") {
        this.logDegradedStatus(key, err?.message || "database_error", policy);
        return {
          success: false,
          remaining: 0,
          resetInSeconds: windowSeconds,
          authoritative: false,
          degraded: true,
          error: "limiter_unavailable",
        };
      }
      this.logDegradedStatus(key, err?.message || "database_error", policy);
      const mem = memoryFallback.check(key, limit, windowSeconds);
      return {
        ...mem,
        authoritative: false,
        degraded: true,
      };
    }
  }

  /**
   * Resets rate limit for a specific key (useful for tests and manual admin overrides)
   */
  public async reset(key: string): Promise<void> {
    memoryFallback.reset(key);
    try {
      const db = this.dbOverride ? this.dbOverride() : getDb();
      if (db) {
        await db.execute(sql`DELETE FROM shared_rate_limits WHERE key = ${key};`);
      }
    } catch {
      // Non-fatal
    }
  }
}

export const sharedRateLimiter = new SharedRateLimiter();
