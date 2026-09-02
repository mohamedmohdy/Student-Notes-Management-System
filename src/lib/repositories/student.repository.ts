import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../supabase';
import { Student, StudentStatus } from '../types';
import { toNum, toBool } from './base';

export const StudentRepository = {
  findById: async (id: string, teacherId: string, client?: any): Promise<Student | null> => {
    return StudentRepository.getById(id, teacherId, client);
  },

  getAll: async (options?: {
    gradeId?: string;
    classId?: string;
    status?: StudentStatus;
    search?: string;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
    teacherId: string;
  }, client?: any): Promise<Student[]> => {
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    const db = client || supabaseAdmin || supabase;
    let query = db
      .from('students')
      .select(`
        *,
        classes(id, name, grade_id, grades(id, name, archived)),
        notes(id, archived),
        follow_ups(id, status)
      `)
      .eq('teacher_id', teacherId)
      .order('name', { ascending: true });

    if (!options?.includeArchived) {
      query = query.eq('archived', false);
    }
    if (options?.classId) {
      query = query.eq('class_id', options.classId);
    }
    if (options?.gradeId) {
      query = query.eq('classes.grade_id', options.gradeId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,student_number.ilike.%${options.search}%`);
    }
    if (options?.limit !== undefined) {
      const from = options.offset || 0;
      query = query.range(from, from + options.limit - 1);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((s: any) => ({
      id: s.id,
      class_id: s.class_id,
      class_name: s.classes?.name,
      grade_id: s.classes?.grades?.id,
      grade_name: s.classes?.grades?.name,
      teacher_id: s.teacher_id,
      student_number: s.student_number,
      name: s.name,
      photo: s.photo,
      status: s.status,
      archived: toNum(s.archived),
      created_at: s.created_at,
      updated_at: s.updated_at,
      notes_count: (s.notes || []).filter((n: any) => !toBool(n.archived)).length,
      follow_ups_count: (s.follow_ups || []).filter((f: any) => f.status === 'pending').length,
    }));
  },

  getById: async (id: string, teacherId: string, client?: any): Promise<Student | null> => {
    const db = client || supabaseAdmin || supabase;
    const { data, error } = await db
      .from('students')
      .select(`
        *,
        classes(id, name, grade_id, grades(id, name)),
        notes(id, archived),
        follow_ups(id, status)
      `)
      .eq('id', id)
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      class_id: data.class_id,
      class_name: data.classes?.name,
      grade_id: data.classes?.grades?.id,
      grade_name: data.classes?.grades?.name,
      teacher_id: data.teacher_id,
      student_number: data.student_number,
      name: data.name,
      photo: data.photo,
      status: data.status,
      archived: toNum(data.archived),
      created_at: data.created_at,
      updated_at: data.updated_at,
      notes_count: (data.notes || []).filter((n: any) => !toBool(n.archived)).length,
      follow_ups_count: (data.follow_ups || []).filter((f: any) => f.status === 'pending').length,
    };
  },

  create: async (data: { class_id?: string; classId?: string; student_number?: string; studentNumber?: string; name: string; photo?: string; status?: StudentStatus; teacher_id?: string; teacherId?: string }, client?: SupabaseClient): Promise<Student> => {
    const sb = client || supabaseAdmin || supabase;
    const now = new Date().toISOString();
    const teacherId = data.teacherId || data.teacher_id || '';
    const classId = data.classId || data.class_id || '';
    const studentNumber = data.studentNumber || data.student_number || '';

    const { data: inserted, error } = await sb
      .from('students')
      .insert({
        teacher_id: teacherId,
        class_id: classId,
        student_number: studentNumber.trim(),
        name: data.name.trim(),
        photo: data.photo || null,
        status: data.status || 'normal',
        archived: false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    if (!inserted) throw new Error('Failed to create student');
    return (await StudentRepository.getById(inserted.id, teacherId, sb))!;
  },

  importBatch: async (students: any[], teacherId: string, client?: SupabaseClient): Promise<number> => {
    return StudentRepository.bulkCreate(students, teacherId, client);
  },

  bulkCreate: async (students: any[], teacherId: string, client?: SupabaseClient): Promise<number> => {
    if (!students || students.length === 0) return 0;
    const dbClient = client || supabaseAdmin || supabase;
    const now = new Date().toISOString();

    const targetClassId = students[0]?.class_id || students[0]?.classId || '';
    const existingNumbers = new Set<string>();

    if (targetClassId && teacherId) {
      const { data: existing } = await dbClient
        .from('students')
        .select('student_number')
        .eq('teacher_id', teacherId)
        .eq('class_id', targetClassId);

      if (existing) {
        existing.forEach((s: any) => {
          if (s.student_number) existingNumbers.add(String(s.student_number).trim());
        });
      }
    }

    let counter = 100;
    const payload = students
      .map((s) => {
        const name = (s.name || '').toString().trim();
        if (!name) return null;

        const sClassId = s.class_id || s.classId || targetClassId;
        const sTeacherId = s.teacher_id || s.teacherId || teacherId;
        if (!sClassId || !sTeacherId) return null;

        let num = (s.student_number || s.studentNumber || '').toString().trim();
        if (!num) {
          while (existingNumbers.has(String(counter))) {
            counter++;
          }
          num = String(counter++);
        }
        existingNumbers.add(num);

        let status: StudentStatus = 'normal';
        const rawStatus = (s.status || '').toString().toLowerCase();
        if (rawStatus === 'excellent' || rawStatus.includes('ممتاز')) status = 'excellent';
        else if (rawStatus === 'needs_followup' || rawStatus.includes('متابع')) status = 'needs_followup';
        else status = 'normal';

        return {
          teacher_id: sTeacherId,
          class_id: sClassId,
          student_number: num,
          name,
          photo: s.photo || null,
          status,
          archived: false,
          created_at: now,
          updated_at: now,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    if (payload.length === 0) return 0;

    const { data, error } = await dbClient
      .from('students')
      .upsert(payload, { onConflict: 'teacher_id,class_id,student_number' })
      .select();

    if (error) {
      console.error('bulkCreate Supabase error:', error);
      throw error;
    }

    return data ? data.length : payload.length;
  },

  update: async (id: string, data: { name?: string; studentNumber?: string; classId?: string; photo?: string; status?: StudentStatus }, teacherId: string, client?: any): Promise<Student | null> => {
    const db = client || supabaseAdmin || supabase;
    const current = await StudentRepository.getById(id, teacherId, db);
    if (!current) return null;

    const now = new Date().toISOString();
    const updatePayload: any = { updated_at: now };
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.studentNumber !== undefined) updatePayload.student_number = data.studentNumber.trim();
    if (data.classId !== undefined) updatePayload.class_id = data.classId;
    if (data.photo !== undefined) updatePayload.photo = data.photo;
    if (data.status !== undefined) updatePayload.status = data.status;

    const { error } = await db
      .from('students')
      .update(updatePayload)
      .eq('id', id)
      .eq('teacher_id', teacherId);

    if (error) return null;
    return StudentRepository.getById(id, teacherId, db);
  },

  archive: async (id: string, teacherId: string, client?: any): Promise<boolean> => {
    return StudentRepository.setArchived(id, true, teacherId, client);
  },

  setArchived: async (id: string, archived: boolean, teacherId: string, client?: any): Promise<boolean> => {
    const db = client || supabaseAdmin || supabase;
    const now = new Date().toISOString();
    const { error } = await db
      .from('students')
      .update({ archived, updated_at: now })
      .eq('id', id)
      .eq('teacher_id', teacherId);

    return !error;
  },

  restore: async (id: string, teacherId: string, client?: any): Promise<boolean> => {
    return StudentRepository.setArchived(id, false, teacherId, client);
  },

  delete: async (id: string, teacherId: string, client?: any): Promise<void> => {
    const db = client || supabaseAdmin || supabase;
    await db.from('students').delete().eq('id', id).eq('teacher_id', teacherId);
  },
};
