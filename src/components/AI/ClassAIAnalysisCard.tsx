'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Sparkles, RefreshCw, School, Lightbulb, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ClassAIAnalysisCardProps {
  classId: string;
}

export function ClassAIAnalysisCard({ classId }: ClassAIAnalysisCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchClassAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'class', classId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'فشل التحليل');
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassAnalysis();
  }, [fetchClassAnalysis]);

  if (loading) {
    return (
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
        <span>جاري تحليل بيئة الفصل بالذكاء الاصطناعي...</span>
      </div>
    );
  }

  if (data?.insufficientData) {
    return (
      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-500" />
          <span>{data.message}</span>
        </div>
        <button onClick={fetchClassAnalysis} className="text-indigo-600 font-bold hover:underline">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-tr from-purple-50/50 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/30 border border-purple-100 dark:border-purple-950/60 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🤖 التحليل الذكي لمؤشرات الفصل</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-extrabold">
                {data?.metrics?.disciplineLevel}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              تفاعل ومشاركة الفصل: <span className="text-indigo-600 font-bold">{data?.metrics?.engagementLevel}</span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchClassAnalysis}
          className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition"
          title="تحديث التحليل"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recommendations */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>توجيهات الذكاء الاصطناعي لإدارة هذا الفصل:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {data?.recommendations?.map((rec: string, i: number) => (
            <div key={i} className="text-[11px] text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 leading-relaxed">
              {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
