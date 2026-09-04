import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const ok = await AnnouncementRepository.togglePublish(params.id);
    if (!ok) {
      return NextResponse.json({ error: 'الإعلان غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'تم تحديث حالة نشر الإعلان بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تغيير حالة النشر' }, { status: 500 });
  }
}
