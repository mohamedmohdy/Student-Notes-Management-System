'use client';

import React from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '../UI/Button';

export interface DataBackupCardProps {
  onExport: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function DataBackupCard({
  onExport,
  onFileChange,
  fileInputRef,
}: DataBackupCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      {/* Export Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
            تصدير نسخة احتياطية كاملة
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            تنزيل ملف JSON آمن يحتوي على كافة الصفوف، الفصول، الطلاب، الملاحظات، وسجلات المتابعة الخاصة بك.
          </p>
        </div>
        <Button
          onClick={onExport}
          variant="primary"
          size="md"
          leftIcon={<Download className="w-4 h-4" />}
          className="w-full"
        >
          تنزيل ملف Backup (JSON)
        </Button>
      </div>

      {/* Restore Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
            <Upload className="w-5 h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
            استعادة نسخة احتياطية
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            رفع ملف النسخة الاحتياطية واسترجاع كافة البيانات والصفوف والطلاب المسجلين فورياً.
          </p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".json"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="md"
            leftIcon={<Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            className="w-full border-slate-200 dark:border-slate-700"
          >
            رفع ملف Backup واسترجاعه
          </Button>
        </div>
      </div>
    </div>
  );
}
