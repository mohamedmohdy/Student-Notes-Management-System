'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  RefreshCw,
} from 'lucide-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import { AnnouncementCard } from '@/components/Owner';
import { Modal } from '@/components/UI/Modal';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { Button } from '@/components/UI/Button';
import { Announcement, AnnouncementType } from '@/lib/types';
import { useToast } from '@/components/UI/Toast';

export default function OwnerAnnouncementsPage() {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<AnnouncementType>('general');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
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
  }, [searchTerm, toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

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

      toast.success(data.message || 'تم تحديث حالة النشر');
      fetchAnnouncements();
    } catch (e: any) {
      toast.error(e.message || 'فشل التحديث');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/owner/announcements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'تم حذف الإعلان بنجاح');
      fetchAnnouncements();
    } catch (e: any) {
      toast.error(e.message || 'فشل الحذف');
    }
  };

  return (
    <PageContainer>
      {/* 1. Header with Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              إدارة الإعلانات والتنبيهات العامة
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {announcements.length} إعلان
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            نشر التحديثات، التنبيهات، والنصائح لكافة المعلمين في شاشاتهم الرئيسية.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          إنشاء إعلان جديد
        </Button>
      </div>

      {/* 2. Search */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في عنوان الإعلان أو محتواه..."
            className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition"
          />
        </div>

        <button
          type="button"
          onClick={fetchAnnouncements}
          className="p-2.5 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0"
          title="تحديث القائمة"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 3. Announcements List */}
      {loading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : announcements.length === 0 ? (
        <EmptyState
          title="لا توجد إعلانات مسجلة حتى الآن"
          description="ابدأ بإنشاء أول إعلان ليصل لجميع المعلمين في المنصة فوراً."
          actionLabel="+ إنشاء إعلان الآن"
          onAction={openCreateModal}
          icon={<Megaphone className="w-10 h-10" />}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
              onEdit={openEditModal}
              onTogglePublish={handleTogglePublish}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingAnnouncement ? 'تعديل الإعلان' : 'إنشاء إعلان عام جديد'}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              عنوان الإعلان:
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="مثال: 🎉 تحديث جديد في المنصة..."
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              نوع الإعلان:
            </label>
            <select
              value={formType}
              onChange={(e: any) => setFormType(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="general">إعلان عام</option>
              <option value="event">مناسبة وتهنئة</option>
              <option value="update">تحديث للمنصة</option>
              <option value="warning">تنبيه مهم</option>
              <option value="tip">نصيحة وتوجيه</option>
              <option value="offer">عرض خاص</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              نص الإعلان:
            </label>
            <textarea
              required
              rows={4}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="اكتب تفاصيل الإعلان هنا..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="md" onClick={() => setIsCreateModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ ونشر'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
