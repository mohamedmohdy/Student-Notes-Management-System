import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import { getAuthenticatedOwnerClient } from '@/lib/supabase';

function generateSecureTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let pass = 'Temp#';
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pass += '!';
  return pass;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const ownerClient = await getAuthenticatedOwnerClient(authCheck.user.supabaseAccessToken);
    const teacher = await UserRepository.findById(params.id, ownerClient);
    if (!teacher) {
      return NextResponse.json({ error: 'لم يتم العثور على حساب المعلم' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const customPassword = body.customPassword?.trim();
    const isDirectChange = body.isDirectChange === true;

    if (customPassword && customPassword.length < 6) {
      return NextResponse.json({ error: 'يجب أن تكون كلمة المرور 6 خانات على الأقل' }, { status: 400 });
    }

    const finalPassword = customPassword && customPassword.length >= 6 
      ? customPassword 
      : generateSecureTempPassword();

    const mustChange = isDirectChange ? 0 : 1;

    await UserRepository.updatePassword(params.id, finalPassword, mustChange === 1, ownerClient);

    // Log the security audit event
    const actionType = isDirectChange ? 'CHANGE_PASSWORD' : 'RESET_PASSWORD';
    const actionDesc = isDirectChange
      ? `المالك قام بتعيين كلمة مرور مباشرة جديدة للمعلم: ${teacher.email}`
      : `المالك قام بإعادة تعيين كلمة مرور المعلم وإنشاء كلمة مؤقتة: ${teacher.email}`;

    await UserRepository.logActivity(
      authCheck.user.userId,
      actionType,
      actionDesc
    );

    return NextResponse.json({
      success: true,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherEmail: teacher.email,
      tempPassword: finalPassword,
      isDirectChange,
      message: isDirectChange
        ? `تم تغيير كلمة المرور بنجاح للمعلم (${teacher.name}).`
        : `تم إعادة تعيين كلمة المرور بنجاح للمعلم (${teacher.name}). يرجى نسخ كلمة المرور المؤقتة وتسليمها له.`,
    });
  } catch (error: any) {
    console.error('Owner change password error:', error);
    return NextResponse.json({
      error: error.message || 'حدث خطأ أثناء تغيير كلمة المرور',
      details: error.details || null,
      code: error.code || null,
    }, { status: 500 });
  }
}
