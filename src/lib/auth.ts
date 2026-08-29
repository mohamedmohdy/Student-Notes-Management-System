import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole, UserStatus } from './types';
import { UserRepository } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'student_notes_secret_key_production_2026_secure';
export const AUTH_COOKIE_NAME = 'student_notes_auth_token';

export interface TokenPayload {
  userId: string;
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

export function createToken(user: { id: string; email: string; name: string; role: UserRole; status?: UserStatus; must_change_password?: number }): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status || 'pending',
    must_change_password: user.must_change_password || 0,
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

export async function requireOwner(): Promise<{ user: TokenPayload } | { error: string; status: number }> {
  const tokenUser = await getCurrentUser();
  if (!tokenUser) {
    return { error: 'يرجى تسجيل الدخول أولاً', status: 401 };
  }
  const dbUser = await UserRepository.findById(tokenUser.userId);
  if (!dbUser) {
    return { error: 'المستخدم غير موجود', status: 401 };
  }
  const normalizedRole = dbUser.role.toUpperCase();
  if (normalizedRole !== 'OWNER' && normalizedRole !== 'ADMIN') {
    return { error: 'غير مصرح لك بالوصول: هذه اللوحة مخصصة فقط لمالك المنصة (Owner)', status: 403 };
  }
  return { user: { ...tokenUser, role: 'OWNER', status: dbUser.status } };
}

export async function requireActiveTeacher(): Promise<{ user: TokenPayload } | { error: string; status: number }> {
  const tokenUser = await getCurrentUser();
  if (!tokenUser) {
    return { error: 'يرجى تسجيل الدخول أولاً', status: 401 };
  }
  const dbUser = await UserRepository.findById(tokenUser.userId);
  if (!dbUser) {
    return { error: 'المستخدم غير موجود', status: 401 };
  }
  const normalizedRole = dbUser.role.toUpperCase();
  if (normalizedRole === 'OWNER') {
    return { user: { ...tokenUser, role: 'OWNER', status: dbUser.status } };
  }
  if (dbUser.status === 'pending') {
    return { error: 'حسابك قيد التفعيل من قبل مالك المنصة بعد إتمام عملية الشراء (50 ريال دفعة واحدة)', status: 403 };
  }
  if (dbUser.status === 'disabled') {
    return { error: 'تم تعطيل هذا الحساب من قبل إدارة المنصة', status: 403 };
  }
  return { user: { ...tokenUser, role: dbUser.role, status: dbUser.status, must_change_password: dbUser.must_change_password } };
}
