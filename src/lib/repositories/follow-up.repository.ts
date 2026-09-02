import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../supabase';
import { FollowUp, FollowUpStatus } from '../types';
import { toNum, toBool } from './base';

export const FollowUpRepository = {
  getAll: async (options?: {
    studentId?: string;
    status?: FollowUpStatus;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    teacherId: string;
  }, client?: SupabaseClient): Promise<FollowUp[]> => {
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    const db = client || supabaseAdmin || supabase;
    let query = db
      .from('follow_ups')
      .select(`
        *,
        students(id, name, student_number, class_id, classes(id, name, grade_id, grades(id, name))),
        notes(id, content, type, priority, action_taken)
      `)
      .eq('teacher_id', teacherId)
      .order('follow_up_date', { ascending: true });

    if (options?.studentId) {
      query = query.eq('student_id', options.studentId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.limit !== undefined) {
      const from = options.offset || 0;
      query = query.range(from, from + options.limit - 1);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((f: any) => ({
      id: f.id,
      note_id: f.note_id,
      student_id: f.student_id,
      student_name: f.students?.name,
      student_number: f.students?.student_number,
      class_name: f.students?.classes?.name,
      grade_name: f.students?.classes?.grades?.name,
      teacher_id: f.teacher_id,
      follow_up_date: f.follow_up_date,
      status: f.status,
      result: f.result,
      additional_notes: f.additional_notes,
      note_content: f.notes?.content,
      note_type: f.notes?.type,
      note_priority: f.notes?.priority,
      action_taken: f.notes?.action_taken,
      created_at: f.created_at,
      updated_at: f.updated_at,
    }));
  },

  findById: async (id: string, teacherId: string, client?: any): Promise<FollowUp | null> => {
    return FollowUpRepository.getById(id, teacherId, client);
  },

  resolve: async (id: string, result: string, teacherId: string, client?: any): Promise<FollowUp | null> => {
    return FollowUpRepository.updateStatus(id, 'completed', result, undefined, teacherId, client);
  },

  getById: async (id: string, teacherId: string, client?: any): Promise<FollowUp | null> => {
    const db = client || supabaseAdmin || supabase;
    const { data, error } = await db
      .from('follow_ups')
      .select(`
        *,
        students(id, name, student_number, class_id, classes(id, name, grade_id, grades(id, name))),
        notes(id, content, type, priority, action_taken)
      `)
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      note_id: data.note_id,
      student_id: data.student_id,
      student_name: data.students?.name,
      student_number: data.students?.student_number,
      class_name: data.students?.classes?.name,
      grade_name: data.students?.classes?.grades?.name,
      teacher_id: data.teacher_id,
      follow_up_date: data.follow_up_date,
      status: data.status,
      result: data.result,
      additional_notes: data.additional_notes,
      note_content: data.notes?.content,
      note_type: data.notes?.type,
      note_priority: data.notes?.priority,
      action_taken: data.notes?.action_taken,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  create: async (data: { noteId: string; studentId: string; followUpDate: string; teacherId: string }, client?: SupabaseClient): Promise<FollowUp> => {
    const sb = client || supabaseAdmin || supabase;
    const now = new Date().toISOString();
    const followUpDate = data.followUpDate.includes('T') ? data.followUpDate.split('T')[0] : data.followUpDate;

    const { data: inserted, error } = await sb
      .from('follow_ups')
      .insert({
        teacher_id: data.teacherId,
        note_id: data.noteId,
        student_id: data.studentId,
        follow_up_date: followUpDate,
        status: 'pending',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error || !inserted) throw error || new Error('Failed to create follow-up');
    return (await FollowUpRepository.getById(inserted.id, data.teacherId, sb))!;
  },

  updateStatus: async (id: string, status: FollowUpStatus, result?: string, additionalNotes?: string, teacherId?: string, client?: any): Promise<FollowUp | null> => {
    const db = client || supabaseAdmin || supabase;
    const now = new Date().toISOString();
    const updatePayload: any = {
      status,
      result: result?.trim() || null,
      additional_notes: additionalNotes?.trim() || null,
      updated_at: now,
    };

    let query = db.from('follow_ups').update(updatePayload).eq('id', id);
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    const { error } = await query;
    if (error) return null;

    return teacherId ? FollowUpRepository.getById(id, teacherId, db) : null;
  },
};
