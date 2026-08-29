import { NextRequest, NextResponse } from 'next/server';
import { SystemSettingsRepository } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const banner = await SystemSettingsRepository.getLoginBanner();
    return NextResponse.json({ banner });
  } catch (error: any) {
    console.error('Error fetching public login banner:', error);
    return NextResponse.json(
      {
        banner: {
          title: '🎉 عرض الإطلاق الحصري للمعلمين',
          content: 'احصل على التفعيل الكامل للمنظومة لمرة واحدة مدى الحياة بدون أي اشتراكات دورية.',
          priceText: '50 ريال سعودي',
          badgeText: 'عرض خاص',
          isActive: true,
        },
      },
      { status: 200 }
    );
  }
}
