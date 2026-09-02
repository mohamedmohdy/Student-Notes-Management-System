'use client';

import React from 'react';
import { Clock } from 'lucide-react';

export interface FollowUpsWorkspaceHeaderProps {
  totalCount?: number;
  pendingCount?: number;
}

export function FollowUpsWorkspaceHeader({
  totalCount = 0,
  pendingCount = 0,
}: FollowUpsWorkspaceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              نظام المتابعات المدرسية
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {totalCount} متابعة
            </span>
            {pendingCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/80 dark:border-amber-800/60">
                {pendingCount} معلقة
              </span>
            )}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          متابعة الحالات السلوكية والأكاديمية، وتسجيل نتائج التدخل والإجراءات المتخذة.
        </p>
      </div>
    </div>
  );
}
