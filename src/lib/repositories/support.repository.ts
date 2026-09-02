import { supabase } from '../supabase';

export const SupportTicketRepository = {
  create: async (data: {
    teacherId: string;
    teacherName: string;
    teacherEmail: string;
    category: string;
    subject: string;
    description: string;
    attachmentUrl?: string | null;
  }): Promise<any> => {
    const ticketNumber = '#TK-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date().toISOString();

    const { data: inserted, error } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        teacher_id: data.teacherId,
        teacher_name: data.teacherName.trim(),
        teacher_email: data.teacherEmail.trim(),
        category: data.category,
        subject: data.subject.trim(),
        description: data.description.trim(),
        attachment_url: data.attachmentUrl || null,
        status: 'new',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error || !inserted) throw error || new Error('Failed to create ticket');
    return SupportTicketRepository.getByIdForTeacher(inserted.id, data.teacherId);
  },

  getAllForTeacher: async (teacherId: string): Promise<any[]> => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    return data || [];
  },

  getByIdForTeacher: async (ticketId: string, teacherId: string): Promise<any | null> => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('teacher_id', teacherId)
      .maybeSingle();

    return data || null;
  },

  getAllForOwner: async (options?: { status?: string; category?: string; search?: string }): Promise<any[]> => {
    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }
    if (options?.category && options.category !== 'all') {
      query = query.eq('category', options.category);
    }
    if (options?.search) {
      query = query.or(`ticket_number.ilike.%${options.search}%,teacher_name.ilike.%${options.search}%,teacher_email.ilike.%${options.search}%,subject.ilike.%${options.search}%`);
    }

    const { data } = await query;
    return data || [];
  },

  getByIdForOwner: async (ticketId: string): Promise<any | null> => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .maybeSingle();

    return data || null;
  },

  updateByOwner: async (
    ticketId: string,
    data: { status?: string; adminReply?: string }
  ): Promise<any | null> => {
    const existing = await SupportTicketRepository.getByIdForOwner(ticketId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const status = data.status || existing.status;
    const adminReply = data.adminReply !== undefined ? data.adminReply : existing.admin_reply;

    let adminRepliedAt = existing.admin_replied_at;
    if (data.adminReply && data.adminReply !== existing.admin_reply) {
      adminRepliedAt = now;
    }

    let resolvedAt = existing.resolved_at;
    if (status === 'resolved' && existing.status !== 'resolved') {
      resolvedAt = now;
    }

    let closedAt = existing.closed_at;
    if (status === 'closed' && existing.status !== 'closed') {
      closedAt = now;
    }

    const { data: updated } = await supabase
      .from('support_tickets')
      .update({
        status,
        admin_reply: adminReply,
        admin_replied_at: adminRepliedAt,
        resolved_at: resolvedAt,
        closed_at: closedAt,
        updated_at: now,
      })
      .eq('id', ticketId)
      .select()
      .maybeSingle();

    return updated || null;
  },
};

export const SupportRepository = SupportTicketRepository;
