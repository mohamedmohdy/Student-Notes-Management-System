'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: User | null;
  onSuccess: () => void;
}

export function DeleteTeacherModal({ isOpen, onClose, teacher, onSuccess }: DeleteTeacherModalProps) {
  const toast = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !teacher) return null;

  const isConfirmed = isAcknowledged && confirmText.trim() === 'حذف';

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/owner/teachers/${teacher.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حذف المعلم');

      toast.success(data.message || 'تم حذف حساب المعلم وجميع سجلاته نهائياً');
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حذف المعلم');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setIsAcknowledged(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 shadow-2xl border border-rose-300 dark:border-rose-900 animate-in zoom-in-95 text-slate-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">حذف المعلم نهائيًا (Permanent Delete)</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">{teacher.name} ({teacher.email})</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="space-y-4 overflow-y-auto flex-1 py-2">
          {/* Warning Content */}
          <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2.5 text-xs text-rose-900 dark:text-rose-200 font-semibold leading-relaxed">
            <div className="flex items-center gap-2 font-black text-sm text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>تحذير شديد الأهمية: هذا الإجراء نهائي ولا يمكن التراجع عنه</span>
            </div>
            <p>
              سيؤدي هذا الإجراء إلى <strong>حذف الحساب نهائيًا</strong> وإزالة كافة البيانات المرتبطة بهذا المعلم فقط من قاعدة البيانات:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800 dark:text-rose-300">
              <li>كافة الفصول والصفوف الدراسية الخاصة به.</li>
              <li>كافة الطلاب وسجلاتهم وملاحظاتهم.</li>
              <li>ملاحظات الفصول وسجل المتابعات المستمرة.</li>
              <li>تذاكر الدعم الفني الخاصة بهذا المعلم.</li>
            </ul>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1">
              🔒 لن تتأثر بيانات المعلمين الآخرين أو إدارة المنصة إطلاقاً.
            </p>
          </div>

          {/* Step 1 Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => setIsAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-snug">
              أقر وأؤكد بأنني أرغب في حذف هذا المعلم وجميع سجلاته وبياناته نهائيًا من المنصة.
            </span>
          </label>

          {/* Step 2 Typing Safeguard */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              لتأكيد الحذف النهائي، اكتب كلمة <span className="font-mono text-rose-600 dark:text-rose-400 font-black">حذف</span> في المربع التالي:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="اكتب كلمة: حذف"
              disabled={!isAcknowledged}
              className={heroTheme.input}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleClose}
            disabled={loading}
            className={heroTheme.button.secondary + ' w-full sm:w-auto py-3 min-h-[44px] justify-center text-xs sm:text-sm'}
          >
            إلغاء
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className="w-full sm:w-auto flex-1 py-3 min-h-[44px] bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-rose-600/20 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'جاري الحذف النهائي...' : '🗑️ تأكيد الحذف النهائي'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
