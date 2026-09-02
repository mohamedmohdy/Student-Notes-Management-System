'use client';

import React from 'react';
import { BarChart3, FileSpreadsheet, Download, Printer } from 'lucide-react';
import { Button } from '../UI/Button';

export interface ReportsWorkspaceHeaderProps {
  onExportExcel: () => void;
  onExportCSV: () => void;
  onPrintPDF: () => void;
  exporting?: boolean;
}

export function ReportsWorkspaceHeader({
  onExportExcel,
  onExportCSV,
  onPrintPDF,
  exporting = false,
}: ReportsWorkspaceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            التقارير والتصدير
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
          تحليل سجلات الطلاب والملاحظات الموثقة، وتصدير التقارير المدرسية بصيغتي Excel و CSV أو الطباعة المباشرة كـ PDF.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          onClick={onPrintPDF}
          variant="outline"
          size="md"
          leftIcon={<Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          disabled={exporting}
          className="border-slate-200 dark:border-slate-700"
          aria-label="طباعة التقرير أو حفظ كملف PDF"
        >
          طباعة التقرير PDF
        </Button>

        <Button
          onClick={onExportCSV}
          variant="outline"
          size="md"
          leftIcon={<Download className="w-4 h-4" />}
          disabled={exporting}
          className="border-slate-200 dark:border-slate-700"
          aria-label="تصدير كملف CSV"
        >
          تصدير CSV
        </Button>

        <Button
          onClick={onExportExcel}
          variant="primary"
          size="md"
          leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-300" />}
          disabled={exporting}
          aria-label="تصدير كشف Excel شامل"
        >
          {exporting ? 'جاري المعالجة...' : 'تصدير كشف Excel'}
        </Button>
      </div>
    </div>
  );
}
