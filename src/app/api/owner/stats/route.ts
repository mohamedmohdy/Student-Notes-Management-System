import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import { getSupabaseUserClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const stats = await UserRepository.getOwnerStats(client);
    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Owner stats error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب إحصائيات المالك' }, { status: 500 });
  }
}
