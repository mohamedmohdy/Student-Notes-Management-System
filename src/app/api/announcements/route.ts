import { NextRequest } from 'next/server';
import { AnnouncementRepository } from '@/lib/db';
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
    const announcements = await AnnouncementRepository.getActiveForTeacher(authCheck.user.userId, client);
    return apiSuccess({ announcements });
  } catch (error: any) {
    return apiServerError('حدث خطأ أثناء جلب الإعلانات', error);
  }
}
