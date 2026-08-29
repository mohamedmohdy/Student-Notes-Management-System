import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import { UserStatus } from '@/lib/types';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const status = body.status as UserStatus;

    if (!status || !['active', 'pending', 'disabled'].includes(status)) {
      return NextResponse.json({ error: 'حالة الحساب غير صالحة. الحالات المقبولة: active, pending, disabled' }, { status: 400 });
    }

    const teacher = await UserRepository.findById(params.id);
    if (!teacher) {
      return NextResponse.json({ error: 'لم يتم العثور على المعلم' }, { status: 404 });
    }

    const updated = await UserRepository.updateStatus(params.id, status);
    if (!updated) {
      return NextResponse.json({ error: 'فشل تحديث حالة الحساب' }, { status: 500 });
    }

    const updatedTeacher = await UserRepository.findById(params.id);
    return NextResponse.json({
      teacher: updatedTeacher,
      message: status === 'active' 
        ? 'تم تفعيل حساب المعلم بنجاح وبشكل دائم' 
        : status === 'disabled'
        ? 'تم تعطيل حساب المعلم (البيانات والطلاب محفوظة)'
        : 'تم تغيير حالة الحساب إلى قيد المراجعة',
    });
  } catch (error: any) {
    console.error('Update teacher status error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث حالة المعلم' }, { status: 500 });
  }
}
