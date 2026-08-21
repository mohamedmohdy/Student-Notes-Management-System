import { NextResponse } from 'next/server';
import { ArchiveRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const archived = ArchiveRepository.getAllArchived();
    return NextResponse.json({ archived });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الأرشيف' }, { status: 500 });
  }
}
