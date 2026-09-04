import { NextResponse } from 'next/server';
import { RateLimitResult } from './types';

/**
 * Builds standard RFC / IETF RateLimit headers.
 */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetUnixSeconds = Math.ceil(result.resetAt / 1000);
  const headers: Record<string, string> = {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'RateLimit-Reset': String(resetUnixSeconds),
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(resetUnixSeconds),
  };

  if (!result.success && result.retryAfter > 0) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Generates a standard HTTP 429 Too Many Requests response matching Basita's apiError format.
 */
export function createRateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const headers = buildRateLimitHeaders(result);
  const seconds = result.retryAfter > 0 ? result.retryAfter : Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

  return NextResponse.json(
    {
      error: `تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة بعد ${seconds} ثانية.`,
      code: 'RATE_LIMIT_EXCEEDED',
      details: {
        retryAfter: seconds,
        policy: result.policy,
      },
    },
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Appends RateLimit-* headers to an existing successful NextResponse.
 */
export function attachRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  const headers = buildRateLimitHeaders(result);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
