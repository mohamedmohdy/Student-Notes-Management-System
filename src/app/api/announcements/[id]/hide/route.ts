import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    await AnnouncementRepository.markAsHidden(params.id, authCheck.user.userId);
    return NextResponse.json({ success: true, message: 'تم إخفاء الإعلان بنجاح من لوحتك' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء إخفاء الإعلان' }, { status: 500 });
  }
}
