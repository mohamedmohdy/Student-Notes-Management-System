import { NextRequest, NextResponse } from 'next/server';
import { rateLimitGuard } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimitGuard(request, 'AUTH', { action: 'register' });
  if (rateLimitResponse) return rateLimitResponse;
  return NextResponse.json(
    {
      error: 'التسجيل الذاتي مغلق. يتم إنشاء وتفعيل حسابات المعلمين حصرياً من قِبل إدارة المنصة (Owner) بعد سداد الرسوم لمرة واحدة (50 ريال).',
    },
    { status: 403 }
  );
}
