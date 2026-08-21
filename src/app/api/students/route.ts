import { NextRequest, NextResponse } from 'next/server';
import { StudentRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const classId = request.nextUrl.searchParams.get('classId') || undefined;
    const gradeId = request.nextUrl.searchParams.get('gradeId') || undefined;
    const search = request.nextUrl.searchParams.get('search') || undefined;
    const status = (request.nextUrl.searchParams.get('status') as any) || undefined;
    const includeArchived = request.nextUrl.searchParams.get('includeArchived') === 'true';

    const students = StudentRepository.getAll({ classId, gradeId, search, status, includeArchived });
    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الطلاب' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { class_id, student_number, name, photo, status } = body;

    if (!class_id || !student_number || !name || !name.trim()) {
      return NextResponse.json({ error: 'يرجى تعبئة الحقول المطلوبة: الفصل، رقم الطالب، واسم الطالب' }, { status: 400 });
    }

    const student = StudentRepository.create({
      class_id,
      student_number,
      name,
      photo,
      status: status || 'normal',
    });

    return NextResponse.json({ student, message: 'تم إضافة الطالب بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة الطالب' }, { status: 500 });
  }
}
