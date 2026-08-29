import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementRepository, UserRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireOwner();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const isPublishedParam = searchParams.get('isPublished');
    const isPublished = isPublishedParam !== null ? isPublishedParam === 'true' : undefined;

    const announcements = await AnnouncementRepository.getAll({ isPublished, search });
    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error('Owner get announcements error:', error);
    return NextResponse.json({ error: 'فشل جلب الإعلانات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireOwner();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { title, content, type, is_published, expires_at } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'العنوان ومحتوى الإعلان مطلوبان' }, { status: 400 });
    }

    const announcement = await AnnouncementRepository.create({
      title,
      content,
      type,
      is_published,
      expires_at,
    });

    await UserRepository.logActivity(
      authCheck.user.userId,
      'CREATE_ANNOUNCEMENT',
      `المالك قام بنشر إعلان جديد بعنوان: ${title}`
    );

    return NextResponse.json({
      success: true,
      announcement,
      message: 'تم إنشاء ونشر الإعلان العام بنجاح لجميع المعلمين',
    });
  } catch (error: any) {
    console.error('Owner create announcement error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الإعلان' }, { status: 500 });
  }
}
