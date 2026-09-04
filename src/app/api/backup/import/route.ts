import { NextRequest, NextResponse } from 'next/server';
import { BackupRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { parseJsonWithLimit } from '@/lib/security/request-size-limiter';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request, 'EXPORT');
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    // Server-side Request Body Size Limit (BACKUP_IMPORT: 15 MB cap)
    const { data: body, errorResponse } = await parseJsonWithLimit(request, 'BACKUP_IMPORT');
    if (errorResponse) return errorResponse;

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'ملف النسخة الاحتياطية غير صالح' }, { status: 400 });
    }

    await BackupRepository.importAll(body, authCheck.user.userId);

    return NextResponse.json({ message: 'تم استعادة النسخة الاحتياطية بنجاح' });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء استيراد البيانات، تأكد من صحة الملف' }, { status: 500 });
  }
}

