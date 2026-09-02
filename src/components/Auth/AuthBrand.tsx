'use client';

import React from 'react';
import { BookOpenCheck } from 'lucide-react';

export interface AuthBrandProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function AuthBrand({
  title = 'سجل الطالب الإلكتروني',
  subtitle = 'المنظومة الاحترافية لإدارة الصفوف والطلاب والملاحظات',
  icon,
}: AuthBrandProps) {
  return (
    <header className="text-center space-y-2.5">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-indigo-600 text-white shadow-md shadow-indigo-600/20 mx-auto">
        {icon || <BookOpenCheck className="w-7 h-7" />}
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
