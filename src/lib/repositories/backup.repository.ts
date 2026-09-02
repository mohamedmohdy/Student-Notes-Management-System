import { supabase } from '../supabase';
import { GradeRepository } from './grade.repository';
import { ClassRepository } from './class.repository';
import { StudentRepository } from './student.repository';
import { NoteRepository } from './note.repository';
import { FollowUpRepository } from './follow-up.repository';
import { toBool } from './base';

import { ClassNoteRepository } from './class-note.repository';

export const BackupRepository = {
  exportAll: async (teacherId?: string) => {
    if (teacherId) {
      return {
        grades: await GradeRepository.getAll({ includeArchived: true, teacherId }),
        classes: await ClassRepository.getAll({ includeArchived: true, teacherId }),
        students: await StudentRepository.getAll({ includeArchived: true, teacherId }),
        notes: await NoteRepository.getAll({ includeArchived: true, teacherId }),
        classNotes: await ClassNoteRepository.getAll({ includeArchived: true, teacherId }),
        followUps: await FollowUpRepository.getAll({ teacherId }),
        exportedAt: new Date().toISOString(),
      };
    }
    return {
      grades: (await supabase.from('grades').select('*')).data || [],
      classes: (await supabase.from('classes').select('*')).data || [],
      students: (await supabase.from('students').select('*')).data || [],
      notes: (await supabase.from('notes').select('*')).data || [],
      classNotes: (await supabase.from('class_notes').select('*')).data || [],
      followUps: (await supabase.from('follow_ups').select('*')).data || [],
      exportedAt: new Date().toISOString(),
    };
  },

  resetAllData: async (teacherId?: string) => {
    if (teacherId) {
      await supabase.from('follow_ups').delete().eq('teacher_id', teacherId);
      await supabase.from('class_notes').delete().eq('teacher_id', teacherId);
      await supabase.from('notes').delete().eq('teacher_id', teacherId);
      await supabase.from('students').delete().eq('teacher_id', teacherId);
      await supabase.from('classes').delete().eq('teacher_id', teacherId);
      await supabase.from('grades').delete().eq('teacher_id', teacherId);
    }
  },

  importAll: async (data: any, teacherId?: string) => {
    const now = new Date().toISOString();

    if (data.grades && Array.isArray(data.grades)) {
      for (const g of data.grades) {
        const tId = teacherId || g.teacher_id;
        await supabase.from('grades').upsert({
          id: g.id,
          teacher_id: tId,
          name: g.name,
          archived: toBool(g.archived),
          created_at: g.created_at || now,
          updated_at: now,
        });
      }
    }

    if (data.classes && Array.isArray(data.classes)) {
      for (const c of data.classes) {
        const tId = teacherId || c.teacher_id;
        await supabase.from('classes').upsert({
          id: c.id,
          teacher_id: tId,
          grade_id: c.grade_id,
          name: c.name,
          archived: toBool(c.archived),
          created_at: c.created_at || now,
          updated_at: now,
        });
      }
    }

    if (data.students && Array.isArray(data.students)) {
      for (const s of data.students) {
        const tId = teacherId || s.teacher_id;
        await supabase.from('students').upsert({
          id: s.id,
          teacher_id: tId,
          class_id: s.class_id,
          student_number: s.student_number,
          name: s.name,
          photo: s.photo || null,
          status: s.status || 'normal',
          archived: toBool(s.archived),
          created_at: s.created_at || now,
          updated_at: now,
        });
      }
    }

    if (data.notes && Array.isArray(data.notes)) {
      for (const n of data.notes) {
        const tId = teacherId || n.teacher_id;
        await supabase.from('notes').upsert({
          id: n.id,
          teacher_id: tId,
          student_id: n.student_id,
          type: n.type || 'academic',
          priority: n.priority || 'medium',
          content: n.content,
          action_taken: n.action_taken || null,
          requires_follow_up: toBool(n.requires_follow_up),
          archived: toBool(n.archived),
          created_at: n.created_at || now,
          updated_at: now,
        });
      }
    }

    if (data.classNotes && Array.isArray(data.classNotes)) {
      for (const cn of data.classNotes) {
        const tId = teacherId || cn.teacher_id;
        await supabase.from('class_notes').upsert({
          id: cn.id,
          teacher_id: tId,
          class_id: cn.class_id,
          title: cn.title || null,
          content: cn.content,
          type: cn.type || 'general',
          note_date: cn.note_date || now.split('T')[0],
          archived: toBool(cn.archived),
          created_at: cn.created_at || now,
          updated_at: now,
        });
      }
    }

    if (data.followUps && Array.isArray(data.followUps)) {
      for (const f of data.followUps) {
        const tId = teacherId || f.teacher_id;
        await supabase.from('follow_ups').upsert({
          id: f.id,
          teacher_id: tId,
          note_id: f.note_id,
          student_id: f.student_id,
          follow_up_date: f.follow_up_date,
          status: f.status || 'pending',
          result: f.result || null,
          additional_notes: f.additional_notes || null,
          created_at: f.created_at || now,
          updated_at: now,
        });
      }
    }
  },
};
