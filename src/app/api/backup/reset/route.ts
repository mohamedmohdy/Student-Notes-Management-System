import { NextResponse } from 'next/server';
import { BackupRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    BackupRepository.resetAllData();
    return NextResponse.json({ message: 'تم تصفير وحذف كافة البيانات بنجاح، يمكنك الآن البدء بإدخال بيانات جديدة.' });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تصفير البيانات' }, { status: 500 });
  }
}
