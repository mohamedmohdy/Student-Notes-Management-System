'use client';

import React from 'react';
import { Student, StudentStatus } from '@/lib/types';
import { STUDENT_STATUS_LABELS } from '@/lib/utils';

export interface StudentOverviewProps {
  student: Student;
  notesCount: number;
  onStatusChange: (status: StudentStatus) => void;
}

export function StudentOverview({
  student,
  notesCount,
  onStatusChange,
}: StudentOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الملاحظات:</span>
        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
          {student.notes_count || notesCount} ملاحظة
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">مرات المتابعة:</span>
        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
          {student.follow_ups_count || 0} متابعة
        </span>
      </div>

      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">الحالة:</span>
        <select
          value={student.status}
          onChange={(e) => onStatusChange(e.target.value as StudentStatus)}
          className="min-h-[36px] px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
        >
          {Object.entries(STUDENT_STATUS_LABELS).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
