import { NextRequest } from 'next/server';
import { GradeRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { getSupabaseUserClient } from '@/lib/supabase';
import { apiSuccess, apiError, apiBadRequest, apiServerError } from '@/lib/api-response';
import { validateGradeInput } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return apiError(authCheck.error, { status: authCheck.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const grades = await GradeRepository.getAll({ includeArchived, teacherId: authCheck.user.userId }, client);
    return apiSuccess({ grades });
  } catch (error: any) {
    return apiServerError('حدث خطأ أثناء جلب الصفوف', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return apiError(authCheck.error, { status: authCheck.status });
    }
    const body = await request.json().catch(() => ({}));
    const validation = validateGradeInput(body);
    if (!validation.valid || !validation.data) {
      return apiBadRequest(validation.errors[0] || 'بيانات الصف غير صحيحة', validation.errors);
    }

    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const grade = await GradeRepository.create(validation.data.name, authCheck.user.userId, client);
    return apiSuccess({ grade, message: 'تم إنشاء الصف بنجاح' }, { status: 201 });
  } catch (error: any) {
    return apiServerError('حدث خطأ أثناء إنشاء الصف', error);
  }
}
