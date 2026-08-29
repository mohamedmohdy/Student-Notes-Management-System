import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await AnnouncementRepository.markAsRead(params.id, authCheck.user.userId);
    return NextResponse.json({ success: true, message: 'تم تعيين الإعلان كمقروء' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث حالة الإعلان' }, { status: 500 });
  }
}
