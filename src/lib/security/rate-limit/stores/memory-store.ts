import { IRateLimitStore } from '../types';

interface MemoryEntry {
  count: number;
  resetAt: number;
}

/**
 * High-performance In-Memory Rate Limit Store.
 * NOTE: As per Gate 3, this is strictly for local dev, unit testing, and emergency failover.
 * It is NOT the primary distributed store for production.
 */
export class MemoryRateLimitStore implements IRateLimitStore {
  private store = new Map<string, MemoryEntry>();
  private lastCleanup = Date.now();

  async increment(
    key: string,
    windowMs: number,
    _max: number
  ): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();

    // Lazy cleanup every 60 seconds
    if (now - this.lastCleanup > 60000) {
      this.cleanupSync(now);
      this.lastCleanup = now;
    }

    const existing = this.store.get(key);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { count: 1, resetAt };
    }

    existing.count += 1;
    return { count: existing.count, resetAt: existing.resetAt };
  }

  async cleanup(): Promise<number> {
    return this.cleanupSync(Date.now());
  }

  private cleanupSync(now: number): number {
    let deleted = 0;
    for (const [k, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(k);
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Resets the store (useful in automated tests).
   */
  clear(): void {
    this.store.clear();
  }
}

export const memoryRateLimitStore = new MemoryRateLimitStore();
