import { NextRequest, NextResponse } from 'next/server';
import { BackupRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const body = await request.json();
    await BackupRepository.importAll(body, authCheck.user.userId);

    return NextResponse.json({ message: 'تم استعادة النسخة الاحتياطية بنجاح' });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء استيراد البيانات، تأكد من صحة الملف' }, { status: 500 });
  }
}
