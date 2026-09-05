'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  X,
  Sparkles,
  RefreshCw,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  School,
  FileText,
  Lightbulb,
  Calendar,
  Flame,
} from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

interface AIDataAnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIDataAnalystModal({ isOpen, onClose }: AIDataAnalystModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly' | 'recommendations'>('overview');

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'general' }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'فشل جلب التحليل');
      setData(result);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تحليل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAnalysis();
    }
  }, [isOpen, fetchAnalysis]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp text-slate-900 dark:text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-transparent to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black">🤖 المساعد الذكي لتحليل البيانات</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold border border-indigo-200 dark:border-indigo-800">
                  AI Analyst
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                تحليل فوري دقيق مبني على بياناتك المسجلة حصرياً وبدون اختراع
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchAnalysis}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="تحديث التحليل"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`shrink-0 px-3 sm:px-4 py-2 min-h-[38px] rounded-xl text-xs font-extrabold transition ${
              activeTab === 'overview'
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📊 ملخص بياناتك
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`shrink-0 px-3 sm:px-4 py-2 min-h-[38px] rounded-xl text-xs font-extrabold transition ${
              activeTab === 'weekly'
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📅 تحليل هذا الأسبوع
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`shrink-0 px-3 sm:px-4 py-2 min-h-[38px] rounded-xl text-xs font-extrabold transition ${
              activeTab === 'recommendations'
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            💡 التوصيات الذكية
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">جاري تحليل بياناتك واستخراج المؤشرات التربوية...</p>
            </div>
          ) : data?.insufficientData ? (
            <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-300">لا توجد بيانات كافية لإجراء هذا التحليل حالياً</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 max-w-md mx-auto leading-relaxed">
                {data.message}
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
                      <p className="text-xs font-bold text-slate-400">إجمالي الطلاب</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{data?.overview?.totalStudents}</p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
                      <p className="text-xs font-bold text-slate-400">إجمالي الملاحظات</p>
                      <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{data?.overview?.totalNotes}</p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
                      <p className="text-xs font-bold text-slate-400">ملاحظات الفصول</p>
                      <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">{data?.overview?.totalClassNotes}</p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center">
                      <p className="text-xs font-bold text-slate-400">متابعات معلقة</p>
                      <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{data?.overview?.pendingFollowUps}</p>
                    </div>
                  </div>

                  {/* Insights Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Student Health */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>توزيع حالات الطلاب:</span>
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-600 dark:text-slate-400">🟢 طلاب في المسار الطبيعي:</span>
                          <span className="text-slate-900 dark:text-white font-black">{data?.studentDistribution?.normal || 0}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400">🌟 طلاب متميزون:</span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-black">{data?.studentDistribution?.excellent || 0}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-amber-600 dark:text-amber-400">🟡 يحتاجون متابعة وتدخل:</span>
                          <span className="text-amber-700 dark:text-amber-300 font-black">{data?.studentDistribution?.needs_followup || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Behavior & Trend */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                        <span>الاتجاه والمؤشرات:</span>
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-600 dark:text-slate-400">أكثر السلوكيات تسجيلاً:</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-black">{data?.insights?.topBehavior}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400">نسبة الملاحظات الإيجابية:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">{data?.insights?.positiveRatio}%</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-600 dark:text-slate-400">الاتجاه العام للبيانات:</span>
                          <span className="text-slate-900 dark:text-white font-black">{data?.insights?.generalTrend}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WEEKLY */}
              {activeTab === 'weekly' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-black text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>ملخص الأسبوع الحالي</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {data?.weekly?.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-400 font-bold">ملاحظات الطلاب</p>
                      <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">{data?.weekly?.notesThisWeek}</p>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-400 font-bold">ملاحظات الفصول</p>
                      <p className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">{data?.weekly?.classNotesThisWeek}</p>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-400 font-bold">متابعات جديدة</p>
                      <p className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400 mt-1">{data?.weekly?.followUpsThisWeek}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: RECOMMENDATIONS */}
              {activeTab === 'recommendations' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>توصيات تربوية ذكية مقترحة لمعلم الصفوف:</span>
                  </h4>

                  <div className="space-y-2.5">
                    {data?.recommendations?.map((rec: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3"
                      >
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-400 font-medium text-center sm:text-right">
            مبني على المعالجة الإحصائية لبيانات حسابك فقط 🔒
          </span>

          <button
            onClick={fetchAnalysis}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] sm:min-h-[38px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث التحليل</span>
          </button>
        </div>
      </div>
    </div>
  );
}
