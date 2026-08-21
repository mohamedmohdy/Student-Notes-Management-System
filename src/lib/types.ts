export type UserRole = 'teacher' | 'supervisor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  name: string;
  archived: number;
  created_at: string;
  updated_at: string;
  classes_count?: number;
  students_count?: number;
}

export interface ClassRoom {
  id: string;
  grade_id: string;
  grade_name?: string;
  name: string;
  archived: number;
  created_at: string;
  updated_at: string;
  students_count?: number;
}

export type StudentStatus = 'excellent' | 'normal' | 'needs_followup';

export interface Student {
  id: string;
  class_id: string;
  class_name?: string;
  grade_id?: string;
  grade_name?: string;
  student_number: string;
  name: string;
  photo?: string | null;
  status: StudentStatus;
  archived: number;
  created_at: string;
  updated_at: string;
  notes_count?: number;
  follow_ups_count?: number;
  latest_note?: Note | null;
}

export type NoteType =
  | 'academic'
  | 'behavioral'
  | 'participation'
  | 'skill'
  | 'positive'
  | 'needs_followup'
  | 'other';

export type NotePriority = 'low' | 'medium' | 'high';

export interface Note {
  id: string;
  student_id: string;
  student_name?: string;
  student_number?: string;
  class_id?: string;
  class_name?: string;
  grade_id?: string;
  grade_name?: string;
  teacher_id: string;
  teacher_name?: string;
  type: NoteType;
  priority: NotePriority;
  content: string;
  action_taken?: string | null;
  requires_follow_up: number;
  archived: number;
  created_at: string;
  updated_at: string;
  follow_up?: FollowUp | null;
}

export type FollowUpStatus = 'pending' | 'completed' | 'still_needs_followup';

export interface FollowUp {
  id: string;
  note_id: string;
  student_id: string;
  student_name?: string;
  student_number?: string;
  class_name?: string;
  grade_name?: string;
  teacher_id: string;
  teacher_name?: string;
  follow_up_date: string;
  status: FollowUpStatus;
  result?: string | null;
  additional_notes?: string | null;
  note_content?: string;
  note_type?: NoteType;
  note_priority?: NotePriority;
  action_taken?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalGrades: number;
  totalClasses: number;
  totalStudents: number;
  totalNotes: number;
  studentsNeedingFollowUp: number;
  pendingFollowUps: number;
  notesToday: number;
  notesThisWeek: number;
  notesThisMonth: number;
  recentNotes: Note[];
  urgentFollowUps: FollowUp[];
  notesByType: { type: NoteType; label: string; count: number }[];
  notesByClass: { className: string; count: number }[];
  studentsByStatus: { status: StudentStatus; label: string; count: number }[];
}
