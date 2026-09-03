import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../supabase';
import { ClassRoom } from '../types';
import { toNum, toBool } from './base';

export const ClassRepository = {
  findById: async (id: string, teacherId: string, client?: any): Promise<ClassRoom | null> => {
    return ClassRepository.getById(id, teacherId, client);
  },

  getAll: async (options?: { gradeId?: string; includeArchived?: boolean; teacherId: string }, client?: any): Promise<ClassRoom[]> => {
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    const db = client || supabaseAdmin || supabase;
    let query = db
      .from('classes')
      .select(`
        *,
        grades(id, name, archived),
        students(id, archived),
        class_notes(id, archived)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: true });

    if (!options?.includeArchived) {
      query = query.eq('archived', false);
    }
    if (options?.gradeId) {
      query = query.eq('grade_id', options.gradeId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((c: any) => ({
      id: c.id,
      grade_id: c.grade_id,
      grade_name: c.grades?.name,
      teacher_id: c.teacher_id,
      name: c.name,
      archived: toNum(c.archived),
      created_at: c.created_at,
      updated_at: c.updated_at,
      students_count: (c.students || []).filter((s: any) => !toBool(s.archived)).length,
      class_notes_count: (c.class_notes || []).filter((cn: any) => !toBool(cn.archived)).length,
    }));
  },

  getById: async (id: string, teacherId: string, client?: any): Promise<ClassRoom | null> => {
    const db = client || supabaseAdmin || supabase;
    const { data, error } = await db
      .from('classes')
      .select(`
        *,
        grades(id, name),
        students(id, archived),
        class_notes(id, archived)
      `)
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      grade_id: data.grade_id,
      grade_name: data.grades?.name,
      teacher_id: data.teacher_id,
      name: data.name,
      archived: toNum(data.archived),
      created_at: data.created_at,
      updated_at: data.updated_at,
      students_count: (data.students || []).filter((s: any) => !toBool(s.archived)).length,
      class_notes_count: (data.class_notes || []).filter((cn: any) => !toBool(cn.archived)).length,
    };
  },

  create: async (
    dataOrGradeId: string | { grade_id?: string; gradeId?: string; name: string; teacher_id?: string; teacherId?: string },
    nameArg?: string,
    teacherIdArg?: string,
    client?: SupabaseClient
  ): Promise<ClassRoom> => {
    const sb = client || supabaseAdmin || supabase;
    const now = new Date().toISOString();
    let gradeId = '';
    let name = '';
    let teacherId = '';

    if (typeof dataOrGradeId === 'object') {
      gradeId = dataOrGradeId.grade_id || dataOrGradeId.gradeId || '';
      name = dataOrGradeId.name || '';
      teacherId = dataOrGradeId.teacher_id || dataOrGradeId.teacherId || '';
    } else {
      gradeId = dataOrGradeId;
      name = nameArg || '';
      teacherId = teacherIdArg || '';
    }

    const { data: inserted, error } = await sb
      .from('classes')
      .insert({
        teacher_id: teacherId,
        grade_id: gradeId,
        name: name.trim(),
        archived: false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    if (!inserted) throw new Error('Failed to create class');
    return (await ClassRepository.getById(inserted.id, teacherId, sb))!;
  },

  update: async (id: string, name: string, teacherId: string, client?: any): Promise<ClassRoom | null> => {
    const db = client || supabaseAdmin || supabase;
    const now = new Date().toISOString();
    const { error } = await db
      .from('classes')
      .update({ name: name.trim(), updated_at: now })
      .eq('id', id)
      .eq('teacher_id', teacherId);

    if (error) return null;
    return ClassRepository.getById(id, teacherId, db);
  },

  archive: async (id: string, teacherId: string, client?: any): Promise<boolean> => {
    return ClassRepository.setArchived(id, true, teacherId, client);
  },

  setArchived: async (id: string, archived: boolean, teacherId: string, client?: any): Promise<boolean> => {
    const db = client || supabaseAdmin || supabase;
    const now = new Date().toISOString();
    const { data, error } = await db
      .from('classes')
      .update({ archived, updated_at: now })
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .select('id');

    return !error && Array.isArray(data) && data.length > 0;
  },

  restore: async (id: string, teacherId: string, client?: any): Promise<boolean> => {
    return ClassRepository.setArchived(id, false, teacherId, client);
  },

  delete: async (id: string, teacherId: string, client?: any): Promise<void> => {
    const db = client || supabaseAdmin || supabase;
    await db.from('classes').delete().eq('id', id).eq('teacher_id', teacherId);
  },
};
