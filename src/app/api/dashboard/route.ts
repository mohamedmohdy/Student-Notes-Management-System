import { NextResponse } from 'next/server';
import { DashboardRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET() {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const stats = await DashboardRepository.getStats(authCheck.user.userId);
    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Dashboard API Error Details:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب إحصائيات لوحة التحكم' }, { status: 500 });
  }
}
