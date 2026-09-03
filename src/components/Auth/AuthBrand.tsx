'use client';

import React from 'react';

export interface AuthBrandProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function AuthBrand({
  title = 'بسيطة — Basita',
  subtitle = 'المنظومة الاحترافية لإدارة الصفوف والطلاب وسجلات الملاحظات',
  icon,
}: AuthBrandProps) {
  return (
    <header className="text-center space-y-2.5">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mx-auto overflow-hidden p-1.5">
        {icon || <img src="/icon-192.png" alt="شعار بسيطة" className="w-full h-full object-contain" />}
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
