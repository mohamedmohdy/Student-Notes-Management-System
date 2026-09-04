import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementRepository, UserRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const announcement = await AnnouncementRepository.findById(params.id);
    if (!announcement) {
      return NextResponse.json({ error: 'الإعلان غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ announcement });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الإعلان' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const body = await request.json();
    const updated = await AnnouncementRepository.update(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'الإعلان غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ announcement: updated, message: 'تم تعديل الإعلان بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الإعلان' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const ok = await AnnouncementRepository.delete(params.id);
    if (!ok) {
      return NextResponse.json({ error: 'الإعلان غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف الإعلان بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الإعلان' }, { status: 500 });
  }
}
