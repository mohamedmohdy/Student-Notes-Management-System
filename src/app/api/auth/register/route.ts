import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { hashPassword, createToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'يجب أن تتكون كلمة المرور من 6 خانات على الأقل' }, { status: 400 });
    }

    const existing = UserRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 400 });
    }

    const password_hash = hashPassword(password);
    const user = UserRepository.create({
      name,
      email,
      password_hash,
      role: 'teacher',
    });

    const token = createToken(user);
    const response = NextResponse.json({
      user,
      message: 'تم إنشاء الحساب بنجاح',
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
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الحساب' }, { status: 500 });
  }
}
