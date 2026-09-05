'use client';

import React, { useState } from 'react';
import { Note } from '@/lib/types';
import { NOTE_TYPE_LABELS, NOTE_PRIORITY_LABELS, FOLLOWUP_STATUS_LABELS, formatDateTimeArabic, formatDateArabic } from '@/lib/utils';
import { Clock, Calendar, CheckSquare, MoreVertical, Edit2, Archive } from 'lucide-react';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useToast } from '../UI/Toast';

interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onArchiveSuccess?: () => void;
  onResolveFollowUp?: (note: Note) => void;
}

export function NoteCard({ note, onEdit, onArchiveSuccess, onResolveFollowUp }: NoteCardProps) {
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const toast = useToast();

  const typeStyle = NOTE_TYPE_LABELS[note.type] || NOTE_TYPE_LABELS.other;
  const priorityStyle = NOTE_PRIORITY_LABELS[note.priority] || NOTE_PRIORITY_LABELS.medium;
  const { date, time } = formatDateTimeArabic(note.created_at);

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('تم أرشفة الملاحظة بنجاح');
      setShowArchiveConfirm(false);
      if (onArchiveSuccess) onArchiveSuccess();
    } catch {
      toast.error('حدث خطأ أثناء أرشفة الملاحظة');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <>
      <div className="relative p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-3.5 group">
        {/* Card Header: Type, Priority, Date & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
              {typeStyle.label}
            </span>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${priorityStyle.bg} ${priorityStyle.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`}></span>
              أولوية {priorityStyle.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-left text-slate-400 text-xs font-medium">
              <span>{date}</span>
              {time && <span className="mr-1.5">({time})</span>}
            </div>

            {/* Menu */}
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
              {onEdit && (
                <button
                  onClick={() => onEdit(note)}
                  className="p-1.5 min-h-[36px] min-w-[36px] text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center justify-center"
                  title="تعديل الملاحظة"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setShowArchiveConfirm(true)}
                className="p-1.5 min-h-[36px] min-w-[36px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition flex items-center justify-center"
                title="أرشفة الملاحظة"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Note Content */}
        <p className="text-slate-800 text-sm leading-relaxed font-normal whitespace-pre-line">
          {note.content}
        </p>

        {/* Action Taken Box if present */}
        {note.action_taken && (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
            <span className="font-bold text-slate-600">الإجراء المتخذ:</span>
            <p className="text-slate-700 leading-normal">{note.action_taken}</p>
          </div>
        )}

        {/* Follow-up Info Badge & Footer */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400">المعلم: <strong className="text-slate-600 font-bold">{note.teacher_name || 'أ. المعلم'}</strong></span>

          {note.requires_follow_up === 1 && note.follow_up && (
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${
                FOLLOWUP_STATUS_LABELS[note.follow_up.status].bg
              } ${FOLLOWUP_STATUS_LABELS[note.follow_up.status].text} ${
                FOLLOWUP_STATUS_LABELS[note.follow_up.status].border
              }`}>
                {FOLLOWUP_STATUS_LABELS[note.follow_up.status].label} ({formatDateArabic(note.follow_up.follow_up_date)})
              </span>

              {onResolveFollowUp && (
                <button
                  onClick={() => onResolveFollowUp(note)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition"
                >
                  متابعة
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchive}
        isLoading={archiving}
        title="أرشفة الملاحظة"
        message="هل أنت متأكد من رغبتك في أرشفة هذه الملاحظة؟ لن تُحذف نهائياً وستبقى محفوظة في سجل الأرشيف."
        confirmLabel="أرشفة الملاحظة"
      />
    </>
  );
}
