import { NextRequest, NextResponse } from 'next/server';
import { FollowUpRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const followUp = await FollowUpRepository.findById(params.id, authCheck.user.userId);
    if (!followUp) return NextResponse.json({ error: 'المتابعة غير موجودة أو غير تابعة لحسابك' }, { status: 404 });

    return NextResponse.json({ followUp });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المتابعة' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const body = await request.json();
    const followUp = await FollowUpRepository.resolve(params.id, body, authCheck.user.userId);
    if (!followUp) return NextResponse.json({ error: 'المتابعة غير موجودة أو غير تابعة لحسابك' }, { status: 404 });

    return NextResponse.json({ followUp, message: 'تم تحديث حالة المتابعة بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث المتابعة' }, { status: 500 });
  }
}
