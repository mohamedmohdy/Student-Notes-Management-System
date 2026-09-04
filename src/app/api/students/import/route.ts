import { NextRequest, NextResponse } from 'next/server';
import { StudentRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { parseJsonWithLimit } from '@/lib/security/request-size-limiter';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request, 'EXPORT');
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    // Server-side Request Body Size Limit (EXCEL_IMPORT: 5 MB cap)
    const { data: body, errorResponse } = await parseJsonWithLimit<{ students?: any[]; classId?: string }>(
      request,
      'EXCEL_IMPORT'
    );
    if (errorResponse) return errorResponse;

    let { students, classId } = body || {};

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
    console.error('Import students server error:', error);
    return NextResponse.json({
      error: error.message || 'حدث خطأ أثناء استيراد الطلاب من الملف',
      code: error.code || null,
      details: error.details || null,
    }, { status: 500 });
  }
}

