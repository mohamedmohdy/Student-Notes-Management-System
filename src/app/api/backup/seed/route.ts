import { NextRequest, NextResponse } from 'next/server';
const { seedDatabase } = require('../../../../../scripts/seed.js');
import { requireActiveTeacher } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request, 'BACKUP');
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    seedDatabase();
    return NextResponse.json({ message: 'تم إعادة توليد البيانات التجريبية بنجاح' });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء توليد البيانات' }, { status: 500 });
  }
}
