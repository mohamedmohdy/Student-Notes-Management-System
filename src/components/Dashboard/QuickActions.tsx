'use client';

import React from 'react';
import Link from 'next/link';
import {
  Plus,
  UserPlus,
  GraduationCap,
  Clock,
  BarChart3,
  FileSpreadsheet,
  LucideIcon,
} from 'lucide-react';

export interface QuickActionsProps {
  onOpenAddNote: () => void;
}

interface ActionItem {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
  href?: string;
}

export function QuickActions({ onOpenAddNote }: QuickActionsProps) {
  const actions: ActionItem[] = [
    {
      label: 'تدوين ملاحظة',
      description: 'إضافة ملاحظة سلوكية أو أكاديمية',
      icon: Plus,
      color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
      onClick: onOpenAddNote,
    },
    {
      label: 'إضافة طالب',
      description: 'تسجيل طالب جديد في فصلك',
      icon: UserPlus,
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
      href: '/students',
    },
    {
      label: 'الصفوف والفصول',
      description: 'تنظيم الشعب والمجموعات',
      icon: GraduationCap,
      color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
      href: '/grades',
    },
    {
      label: 'خطة المتابعة',
      description: 'جدول المتابعات المستمرة',
      icon: Clock,
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
      href: '/follow-ups',
    },
    {
      label: 'تصدير التقارير',
      description: 'طباعة كشوفات Excel و PDF',
      icon: BarChart3,
      color: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
      href: '/reports',
    },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
          وصول سريع
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
          الإجراءات الأكثر استخداماً في إدارتك التعليمية
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          const content = (
            <div className="p-2.5 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:border-indigo-300 dark:hover:border-indigo-600/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all duration-150 flex flex-col items-center text-center gap-1.5 sm:gap-2 group min-h-[88px] sm:min-h-[96px] justify-center cursor-pointer select-none">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border shrink-0 ${act.color} group-hover:scale-105 transition-transform duration-150`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="w-full overflow-hidden">
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {act.label}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                  {act.description}
                </p>
              </div>
            </div>
          );

          if (act.href) {
            return (
              <Link
                key={act.label}
                href={act.href}
                aria-label={`${act.label} — ${act.description}`}
                className="outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={act.label}
              type="button"
              onClick={act.onClick}
              aria-label={`${act.label} — ${act.description}`}
              className="text-right outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
