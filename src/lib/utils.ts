import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NotePriority, NoteType, StudentStatus, FollowUpStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const NOTE_TYPE_LABELS: Record<NoteType, { label: string; bg: string; text: string; border: string }> = {
  academic: { label: 'أكاديمية', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  behavioral: { label: 'سلوكية', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  participation: { label: 'مشاركة', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  skill: { label: 'مهارة', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  positive: { label: 'إيجابية', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  needs_followup: { label: 'تحتاج متابعة', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  other: { label: 'أخرى', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

export const NOTE_PRIORITY_LABELS: Record<NotePriority, { label: string; bg: string; text: string; dot: string }> = {
  low: { label: 'منخفضة', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  medium: { label: 'متوسطة', bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  high: { label: 'عالية', bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500' },
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, { label: string; bg: string; text: string; border: string }> = {
  excellent: { label: 'ممتاز', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  normal: { label: 'طبيعي', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  needs_followup: { label: 'يحتاج متابعة', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
};

export const FOLLOWUP_STATUS_LABELS: Record<FollowUpStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'تحتاج متابعة', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  completed: { label: 'تمت المتابعة', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  still_needs_followup: { label: 'ما زالت تحتاج متابعة', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
};

export function formatDateArabic(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeArabic(dateStr: string | null | undefined): { date: string; time: string } {
  if (!dateStr) return { date: '—', time: '—' };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: '' };
    
    const date = new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }).format(d);

    const time = new Intl.DateTimeFormat('ar-SA', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(d);

    return { date, time };
  } catch {
    return { date: dateStr, time: '' };
  }
}

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
}
