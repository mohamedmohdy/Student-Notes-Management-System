'use client';

import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '../UI/Button';

export interface NotesWorkspaceHeaderProps {
  totalCount?: number;
  onOpenAddNote: () => void;
}

export function NotesWorkspaceHeader({
  totalCount = 0,
  onOpenAddNote,
}: NotesWorkspaceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              سجل الملاحظات العام
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {totalCount} ملاحظة
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          استعراض، فلترة، وتدوين كافة الملاحظات السلوكية والأكاديمية للطلاب.
        </p>
      </div>

      <Button
        onClick={onOpenAddNote}
        variant="primary"
        size="md"
        leftIcon={<Plus className="w-4 h-4" />}
        className="w-full sm:w-auto justify-center min-h-[44px]"
      >
        تدوين ملاحظة جديدة
      </Button>
    </div>
  );
}
