import { NextRequest, NextResponse } from 'next/server';
import { ClassRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { name, grade_id } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم الفصل مطلوب' }, { status: 400 });
    }

    const classRoom = ClassRepository.update(params.id, name, grade_id);
    if (!classRoom) return NextResponse.json({ error: 'الفصل غير موجود' }, { status: 404 });

    return NextResponse.json({ classRoom, message: 'تم تعديل الفصل بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الفصل' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const permanent = request.nextUrl.searchParams.get('permanent') === 'true';

    if (permanent) {
      ClassRepository.deletePermanent(params.id);
      return NextResponse.json({ message: 'تم حذف الفصل وكافة الطلاب والملاحظات التابعة له نهائياً بنجاح' });
    } else {
      ClassRepository.setArchived(params.id, true);
      return NextResponse.json({ message: 'تم أرشفة الفصل بنجاح' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الفصل' }, { status: 500 });
  }
}
