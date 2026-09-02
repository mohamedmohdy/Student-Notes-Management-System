export type UserRole = 'OWNER' | 'TEACHER' | 'owner' | 'teacher';
export type UserStatus = 'pending' | 'active' | 'disabled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  must_change_password?: number;
  onboarding_completed?: number;
  onboarding_skipped?: number;
  onboarding_version?: number;
  onboarding_completed_at?: string | null;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
  students_count?: number;
  notes_count?: number;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  details: string;
  created_at: string;
}

export interface PricingInfo {
  activeCount: number;
  offerLimit: number;
  isOfferActive: boolean;
  remainingSeats: number;
  currentPrice: number;
  offerPrice: number;
  originalPrice: number;
}

export interface LoginBannerSettings {
  title: string;
  content: string;
  priceText: string;
  badgeText: string;
  isActive: boolean;
  updatedAt?: string;
}

export type AnnouncementType = 'general' | 'event' | 'update' | 'warning' | 'tip' | 'offer';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  is_published: number;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  reads_count?: number;
  is_read?: number;
  is_hidden?: number;
}

export interface OwnerStats {
  totalTeachers: number;
  activeTeachers: number;
  pendingTeachers: number;
  disabledTeachers: number;
  totalStudents: number;
  totalNotes: number;
  totalRevenue: number;
  pricing: PricingInfo;
  recentTeachers: User[];
}

export interface Grade {
  id: string;
  name: string;
  teacher_id?: string;
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
  teacher_id?: string;
  name: string;
  archived: number;
  created_at: string;
  updated_at: string;
  students_count?: number;
  class_notes_count?: number;
}

export type StudentStatus = 'excellent' | 'normal' | 'needs_followup';

export interface Student {
  id: string;
  class_id: string;
  class_name?: string;
  grade_id?: string;
  grade_name?: string;
  teacher_id?: string;
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

export type ClassNoteType = 'behavior' | 'engagement' | 'discipline' | 'academic' | 'general';

export interface ClassNote {
  id: string;
  teacher_id: string;
  class_id: string;
  class_name?: string;
  grade_name?: string;
  grade_id?: string;
  title?: string | null;
  content: string;
  type: ClassNoteType;
  note_date: string;
  archived: number;
  created_at: string;
  updated_at: string;
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
  totalClassNotes?: number;
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
  recentActivities?: { id: string; type: string; title: string; desc: string; time: string }[];
}

export type SupportTicketCategory =
  | 'technical'
  | 'login'
  | 'students_data'
  | 'reports'
  | 'ai'
  | 'suggestion'
  | 'inquiry'
  | 'other';

export type SupportTicketStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  teacher_id: string | null;
  teacher_name: string;
  teacher_email: string;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  attachment_url?: string | null;
  status: SupportTicketStatus;
  admin_reply?: string | null;
  admin_replied_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
}
