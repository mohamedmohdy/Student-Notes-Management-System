import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { verifyPassword, createToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' }, { status: 400 });
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Update last login timestamp
    await UserRepository.updateLastLogin(user.id);

    const token = createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      must_change_password: user.must_change_password || 0,
    });

    const isOwner = user.role.toUpperCase() === 'OWNER';
    let redirectUrl = '/dashboard';

    if (isOwner) {
      redirectUrl = '/owner';
    } else if (user.status === 'pending') {
      redirectUrl = '/pending-activation';
    } else if (user.status === 'disabled') {
      redirectUrl = '/account-disabled';
    } else if (user.must_change_password === 1) {
      redirectUrl = '/change-password';
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        must_change_password: user.must_change_password || 0,
      },
      redirectUrl,
      message: 'تم تسجيل الدخول بنجاح',
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 });
  }
}
