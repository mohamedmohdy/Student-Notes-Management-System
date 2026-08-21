import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'يرجى إكمال جميع الحقول المطلوبة' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل' }, { status: 400 });
    }

    const isValid = UserRepository.verifyPasswordReset(email, code);
    if (!isValid) {
      return NextResponse.json({ error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' }, { status: 400 });
    }

    const password_hash = hashPassword(newPassword);
    UserRepository.updatePassword(email, password_hash);
    UserRepository.clearPasswordReset(email);

    return NextResponse.json({ message: 'تم تعيين كلمة المرور الجديدة بنجاح، يمكنك الآن تسجيل الدخول' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تعيين كلمة المرور' }, { status: 500 });
  }
}
