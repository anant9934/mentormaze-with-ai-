interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * In-Memory Token Bucket / Sliding Window Rate Limiter.
 * Protects auth endpoints, webhook receivers, and booking mutations
 * against brute-force attacks and denial-of-service attempts.
 */
class MemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();

  /**
   * Checks if the given key (e.g., client IP) has exceeded the rate limit.
   * @param key IP address or user identifier
   * @param limit Maximum requests allowed in the window
   * @param windowSeconds Window duration in seconds
   */
  check(key: string, limit: number = 10, windowSeconds: number = 60): { success: boolean; remaining: number; resetInSeconds: number } {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    const existing = this.records.get(key);

    if (!existing || now > existing.resetAt) {
      this.records.set(key, { count: 1, resetAt: now + windowMs });
      return { success: true, remaining: limit - 1, resetInSeconds: windowSeconds };
    }

    if (existing.count >= limit) {
      const resetInSeconds = Math.ceil((existing.resetAt - now) / 1000);
      return { success: false, remaining: 0, resetInSeconds };
    }

    existing.count++;
    const resetInSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return { success: true, remaining: limit - existing.count, resetInSeconds };
  }

  reset(key: string) {
    this.records.delete(key);
  }
}

export const rateLimiter = new MemoryRateLimiter();

