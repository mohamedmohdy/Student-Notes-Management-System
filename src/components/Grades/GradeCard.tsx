'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, Edit2, Trash2, ChevronLeft } from 'lucide-react';
import { Grade } from '@/lib/types';

export interface GradeCardProps {
  grade: Grade;
  onEdit: (grade: Grade) => void;
  onDelete: (grade: Grade) => void;
}

export function GradeCard({ grade, onEdit, onDelete }: GradeCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-150 flex flex-col justify-between space-y-5 group">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <Link
                href={`/grades/${grade.id}`}
                className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition block truncate"
              >
                {grade.name}
              </Link>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">مرحلة دراسية معتمدة</p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={() => onEdit(grade)}
              className="p-2 min-h-[36px] min-w-[36px] text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center justify-center"
              title="تعديل اسم الصف"
              aria-label="تعديل اسم الصف"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(grade)}
              className="p-2 min-h-[36px] min-w-[36px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition flex items-center justify-center"
              title="حذف الصف"
              aria-label="حذف الصف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">عدد الفصول</p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">{grade.classes_count || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">إجمالي الطلاب</p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">{grade.students_count || 0}</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href={`/grades/${grade.id}`}
        className="w-full min-h-[40px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all duration-150 group/btn"
      >
        <span>استعراض فصول الصف</span>
        <ChevronLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
