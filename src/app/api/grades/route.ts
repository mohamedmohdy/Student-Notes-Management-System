import { NextRequest, NextResponse } from 'next/server';
import { GradeRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const searchParams = request.nextUrl.searchParams;
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const grades = await GradeRepository.getAll({ includeArchived, teacherId: authCheck.user.userId });
    return NextResponse.json({ grades });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الصفوف' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const body = await request.json();
    const { name } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم الصف مطلوب' }, { status: 400 });
    }
    const grade = await GradeRepository.create(name.trim(), authCheck.user.userId);
    return NextResponse.json({ grade, message: 'تم إنشاء الصف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الصف' }, { status: 500 });
  }
}
