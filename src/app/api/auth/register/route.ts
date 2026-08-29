import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'التسجيل الذاتي مغلق. يتم إنشاء وتفعيل حسابات المعلمين حصرياً من قِبل إدارة المنصة (Owner) بعد سداد الرسوم لمرة واحدة (50 ريال).',
    },
    { status: 403 }
  );
}
