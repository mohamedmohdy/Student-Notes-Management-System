import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { SystemSettingsRepository } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireOwner(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const banner = await SystemSettingsRepository.getLoginBanner();
    return NextResponse.json({ banner });
  } catch (error: any) {
    console.error('Error fetching owner login banner settings:', error);
    return NextResponse.json({ error: 'فشل جلب إعدادات صفحة تسجيل الدخول' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireOwner(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const title = body.title;
    const content = body.content || body.message;
    const priceText = body.priceText;
    const badgeText = body.badgeText;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : (body.enabled !== undefined ? Boolean(body.enabled) : undefined);

    const updated = await SystemSettingsRepository.updateLoginBanner({
      title,
      content,
      priceText,
      badgeText,
      isActive,
    });

    return NextResponse.json({
      success: true,
      banner: updated,
      message: 'تم حفظ إعدادات صفحة تسجيل الدخول بنجاح',
    });
  } catch (error: any) {
    console.error('Error updating owner login banner settings:', error);
    return NextResponse.json({ error: 'فشل حفظ إعدادات صفحة تسجيل الدخول' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
