import { NextResponse } from 'next/server';
import { ArchiveRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET() {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const archived = await ArchiveRepository.getAllArchived(authCheck.user.userId);
    return NextResponse.json({ archived });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الأرشيف' }, { status: 500 });
  }
}
