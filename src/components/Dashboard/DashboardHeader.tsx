'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, BarChart3, Calendar, Sparkles } from 'lucide-react';
import { Button } from '../UI/Button';

export interface DashboardHeaderProps {
  teacherName?: string;
  totalStudents?: number;
  onOpenAddNote: () => void;
}

export function DashboardHeader({
  teacherName = 'أستاذنا الفاضل',
  totalStudents = 0,
  onOpenAddNote,
}: DashboardHeaderProps) {
  const todayArabic = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-tr from-indigo-900 via-indigo-800 to-slate-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 text-white border border-indigo-700/30 shadow-sm relative overflow-hidden">
      {/* Subtle institutional backdrop glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-bold border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>مساحة العمل اليومية</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-200/90">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayArabic}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-snug">
            أهلاً بك يا {teacherName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80 font-medium max-w-xl">
            إليك ملخص النشاط اليومي لفصولك وطلابك ({totalStudents} طالباً). يمكنك تدوين الملاحظات ومتابعة الحالات مباشرة.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenAddNote}
            aria-label="تدوين ملاحظة سريعة"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 min-h-[44px] rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 dark:text-slate-950 font-black text-xs sm:text-sm shadow-sm border border-white transition-all duration-150 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-900 select-none cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-700 shrink-0 stroke-[2.5]" />
            <span className="text-slate-900 dark:text-slate-950 font-black truncate">تدوين ملاحظة</span>
          </button>

          <Link
            href="/reports"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition active:scale-[0.98]"
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>التقارير</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
