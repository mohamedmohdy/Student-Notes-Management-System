import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimitGuard } from '@/lib/security/rate-limit';
import { parseJsonWithLimit } from '@/lib/security/request-size-limiter';

const GENERIC_RESET_MESSAGE =
  'إذا كان البريد الإلكتروني مسجلاً لدينا، فسيتم إرسال رمز التحقق والتعليمات إليه. يرجى مراجعة صندوق الوارد.';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting Guard (AUTH policy: 5 req/min, fail-closed)
    const rateLimitResponse = await rateLimitGuard(request, 'AUTH', { action: 'forgot-password' });
    if (rateLimitResponse) return rateLimitResponse;

    // 2. Server-side Request Body Size Limit (AUTH cap: 64 KB)
    const { data: body, errorResponse } = await parseJsonWithLimit<{ email?: string }>(request, 'AUTH');
    if (errorResponse) return errorResponse;

    const email = body?.email;

    // 3. Input Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'يرجى إدخال البريد الإلكتروني' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 255) {
      return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة' }, { status: 400 });
    }

    // 4. Look up user account
    const user = await UserRepository.findByEmail(cleanEmail);

    // 5. If user exists and is active, create OTP and dispatch reset email
    if (user && user.status !== 'disabled') {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await UserRepository.createPasswordReset(cleanEmail, code, expiresAt);

      // Send email asynchronously to mitigate timing side-channel attacks
      sendPasswordResetEmail(cleanEmail, code).catch((err) => {
        console.error('[Forgot Password] Mailer delivery failed:', err);
      });
    }

    // 6. Return identical Generic 200 OK response regardless of account existence or status
    // SECURITY: Prevents user/email enumeration across all states (existing, non-existing, disabled)
    return NextResponse.json({
      message: GENERIC_RESET_MESSAGE,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة طلب استعادة كلمة المرور' }, { status: 500 });
  }
}

