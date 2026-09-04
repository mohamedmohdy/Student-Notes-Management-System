import { IRateLimitStore } from '../types';
import { postgresRateLimitStore } from './postgres-store';
import { memoryRateLimitStore } from './memory-store';

export * from './base';
export * from './memory-store';
export * from './postgres-store';

/**
 * Returns the active Rate Limit Store.
 * In production / serverless, the primary distributed store is PostgreSQL.
 * Memory store is strictly used for testing and emergency fallback.
 */
export function getDefaultRateLimitStore(): IRateLimitStore {
  if (process.env.RATE_LIMIT_STORE === 'memory') {
    return memoryRateLimitStore;
  }
  return postgresRateLimitStore;
}
