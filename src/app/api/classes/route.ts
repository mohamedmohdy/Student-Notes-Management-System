import { NextRequest, NextResponse } from 'next/server';
import { ClassRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const gradeId = request.nextUrl.searchParams.get('gradeId') || undefined;
    const includeArchived = request.nextUrl.searchParams.get('includeArchived') === 'true';
    const classes = ClassRepository.getAll(gradeId, includeArchived);
    return NextResponse.json({ classes });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الفصول' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { grade_id, name } = body;

    if (!grade_id || !name || !name.trim()) {
      return NextResponse.json({ error: 'الصف واسم الفصل مطلوبان' }, { status: 400 });
    }

    const classRoom = ClassRepository.create(grade_id, name);
    return NextResponse.json({ classRoom, message: 'تم إضافة الفصل بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة الفصل' }, { status: 500 });
  }
}
