'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, ChevronLeft } from 'lucide-react';
import { FollowUp } from '@/lib/types';
import { Badge } from '../UI/Badge';

export interface NeedsAttentionProps {
  urgentFollowUps?: FollowUp[];
  pendingCount?: number;
  onResolveFollowUp: (followUp: FollowUp) => void;
}

export function NeedsAttention({
  urgentFollowUps = [],
  pendingCount = 0,
  onResolveFollowUp,
}: NeedsAttentionProps) {
  const hasUrgent = urgentFollowUps.length > 0;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${hasUrgent ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'}`}>
            {hasUrgent ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
              يحتاج انتباهك
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              {hasUrgent ? `${urgentFollowUps.length} حالات عاجلة تتطلب تدخلك` : 'لا توجد حالات متأخرة حالياً'}
            </p>
          </div>
        </div>

        {pendingCount > 0 && (
          <Link
            href="/follow-ups"
            aria-label={`عرض كل المتابعات المعلقة (${pendingCount})`}
            className="inline-flex items-center gap-1 px-2.5 py-2 min-h-[44px] text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline rounded-xl"
          >
            <span>عرض كل المتابعات ({pendingCount})</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {hasUrgent ? (
        <div className="space-y-2.5">
          {urgentFollowUps.map((f) => (
            <div
              key={f.id}
              className="p-3.5 sm:p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
            >
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                    {f.student_name || 'طالب بحاجة لمتابعة'}
                  </span>
                  <Badge variant="danger" size="sm">عاجل</Badge>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1 font-medium">
                  {f.note_content || 'ملاحظة تستوجب اتخاذ إجراء'}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>موعد المتابعة: {f.follow_up_date || 'اليوم'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onResolveFollowUp(f)}
                aria-label={`معالجة حالة الطالب ${f.student_name || ''}`}
                className="w-full sm:w-auto self-stretch sm:self-center px-4 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs shrink-0 inline-flex items-center justify-center"
              >
                معالجة الحالة
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center space-y-1.5">
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            👏 كل المتابعات مكتملة وعلى ما يرام!
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            لا توجد مواعيد متابعة متأخرة أو حرجة تتطلب تدخلاً فورياً في فصولك اليوم.
          </p>
        </div>
      )}
    </div>
  );
}
