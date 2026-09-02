import { NextRequest } from 'next/server';
import { NoteRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { getSupabaseUserClient } from '@/lib/supabase';
import { apiSuccess, apiError, apiBadRequest, apiServerError } from '@/lib/api-response';
import { validateNoteInput } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return apiError(authCheck.error, { status: authCheck.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId') || undefined;
    const classId = searchParams.get('classId') || undefined;
    const gradeId = searchParams.get('gradeId') || undefined;
    const type = searchParams.get('type') as any || undefined;
    const priority = searchParams.get('priority') as any || undefined;
    const search = searchParams.get('search') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const notes = await NoteRepository.getAll({
      studentId,
      classId,
      gradeId,
      type,
      priority,
      search,
      includeArchived,
      teacherId: authCheck.user.userId,
      teacherName: authCheck.user.name,
    }, client);
    return apiSuccess({ notes });
  } catch (error: any) {
    return apiServerError('حدث خطأ أثناء جلب الملاحظات', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return apiError(authCheck.error, { status: authCheck.status });
    }
    const body = await request.json().catch(() => ({}));
    const validation = validateNoteInput(body);
    if (!validation.valid || !validation.data) {
      return apiBadRequest(validation.errors[0] || 'بيانات الملاحظة غير صحيحة', validation.errors);
    }

    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const note = await NoteRepository.create({
      studentId: validation.data.studentId,
      type: validation.data.type,
      priority: validation.data.priority,
      content: validation.data.content,
      actionTaken: validation.data.actionTaken,
      requiresFollowUp: validation.data.requiresFollowUp,
      follow_up_date: validation.data.followUpDate,
      teacherId: authCheck.user.userId,
    }, client);

    return apiSuccess({ note, message: 'تم إضافة الملاحظة بنجاح' }, { status: 201 });
  } catch (error: any) {
    return apiServerError('حدث خطأ أثناء إضافة الملاحظة', error);
  }
}
