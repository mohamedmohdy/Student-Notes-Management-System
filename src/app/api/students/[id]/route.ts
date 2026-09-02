import { NextRequest, NextResponse } from 'next/server';
import { StudentRepository, NoteRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { getSupabaseUserClient } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const student = await StudentRepository.findById(params.id, authCheck.user.userId, client);
    if (!student) {
      return NextResponse.json({ error: 'الطالب غير موجود أو غير تابع لحسابك' }, { status: 404 });
    }

    const notes = await NoteRepository.getAll({ studentId: params.id, teacherId: authCheck.user.userId }, client);
    return NextResponse.json({ student, notes });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب بيانات الطالب' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const body = await request.json();
    const student = await StudentRepository.update(params.id, body, authCheck.user.userId, client);
    if (!student) {
      return NextResponse.json({ error: 'الطالب غير موجود أو غير تابع لحسابك' }, { status: 404 });
    }

    return NextResponse.json({ student, message: 'تم تحديث بيانات الطالب بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث بيانات الطالب' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const client = getSupabaseUserClient(authCheck.user.supabaseAccessToken);
    const ok = await StudentRepository.setArchived(params.id, true, authCheck.user.userId, client);
    if (!ok) {
      return NextResponse.json({ error: 'الطالب غير موجود أو غير تابع لحسابك' }, { status: 404 });
    }

    return NextResponse.json({ message: 'تم أرشفة الطالب بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: 'حدث خطأ أثناء أرشفة الطالب' }, { status: 500 });
  }
}
