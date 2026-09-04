import { NextRequest, NextResponse } from 'next/server';
import { SupportTicketRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const ticket = await SupportTicketRepository.getByIdForTeacher(params.id, authCheck.user.userId);
    if (!ticket) {
      return NextResponse.json({ error: 'التذكرة غير موجودة أو غير تابعة لحسابك' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error('Error fetching ticket details:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تفاصيل التذكرة' }, { status: 500 });
  }
}
