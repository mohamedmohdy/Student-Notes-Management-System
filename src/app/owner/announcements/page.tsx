'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  PartyPopper,
  BookOpen,
  Lightbulb,
  Gift,
  X,
  Send,
  Calendar,
  Users,
} from 'lucide-react';
import { Announcement, AnnouncementType } from '@/lib/types';
import { formatDateArabic } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

const ANNOUNCEMENT_TYPE_CONFIG: Record<
  AnnouncementType,
  { label: string; icon: any; bg: string; text: string; border: string }
> = {
  general: {
    label: 'إعلان عام',
    icon: Megaphone,
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  event: {
    label: 'مناسبة وتهنئة',
    icon: PartyPopper,
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  update: {
    label: 'تحديث للمنصة',
    icon: BookOpen,
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  warning: {
    label: 'تنبيه مهم',
    icon: AlertTriangle,
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
  tip: {
    label: 'نصيحة وتوجيه',
    icon: Lightbulb,
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  offer: {
    label: 'عرض خاص',
    icon: Gift,
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

export default function OwnerAnnouncementsPage() {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<AnnouncementType>('general');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/owner/announcements?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAnnouncements(data.announcements || []);
    } catch (e: any) {
      toast.error(e.message || 'فشل جلب الإعلانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormTitle('');
    setFormContent('');
    setFormType('general');
    setFormIsPublished(true);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormType(ann.type);
    setFormIsPublished(ann.is_published === 1);
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('يرجى كتابة عنوان ونص الإعلان');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingAnnouncement
        ? `/api/owner/announcements/${editingAnnouncement.id}`
        : '/api/owner/announcements';
      const method = editingAnnouncement ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          content: formContent.trim(),
          type: formType,
          is_published: formIsPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'تم حفظ الإعلان بنجاح');
      setIsCreateModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/owner/announcements/${id}/toggle`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث حالة النشر');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/owner/announcements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      setDeletingId(null);
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message || 'فشل حذف الإعلان');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-amber-500" />
            <span>📢 الإعلانات والتنبيهات العامة للمعلمين</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            نشر رسائل، تهاني، تنبيهات وتحديثات تظهر في لوحة تحكم جميع المعلمين النشطين
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>📢 إنشاء إعلان جديد</span>
          </button>

          <button
            onClick={fetchAnnouncements}
            className={heroTheme.button.ghost}
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري تحميل الإعلانات...</p>
          </div>
        ) : announcements.length > 0 ? (
          announcements.map((ann) => {
            const config = ANNOUNCEMENT_TYPE_CONFIG[ann.type] || ANNOUNCEMENT_TYPE_CONFIG.general;
            const Icon = config.icon;
            return (
              <div
                key={ann.id}
                className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-start justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${config.bg} ${config.text} ${config.border} border flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${config.bg} ${config.text} ${config.border}`}>
                        {config.label}
                      </span>

                      {ann.is_published === 1 ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>منشور ونشط (Published)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black">
                          مسودة (Draft)
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-semibold">
                        {formatDateArabic(ann.created_at)}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white">{ann.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl whitespace-pre-line">
                      {ann.content}
                    </p>

                    <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>تمت القراءة بواسطة: {ann.reads_count || 0} معلم</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleTogglePublish(ann.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      ann.is_published === 1
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                    }`}
                  >
                    {ann.is_published === 1 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{ann.is_published === 1 ? 'إلغاء النشر' : 'نشر الآن'}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(ann)}
                    className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingId(ann.id)}
                    className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500">لا توجد إعلانات حالياً.</p>
            <button
              onClick={openCreateModal}
              className={heroTheme.button.primary + ' text-xs py-2 px-4'}
            >
              ➕ نشر أول إعلان للمعلمين
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-5 animate-in zoom-in-95 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {editingAnnouncement ? 'تعديل الإعلان العام' : 'إنشاء إعلان عام جديد للمعلمين'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">سيظهر في شريط التنبيهات لدى المعلمين المشتركين</p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان الإعلان *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: 🎉 كل عام وأنتم بخير بمناسبة شهر رمضان"
                  className={heroTheme.input}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع الإعلان *
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as AnnouncementType)}
                  className={heroTheme.select}
                >
                  <option value="general">📢 إعلان عام</option>
                  <option value="event">🎉 مناسبة وتهنئة</option>
                  <option value="update">📚 تحديث للمنصة</option>
                  <option value="warning">⚠️ تنبيه مهم</option>
                  <option value="tip">💡 نصيحة وتوجيه</option>
                  <option value="offer">🎁 عرض خاص</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نص ومحتوى الإعلان *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="اكتب تفاصيل الإعلان هنا بأسلوب واضح وجذاب..."
                  className={heroTheme.input + ' resize-none'}
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <input
                  type="checkbox"
                  id="pubCheck"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="pubCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  نشر الإعلان فوراً لجميع المعلمين (Active Published)
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={heroTheme.button.primary + ' flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600'}
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingAnnouncement ? 'حفظ التعديلات' : '📢 نشر الإعلان الآن'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={heroTheme.button.secondary + ' py-3'}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4">
            <h4 className="font-black text-base text-slate-900 dark:text-white">تأكيد حذف الإعلان</h4>
            <p className="text-xs text-slate-500">هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟</p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleDelete(deletingId)}
                className={heroTheme.button.danger + ' flex-1 py-2.5 text-xs'}
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className={heroTheme.button.secondary + ' py-2.5 text-xs'}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
