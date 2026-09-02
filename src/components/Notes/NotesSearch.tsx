'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

export interface NotesSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function NotesSearch({
  value,
  onChange,
  placeholder = 'بحث في نص الملاحظة أو اسم الطالب...',
}: NotesSearchProps) {
  return (
    <div className="relative flex-1">
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-10 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute left-3 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg flex items-center justify-center transition"
          aria-label="مسح البحث"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
