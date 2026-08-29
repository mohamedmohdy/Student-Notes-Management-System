import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireOwner();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const stats = await UserRepository.getOwnerStats();
    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Owner stats error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب إحصائيات المالك' }, { status: 500 });
  }
}
