import { NextRequest, NextResponse } from 'next/server';
import { SupportTicketRepository } from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { sendSupportTicketEmailToAdmin } from '@/lib/email';
import { TICKET_CATEGORY_LABELS } from '@/lib/utils';
import { SupportTicketCategory } from '@/lib/types';
import { parseJsonWithLimit } from '@/lib/security/request-size-limiter';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const teacherId = authCheck.user.userId;
    const tickets = await SupportTicketRepository.getAllForTeacher(teacherId);

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تذاكر الدعم الفني' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const user = authCheck.user;
    
    // Server-side Request Body Size Limit (SUPPORT_TICKET: 2 MB cap)
    const { data: body, errorResponse } = await parseJsonWithLimit(request, 'SUPPORT_TICKET');
    if (errorResponse) return errorResponse;

    const category = body?.category || body?.type || body?.priority || 'general';
    const subject = body?.subject || body?.title;
    const description = body?.description || body?.message || body?.content;
    const attachment_url = body?.attachment_url || body?.attachmentUrl;

    if (!subject || !subject.trim() || !description || !description.trim()) {
      return NextResponse.json(
        { error: 'يرجى اختيار نوع المشكلة وكتابة العنوان والوصف التفصيلي' },
        { status: 400 }
      );
    }

    const categoryKey = category as SupportTicketCategory;
    const categoryLabel = TICKET_CATEGORY_LABELS[categoryKey]?.label || category;

    const ticket = await SupportTicketRepository.create({
      teacherId: user.userId,
      teacherName: user.name,
      teacherEmail: user.email,
      category,
      subject: subject.trim(),
      description: description.trim(),
      attachmentUrl: attachment_url || null,
    });

    sendSupportTicketEmailToAdmin({
      ticketNumber: ticket.ticket_number,
      teacherName: ticket.teacher_name,
      teacherEmail: ticket.teacher_email,
      category: categoryLabel,
      subject: ticket.subject,
      description: ticket.description,
      attachmentUrl: ticket.attachment_url,
      createdAt: ticket.created_at,
    }).catch((err) => console.error('Admin email notify failed:', err));

    return NextResponse.json({
      ticket,
      message: 'تم إرسال طلب الدعم الفني بنجاح، وسيتم مراجعته من إدارة المنصة فورياً.',
    });
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال تذكرة الدعم الفني' }, { status: 500 });
  }
}
