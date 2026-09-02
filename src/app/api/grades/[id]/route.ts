import { NextRequest, NextResponse } from 'next/server';
import { GradeRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher(request);
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
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const body = await request.json();
    let grade = null;

    if (typeof body.archived === 'boolean') {
      await GradeRepository.setArchived(params.id, body.archived, authCheck.user.userId);
      grade = await GradeRepository.findById(params.id, authCheck.user.userId);
    } else if (body.name) {
      grade = await GradeRepository.update(params.id, body.name, authCheck.user.userId);
    } else {
      grade = await GradeRepository.findById(params.id, authCheck.user.userId);
    }

    if (!grade) return NextResponse.json({ error: 'الصف غير موجود أو غير تابع لحسابك' }, { status: 404 });

    return NextResponse.json({ grade, message: 'تم تعديل الصف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء تعديل الصف' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const ok = await GradeRepository.archive(params.id, authCheck.user.userId);
    if (!ok) return NextResponse.json({ error: 'الصف غير موجود أو غير تابع لحسابك' }, { status: 404 });

    return NextResponse.json({ message: 'تم أرشفة الصف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء أرشفة الصف' }, { status: 500 });
  }
}
