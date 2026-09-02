import { supabase, supabaseAdmin } from '../supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { DashboardStats, NoteType, StudentStatus } from '../types';
import { NoteRepository } from './note.repository';
import { FollowUpRepository } from './follow-up.repository';
import { toNum, toBool } from './base';

export const DashboardRepository = {
  getStats: async (teacherId: string, client?: SupabaseClient): Promise<DashboardStats> => {
    const dbClient = client || supabaseAdmin || supabase;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Parallelized Single-Roundtrip Data Aggregation
    const [
      gradesRes,
      classesRes,
      studentsRes,
      notesRes,
      classNotesRes,
      pendingFollowUpsRes,
      recentNotes,
      urgentFollowUps,
    ] = await Promise.all([
      dbClient.from('grades').select('*', { count: 'exact', head: true }).eq('teacher_id', teacherId).eq('archived', false),
      dbClient.from('classes').select('id, name, grade_id, grades!inner(name)').eq('teacher_id', teacherId).eq('archived', false),
      dbClient.from('students').select('id, class_id, status').eq('teacher_id', teacherId).eq('archived', false),
      dbClient.from('notes').select('id, type, created_at, student_id, students!inner(class_id)').eq('teacher_id', teacherId).eq('archived', false),
      dbClient.from('class_notes').select('*', { count: 'exact', head: true }).eq('teacher_id', teacherId).eq('archived', false),
      dbClient.from('follow_ups').select('id, student_id, status').eq('teacher_id', teacherId).eq('status', 'pending'),
      NoteRepository.getAll({ teacherId, limit: 5 }, dbClient),
      FollowUpRepository.getAll({ teacherId, status: 'pending', limit: 5 }, dbClient),
    ]);

    const totalGrades = gradesRes.count || 0;
    const classesData = classesRes.data || [];
    const totalClasses = classesData.length;
    const studentsData = studentsRes.data || [];
    const totalStudents = studentsData.length;
    const notesData = notesRes.data || [];
    const totalNotes = notesData.length;
    const totalClassNotes = classNotesRes.count || 0;

    const pendingFups = pendingFollowUpsRes.data || [];
    const pendingFollowUps = pendingFups.length;
    const studentsNeedingFollowUp = new Set(pendingFups.map((f: any) => f.student_id)).size;

    // In-memory note calculations (0 extra roundtrips)
    let notesToday = 0;
    let notesThisWeek = 0;
    let notesThisMonth = 0;
    const typeCountMap = new Map<string, number>();
    const classCountMap = new Map<string, number>();

    notesData.forEach((n: any) => {
      if (n.created_at >= todayStr + 'T00:00:00Z') notesToday++;
      if (n.created_at >= oneWeekAgo) notesThisWeek++;
      if (n.created_at >= oneMonthAgo) notesThisMonth++;

      typeCountMap.set(n.type, (typeCountMap.get(n.type) || 0) + 1);
      const cId = n.students?.class_id;
      if (cId) classCountMap.set(cId, (classCountMap.get(cId) || 0) + 1);
    });

    const noteTypes: NoteType[] = ['academic', 'behavioral', 'participation', 'skill', 'positive', 'needs_followup', 'other'];
    const typeLabels: Record<NoteType, string> = {
      academic: 'أكاديمية',
      behavioral: 'سلوكية',
      participation: 'مشاركة',
      skill: 'مهارة',
      positive: 'إيجابية',
      needs_followup: 'تحتاج متابعة',
      other: 'أخرى',
    };
    const notesByType = noteTypes.map((type) => ({
      type,
      label: typeLabels[type],
      count: typeCountMap.get(type) || 0,
    }));

    const notesByClass = classesData.map((c: any) => ({
      className: (c.grades?.name || '') + ' - ' + c.name,
      count: classCountMap.get(c.id) || 0,
    }));

    // In-memory student status calculations (0 extra roundtrips)
    const statusCountMap = new Map<string, number>();
    studentsData.forEach((s: any) => {
      statusCountMap.set(s.status, (statusCountMap.get(s.status) || 0) + 1);
    });

    const statuses: StudentStatus[] = ['excellent', 'normal', 'needs_followup'];
    const statusLabels: Record<StudentStatus, string> = {
      excellent: 'ممتاز',
      normal: 'طبيعي',
      needs_followup: 'يحتاج متابعة',
    };
    const studentsByStatus = statuses.map((status) => ({
      status,
      label: statusLabels[status],
      count: statusCountMap.get(status) || 0,
    }));

    return {
      totalGrades,
      totalClasses,
      totalStudents,
      totalNotes,
      totalClassNotes,
      studentsNeedingFollowUp,
      pendingFollowUps,
      notesToday,
      notesThisWeek,
      notesThisMonth,
      recentNotes,
      urgentFollowUps,
      notesByType,
      notesByClass,
      studentsByStatus,
    };
  },
};
