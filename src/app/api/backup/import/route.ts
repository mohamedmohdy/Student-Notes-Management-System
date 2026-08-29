import { NextRequest, NextResponse } from 'next/server';
import { BackupRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    await BackupRepository.importAll(body);

    return NextResponse.json({ message: 'تم استعادة النسخة الاحتياطية بنجاح' });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء استيراد البيانات، تأكد من صحة الملف' }, { status: 500 });
  }
}
