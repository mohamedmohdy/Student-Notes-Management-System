'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Edit2, Archive, Printer } from 'lucide-react';
import { Student } from '@/lib/types';
import { StudentStatusBadge } from './StudentStatusBadge';
import { Button } from '../UI/Button';

export interface StudentProfileHeaderProps {
  student: Student;
  onOpenAddNote: () => void;
  onOpenEditStudent: () => void;
  onOpenArchiveConfirm: () => void;
  onPrintReport?: () => void;
}

export function StudentProfileHeader({
  student,
  onOpenAddNote,
  onOpenEditStudent,
  onOpenArchiveConfirm,
  onPrintReport,
}: StudentProfileHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Back Navigation */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لدليل الطلاب</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-indigo-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none shrink-0">
              {student.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {student.name}
                </h1>
                <StudentStatusBadge status={student.status} />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                الرقم الأكاديمي: <span className="font-bold text-slate-800 dark:text-slate-200">{student.student_number || 'غير محدد'}</span> •{' '}
                {student.grade_name || 'الصف'} - فصل {student.class_name || 'الفصل'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onPrintReport && (
              <Button
                type="button"
                onClick={onPrintReport}
                variant="secondary"
                size="md"
                leftIcon={<Printer className="w-4 h-4" />}
                className="gap-2 font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                طباعة التقرير
              </Button>
            )}

            <Button
              onClick={onOpenAddNote}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + إضافة ملاحظة
            </Button>

            <button
              type="button"
              onClick={onOpenEditStudent}
              className="min-h-[44px] min-w-[44px] p-2.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-center"
              title="تعديل بيانات الطالب"
              aria-label="تعديل بيانات الطالب"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenArchiveConfirm}
              className="min-h-[44px] min-w-[44px] p-2.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-center"
              title="أرشفة الطالب"
              aria-label="أرشفة الطالب"
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
