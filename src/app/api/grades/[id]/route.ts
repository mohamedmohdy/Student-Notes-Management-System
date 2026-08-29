import { NextRequest, NextResponse } from 'next/server';
import { GradeRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const grade = await GradeRepository.findById(params.id, authCheck.user.userId);
    if (!grade) return NextResponse.json({ error: 'الصف غير موجود أو غير تابع لحسابك' }, { status: 404 });

    return NextResponse.json({ grade });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الصف' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const body = await request.json();
    const grade = await GradeRepository.update(params.id, body.name, authCheck.user.userId);
    if (!grade) return NextResponse.json({ error: 'الصف غير موجود أو غير تابع لحسابك' }, { status: 404 });

    return NextResponse.json({ grade, message: 'تم تعديل الصف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الصف' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const ok = await GradeRepository.archive(params.id, authCheck.user.userId);
    if (!ok) return NextResponse.json({ error: 'الصف غير موجود أو غير تابع لحسابك' }, { status: 404 });

    return NextResponse.json({ message: 'تم أرشفة الصف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء أرشفة الصف' }, { status: 500 });
  }
}
