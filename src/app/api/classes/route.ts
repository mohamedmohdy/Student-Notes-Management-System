import { NextRequest } from 'next/server';
import { ClassRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { getSupabaseUserClient } from '@/lib/supabase';
import { apiSuccess, apiError, apiBadRequest, apiServerError } from '@/lib/api-response';
import { validateClassInput } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return apiError(authCheck.error, { status: authCheck.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const gradeId = searchParams.get('gradeId') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const classes = await ClassRepository.getAll({ gradeId, includeArchived, teacherId: authCheck.user.userId }, client);
    return apiSuccess({ classes });
  } catch (error: any) {
    return apiServerError('حدث خطأ أثناء جلب الفصول', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return apiError(authCheck.error, { status: authCheck.status });
    }
    const body = await request.json().catch(() => ({}));
    const validation = validateClassInput(body);
    if (!validation.valid || !validation.data) {
      return apiBadRequest(validation.errors[0] || 'بيانات الفصل غير صحيحة', validation.errors);
    }

    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const classRoom = await ClassRepository.create({
      gradeId: validation.data.gradeId,
      name: validation.data.name,
      teacherId: authCheck.user.userId,
    }, undefined, undefined, client);

    return apiSuccess({ class: classRoom, classRoom, message: 'تم إنشاء الفصل بنجاح' }, { status: 201 });
  } catch (error: any) {
    return apiServerError('حدث خطأ أثناء إنشاء الفصل', error);
  }
}
