'use client';

import React from 'react';
import { Settings } from 'lucide-react';

export function SettingsHeader() {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <Settings className="w-5 h-5" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          الإعدادات وإدارة البيانات
        </h1>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
        النسخ الاحتياطي الكامل، الاستعادة، استعراض العناصر المؤرشفة، وإعادة تشغيل الجولة التعريفية.
      </p>
    </div>
  );
}
