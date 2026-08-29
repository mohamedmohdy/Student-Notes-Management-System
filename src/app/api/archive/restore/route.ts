import { NextRequest, NextResponse } from 'next/server';
import { ArchiveRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json({ error: 'النوع والمعرف مطلوبان' }, { status: 400 });
    }

    const ok = await ArchiveRepository.restore(type, id, authCheck.user.userId);
    if (!ok) {
      return NextResponse.json({ error: 'العنصر غير موجود في الأرشيف الخاص بحسابك' }, { status: 404 });
    }

    return NextResponse.json({ message: 'تم استعادة العنصر بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء استعادة العنصر' }, { status: 500 });
  }
}
