import { NextRequest, NextResponse } from 'next/server';
import { PricingRepository } from '@/lib/db';
import { rateLimitGuard } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimitGuard(request, 'PUBLIC');
    if (rateLimitResponse) return rateLimitResponse;

    const pricing = await PricingRepository.getPricingInfo();
    return NextResponse.json({ pricing });
  } catch (error: any) {
    console.error('Pricing API error:', error);
    return NextResponse.json({ error: 'فشل جلب بيانات السعر' }, { status: 500 });
  }
}
