import { NextRequest, NextResponse } from 'next/server';
import { ArchiveRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const archived = await ArchiveRepository.getAllArchived(authCheck.user.userId);
    return NextResponse.json({ archived });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الأرشيف' }, { status: 500 });
  }
}
