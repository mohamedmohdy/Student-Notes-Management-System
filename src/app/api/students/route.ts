import { NextRequest } from 'next/server';
import { StudentRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { getSupabaseUserClient } from '@/lib/supabase';
import { apiSuccess, apiError, apiBadRequest, apiServerError } from '@/lib/api-response';
import { validateStudentInput } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return apiError(authCheck.error, { status: authCheck.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId') || undefined;
    const gradeId = searchParams.get('gradeId') || undefined;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') as any || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const students = await StudentRepository.getAll({
      classId,
      gradeId,
      search,
      status,
      includeArchived,
      teacherId: authCheck.user.userId,
    }, client);
    return apiSuccess({ students });
  } catch (error: any) {
    return apiServerError('حدث خطأ أثناء جلب الطلاب', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return apiError(authCheck.error, { status: authCheck.status });
    }
    const body = await request.json().catch(() => ({}));
    const validation = validateStudentInput(body);
    if (!validation.valid || !validation.data) {
      return apiBadRequest(validation.errors[0] || 'بيانات الطالب غير صحيحة', validation.errors);
    }

    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const student = await StudentRepository.create({
      classId: validation.data.classId,
      name: validation.data.name,
      studentNumber: validation.data.studentNumber,
      status: validation.data.status,
      photo: validation.data.photo,
      teacherId: authCheck.user.userId,
    }, client);

    return apiSuccess({ student, message: 'تم إضافة الطالب بنجاح' }, { status: 201 });
  } catch (error: any) {
    return apiServerError('حدث خطأ أثناء إضافة الطالب', error);
  }
}
