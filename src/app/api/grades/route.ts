import { NextRequest, NextResponse } from 'next/server';
import { GradeRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const includeArchived = request.nextUrl.searchParams.get('includeArchived') === 'true';
    const grades = GradeRepository.getAll(includeArchived);
    return NextResponse.json({ grades });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الصفوف' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { name } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم الصف مطلوب' }, { status: 400 });
    }

    const grade = GradeRepository.create(name);
    return NextResponse.json({ grade, message: 'تم إضافة الصف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة الصف' }, { status: 500 });
  }
}
