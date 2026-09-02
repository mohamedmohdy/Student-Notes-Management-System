import { NextRequest, NextResponse } from 'next/server';
import { FollowUpRepository, NoteRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId') || searchParams.get('student_id') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const followUps = await FollowUpRepository.getAll({
      studentId,
      status,
      startDate,
      endDate,
      teacherId: authCheck.user.userId,
    });
    return NextResponse.json({ followUps });
  } catch (error: any) {
    console.error('Error fetching follow ups:', error);
    return NextResponse.json({
      error: error.message || 'حدث خطأ أثناء جلب المتابعات',
      code: error.code || null,
      details: error.details || null,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const studentId = body.studentId || body.student_id;
    const noteId = body.noteId || body.note_id;
    const followUpDate = body.followUpDate || body.follow_up_date || body.due_date || new Date().toISOString().split('T')[0];

    if (!studentId || !noteId) {
      return NextResponse.json({ error: 'يرجى تحديد الطالب والملاحظة لإنشاء المتابعة' }, { status: 400 });
    }

    const followUp = await FollowUpRepository.create({
      teacherId: authCheck.user.userId,
      studentId,
      noteId,
      followUpDate,
    });

    return NextResponse.json({ success: true, followUp, message: 'تم جدولة المتابعة بنجاح' });
  } catch (error: any) {
    console.error('Error creating follow up:', error);
    return NextResponse.json({
      error: error.message || 'حدث خطأ أثناء إنشاء المتابعة',
      code: error.code || null,
    }, { status: 500 });
  }
}
