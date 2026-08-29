import { NextRequest, NextResponse } from 'next/server';
import { ClassRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const gradeId = searchParams.get('gradeId') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const classes = await ClassRepository.getAll({ gradeId, includeArchived, teacherId: authCheck.user.userId });
    return NextResponse.json({ classes });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الفصول' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const body = await request.json();
    const gradeId = body.grade_id || body.gradeId;
    const name = body.name;
    if (!gradeId || !name || !name.trim()) {
      return NextResponse.json({ error: 'الصف واسم الفصل مطلوبان' }, { status: 400 });
    }
    const classRoom = await ClassRepository.create({
      grade_id: gradeId,
      name: name.trim(),
      teacher_id: authCheck.user.userId,
    });
    return NextResponse.json({ class: classRoom, classRoom, message: 'تم إنشاء الفصل بنجاح' });
  } catch (error: any) {
    console.error('Create class error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الفصل' }, { status: 500 });
  }
}
