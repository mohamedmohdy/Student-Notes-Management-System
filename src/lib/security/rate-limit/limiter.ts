import { RateLimitCheckOptions, RateLimitResult, IRateLimitStore } from './types';
import { RATE_LIMIT_POLICIES } from './config';
import { generateRateLimitKey } from './key-generator';
import { getDefaultRateLimitStore } from './stores';

/**
 * Core Rate Limiter evaluation engine.
 *
 * Enforces policy limits, generates tenant/IP keys, queries distributed store,
 * and executes fail-open or fail-closed fallbacks on store failure.
 */
export async function checkRateLimit(
  options: RateLimitCheckOptions,
  customStore?: IRateLimitStore
): Promise<RateLimitResult> {
  const { policy, request, userId, action, customMax, customWindowMs } = options;
  const config = RATE_LIMIT_POLICIES[policy];

  const limit = customMax !== undefined ? customMax : config.max;
  const windowMs = customWindowMs !== undefined ? customWindowMs : config.windowMs;
  const store = customStore || getDefaultRateLimitStore();

  const key = generateRateLimitKey({
    policy,
    request,
    userId,
    action,
  });

  const now = Date.now();

  try {
    const { count, resetAt } = await store.increment(key, windowMs, limit);

    const success = count <= limit;
    const remaining = Math.max(0, limit - count);
    const retryAfter = success ? 0 : Math.max(1, Math.ceil((resetAt - now) / 1000));

    return {
      success,
      limit,
      remaining,
      resetAt,
      retryAfter,
      key,
      policy,
    };
  } catch (error: any) {
    // Failover handling based on strict policy rules (Gate 3 & Gate 10)
    console.error(`[RATE_LIMIT_STORE_ERROR] policy=${policy} key=${key} failStrategy=${config.failStrategy}`);

    if (config.failStrategy === 'fail-open') {
      return {
        success: true,
        limit,
        remaining: 1,
        resetAt: now + windowMs,
        retryAfter: 0,
        key,
        policy,
      };
    }

    // Fail-closed (e.g. AUTH, AI, EXPORT, BACKUP, OWNER)
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: now + windowMs,
      retryAfter: Math.ceil(windowMs / 1000),
      key,
      policy,
    };
  }
}
