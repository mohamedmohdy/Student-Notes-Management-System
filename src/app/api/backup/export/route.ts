import { NextRequest, NextResponse } from 'next/server';
import { BackupRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request, 'EXPORT');
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const data = await BackupRepository.exportAll(authCheck.user.userId);
    const jsonStr = JSON.stringify(data, null, 2);

    return new NextResponse(jsonStr, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="student_notes_backup_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تصدير النسخة الاحتياطية' }, { status: 500 });
  }
}
