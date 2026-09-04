import { NextRequest, NextResponse } from 'next/server';
import { ClassRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const classRoom = await ClassRepository.findById(params.id, authCheck.user.userId);
    if (!classRoom) return NextResponse.json({ error: 'الفصل غير موجود أو غير تابع لحسابك' }, { status: 404 });

    return NextResponse.json({ class: classRoom });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الفصل' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const body = await request.json();
    const classRoom = await ClassRepository.update(params.id, body.name, authCheck.user.userId);
    if (!classRoom) return NextResponse.json({ error: 'الفصل غير موجود أو غير تابع لحسابك' }, { status: 404 });

    return NextResponse.json({ class: classRoom, message: 'تم تعديل الفصل بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الفصل' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const ok = await ClassRepository.archive(params.id, authCheck.user.userId);
    if (!ok) return NextResponse.json({ error: 'الفصل غير موجود أو غير تابع لحسابك' }, { status: 404 });

    return NextResponse.json({ message: 'تم أرشفة الفصل بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء أرشفة الفصل' }, { status: 500 });
  }
}
