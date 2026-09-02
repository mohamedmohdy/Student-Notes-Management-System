'use client';

import React from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import { Button } from '../UI/Button';

export interface GradesWorkspaceHeaderProps {
  totalCount?: number;
  onOpenAddGrade: () => void;
}

export function GradesWorkspaceHeader({
  totalCount = 0,
  onOpenAddGrade,
}: GradesWorkspaceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              الصفوف والفصول
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {totalCount} صف دراسي
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          استعراض المراحل الدراسية، إدارة الفصول، والوصول المباشر لسجلات الطلاب والملاحظات.
        </p>
      </div>

      <Button
        onClick={onOpenAddGrade}
        variant="primary"
        size="md"
        leftIcon={<Plus className="w-4 h-4" />}
      >
        إضافة صف دراسي جديد
      </Button>
    </div>
  );
}
