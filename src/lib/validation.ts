import { NoteType, NotePriority, StudentStatus } from './types';

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}

const ALLOWED_NOTE_TYPES: readonly NoteType[] = [
  'academic',
  'behavioral',
  'participation',
  'skill',
  'positive',
  'needs_followup',
  'other',
];
const ALLOWED_NOTE_PRIORITIES: readonly NotePriority[] = ['low', 'medium', 'high'];
const ALLOWED_STUDENT_STATUSES: readonly StudentStatus[] = ['normal', 'excellent', 'needs_followup'];

export function sanitizeString(val: any, maxLength = 1000): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLength);
}

export function validateStudentInput(body: any): ValidationResult<{
  name: string;
  studentNumber: string;
  classId: string;
  status: StudentStatus;
  photo?: string;
}> {
  const errors: string[] = [];
  const name = sanitizeString(body?.name, 100);
  const studentNumber = sanitizeString(body?.student_number || body?.studentNumber, 50);
  const classId = sanitizeString(body?.class_id || body?.classId, 100);
  const rawStatus = body?.status;
  const photo = typeof body?.photo === 'string' && body.photo.startsWith('data:image') ? body.photo : undefined;

  if (!name || name.length < 2) {
    errors.push('اسم الطالب يجب أن يتكون من حرفين على الأقل');
  }
  if (!classId) {
    errors.push('تحديد الفصل الدراسي مطلوب');
  }

  let status: StudentStatus = 'normal';
  if (rawStatus && ALLOWED_STUDENT_STATUSES.includes(rawStatus)) {
    status = rawStatus;
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      name,
      studentNumber,
      classId,
      status,
      photo,
    },
  };
}

export function validateNoteInput(body: any): ValidationResult<{
  studentId: string;
  type: NoteType;
  priority: NotePriority;
  content: string;
  actionTaken?: string;
  requiresFollowUp: boolean;
  followUpDate?: string;
}> {
  const errors: string[] = [];
  const studentId = sanitizeString(body?.student_id || body?.studentId, 100);
  const content = sanitizeString(body?.content, 2000);
  const actionTaken = sanitizeString(body?.action_taken || body?.actionTaken, 1000);
  const rawType = body?.type;
  const rawPriority = body?.priority;
  const requiresFollowUp = Boolean(body?.requires_follow_up ?? body?.requiresFollowUp);
  const followUpDate = body?.follow_up_date || body?.followUpDate ? sanitizeString(body?.follow_up_date || body?.followUpDate, 50) : undefined;

  if (!studentId) {
    errors.push('تحديد الطالب مطلوب');
  }
  if (!content || content.length < 2) {
    errors.push('نص الملاحظة مطلوب ويجب ألا يقل عن حرفين');
  }

  let type: NoteType = 'academic';
  if (rawType && ALLOWED_NOTE_TYPES.includes(rawType)) {
    type = rawType;
  }

  let priority: NotePriority = 'medium';
  if (rawPriority && ALLOWED_NOTE_PRIORITIES.includes(rawPriority)) {
    priority = rawPriority;
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      studentId,
      type,
      priority,
      content,
      actionTaken: actionTaken || undefined,
      requiresFollowUp,
      followUpDate,
    },
  };
}

export function validateGradeInput(body: any): ValidationResult<{ name: string }> {
  const errors: string[] = [];
  const name = sanitizeString(body?.name, 100);

  if (!name || name.length < 2) {
    errors.push('اسم الصف الدراسي مطلوب ويجب أن يتكون من حرفين على الأقل');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data: { name } };
}

export function validateClassInput(body: any): ValidationResult<{ gradeId: string; name: string }> {
  const errors: string[] = [];
  const gradeId = sanitizeString(body?.grade_id || body?.gradeId, 100);
  const name = sanitizeString(body?.name, 100);

  if (!gradeId) {
    errors.push('تحديد الصف الدراسي التابع له الفصل مطلوب');
  }
  if (!name || name.length < 1) {
    errors.push('اسم الفصل مطلوب');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data: { gradeId, name } };
}
