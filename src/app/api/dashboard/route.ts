import { NextResponse } from 'next/server';
import { DashboardRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const stats = DashboardRepository.getStats();
    return NextResponse.json({ stats });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب إحصائيات لوحة التحكم' }, { status: 500 });
  }
}
