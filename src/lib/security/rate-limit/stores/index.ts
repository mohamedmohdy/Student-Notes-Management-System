import { IRateLimitStore } from '../types';
import { postgresRateLimitStore } from './postgres-store';
import { memoryRateLimitStore } from './memory-store';
import { resilientRateLimitStore } from './resilient-store';

export * from './base';
export * from './memory-store';
export * from './postgres-store';
export * from './resilient-store';

/**
 * Returns the active Rate Limit Store.
 * By default, uses the Resilient Hybrid Store:
 * Attempts distributed PostgreSQL row-level locks, with zero-downtime in-memory fallback.
 */
export function getDefaultRateLimitStore(): IRateLimitStore {
  const configuredStore = process.env.RATE_LIMIT_STORE?.toLowerCase();
  if (configuredStore === 'memory') {
    return memoryRateLimitStore;
  }
  if (configuredStore === 'postgres') {
    return postgresRateLimitStore;
  }
  return resilientRateLimitStore;
}
