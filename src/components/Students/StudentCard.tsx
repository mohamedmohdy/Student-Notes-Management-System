'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ChevronLeft } from 'lucide-react';
import { Student } from '@/lib/types';
import { StudentStatusBadge } from './StudentStatusBadge';

export interface StudentCardProps {
  student: Student;
  onQuickNote?: (student: Student) => void;
}

export function StudentCard({ student, onQuickNote }: StudentCardProps) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-150 flex flex-col justify-between gap-4 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-sm sm:text-base flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 shrink-0 group-hover:scale-105 transition-transform duration-150">
            {student.name.charAt(0)}
          </div>
          <div className="truncate space-y-0.5">
            <Link
              href={`/students/${student.id}`}
              className="text-sm font-black text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block transition-colors"
            >
              {student.name}
            </Link>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">
              #{student.student_number || 'بدون رقم'} • {student.grade_name || 'الصف'} - {student.class_name || 'الفصل'}
            </p>
          </div>
        </div>

        <StudentStatusBadge status={student.status} />
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {onQuickNote ? (
          <button
            type="button"
            onClick={() => onQuickNote(student)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ملاحظة</span>
          </button>
        ) : <div />}

        <Link
          href={`/students/${student.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <span>عرض الملف</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
