import { IRateLimitStore } from '../types';
import { postgresRateLimitStore } from './postgres-store';
import { memoryRateLimitStore } from './memory-store';

/**
 * Resilient Hybrid Rate Limit Store.
 *
 * Primary: PostgreSQL distributed store (atomic row-level locks across all instances).
 * Fallback: In-memory sliding-window store (zero downtime on serverless cold starts or missing DATABASE_URL).
 *
 * Guarantees:
 * 1. Legitimate users are NEVER blocked due to database connectivity issues.
 * 2. Brute-force attacks are ALWAYS throttled (even during database downtime).
 * 3. Seamless distributed synchronization when PostgreSQL is reachable.
 */
export class ResilientRateLimitStore implements IRateLimitStore {
  private primaryStore: IRateLimitStore;
  private fallbackStore: IRateLimitStore;
  private lastWarningTime = 0;

  constructor(primary?: IRateLimitStore, fallback?: IRateLimitStore) {
    this.primaryStore = primary || postgresRateLimitStore;
    this.fallbackStore = fallback || memoryRateLimitStore;
  }

  async increment(
    key: string,
    windowMs: number,
    max: number
  ): Promise<{ count: number; resetAt: number }> {
    try {
      return await this.primaryStore.increment(key, windowMs, max);
    } catch (primaryError: any) {
      const now = Date.now();
      // Rate-limit console warnings to once every 30 seconds to avoid log spam
      if (now - this.lastWarningTime > 30000) {
        this.lastWarningTime = now;
        console.warn(
          `[RATE_LIMIT_STORE_FALLBACK] Primary PostgreSQL store unavailable (${primaryError?.message || 'connection failed'}), using in-memory store.`
        );
      }

      // Seamless fallback to memory store
      return await this.fallbackStore.increment(key, windowMs, max);
    }
  }

  async cleanup(): Promise<number> {
    try {
      if (this.primaryStore.cleanup) {
        return await this.primaryStore.cleanup();
      }
    } catch {
      // Primary cleanup failed, run fallback cleanup
    }

    if (this.fallbackStore.cleanup) {
      return await this.fallbackStore.cleanup();
    }
    return 0;
  }
}

export const resilientRateLimitStore = new ResilientRateLimitStore();
