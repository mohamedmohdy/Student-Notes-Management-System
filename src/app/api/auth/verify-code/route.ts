import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: 'البريد الإلكتروني ورمز التحقق مطلوبان' }, { status: 400 });
    }

    const isValid = UserRepository.verifyPasswordReset(email, code);
    if (!isValid) {
      return NextResponse.json({ error: 'رمز التحقق غير صحيح أو انتهت صلاحيته (صلاحية الرمز 15 دقيقة)' }, { status: 400 });
    }

    return NextResponse.json({ message: 'تم التحقق من الرمز بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء التحقق من الرمز' }, { status: 500 });
  }
}
