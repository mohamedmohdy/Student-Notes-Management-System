import { NextRequest, NextResponse } from 'next/server';
import { ClassNoteRepository, ClassRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { ClassNoteType } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId') || undefined;
    const type = (searchParams.get('type') as ClassNoteType) || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;

    const classNotes = await ClassNoteRepository.getAll({
      teacherId: authCheck.user.userId,
      classId,
      type,
      startDate,
      endDate,
      search,
    });

    return NextResponse.json({ classNotes });
  } catch (error: any) {
    console.error('Error fetching class notes:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب ملاحظات الفصل' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { classId, title, content, type, noteDate } = body;

    if (!classId || !content || !content.trim()) {
      return NextResponse.json({ error: 'يرجى تحديد الفصل وكتابة نص الملاحظة' }, { status: 400 });
    }

    // Verify class belongs to authenticated teacher
    const classItem = await ClassRepository.getById(classId, authCheck.user.userId);
    if (!classItem) {
      return NextResponse.json({ error: 'الفصل غير موجود أو غير مصرح بالوصول إليه' }, { status: 404 });
    }

    const classNote = await ClassNoteRepository.create({
      teacherId: authCheck.user.userId,
      classId,
      title,
      content,
      type,
      noteDate,
    });

    return NextResponse.json({ success: true, classNote });
  } catch (error: any) {
    console.error('Error creating class note:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ ملاحظة الفصل' }, { status: 500 });
  }
}
