import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET() {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const announcements = await AnnouncementRepository.getActiveForTeacher(authCheck.user.userId);
    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error('Teacher announcements error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الإعلانات' }, { status: 500 });
  }
}
