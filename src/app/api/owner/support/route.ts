import { NextRequest, NextResponse } from 'next/server';
import { SupportTicketRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireOwner();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const tickets = await SupportTicketRepository.getAllForOwner({ status, category, search });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('Error fetching owner support tickets:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تذاكر الدعم الإداري' }, { status: 500 });
  }
}
