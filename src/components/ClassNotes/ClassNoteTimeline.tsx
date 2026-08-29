'use client';

import React, { useState } from 'react';
import { ClassNote } from '@/lib/types';
import { CLASS_NOTE_TYPE_LABELS, formatDateArabic } from '@/lib/utils';
import { Calendar, Edit3, Trash2, Clock, FileText } from 'lucide-react';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

interface ClassNoteTimelineProps {
  classNotes: ClassNote[];
  onEdit: (note: ClassNote) => void;
  onRefresh: () => void;
}

export function ClassNoteTimeline({ classNotes, onEdit, onRefresh }: ClassNoteTimelineProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const safeNotes = Array.isArray(classNotes) ? classNotes : [];

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/class-notes/${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل حذف الملاحظة');
      }
      toast.success('تم حذف ملاحظة الفصل بنجاح');
      setDeletingId(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setIsDeleting(false);
    }
  };

  if (safeNotes.length === 0) {
    return null;
  }

  return (
    <div className="relative pl-2 sm:pl-4 space-y-4 before:absolute before:right-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {safeNotes.map((note) => {
        const typeStyle = CLASS_NOTE_TYPE_LABELS[note.type] || CLASS_NOTE_TYPE_LABELS.general;
        const isUpdated = note.updated_at && note.updated_at !== note.created_at;

        return (
          <div key={note.id} className="relative flex items-start gap-3 sm:gap-4 group">
            {/* Dot Indicator */}
            <div className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-sm flex items-center justify-center shrink-0 z-10 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 transition duration-200">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>

            {/* Note Card */}
            <div className="flex-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/60 transition duration-200 space-y-3">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                    {typeStyle.label}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{formatDateArabic(note.note_date)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                  <button
                    onClick={() => onEdit(note)}
                    title="تعديل الملاحظة"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingId(note.id)}
                    title="حذف الملاحظة"
                    className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title if present */}
              {note.title && (
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  {note.title}
                </h4>
              )}

              {/* Content */}
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>

              {/* Timestamps Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>تاريخ التسجيل: {formatDateArabic(note.created_at)}</span>
                </div>

                {isUpdated && (
                  <span className="text-[10px] text-slate-400 italic">
                    (معدلة: {formatDateArabic(note.updated_at)})
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="حذف ملاحظة الفصل"
        message="هل أنت متأكد من رغبتك في حذف هذه الملاحظة نهائيًا؟ لن تتمكن من استرجاعها بعد الحذف."
        confirmText={isDeleting ? 'جاري الحذف...' : 'نعم، احذف الملاحظة'}
        isDangerous={true}
      />
    </div>
  );
}
