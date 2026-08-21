import { NextRequest, NextResponse } from 'next/server';
import { FollowUpRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const status = (request.nextUrl.searchParams.get('status') as any) || undefined;
    const studentId = request.nextUrl.searchParams.get('studentId') || undefined;

    const followUps = FollowUpRepository.getAll({ status, studentId });
    return NextResponse.json({ followUps });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المتابعات' }, { status: 500 });
  }
}
