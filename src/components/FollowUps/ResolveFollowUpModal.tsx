'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { useToast } from '../UI/Toast';
import { FollowUp, FollowUpStatus, Note } from '@/lib/types';
import { FOLLOWUP_STATUS_LABELS, formatDateArabic } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface ResolveFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  followUp: FollowUp | null;
}

export function ResolveFollowUpModal({
  isOpen,
  onClose,
  onSuccess,
  followUp,
}: ResolveFollowUpModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<FollowUpStatus>('completed');
  const [result, setResult] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (isOpen && followUp) {
      setStatus(followUp.status === 'pending' ? 'completed' : followUp.status);
      setResult(followUp.result || '');
      setAdditionalNotes(followUp.additional_notes || '');
    }
  }, [isOpen, followUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUp) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/follow-ups/${followUp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          result: result.trim() || null,
          additional_notes: additionalNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء تحديث المتابعة');

      toast.success('تم تحديث حالة المتابعة بنجاح');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تحديث المتابعة');
    } finally {
      setLoading(false);
    }
  };

  if (!followUp) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="متابعة حالة الطالب وإتمام الإجراء" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student & Note Info Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">{followUp.student_name}</h4>
            <span className="text-xs text-slate-500 font-semibold">{followUp.grade_name} - {followUp.class_name}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
            {followUp.note_content}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>تاريخ المتابعة المستهدف: <strong className="text-slate-700">{formatDateArabic(followUp.follow_up_date)}</strong></span>
          </div>
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">الحالة الجديدة للمتابعة *</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.entries(FOLLOWUP_STATUS_LABELS).map(([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key as FollowUpStatus)}
                className={`p-2.5 min-h-[48px] rounded-xl text-xs font-bold border transition text-center flex items-center sm:flex-col justify-center gap-2 sm:gap-1.5 ${
                  status === key
                    ? `${val.bg} ${val.text} border-current shadow-xs font-black`
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {key === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                {key === 'still_needs_followup' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                {key === 'pending' && <Clock className="w-4 h-4 text-amber-600 shrink-0" />}
                <span>{val.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Result of Follow-up */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            نتيجة المتابعة / الإجراء الذي تم
          </label>
          <textarea
            rows={3}
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="مثال: تم الجلوس مع الطالب ومراجعة مستواه، لوحظ تحسن ملحوظ في الأداء..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 resize-none"
          ></textarea>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            ملاحظات وتوصيات إضافية (اختياري)
          </label>
          <textarea
            rows={2}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="أي توصيات لولي الأمر أو المعلمين الآخرين..."
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 resize-none"
          ></textarea>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التحديث'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
