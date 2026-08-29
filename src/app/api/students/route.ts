import { NextRequest, NextResponse } from 'next/server';
import { StudentRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId') || undefined;
    const gradeId = searchParams.get('gradeId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const search = searchParams.get('search') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const students = await StudentRepository.getAll({
      classId,
      gradeId,
      status,
      search,
      includeArchived,
      teacherId: authCheck.user.userId,
    });
    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الطلاب' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const body = await request.json();
    const { class_id, student_number, name, photo, status } = body;
    if (!class_id || !student_number || !name) {
      return NextResponse.json({ error: 'الفصل ورقم الطالب والاسم مطلوبان' }, { status: 400 });
    }
    const student = await StudentRepository.create({
      class_id,
      student_number: student_number.trim(),
      name: name.trim(),
      photo,
      status,
      teacher_id: authCheck.user.userId,
    });
    return NextResponse.json({ student, message: 'تمت إضافة الطالب بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة الطالب' }, { status: 500 });
  }
}
