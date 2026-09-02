import { supabase } from '../supabase';
import { ClassNote, ClassNoteType } from '../types';
import { toNum, toBool } from './base';

export const ClassNoteRepository = {
  getAll: async (options?: {
    classId?: string;
    type?: ClassNoteType;
    startDate?: string;
    endDate?: string;
    search?: string;
    includeArchived?: boolean;
    teacherId: string;
  }): Promise<ClassNote[]> => {
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    let query = supabase
      .from('class_notes')
      .select(`
        *,
        classes!inner(id, name, grade_id, grades!inner(id, name))
      `)
      .eq('teacher_id', teacherId)
      .order('note_date', { ascending: false });

    if (!options?.includeArchived) {
      query = query.eq('archived', false);
    }
    if (options?.classId) {
      query = query.eq('class_id', options.classId);
    }
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.startDate) {
      query = query.gte('note_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('note_date', options.endDate);
    }
    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((cn: any) => ({
      id: cn.id,
      teacher_id: cn.teacher_id,
      class_id: cn.class_id,
      class_name: cn.classes?.name,
      grade_id: cn.classes?.grades?.id,
      grade_name: cn.classes?.grades?.name,
      title: cn.title,
      content: cn.content,
      type: cn.type,
      note_date: cn.note_date,
      archived: toNum(cn.archived),
      created_at: cn.created_at,
      updated_at: cn.updated_at,
    }));
  },

  getById: async (id: string, teacherId: string): Promise<ClassNote | null> => {
    const { data, error } = await supabase
      .from('class_notes')
      .select(`
        *,
        classes!inner(id, name, grade_id, grades!inner(id, name))
      `)
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      teacher_id: data.teacher_id,
      class_id: data.class_id,
      class_name: data.classes?.name,
      grade_id: data.classes?.grades?.id,
      grade_name: data.classes?.grades?.name,
      title: data.title,
      content: data.content,
      type: data.type,
      note_date: data.note_date,
      archived: toNum(data.archived),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  create: async (data: {
    teacherId: string;
    classId: string;
    title?: string;
    content: string;
    type?: ClassNoteType;
    noteDate?: string;
  }): Promise<ClassNote> => {
    const now = new Date().toISOString();
    const noteDate = data.noteDate || now.split('T')[0];

    const { data: inserted, error } = await supabase
      .from('class_notes')
      .insert({
        teacher_id: data.teacherId,
        class_id: data.classId,
        title: data.title?.trim() || null,
        content: data.content.trim(),
        type: data.type || 'general',
        note_date: noteDate,
        archived: false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error || !inserted) throw error || new Error('Failed to create class note');
    return (await ClassNoteRepository.getById(inserted.id, data.teacherId))!;
  },

  update: async (
    id: string,
    teacherId: string,
    data: {
      title?: string;
      content?: string;
      type?: ClassNoteType;
      noteDate?: string;
    }
  ): Promise<ClassNote | null> => {
    const now = new Date().toISOString();
    const updatePayload: any = { updated_at: now };
    if (data.title !== undefined) updatePayload.title = data.title.trim() || null;
    if (data.content !== undefined) updatePayload.content = data.content.trim();
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.noteDate !== undefined) updatePayload.note_date = data.noteDate;

    const { error } = await supabase
      .from('class_notes')
      .update(updatePayload)
      .eq('id', id)
      .eq('teacher_id', teacherId);

    if (error) return null;
    return ClassNoteRepository.getById(id, teacherId);
  },

  delete: async (id: string, teacherId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('class_notes')
      .delete()
      .eq('id', id)
      .eq('teacher_id', teacherId);

    return !error;
  },
};
