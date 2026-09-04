import { NextRequest } from 'next/server';

export type RateLimitPolicy =
  | 'AUTH'
  | 'TEACHER'
  | 'AI'
  | 'EXPORT'
  | 'BACKUP'
  | 'OWNER'
  | 'PUBLIC';

export type FailStrategy = 'fail-open' | 'fail-closed';

export interface RateLimitPolicyConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of allowed requests in the window */
  max: number;
  /** Behavior when the rate limit storage backend is unreachable */
  failStrategy: FailStrategy;
  /** Human-readable description */
  description: string;
}

export interface RateLimitResult {
  /** Whether the request is permitted */
  success: boolean;
  /** Maximum allowed requests in the current window */
  limit: number;
  /** Number of remaining requests permitted in the window */
  remaining: number;
  /** Timestamp in milliseconds when the current window resets */
  resetAt: number;
  /** Number of seconds to wait before retrying (0 if success) */
  retryAfter: number;
  /** Generated rate limit key */
  key: string;
  /** Policy applied */
  policy: RateLimitPolicy;
}

export interface IRateLimitStore {
  /**
   * Atomically increment the request counter for the given key and window.
   * Returns current count and reset timestamp in milliseconds.
   */
  increment(
    key: string,
    windowMs: number,
    max: number
  ): Promise<{ count: number; resetAt: number }>;

  /**
   * Cleans up expired rate limit records.
   * Returns the count of deleted rows/keys.
   */
  cleanup?(): Promise<number>;
}

export interface RateLimitCheckOptions {
  request: NextRequest | Request;
  policy: RateLimitPolicy;
  userId?: string;
  action?: string;
  customMax?: number;
  customWindowMs?: number;
}
