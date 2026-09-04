import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { rateLimitGuard } from '@/lib/security/rate-limit';
import { parseJsonWithLimit } from '@/lib/security/request-size-limiter';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimitGuard(request, 'AUTH', { action: 'verify-code' });
    if (rateLimitResponse) return rateLimitResponse;

    const { data: body, errorResponse } = await parseJsonWithLimit<{ email?: string; code?: string }>(request, 'AUTH');
    if (errorResponse) return errorResponse;

    const { email, code } = body || {};

    if (!email || !code) {
      return NextResponse.json({ error: 'البريد الإلكتروني ورمز التحقق مطلوبان' }, { status: 400 });
    }

    const isValid = await UserRepository.verifyPasswordReset(email, code);
    if (!isValid) {
      return NextResponse.json({ error: 'رمز التحقق غير صحيح أو انتهت صلاحيته (صلاحية الرمز 15 دقيقة)' }, { status: 400 });
    }

    return NextResponse.json({ message: 'تم التحقق من الرمز بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء التحقق من الرمز' }, { status: 500 });
  }
}
