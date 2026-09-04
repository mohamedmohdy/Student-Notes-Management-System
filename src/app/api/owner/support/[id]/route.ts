import { NextRequest, NextResponse } from 'next/server';
import { SupportTicketRepository } from '@/lib/db';
import { requireOwner } from '@/lib/auth';
import { sendSupportTicketStatusUpdateEmail } from '@/lib/email';
import { TICKET_STATUS_LABELS } from '@/lib/utils';
import { SupportTicketStatus } from '@/lib/types';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const ticket = await SupportTicketRepository.getByIdForOwner(params.id);
    if (!ticket) {
      return NextResponse.json({ error: 'التذكرة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error('Error getting owner ticket:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب التذكرة' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireOwner(request);
    if ('error' in authCheck) {
      return NextResponse.json(
        { error: authCheck.error, code: authCheck.code || null },
        { status: authCheck.status, headers: authCheck.headers }
      );
    }

    const body = await request.json();
    const { status, admin_reply } = body;

    const updated = await SupportTicketRepository.updateByOwner(params.id, {
      status,
      adminReply: admin_reply,
    });

    if (!updated) {
      return NextResponse.json({ error: 'التذكرة غير موجودة' }, { status: 404 });
    }

    // Send email update to teacher (asynchronous)
    const statusKey = updated.status as SupportTicketStatus;
    const statusLabel = TICKET_STATUS_LABELS[statusKey]?.label || updated.status;

    sendSupportTicketStatusUpdateEmail({
      ticketNumber: updated.ticket_number,
      teacherName: updated.teacher_name,
      teacherEmail: updated.teacher_email,
      statusLabel,
      adminReply: updated.admin_reply,
    }).catch((err) => console.error('Teacher status update notify failed:', err));

    return NextResponse.json({
      ticket: updated,
      message: 'تم تحديث التذكرة بنجاح وإرسال الإشعار للمعلم.',
    });
  } catch (error: any) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث التذكرة' }, { status: 500 });
  }
}
