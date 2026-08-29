import { NextRequest, NextResponse } from 'next/server';
import { NoteRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId') || undefined;
    const classId = searchParams.get('classId') || undefined;
    const gradeId = searchParams.get('gradeId') || undefined;
    const type = (searchParams.get('type') as any) || undefined;
    const priority = (searchParams.get('priority') as any) || undefined;
    const search = searchParams.get('search') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const notes = await NoteRepository.getAll({
      studentId,
      classId,
      gradeId,
      type,
      priority,
      search,
      includeArchived,
      teacherId: authCheck.user.userId,
    });
    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الملاحظات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const body = await request.json();
    const { student_id, type, priority, content, action_taken, requires_follow_up, follow_up_date } = body;

    if (!student_id || !type || !content) {
      return NextResponse.json({ error: 'الطالب ونوع الملاحظة والمحتوى مطلوبان' }, { status: 400 });
    }

    const note = await NoteRepository.create({
      student_id,
      teacher_id: authCheck.user.userId,
      type,
      priority: priority || 'medium',
      content: content.trim(),
      action_taken,
      requires_follow_up: !!requires_follow_up,
      follow_up_date,
    });
    return NextResponse.json({ note, message: 'تم حفظ الملاحظة بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ الملاحظة' }, { status: 500 });
  }
}
