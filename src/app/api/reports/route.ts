import { NextRequest, NextResponse } from 'next/server';
import { NoteRepository, StudentRepository, GradeRepository, ClassRepository, FollowUpRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const gradeId = searchParams.get('gradeId') || undefined;
    const classId = searchParams.get('classId') || undefined;
    const studentId = searchParams.get('studentId') || undefined;
    const type = (searchParams.get('type') as any) || undefined;
    const priority = (searchParams.get('priority') as any) || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const notes = NoteRepository.getAll({ gradeId, classId, studentId, type, priority, startDate, endDate });
    const students = StudentRepository.getAll({ gradeId, classId });
    const grades = GradeRepository.getAll();
    const classes = ClassRepository.getAll();
    const followUps = FollowUpRepository.getAll({ studentId });

    return NextResponse.json({
      notes,
      students,
      grades,
      classes,
      followUps,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء إعداد التقرير' }, { status: 500 });
  }
}
