import { FollowUpRepository } from './follow-up.repository';
import { supabase, supabaseAdmin } from '../supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { Note, NoteType, NotePriority } from '../types';
import { toNum, toBool } from './base';

export const NoteRepository = {
  findById: async (id: string, teacherId: string, client?: any): Promise<Note | null> => {
    return NoteRepository.getById(id, teacherId, client);
  },

  getAll: async (options?: {
    studentId?: string;
    classId?: string;
    gradeId?: string;
    type?: NoteType;
    priority?: NotePriority;
    requiresFollowUp?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
    teacherId: string;
    teacherName?: string;
  }, client?: any): Promise<Note[]> => {
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    const db = client || supabaseAdmin || supabase;
    let query = db
      .from('notes')
      .select(`
        *,
        students(id, name, student_number, class_id, classes(id, name, grade_id, grades(id, name)))
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (!options?.includeArchived) {
      query = query.eq('archived', false);
    }
    if (options?.studentId) {
      query = query.eq('student_id', options.studentId);
    }
    if (options?.classId) {
      query = query.eq('students.class_id', options.classId);
    }
    if (options?.gradeId) {
      query = query.eq('students.classes.grade_id', options.gradeId);
    }
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.priority) {
      query = query.eq('priority', options.priority);
    }
    if (options?.requiresFollowUp !== undefined) {
      query = query.eq('requires_follow_up', options.requiresFollowUp);
    }
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    if (options?.search) {
      query = query.or(`content.ilike.%${options.search}%,students.name.ilike.%${options.search}%`);
    }
    if (options?.limit !== undefined) {
      const from = options.offset || 0;
      query = query.range(from, from + options.limit - 1);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((n: any) => ({
      id: n.id,
      student_id: n.student_id,
      student_name: n.students?.name,
      student_number: n.students?.student_number,
      class_id: n.students?.classes?.id,
      class_name: n.students?.classes?.name,
      grade_id: n.students?.classes?.grades?.id,
      grade_name: n.students?.classes?.grades?.name,
      teacher_id: n.teacher_id,
      teacher_name: options?.teacherName || '',
      type: n.type,
      priority: n.priority,
      content: n.content,
      action_taken: n.action_taken,
      requires_follow_up: toNum(n.requires_follow_up),
      archived: toNum(n.archived),
      created_at: n.created_at,
      updated_at: n.updated_at,
    }));
  },

  getById: async (id: string, teacherId: string, client?: any): Promise<Note | null> => {
    const db = client || supabaseAdmin || supabase;
    const { data, error } = await db
      .from('notes')
      .select(`
        *,
        students(id, name, student_number, class_id, classes(id, name, grade_id, grades(id, name))),
        users(id, name)
      `)
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      student_id: data.student_id,
      student_name: data.students?.name,
      student_number: data.students?.student_number,
      class_id: data.students?.classes?.id,
      class_name: data.students?.classes?.name,
      grade_id: data.students?.classes?.grades?.id,
      grade_name: data.students?.classes?.grades?.name,
      teacher_id: data.teacher_id,
      teacher_name: data.users?.name,
      type: data.type,
      priority: data.priority,
      content: data.content,
      action_taken: data.action_taken,
      requires_follow_up: toNum(data.requires_follow_up),
      archived: toNum(data.archived),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  create: async (data: {
    student_id?: string;
    studentId?: string;
    type: NoteType;
    priority: NotePriority;
    content: string;
    action_taken?: string;
    actionTaken?: string;
    requires_follow_up?: boolean;
    requiresFollowUp?: boolean;
    follow_up_date?: string;
    teacher_id?: string;
    teacherId?: string;
  }, client?: SupabaseClient): Promise<Note> => {
    const sb = client || supabaseAdmin || supabase;
    const now = new Date().toISOString();
    const teacherId = data.teacherId || data.teacher_id || '';
    const studentId = data.studentId || data.student_id || '';
    const actionTaken = data.actionTaken || data.action_taken || null;
    const reqFollowUp = data.requiresFollowUp ?? data.requires_follow_up ?? false;

    const { data: inserted, error } = await sb
      .from('notes')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        type: data.type,
        priority: data.priority,
        content: data.content.trim(),
        action_taken: actionTaken?.trim() || null,
        requires_follow_up: Boolean(reqFollowUp),
        archived: false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    if (!inserted) throw new Error('Failed to create note');

    if (reqFollowUp) {
      let followUpDate = data.follow_up_date;
      if (!followUpDate) {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        followUpDate = d.toISOString().split('T')[0];
      } else if (followUpDate.includes('T')) {
        followUpDate = followUpDate.split('T')[0];
      }
      await FollowUpRepository.create({
        noteId: inserted.id,
        studentId,
        followUpDate,
        teacherId,
      }, sb);
    }

    return (await NoteRepository.getById(inserted.id, teacherId, sb))!;
  },

  update: async (
    id: string,
    data: {
      type?: NoteType;
      priority?: NotePriority;
      content?: string;
      actionTaken?: string;
      requiresFollowUp?: boolean;
    },
    teacherId: string,
    client?: any
  ): Promise<Note | null> => {
    const db = client || supabaseAdmin || supabase;
    const current = await NoteRepository.getById(id, teacherId, db);
    if (!current) return null;

    const now = new Date().toISOString();
    const updatePayload: any = { updated_at: now };
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.content !== undefined) updatePayload.content = data.content.trim();
    if (data.actionTaken !== undefined) updatePayload.action_taken = data.actionTaken.trim() || null;
    if (data.requiresFollowUp !== undefined) updatePayload.requires_follow_up = Boolean(data.requiresFollowUp);

    const { error } = await db
      .from('notes')
      .update(updatePayload)
      .eq('id', id)
      .eq('teacher_id', teacherId);

    if (error) return null;
    return NoteRepository.getById(id, teacherId, db);
  },

  archive: async (id: string, teacherId: string, client?: any): Promise<boolean> => {
    return NoteRepository.setArchived(id, true, teacherId, client);
  },

  setArchived: async (id: string, archived: boolean, teacherId: string, client?: any): Promise<boolean> => {
    const db = client || supabaseAdmin || supabase;
    const now = new Date().toISOString();
    const { error } = await db
      .from('notes')
      .update({ archived, updated_at: now })
      .eq('id', id)
      .eq('teacher_id', teacherId);

    return !error;
  },

  restore: async (id: string, teacherId: string, client?: any): Promise<boolean> => {
    return NoteRepository.setArchived(id, false, teacherId, client);
  },

  delete: async (id: string, teacherId: string, client?: any): Promise<void> => {
    const db = client || supabaseAdmin || supabase;
    await db.from('notes').delete().eq('id', id).eq('teacher_id', teacherId);
  },
};
