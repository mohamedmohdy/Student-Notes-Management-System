import { NextRequest, NextResponse } from 'next/server';
import { GradeRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { name } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم الصف مطلوب' }, { status: 400 });
    }

    const grade = GradeRepository.update(params.id, name);
    if (!grade) return NextResponse.json({ error: 'الصف غير موجود' }, { status: 404 });

    return NextResponse.json({ grade, message: 'تم تعديل الصف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الصف' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const permanent = request.nextUrl.searchParams.get('permanent') === 'true';

    if (permanent) {
      GradeRepository.deletePermanent(params.id);
      return NextResponse.json({ message: 'تم حذف الصف وكافة فصوله وطلابه وملاحظاته نهائياً بنجاح' });
    } else {
      GradeRepository.setArchived(params.id, true);
      return NextResponse.json({ message: 'تم أرشفة الصف بنجاح' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الصف' }, { status: 500 });
  }
}
