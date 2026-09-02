import { NextRequest, NextResponse } from 'next/server';
import { BackupRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    await BackupRepository.resetAllData(authCheck.user.userId);
    return NextResponse.json({ message: 'تم تصفير وحذف كافة البيانات بنجاح، يمكنك الآن البدء بإدخال بيانات جديدة.' });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تصفير البيانات' }, { status: 500 });
  }
}
