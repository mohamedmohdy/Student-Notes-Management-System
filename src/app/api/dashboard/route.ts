import { NextRequest } from 'next/server';
import { DashboardRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { getSupabaseUserClient } from '@/lib/supabase';
import { apiSuccess, apiError, apiServerError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return apiError(authCheck.error, { status: authCheck.status });
    }
    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const stats = await DashboardRepository.getStats(authCheck.user.userId, client);
    return apiSuccess({
      stats: {
        ...stats,
        teacherName: authCheck.user.name,
      },
    });
  } catch (error: any) {
    return apiServerError('حدث خطأ أثناء جلب إحصائيات لوحة التحكم', error);
  }
}
