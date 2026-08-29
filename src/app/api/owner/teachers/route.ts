import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { requireOwner, hashPassword } from '@/lib/auth';
import { UserStatus } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireOwner();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const teachers = await UserRepository.getAllTeachers({ status: status as UserStatus, search });
    return NextResponse.json({ teachers });
  } catch (error: any) {
    console.error('Owner teachers list error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب قائمة المعلمين' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireOwner();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { name, email, password, status } = body;

    if (!name || !name.trim() || !email || !email.trim() || !password) {
      return NextResponse.json({ error: 'يرجى إدخال اسم المعلم والبريد الإلكتروني وكلمة المرور' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'يجب أن تكون كلمة المرور 6 خانات على الأقل' }, { status: 400 });
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً لمعلم آخر' }, { status: 400 });
    }

    const password_hash = hashPassword(password);
    const userStatus: UserStatus = (status === 'pending' || status === 'disabled') ? status : 'active';

    const newTeacher = await UserRepository.createTeacher({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      status: userStatus,
    });

    // Log the audit event
    await UserRepository.logActivity(
      authCheck.user.userId,
      'CREATE_TEACHER',
      `المالك قام بإنشاء حساب معلم جديد: ${name.trim()} (${email.trim().toLowerCase()}) بحالة ${userStatus}`
    );

    return NextResponse.json({
      teacher: newTeacher,
      message: userStatus === 'active'
        ? 'تم إنشاء حساب المعلم بنجاح وتفعيله بشكل دائم 🟢'
        : 'تم إنشاء حساب المعلم بنجاح بحالة قيد المراجعة 🟡',
    });
  } catch (error: any) {
    console.error('Create teacher error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء حساب المعلم' }, { status: 500 });
  }
}
