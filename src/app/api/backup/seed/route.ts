import { NextResponse } from 'next/server';
const { seedDatabase } = require('../../../../../scripts/seed.js');
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    seedDatabase();
    return NextResponse.json({ message: 'تم إعادة توليد البيانات التجريبية بنجاح' });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء توليد البيانات' }, { status: 500 });
  }
}
