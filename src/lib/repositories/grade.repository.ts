import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../supabase';
import { Grade } from '../types';
import { toNum, toBool } from './base';

export const GradeRepository = {
  findById: async (id: string, teacherId: string): Promise<Grade | null> => {
    return GradeRepository.getById(id, teacherId);
  },

  getAll: async (options?: { includeArchived?: boolean; teacherId: string }, client?: any): Promise<Grade[]> => {
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    const db = client || supabase;
    let query = db
      .from('grades')
      .select(`
        *,
        classes(id, archived)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: true });

    if (!options?.includeArchived) {
      query = query.eq('archived', false);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((g: any) => ({
      id: g.id,
      name: g.name,
      teacher_id: g.teacher_id,
      archived: toNum(g.archived),
      created_at: g.created_at,
      updated_at: g.updated_at,
      classes_count: (g.classes || []).filter((c: any) => !toBool(c.archived)).length,
    }));
  },

  getById: async (id: string, teacherId: string): Promise<Grade | null> => {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      archived: toNum(data.archived),
    };
  },

  create: async (name: string, teacherId: string, client?: SupabaseClient): Promise<Grade> => {
    const sb = client || supabase;
    const now = new Date().toISOString();
    const { data, error } = await sb
      .from('grades')
      .insert({
        teacher_id: teacherId,
        name: name.trim(),
        archived: false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create grade');
    return {
      ...data,
      archived: toNum(data.archived),
    };
  },

  update: async (id: string, name: string, teacherId: string): Promise<Grade | null> => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('grades')
      .update({ name: name.trim(), updated_at: now })
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      archived: toNum(data.archived),
    };
  },

  archive: async (id: string, teacherId: string): Promise<boolean> => {
    return GradeRepository.setArchived(id, true, teacherId);
  },

  setArchived: async (id: string, archived: boolean, teacherId: string): Promise<boolean> => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('grades')
      .update({ archived, updated_at: now })
      .eq('id', id)
      .eq('teacher_id', teacherId);

    return !error;
  },

  restore: async (id: string, teacherId: string): Promise<boolean> => {
    return GradeRepository.setArchived(id, false, teacherId);
  },

  delete: async (id: string, teacherId: string): Promise<void> => {
    await supabase.from('grades').delete().eq('id', id).eq('teacher_id', teacherId);
  },
};
