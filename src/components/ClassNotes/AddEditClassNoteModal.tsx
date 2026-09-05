'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Tag, Sparkles } from 'lucide-react';
import { ClassNote, ClassNoteType } from '@/lib/types';
import { CLASS_NOTE_TYPE_LABELS } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

interface AddEditClassNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: string;
  className: string;
  gradeName?: string;
  initialNote?: ClassNote | null;
}

export function AddEditClassNoteModal({
  isOpen,
  onClose,
  onSuccess,
  classId,
  className,
  gradeName,
  initialNote,
}: AddEditClassNoteModalProps) {
  const isEdit = !!initialNote;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ClassNoteType>('general');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title || '');
      setContent(initialNote.content);
      setType(initialNote.type);
      setNoteDate(initialNote.note_date || new Date().toISOString().split('T')[0]);
    } else {
      setTitle('');
      setContent('');
      setType('general');
      setNoteDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.warning('يرجى كتابة نص الملاحظة');
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/class-notes/${initialNote.id}` : '/api/class-notes';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          title: title.trim() || undefined,
          content: content.trim(),
          type,
          noteDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشلت العملية');
      }

      toast.success(isEdit ? 'تم تعديل ملاحظة الفصل بنجاح' : 'تم حفظ ملاحظة الفصل بنجاح');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الملاحظة');
    } finally {
      setLoading(false);
    }
  };

  const quickPhrases = [
    'الفصل متفاعل ومشارك جدًا أثناء الشرح.',
    'يوجد ضعف في الانضباط والالتزام بالتعليمات.',
    'تحسن ملحوظ في مستوى الواجبات والأداء.',
    'الطلاب متعاونون في الأنشطة الجماعية.',
    'يوجد تشتت أثناء الحصة ويحتاج إلى إعادة تنظيم.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-indigo-50/50 via-transparent to-transparent dark:from-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isEdit ? 'تعديل ملاحظة الفصل' : 'إضافة ملاحظة جديدة للفصل'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                فصل: <span className="font-bold text-indigo-600 dark:text-indigo-400">{className} {gradeName ? `(${gradeName})` : ''}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Note Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>نوع الملاحظة:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.entries(CLASS_NOTE_TYPE_LABELS) as [ClassNoteType, typeof CLASS_NOTE_TYPE_LABELS[ClassNoteType]][]).map(([key, val]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setType(key)}
                  className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center ${
                    type === key
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>تاريخ الملاحظة:</span>
            </label>
            <input
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className={heroTheme.input}
              required
            />
          </div>

          {/* Optional Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              عنوان الملاحظة <span className="text-slate-400 font-normal">(اختياري)</span>:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: متابعة تفاعل الحصة الثالثة..."
              className={heroTheme.input}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              نص الملاحظة <span className="text-rose-500">*</span>:
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب تفاصيل الملاحظة العامة عن الفصل وسلوك الطلاب ومستوى التفاعل..."
              className={`${heroTheme.input} resize-none`}
              required
            />
          </div>

          {/* Quick Suggestions */}
          {!isEdit && (
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>عبارات مقترحة سريعة:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickPhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setContent(phrase)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 transition text-right"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`${heroTheme.button.secondary} w-full sm:w-auto min-h-[44px] justify-center`}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${heroTheme.button.primary} w-full sm:w-auto min-h-[44px] justify-center`}
            >
              {loading ? 'جاري الحفظ...' : isEdit ? 'تحديث الملاحظة' : 'حفظ الملاحظة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
