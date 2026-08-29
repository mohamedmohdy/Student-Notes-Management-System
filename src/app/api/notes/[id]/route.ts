import { NextRequest, NextResponse } from 'next/server';
import { NoteRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const note = await NoteRepository.findById(params.id, authCheck.user.userId);
    if (!note) return NextResponse.json({ error: 'الملاحظة غير موجودة أو غير تابعة لحسابك' }, { status: 404 });

    return NextResponse.json({ note });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الملاحظة' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const body = await request.json();
    const note = await NoteRepository.update(params.id, body, authCheck.user.userId);
    if (!note) return NextResponse.json({ error: 'الملاحظة غير موجودة أو غير تابعة لحسابك' }, { status: 404 });

    return NextResponse.json({ note, message: 'تم تعديل الملاحظة بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الملاحظة' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const ok = await NoteRepository.setArchived(params.id, true, authCheck.user.userId);
    if (!ok) return NextResponse.json({ error: 'الملاحظة غير موجودة أو غير تابعة لحسابك' }, { status: 404 });

    return NextResponse.json({ message: 'تم أرشفة الملاحظة بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء أرشفة الملاحظة' }, { status: 500 });
  }
}
