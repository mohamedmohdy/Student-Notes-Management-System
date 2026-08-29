'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Sparkles, RefreshCw, TrendingUp, Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/UI/Toast';

interface StudentAIAnalysisCardProps {
  studentId: string;
}

export function StudentAIAnalysisCard({ studentId }: StudentAIAnalysisCardProps) {
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'student', studentId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'فشل التحليل');
      setData(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentAnalysis();
  }, [fetchStudentAnalysis]);

  if (loading) {
    return (
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
        <span>جاري تحليل سجل الطالب بالذكاء الاصطناعي...</span>
      </div>
    );
  }

  if (data?.insufficientData) {
    return (
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 font-semibold">
          <Bot className="w-5 h-5 text-indigo-500 shrink-0" />
          <span>{data.message}</span>
        </div>
        <button
          onClick={fetchStudentAnalysis}
          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0"
        >
          إعادة التحليل
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-tr from-indigo-50/50 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-100 dark:border-indigo-950/60 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-100/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🤖 التحليل الذكي لحالة الطالب</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold">
                {data?.metrics?.improvement}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{data?.summary}</p>
          </div>
        </div>

        <button
          onClick={fetchStudentAnalysis}
          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition"
          title="تحديث التحليل"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400">الملاحظات الإيجابية</span>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{data?.metrics?.positiveNotes}</p>
        </div>

        <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400">ملاحظات التركيز</span>
          <p className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {(data?.metrics?.academicNotes || 0) + (data?.metrics?.behavioralNotes || 0)}
          </p>
        </div>

        <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400">المتابعات المعلقة</span>
          <p className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5">{data?.metrics?.pendingFollowUps}</p>
        </div>

        <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400">السلوك الأبرز</span>
          <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5 truncate">{data?.metrics?.topBehavior}</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>توصيات الذكاء الاصطناعي للمعلم:</span>
        </div>
        <div className="space-y-1.5">
          {data?.recommendations?.map((rec: string, i: number) => (
            <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-white/60 dark:bg-slate-800/40 p-2 rounded-xl">
              <span className="text-indigo-600 font-bold">•</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
