import { NextRequest, NextResponse } from 'next/server';
import { StudentRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const body = await request.json();
    let { students, classId } = body;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على بيانات طلاب في الملف' }, { status: 400 });
    }

    if (classId) {
      students = students.map((s) => ({
        ...s,
        class_id: s.class_id || s.classId || classId,
      }));
    }

    const count = await StudentRepository.importBatch(students, authCheck.user.userId);
    return NextResponse.json({
      count,
      message: `تم استيراد وإضافة ${count} طالباً بنجاح في فصولك!`,
    });
  } catch (error: any) {
    console.error('Import students error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء استيراد الطلاب من الملف' }, { status: 500 });
  }
}
