import { NextRequest, NextResponse } from 'next/server';
import { RateLimitPolicy } from './types';
import { checkRateLimit } from './limiter';
import { createRateLimitExceededResponse, attachRateLimitHeaders } from './response';

/**
 * Guard function to be called at the top of an API Route Handler.
 * Returns a 429 NextResponse if rate limit is exceeded, or null if permitted.
 *
 * Example usage:
 * const blocked = await rateLimitGuard(request, 'AUTH');
 * if (blocked) return blocked;
 */
export async function rateLimitGuard(
  request: NextRequest,
  policy: RateLimitPolicy,
  options?: {
    userId?: string;
    action?: string;
    customMax?: number;
    customWindowMs?: number;
  }
): Promise<NextResponse | null> {
  const result = await checkRateLimit({
    request,
    policy,
    userId: options?.userId,
    action: options?.action,
    customMax: options?.customMax,
    customWindowMs: options?.customWindowMs,
  });

  if (!result.success) {
    return createRateLimitExceededResponse(result);
  }

  return null;
}

/**
 * Higher-order function wrapping a Next.js Route Handler with automatic Rate Limiting.
 */
export function withRateLimit(
  policy: RateLimitPolicy,
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options?: {
    getUserId?: (request: NextRequest) => Promise<string | undefined> | string | undefined;
    action?: string;
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    let userId: string | undefined = undefined;
    if (options?.getUserId) {
      userId = await options.getUserId(request);
    }

    const result = await checkRateLimit({
      request,
      policy,
      userId,
      action: options?.action,
    });

    if (!result.success) {
      return createRateLimitExceededResponse(result);
    }

    const response = await handler(request, context);
    return attachRateLimitHeaders(response, result);
  };
}
