import { NextRequest, NextResponse } from 'next/server';
import { FollowUpRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const followUps = await FollowUpRepository.getAll({
      studentId,
      status,
      startDate,
      endDate,
      teacherId: authCheck.user.userId,
    });
    return NextResponse.json({ followUps });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المتابعات' }, { status: 500 });
  }
}
