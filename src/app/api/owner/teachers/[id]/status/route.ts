import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import { getSupabaseUserClient, getAuthenticatedOwnerClient } from '@/lib/supabase';
import { UserStatus } from '@/lib/types';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const status = body.status as UserStatus;

    if (!status || !['active', 'pending', 'disabled'].includes(status)) {
      return NextResponse.json({ error: 'حالة الحساب غير صالحة. الحالات المقبولة: active, pending, disabled' }, { status: 400 });
    }

    const ownerClient = await getAuthenticatedOwnerClient(authCheck.user.supabaseAccessToken);
    const teacher = await UserRepository.findById(params.id, ownerClient);
    if (!teacher) {
      return NextResponse.json({ error: 'لم يتم العثور على المعلم' }, { status: 404 });
    }

    const updated = await UserRepository.updateStatus(params.id, status, ownerClient);
    if (!updated) {
      return NextResponse.json({ error: 'فشل تحديث حالة الحساب' }, { status: 500 });
    }

    // Log the security audit event
    await UserRepository.logActivity(
      authCheck.user.userId,
      'UPDATE_TEACHER_STATUS',
      `المالك قام بتغيير حالة المعلم (${teacher.name} - ${teacher.email}) من ${teacher.status} إلى ${status}`
    );

    return NextResponse.json({
      teacher: updated,
      message: status === 'active' 
        ? 'تم تفعيل حساب المعلم بنجاح وبشكل دائم 🟢' 
        : status === 'disabled'
        ? 'تم تعطيل حساب المعلم (البيانات والطلاب محفوظة) 🔴'
        : 'تم تغيير حالة الحساب إلى قيد المراجعة 🟡',
    });
  } catch (error: any) {
    console.error('Update teacher status error:', error);
    return NextResponse.json({
      error: error.message || 'حدث خطأ أثناء تحديث حالة المعلم',
      details: error.details || null,
      code: error.code || null,
      hint: error.hint || null,
    }, { status: 500 });
  }
}
