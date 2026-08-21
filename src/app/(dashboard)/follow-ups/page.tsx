'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, AlertTriangle, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { FollowUp, FollowUpStatus } from '@/lib/types';
import { ResolveFollowUpModal } from '@/components/FollowUps/ResolveFollowUpModal';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { FOLLOWUP_STATUS_LABELS, formatDateArabic, NOTE_TYPE_LABELS, NOTE_PRIORITY_LABELS } from '@/lib/utils';

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [resolvingFollowUp, setResolvingFollowUp] = useState<FollowUp | null>(null);

  const loadFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      const res = await fetch(`/api/follow-ups?${params.toString()}`);
      const data = await res.json();
      setFollowUps(data.followUps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadFollowUps();
  }, [loadFollowUps]);

  const tabs = [
    { id: 'all', label: 'كافة المتابعات' },
    { id: 'pending', label: 'تحتاج متابعة (قيد الانتظار)' },
    { id: 'completed', label: 'تمت المتابعة' },
    { id: 'still_needs_followup', label: 'ما زالت تحتاج متابعة' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">نظام المتابعات المدرسية المستمرة</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          متابعة الحالات السلوكية والأكاديمية، وتسجيل نتائج التدخل والإجراءات المتخذة
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl self-start">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : followUps.length === 0 ? (
        <EmptyState
          title="لا توجد متابعات مطابقة"
          description="الملاحظات التي يتم تحديد خيار (تحتاج متابعة) لها ستظهر تلقائياً في هذا القسم."
          icon={<Clock className="w-10 h-10" />}
        />
      ) : (
        <div className="space-y-4">
          {followUps.map((fu) => {
            const statusStyle = FOLLOWUP_STATUS_LABELS[fu.status] || FOLLOWUP_STATUS_LABELS.pending;
            const typeStyle = fu.note_type ? (NOTE_TYPE_LABELS[fu.note_type] || NOTE_TYPE_LABELS.other) : NOTE_TYPE_LABELS.other;

            return (
              <div
                key={fu.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-4"
              >
                {/* Header: Student name, class, status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center">
                      {fu.student_name?.charAt(0)}
                    </div>
                    <div>
                      <Link
                        href={`/students/${fu.student_id}`}
                        className="text-base font-extrabold text-slate-900 hover:text-indigo-600 transition"
                      >
                        {fu.student_name}
                      </Link>
                      <p className="text-xs text-slate-400 font-semibold">
                        رقم: {fu.student_number} • {fu.grade_name} - فصل {fu.class_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      {statusStyle.label}
                    </span>
                    <button
                      onClick={() => setResolvingFollowUp(fu)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      إتمام / تحديث الإجراء
                    </button>
                  </div>
                </div>

                {/* Original Note Box */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${typeStyle.bg} ${typeStyle.text}`}>
                      {typeStyle.label}
                    </span>
                    <span className="text-xs font-bold text-slate-500">نص الملاحظة الأصلية:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                    {fu.note_content}
                  </p>
                  {fu.action_taken && (
                    <p className="text-xs text-slate-500 font-medium">
                      الإجراء الأولي: <strong className="text-slate-700">{fu.action_taken}</strong>
                    </p>
                  )}
                </div>

                {/* Follow-up result if conducted */}
                {fu.result && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>نتيجة المتابعة المسجلة:</span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed font-medium">{fu.result}</p>
                    {fu.additional_notes && (
                      <p className="text-emerald-700 text-[11px]">ملاحظات إضافية: {fu.additional_notes}</p>
                    )}
                  </div>
                )}

                {/* Footer Dates */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 font-medium">
                  <span>تاريخ المتابعة المستهدف: <strong className="text-slate-700">{formatDateArabic(fu.follow_up_date)}</strong></span>
                  <span>المعلم المسؤول: <strong className="text-slate-700">{fu.teacher_name || 'أ. المعلم'}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ResolveFollowUpModal
        isOpen={!!resolvingFollowUp}
        onClose={() => setResolvingFollowUp(null)}
        onSuccess={loadFollowUps}
        followUp={resolvingFollowUp}
      />
    </div>
  );
}
