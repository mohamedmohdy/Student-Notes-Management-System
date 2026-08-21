import { NextRequest, NextResponse } from 'next/server';
import { StudentRepository } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

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

    const count = StudentRepository.importBatch(students);
    return NextResponse.json({
      count,
      message: `تم استيراد وإضافة ${count} طالباً بنجاح من ملف Excel!`,
    });
  } catch (error: any) {
    console.error('Import students error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء استيراد الطلاب من الملف' }, { status: 500 });
  }
}
