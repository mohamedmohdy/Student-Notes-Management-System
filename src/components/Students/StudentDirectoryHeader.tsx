'use client';

import React from 'react';
import { Users, Plus, FileSpreadsheet } from 'lucide-react';
import { Button } from '../UI/Button';

export interface StudentDirectoryHeaderProps {
  totalCount?: number;
  onOpenAddStudent: () => void;
  onOpenImport: () => void;
}

export function StudentDirectoryHeader({
  totalCount = 0,
  onOpenAddStudent,
  onOpenImport,
}: StudentDirectoryHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              دليل الطلاب
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {totalCount} طالب
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          إدارة سجلات الطلاب، البحث السريع، واستيراد القوائم وتدوين الملاحظات.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
        <Button
          onClick={onOpenImport}
          variant="outline"
          size="md"
          leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          className="w-full sm:w-auto justify-center text-xs sm:text-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
        >
          استيراد Excel
        </Button>

        <Button
          onClick={onOpenAddStudent}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto justify-center text-xs sm:text-sm min-h-[44px]"
        >
          إضافة طالب جديد
        </Button>
      </div>
    </div>
  );
}
