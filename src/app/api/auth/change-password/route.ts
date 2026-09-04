import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { getCurrentUser, hashPassword, createToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { rateLimitGuard } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 });
    }

    const rateLimitResponse = await rateLimitGuard(request, 'AUTH', {
      userId: session.userId,
      action: 'change-password',
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { newPassword, confirmPassword } = body;

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'يرجى إدخال كلمة المرور وتأكيدها' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'يجب أن تتكون كلمة المرور من 6 خانات على الأقل' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'كلمتا المرور غير متطابقتين' }, { status: 400 });
    }

    const password_hash = hashPassword(newPassword);
    const updated = await UserRepository.changePassword(session.userId, password_hash);
    if (!updated) {
      return NextResponse.json({ error: 'فشل تغيير كلمة المرور' }, { status: 500 });
    }

    // Refresh token with must_change_password = 0
    const user = await UserRepository.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const token = createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      must_change_password: 0,
    });

    const response = NextResponse.json({
      success: true,
      message: 'تم إنشاء وتعيين كلمة المرور الجديدة بنجاح! جاري نقلك للوحة التحكم...',
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تغيير كلمة المرور' }, { status: 500 });
  }
}
