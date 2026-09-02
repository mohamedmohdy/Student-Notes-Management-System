'use client';

import React from 'react';
import { User, UserStatus } from '@/lib/types';
import { formatDateArabic } from '@/lib/utils';
import { TeacherStatusBadge } from './TeacherStatusBadge';
import { Edit2, KeyRound, ShieldAlert, CheckCircle2, Trash2 } from 'lucide-react';

export interface TeacherCardProps {
  teacher: User;
  onEdit: (teacher: User) => void;
  onToggleStatus: (teacher: User, newStatus: UserStatus) => void;
  onChangePassword: (teacher: User) => void;
  onDelete: (teacher: User) => void;
  isUpdating?: boolean;
}

export function TeacherCard({
  teacher,
  onEdit,
  onToggleStatus,
  onChangePassword,
  onDelete,
  isUpdating = false,
}: TeacherCardProps) {
  const isPending = teacher.status === 'pending';
  const isActive = teacher.status === 'active';

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-500/40 transition-all duration-150 flex flex-col justify-between gap-4 group">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-black text-sm flex items-center justify-center border border-amber-100 dark:border-amber-900/60 shrink-0">
              {teacher.name.charAt(0)}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                {teacher.name}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                {teacher.email}
              </p>
            </div>
          </div>

          <TeacherStatusBadge status={teacher.status} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">الطلاب</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{teacher.students_count || 0}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">الملاحظات</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{teacher.notes_count || 0}</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between pt-1">
          <span>تاريخ التسجيل:</span>
          <span className="text-slate-700 dark:text-slate-300">{formatDateArabic(teacher.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1">
          {isPending ? (
            <button
              type="button"
              onClick={() => onToggleStatus(teacher, 'active')}
              disabled={isUpdating}
              className="px-3 py-1.5 min-h-[36px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تفعيل الحساب</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggleStatus(teacher, isActive ? 'disabled' : 'active')}
              disabled={isUpdating}
              className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-bold border transition flex items-center gap-1 ${
                isActive
                  ? 'border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  : 'border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isActive ? 'تعطيل' : 'إعادة تفعيل'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onChangePassword(teacher)}
            className="p-2 min-h-[36px] min-w-[36px] text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center justify-center"
            title="تغيير كلمة المرور"
            aria-label="تغيير كلمة المرور"
          >
            <KeyRound className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(teacher)}
            className="p-2 min-h-[36px] min-w-[36px] text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center justify-center"
            title="تعديل بيانات المعلم"
            aria-label="تعديل بيانات المعلم"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(teacher)}
            className="p-2 min-h-[36px] min-w-[36px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition flex items-center justify-center"
            title="حذف المعلم"
            aria-label="حذف المعلم"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
