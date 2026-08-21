import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'يرجى إدخال البريد الإلكتروني' }, { status: 400 });
    }

    const user = UserRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني' }, { status: 404 });
    }

    // Generate random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    UserRepository.createPasswordReset(email, code);

    // Send real email to teacher's Gmail address
    await sendPasswordResetEmail(email.trim(), code);

    // SECURITY: Never expose the OTP code in the JSON API response!
    return NextResponse.json({
      message: 'تم إرسال رمز التحقق السري المكون من 6 أرقام إلى بريدك الإلكتروني في Gmail بنجاح. يرجى مراجعة صندوق الوارد والرسائل.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال رمز التحقق' }, { status: 500 });
  }
}
