import { NextRequest } from 'next/server';
import { RateLimitPolicy } from './types';

/**
 * Extracts client IP safely across Netlify, Cloudflare, standard Reverse Proxies, and Node.js.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;

  // 1. Netlify Verified Client IP (Protected server-injected header)
  const netlifyIp = headers.get('x-nf-client-connection-ip') || headers.get('client-ip');
  if (netlifyIp) {
    const cleaned = cleanIp(netlifyIp);
    if (isValidIp(cleaned)) return cleaned;
  }

  // 2. Cloudflare Connecting IP
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) {
    const cleaned = cleanIp(cfIp);
    if (isValidIp(cleaned)) return cleaned;
  }

  // 3. X-Real-IP
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    const cleaned = cleanIp(realIp);
    if (isValidIp(cleaned)) return cleaned;
  }

  // 4. X-Forwarded-For (Extract leftmost public/client IP)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const rawIps = forwardedFor.split(',');
    for (const raw of rawIps) {
      const cleaned = cleanIp(raw);
      if (isValidIp(cleaned)) {
        return cleaned;
      }
    }
  }

  // 5. NextRequest .ip property (if available in edge/runtime)
  if ('ip' in request && typeof (request as any).ip === 'string') {
    const directIp = (request as any).ip;
    if (directIp) {
      const cleaned = cleanIp(directIp);
      if (isValidIp(cleaned)) return cleaned;
    }
  }

  return '127.0.0.1';
}

function cleanIp(raw: string): string {
  if (!raw) return '';
  let ip = raw.trim();
  // Strip IPv4 port e.g. 192.168.1.1:8080 -> 192.168.1.1
  if (/^(\d{1,3}\.){3}\d{1,3}:\d+$/.test(ip)) {
    ip = ip.split(':')[0];
  }
  return ip;
}

function isValidIp(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  // Simple check for valid characters in IPv4 or IPv6
  return /^[0-9a-fA-F:.]+$/.test(ip);
}

/**
 * Generates an isolated, spoof-proof Rate Limit key.
 *
 * For Authenticated requests:
 *   rl:user:{verifiedUserId}:{policy}
 *
 * For Unauthenticated requests:
 *   rl:ip:{clientIp}:{policy}:{actionOrRoute}
 */
export function generateRateLimitKey(options: {
  policy: RateLimitPolicy;
  request: NextRequest | Request;
  userId?: string;
  action?: string;
}): string {
  const { policy, request, userId, action } = options;

  // 1. Authenticated tenant key (Strictly derived from server-verified userId)
  if (userId && typeof userId === 'string' && userId.trim().length > 0) {
    return `rl:user:${userId.trim()}:${policy}`;
  }

  // 2. Unauthenticated / IP-based key
  const clientIp = getClientIp(request);
  let routeIdentifier = action || '';

  if (!routeIdentifier) {
    try {
      if ('nextUrl' in request && request.nextUrl?.pathname) {
        routeIdentifier = request.nextUrl.pathname;
      } else if ('url' in request && request.url) {
        const parsed = new URL(request.url, 'http://localhost');
        routeIdentifier = parsed.pathname;
      }
    } catch {
      routeIdentifier = 'unknown';
    }
  }

  // Clean identifier to safe alphanumeric + dashes/slashes
  const cleanRoute = routeIdentifier.replace(/[^a-zA-Z0-9_/.-]/g, '_');
  return `rl:ip:${clientIp}:${policy}:${cleanRoute}`;
}
