import { NextRequest, NextResponse } from 'next/server';
import { NoteRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId') || undefined;
    const classId = searchParams.get('classId') || undefined;
    const gradeId = searchParams.get('gradeId') || undefined;
    const type = (searchParams.get('type') as any) || undefined;
    const priority = (searchParams.get('priority') as any) || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const reqFu = searchParams.get('requiresFollowUp');
    const requiresFollowUp = reqFu !== null ? reqFu === 'true' : undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const notes = NoteRepository.getAll({
      studentId,
      classId,
      gradeId,
      type,
      priority,
      search,
      startDate,
      endDate,
      requiresFollowUp,
      includeArchived,
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الملاحظات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { student_id, type, priority, content, action_taken, requires_follow_up, follow_up_date } = body;

    if (!student_id || !content || !content.trim()) {
      return NextResponse.json({ error: 'يرجى اختيار الطالب وكتابة نص الملاحظة' }, { status: 400 });
    }

    if (requires_follow_up && !follow_up_date) {
      return NextResponse.json({ error: 'يرجى تحديد تاريخ المتابعة' }, { status: 400 });
    }

    const note = NoteRepository.create({
      student_id,
      teacher_id: session.userId,
      type: type || 'academic',
      priority: priority || 'medium',
      content,
      action_taken,
      requires_follow_up: !!requires_follow_up,
      follow_up_date,
    });

    return NextResponse.json({ note, message: 'تم حفظ الملاحظة بنجاح' });
  } catch (error: any) {
    console.error('Create note error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ الملاحظة، حاول مرة أخرى' }, { status: 500 });
  }
}
