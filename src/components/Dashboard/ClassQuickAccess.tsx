'use client';

import React from 'react';
import Link from 'next/link';
import { School, User, Plus } from 'lucide-react';
import { ClassRoom, Student } from '@/lib/types';

export interface ClassQuickAccessProps {
  classes: ClassRoom[];
  students: Student[];
  selectedClassId: string;
  onSelectClassId: (classId: string) => void;
  onQuickNote: (student: Student) => void;
}

export function ClassQuickAccess({
  classes = [],
  students = [],
  selectedClassId,
  onSelectClassId,
  onQuickNote,
}: ClassQuickAccessProps) {
  const filteredStudents = selectedClassId === 'all'
    ? students
    : students.filter((s) => s.class_id === selectedClassId);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <School className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
              فصولي والوصول السريع للطلاب
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              اختر فصلاً للوصول السريع لبطاقة الطالب وإضافة الملاحظات
            </p>
          </div>
        </div>

        {/* Class Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => onSelectClassId('all')}
            className={`px-3 py-1.5 min-h-[44px] rounded-xl text-xs font-bold transition-all duration-150 shrink-0 ${
              selectedClassId === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            جميع الفصول ({students.length})
          </button>
          {classes.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectClassId(c.id)}
              className={`px-3 py-1.5 min-h-[44px] rounded-xl text-xs font-bold transition-all duration-150 shrink-0 ${
                selectedClassId === c.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Students Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto pr-0.5">
        {filteredStudents.map((s) => (
          <div
            key={s.id}
            className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition flex items-center justify-between gap-2.5 group"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                {s.name.charAt(0)}
              </div>
              <div className="truncate">
                <Link
                  href={`/students/${s.id}`}
                  aria-label={`الملف الأكاديمي للطالب ${s.name}`}
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block"
                >
                  {s.name}
                </Link>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{s.class_name} • #{s.student_number}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onQuickNote(s)}
              aria-label={`إضافة ملاحظة سريعة للطالب ${s.name}`}
              className="px-2.5 py-1.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg text-xs font-bold shrink-0 transition"
              title="إضافة ملاحظة سريعة للطالب"
            >
              + ملاحظة
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
