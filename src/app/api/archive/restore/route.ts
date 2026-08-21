import { NextRequest, NextResponse } from 'next/server';
import { ArchiveRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json({ error: 'النوع والمعرف مطلوبان' }, { status: 400 });
    }

    ArchiveRepository.restoreItem(type, id);
    return NextResponse.json({ message: 'تم استعادة العنصر من الأرشيف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء استعادة العنصر' }, { status: 500 });
  }
}
