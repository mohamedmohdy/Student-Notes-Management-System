'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  PartyPopper,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Gift,
  X,
  Check,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { Announcement, AnnouncementType } from '@/lib/types';
import { formatDateArabic } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';

const TYPE_STYLES: Record<
  AnnouncementType,
  { icon: any; gradient: string; border: string; badgeBg: string; badgeText: string; label: string }
> = {
  general: {
    icon: Megaphone,
    gradient: 'from-indigo-500/10 via-indigo-500/5 to-purple-500/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40',
    border: 'border-indigo-300 dark:border-indigo-800/60',
    badgeBg: 'bg-indigo-500 text-white',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    label: '📢 إعلان عام',
  },
  event: {
    icon: PartyPopper,
    gradient: 'from-purple-500/15 via-pink-500/10 to-amber-500/15 dark:from-purple-950/40 dark:via-pink-950/30 dark:to-amber-950/40',
    border: 'border-purple-300 dark:border-purple-800/60',
    badgeBg: 'bg-purple-600 text-white',
    badgeText: 'text-purple-700 dark:text-purple-300',
    label: '🎉 مناسبة وتهنئة',
  },
  update: {
    icon: BookOpen,
    gradient: 'from-blue-500/10 via-cyan-500/5 to-blue-500/10 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-blue-950/40',
    border: 'border-blue-300 dark:border-blue-800/60',
    badgeBg: 'bg-blue-600 text-white',
    badgeText: 'text-blue-700 dark:text-blue-300',
    label: '📚 تحديث جديد للمنصة',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-rose-500/15 via-amber-500/10 to-rose-500/15 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-rose-950/40',
    border: 'border-rose-300 dark:border-rose-800/60',
    badgeBg: 'bg-rose-600 text-white',
    badgeText: 'text-rose-700 dark:text-rose-300',
    label: '⚠️ تنبيه مهم',
  },
  tip: {
    icon: Lightbulb,
    gradient: 'from-emerald-500/10 via-teal-500/5 to-emerald-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-800/60',
    badgeBg: 'bg-emerald-600 text-white',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    label: '💡 نصيحة تربوية',
  },
  offer: {
    icon: Gift,
    gradient: 'from-amber-500/15 via-yellow-500/10 to-amber-500/15 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-950/40',
    border: 'border-amber-300 dark:border-amber-800/60',
    badgeBg: 'bg-amber-600 text-white',
    badgeText: 'text-amber-700 dark:text-amber-300',
    label: '🎁 عرض خاص',
  },
};

export function AnnouncementBanner() {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (data.announcements) {
        setAnnouncements(data.announcements);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/announcements/${id}/read`, { method: 'POST' });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: 1 } : a))
      );
    } catch (e) {}
  };

  const handleHide = async (id: string) => {
    try {
      await fetch(`/api/announcements/${id}/hide`, { method: 'POST' });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.info('تم إخفاء الإعلان من لوحتك');
    } catch (e) {
      toast.error('حدث خطأ');
    }
  };

  if (loading || announcements.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 animate-in fade-in duration-300">
      {announcements.map((ann) => {
        const style = TYPE_STYLES[ann.type] || TYPE_STYLES.general;
        const Icon = style.icon;
        const isUnread = ann.is_read === 0;

        return (
          <div
            key={ann.id}
            onClick={() => isUnread && handleMarkAsRead(ann.id)}
            className={`relative p-5 rounded-3xl bg-gradient-to-r ${style.gradient} border-2 ${style.border} shadow-sm backdrop-blur-md transition hover:shadow-md cursor-pointer group`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs ${style.badgeBg}`}>
                      {style.label}
                    </span>

                    {isUnread && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        <span>🔴 إعلان جديد</span>
                      </span>
                    )}

                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                      {formatDateArabic(ann.created_at)}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {ann.title}
                  </h3>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                    {ann.content}
                  </p>
                </div>
              </div>

              {/* Hide Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleHide(ann.id);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-xl transition shrink-0"
                title="إخفاء الإعلان من لوحتك"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
