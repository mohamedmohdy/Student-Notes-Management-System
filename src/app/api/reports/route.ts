import { NextRequest, NextResponse } from 'next/server';
import { NoteRepository, StudentRepository, GradeRepository, ClassRepository, FollowUpRepository, ClassNoteRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }
    const searchParams = request.nextUrl.searchParams;
    const gradeId = searchParams.get('gradeId') || undefined;
    const classId = searchParams.get('classId') || undefined;
    const studentId = searchParams.get('studentId') || undefined;
    const type = (searchParams.get('type') as any) || undefined;
    const priority = (searchParams.get('priority') as any) || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const notes = await NoteRepository.getAll({ gradeId, classId, studentId, type, priority, startDate, endDate, teacherId: authCheck.user.userId });
    const students = await StudentRepository.getAll({ gradeId, classId, teacherId: authCheck.user.userId });
    const grades = await GradeRepository.getAll({ teacherId: authCheck.user.userId });
    const classes = await ClassRepository.getAll({ teacherId: authCheck.user.userId });
    const followUps = await FollowUpRepository.getAll({ studentId, teacherId: authCheck.user.userId });
    const classNotes = await ClassNoteRepository.getAll({ classId, startDate, endDate, teacherId: authCheck.user.userId });

    return NextResponse.json({
      notes,
      students,
      grades,
      classes,
      followUps,
      classNotes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء إعداد التقرير' }, { status: 500 });
  }
}
