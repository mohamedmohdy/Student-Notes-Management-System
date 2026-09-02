'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, User } from 'lucide-react';
import { FollowUp } from '@/lib/types';
import { formatDateArabic } from '@/lib/utils';
import { FollowUpStatusBadge } from './FollowUpStatusBadge';
import { NoteTypeBadge } from '../Notes/NoteTypeBadge';
import { Button } from '../UI/Button';

export interface FollowUpCardProps {
  followUp: FollowUp;
  onResolve: (followUp: FollowUp) => void;
}

export function FollowUpCard({ followUp, onResolve }: FollowUpCardProps) {
  const isCompleted = followUp.status === 'completed';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-150 space-y-4">
      {/* Header: Student name, class, badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-sm flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 shrink-0">
            {followUp.student_name ? followUp.student_name.charAt(0) : <User className="w-5 h-5" />}
          </div>
          <div>
            <Link
              href={`/students/${followUp.student_id}`}
              className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition block truncate"
            >
              {followUp.student_name}
            </Link>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">
              #{followUp.student_number || 'بدون رقم'} • {followUp.grade_name || 'الصف'} - فصل {followUp.class_name || 'الفصل'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {followUp.note_type && <NoteTypeBadge type={followUp.note_type} />}
          <FollowUpStatusBadge status={followUp.status} />
        </div>
      </div>

      {/* Original Note Content */}
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
        <span className="font-bold text-slate-400 dark:text-slate-500 text-[11px] block">نص الملاحظة الأصلية:</span>
        <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-semibold">
          {followUp.note_content}
        </p>
        {followUp.action_taken && (
          <p className="text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-200/40 dark:border-slate-800">
            الإجراء الأولي: <strong className="text-slate-700 dark:text-slate-300">{followUp.action_taken}</strong>
          </p>
        )}
      </div>

      {/* Recorded Follow-up Result if any */}
      {followUp.result && (
        <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>نتيجة المتابعة:</span>
          </div>
          <p className="text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
            {followUp.result}
          </p>
          {followUp.additional_notes && (
            <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">ملاحظات: {followUp.additional_notes}</p>
          )}
        </div>
      )}

      {/* Footer Dates & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>تاريخ المتابعة: <strong className="text-slate-700 dark:text-slate-300">{formatDateArabic(followUp.follow_up_date)}</strong></span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => onResolve(followUp)}
            variant={isCompleted ? 'outline' : 'primary'}
            size="sm"
          >
            {isCompleted ? 'تحديث الإجراء' : 'معالجة المتابعة'}
          </Button>
        </div>
      </div>
    </div>
  );
}
