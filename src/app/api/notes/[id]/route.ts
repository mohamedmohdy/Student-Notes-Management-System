import { NextRequest, NextResponse } from 'next/server';
import { NoteRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const note = NoteRepository.findById(params.id);
    if (!note) return NextResponse.json({ error: 'الملاحظة غير موجودة' }, { status: 404 });

    return NextResponse.json({ note });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الملاحظة' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const note = NoteRepository.update(params.id, body);
    if (!note) return NextResponse.json({ error: 'الملاحظة غير موجودة' }, { status: 404 });

    return NextResponse.json({ note, message: 'تم تعديل الملاحظة بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الملاحظة' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    NoteRepository.setArchived(params.id, true);
    return NextResponse.json({ message: 'تم أرشفة الملاحظة بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء أرشفة الملاحظة' }, { status: 500 });
  }
}
