import { NextRequest, NextResponse } from 'next/server';
import { FollowUpRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { status, result, additional_notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'حالة المتابعة مطلوبة' }, { status: 400 });
    }

    const followUp = FollowUpRepository.resolve(params.id, {
      status,
      result,
      additional_notes,
    });

    if (!followUp) return NextResponse.json({ error: 'سجل المتابعة غير موجود' }, { status: 404 });

    return NextResponse.json({ followUp, message: 'تم تحديث حالة المتابعة بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث المتابعة' }, { status: 500 });
  }
}
