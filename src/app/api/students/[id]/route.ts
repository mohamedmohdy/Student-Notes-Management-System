import { NextRequest, NextResponse } from 'next/server';
import { StudentRepository, NoteRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const student = StudentRepository.findById(params.id);
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 });

    const notes = NoteRepository.getAll({ studentId: params.id });

    return NextResponse.json({ student, notes });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب بيانات الطالب' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const student = StudentRepository.update(params.id, body);
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 });

    return NextResponse.json({ student, message: 'تم تحديث بيانات الطالب بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث بيانات الطالب' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    StudentRepository.setArchived(params.id, true);
    return NextResponse.json({ message: 'تم أرشفة الطالب بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء أرشفة الطالب' }, { status: 500 });
  }
}
