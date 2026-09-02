'use client';

import React from 'react';
import { Announcement, AnnouncementType } from '@/lib/types';
import { formatDateArabic } from '@/lib/utils';
import { Megaphone, PartyPopper, BookOpen, AlertTriangle, Lightbulb, Gift, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Badge } from '../UI/Badge';

export interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onTogglePublish: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeMap: Record<AnnouncementType, { label: string; icon: any; variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  general: { label: 'إعلان عام', icon: Megaphone, variant: 'primary' },
  event: { label: 'مناسبة وتهنئة', icon: PartyPopper, variant: 'info' },
  update: { label: 'تحديث المنصة', icon: BookOpen, variant: 'neutral' },
  warning: { label: 'تنبيه مهم', icon: AlertTriangle, variant: 'danger' },
  tip: { label: 'نصيحة وتوجيه', icon: Lightbulb, variant: 'success' },
  offer: { label: 'عرض خاص', icon: Gift, variant: 'warning' },
};

export function AnnouncementCard({
  announcement,
  onEdit,
  onTogglePublish,
  onDelete,
}: AnnouncementCardProps) {
  const isPublished = announcement.is_published === 1;
  const typeConfig = typeMap[announcement.type] || typeMap.general;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Badge variant={typeConfig.variant} size="sm">
            {typeConfig.label}
          </Badge>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            isPublished
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
          }`}>
            {isPublished ? '● منشور وظاهر للمعلمين' : '○ مخفي / مسودة'}
          </span>
        </div>

        <span className="text-[11px] font-semibold text-slate-400">
          {formatDateArabic(announcement.created_at)}
        </span>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
          {announcement.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
          {announcement.content}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => onTogglePublish(announcement.id)}
          className="px-3 py-1.5 min-h-[36px] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isPublished ? 'إخفاء الإعلان' : 'نشر الإعلان'}</span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(announcement)}
          className="p-2 min-h-[36px] min-w-[36px] text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-center"
          title="تعديل الإعلان"
          aria-label="تعديل الإعلان"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(announcement.id)}
          className="p-2 min-h-[36px] min-w-[36px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center justify-center"
          title="حذف الإعلان"
          aria-label="حذف الإعلان"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
