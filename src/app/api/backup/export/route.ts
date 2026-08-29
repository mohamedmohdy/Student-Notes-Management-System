import { NextResponse } from 'next/server';
import { BackupRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const data = await BackupRepository.exportAll();
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
