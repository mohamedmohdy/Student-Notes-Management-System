import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import { getAuthenticatedOwnerClient } from '@/lib/supabase';
import { UserStatus } from '@/lib/types';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const ownerClient = await getAuthenticatedOwnerClient(authCheck.user.supabaseAccessToken);
    const teacher = await UserRepository.findById(params.id, ownerClient);
    if (!teacher) {
      return NextResponse.json({ error: 'لم يتم العثور على المعلم' }, { status: 404 });
    }

    return NextResponse.json({ teacher });
  } catch (error: any) {
    console.error('Get teacher error:', error);
    return NextResponse.json({
      error: error.message || 'حدث خطأ أثناء جلب بيانات المعلم',
      details: error.details || null,
      code: error.code || null,
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const ownerClient = await getAuthenticatedOwnerClient(authCheck.user.supabaseAccessToken);
    const teacher = await UserRepository.findById(params.id, ownerClient);
    if (!teacher) {
      return NextResponse.json({ error: 'لم يتم العثور على المعلم' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, status } = body;

    if (email && email.trim().toLowerCase() !== teacher.email.toLowerCase()) {
      const existing = await UserRepository.findByEmail(email);
      if (existing && existing.id !== teacher.id) {
        return NextResponse.json({ error: 'البريد الإلكتروني الجديد مسجل مسبقاً لمستخدم آخر' }, { status: 400 });
      }
    }

    const updated = await UserRepository.updateTeacherProfile(params.id, {
      name: name?.trim(),
      email: email?.trim(),
      status: status as UserStatus,
    }, ownerClient);

    // Log the audit event
    await UserRepository.logActivity(
      authCheck.user.userId,
      'UPDATE_TEACHER',
      `المالك قام بتحديث بيانات المعلم: ${teacher.name} (${teacher.email})`
    );

    return NextResponse.json({
      teacher: updated,
      message: 'تم تحديث بيانات المعلم بنجاح',
    });
  } catch (error: any) {
    console.error('Update teacher error:', error);
    return NextResponse.json({
      error: error.message || 'حدث خطأ أثناء تحديث بيانات المعلم',
      details: error.details || null,
      code: error.code || null,
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const ownerClient = await getAuthenticatedOwnerClient(authCheck.user.supabaseAccessToken);
    const teacher = await UserRepository.findById(params.id, ownerClient);
    if (!teacher) {
      return NextResponse.json({ error: 'لم يتم العثور على حساب المعلم' }, { status: 404 });
    }

    if (teacher.role === 'OWNER' || teacher.role === 'owner') {
      return NextResponse.json({ error: 'لا يمكن حذف حساب مالك المنصة (Owner)' }, { status: 400 });
    }

    // Permanently delete teacher and cascaded records
    await UserRepository.deleteTeacherPermanent(params.id, ownerClient);

    // Log the security audit event
    await UserRepository.logActivity(
      authCheck.user.userId,
      'DELETE_TEACHER_PERMANENT',
      `المالك قام بحذف المعلم (${teacher.name} - ${teacher.email}) نهائياً مع كافة فصوله وطلابه وملاحظاته`
    );

    return NextResponse.json({
      success: true,
      deletedTeacherId: params.id,
      deletedTeacherName: teacher.name,
      deletedTeacherEmail: teacher.email,
      message: `تم حذف حساب المعلم (${teacher.name}) وجميع السجلات المرتبطة به نهائياً بنجاح`,
    });
  } catch (error: any) {
    console.error('Delete teacher permanent error:', error);
    return NextResponse.json({
      error: error.message || 'حدث خطأ أثناء حذف حساب المعلم',
      details: error.details || null,
      code: error.code || null,
    }, { status: 500 });
  }
}
