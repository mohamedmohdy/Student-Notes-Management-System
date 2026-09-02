'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Clock, ChevronLeft } from 'lucide-react';
import { Note } from '@/lib/types';
import { formatDateArabic } from '@/lib/utils';
import { Badge } from '../UI/Badge';

export interface RecentActivityProps {
  recentNotes?: Note[];
}

export function RecentActivity({ recentNotes = [] }: RecentActivityProps) {
  const hasNotes = recentNotes.length > 0;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
              أحدث النشاطات والملاحظات
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              آخر ما تم تسجيله لطلاب فصولك
            </p>
          </div>
        </div>

        <Link
          href="/notes"
          aria-label="عرض سجل الملاحظات الكامل"
          className="inline-flex items-center gap-1 px-2.5 py-2 min-h-[44px] text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline rounded-xl"
        >
          <span>سجل الملاحظات</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {hasNotes ? (
        <div className="space-y-2.5">
          {recentNotes.map((n) => (
            <div
              key={n.id}
              className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/students/${n.student_id}`}
                  aria-label={`الملف الأكاديمي للطالب ${n.student_name || 'طالب'}`}
                  className="text-xs font-black text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                >
                  {n.student_name || 'طالب'}
                </Link>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                  {formatDateArabic(n.created_at)}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {n.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-slate-600 dark:text-slate-400">
          لم يتم تسجيل أي ملاحظات مؤخراً.
        </div>
      )}
    </div>
  );
}
