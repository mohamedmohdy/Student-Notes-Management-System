import { NextRequest, NextResponse } from 'next/server';
import { ClassNoteRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { ClassNoteType } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const classNote = await ClassNoteRepository.getById(id, authCheck.user.userId);
    if (!classNote) {
      return NextResponse.json({ error: 'الملاحظة غير موجودة أو غير مصرح بالوصول إليها' }, { status: 404 });
    }

    return NextResponse.json({ classNote });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ في جلب الملاحظة' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, type, noteDate } = body;

    const existing = await ClassNoteRepository.getById(id, authCheck.user.userId);
    if (!existing) {
      return NextResponse.json({ error: 'الملاحظة غير موجودة أو غير مصرح بتعديلها' }, { status: 404 });
    }

    const updated = await ClassNoteRepository.update(id, authCheck.user.userId, {
      title,
      content,
      type: type as ClassNoteType,
      noteDate,
    });

    return NextResponse.json({ success: true, classNote: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الملاحظة' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const existing = await ClassNoteRepository.getById(id, authCheck.user.userId);
    if (!existing) {
      return NextResponse.json({ error: 'الملاحظة غير موجودة أو غير مصرح بحذفها' }, { status: 404 });
    }

    const success = await ClassNoteRepository.delete(id, authCheck.user.userId);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الملاحظة' }, { status: 500 });
  }
}
