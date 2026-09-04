import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole, UserStatus } from './types';
import { UserRepository } from './db';
import { getSupabaseUserClient } from './supabase';
import { RateLimitPolicy } from './security/rate-limit/types';
import { checkRateLimit } from './security/rate-limit/limiter';
import { buildRateLimitHeaders } from './security/rate-limit/response';

const JWT_SECRET = process.env.JWT_SECRET || 'student_notes_secret_key_production_2026_secure';
export const AUTH_COOKIE_NAME = 'student_notes_auth_token';

// Short-burst in-memory cache to prevent duplicate DB queries during concurrent page-load requests (5 seconds TTL)
const userSessionCache = new Map<string, { user: User; expiresAt: number }>();

export function invalidateUserAuthCache(userId?: string) {
  if (userId) {
    userSessionCache.delete(userId);
  } else {
    userSessionCache.clear();
  }
}

export interface TokenPayload {
  userId: string;
  supabaseAccessToken?: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  must_change_password?: number;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function createToken(user: { id: string; email: string; name: string; role: UserRole; status?: UserStatus; must_change_password?: number; supabaseAccessToken?: string }): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status || 'pending',
    must_change_password: user.must_change_password || 0,
    supabaseAccessToken: user.supabaseAccessToken,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getSessionFromRequest(request: NextRequest): TokenPayload | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getVerifiedUser(userId: string, client?: any): Promise<User | null> {
  const now = Date.now();
  const cached = userSessionCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const dbUser = await UserRepository.findById(userId, client);
  if (dbUser) {
    userSessionCache.set(userId, { user: dbUser, expiresAt: now + 5000 }); // 5s safe burst window
  }
  return dbUser;
}

export interface AuthCheckError {
  error: string;
  status: number;
  code?: string;
  headers?: Record<string, string>;
}

export async function requireOwner(
  request?: NextRequest,
  rateLimitPolicy: RateLimitPolicy = 'OWNER'
): Promise<{ user: TokenPayload } | AuthCheckError> {
  const tokenUser = request ? getSessionFromRequest(request) : await getCurrentUser();
  if (!tokenUser) {
    return { error: 'يرجى تسجيل الدخول أولاً', status: 401 };
  }
  const client = getSupabaseUserClient(tokenUser.supabaseAccessToken);
  const dbUser = await getVerifiedUser(tokenUser.userId, client);
  const normalizedRole = (dbUser?.role || tokenUser.role || '').toUpperCase();
  if (normalizedRole !== 'OWNER' && normalizedRole !== 'ADMIN') {
    return { error: 'غير مصرح لك بالوصول: هذه اللوحة مخصصة فقط لمالك المنصة (Owner)', status: 403 };
  }

  // Rate Limiting Enforcement on Verified Owner ID
  if (request) {
    const rateLimitResult = await checkRateLimit({
      request,
      policy: rateLimitPolicy,
      userId: tokenUser.userId,
    });
    if (!rateLimitResult.success) {
      const seconds =
        rateLimitResult.retryAfter > 0
          ? rateLimitResult.retryAfter
          : Math.max(1, Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000));
      return {
        error: `تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة بعد ${seconds} ثانية.`,
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        headers: buildRateLimitHeaders(rateLimitResult),
      };
    }
  }

  return { user: { ...tokenUser, role: 'OWNER', status: dbUser?.status || tokenUser.status } };
}

export async function requireActiveTeacher(
  request?: NextRequest,
  rateLimitPolicy: RateLimitPolicy = 'TEACHER'
): Promise<{ user: TokenPayload } | AuthCheckError> {
  const tokenUser = request ? getSessionFromRequest(request) : await getCurrentUser();
  if (!tokenUser) {
    return { error: 'يرجى تسجيل الدخول أولاً', status: 401 };
  }
  const client = getSupabaseUserClient(tokenUser.supabaseAccessToken);
  const dbUser = await getVerifiedUser(tokenUser.userId, client);
  const userRole = (dbUser?.role || tokenUser.role || '').toUpperCase();
  const userStatus = dbUser?.status || tokenUser.status || 'pending';

  if (userRole === 'OWNER') {
    // Owner accessing teacher endpoint
    if (request) {
      const rateLimitResult = await checkRateLimit({
        request,
        policy: rateLimitPolicy,
        userId: tokenUser.userId,
      });
      if (!rateLimitResult.success) {
        const seconds =
          rateLimitResult.retryAfter > 0
            ? rateLimitResult.retryAfter
            : Math.max(1, Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000));
        return {
          error: `تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة بعد ${seconds} ثانية.`,
          status: 429,
          code: 'RATE_LIMIT_EXCEEDED',
          headers: buildRateLimitHeaders(rateLimitResult),
        };
      }
    }
    return { user: { ...tokenUser, role: 'OWNER', status: userStatus } };
  }
  if (userStatus === 'pending') {
    return { error: 'حسابك قيد التفعيل من قبل مالك المنصة بعد إتمام عملية الشراء (50 ريال دفعة واحدة)', status: 403 };
  }
  if (userStatus === 'disabled') {
    return { error: 'تم تعطيل هذا الحساب من قبل إدارة المنصة', status: 403 };
  }

  // Rate Limiting Enforcement on Verified Teacher ID
  if (request) {
    const rateLimitResult = await checkRateLimit({
      request,
      policy: rateLimitPolicy,
      userId: tokenUser.userId,
    });
    if (!rateLimitResult.success) {
      const seconds =
        rateLimitResult.retryAfter > 0
          ? rateLimitResult.retryAfter
          : Math.max(1, Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000));
      return {
        error: `تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة بعد ${seconds} ثانية.`,
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        headers: buildRateLimitHeaders(rateLimitResult),
      };
    }
  }

  return {
    user: {
      ...tokenUser,
      role: userRole as UserRole,
      status: userStatus as UserStatus,
      must_change_password: dbUser?.must_change_password ?? tokenUser.must_change_password,
    },
  };
}
