import { NextResponse } from 'next/server';
import { PricingRepository } from '@/lib/db';

export async function GET() {
  try {
    const pricing = await PricingRepository.getPricingInfo();
    return NextResponse.json({ pricing });
  } catch (error: any) {
    console.error('Pricing API error:', error);
    return NextResponse.json({ error: 'فشل جلب بيانات السعر' }, { status: 500 });
  }
}
