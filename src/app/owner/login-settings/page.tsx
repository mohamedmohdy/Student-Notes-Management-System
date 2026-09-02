'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Sparkles,
  LayoutTemplate,
  Tag,
  Flame,
} from 'lucide-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { Button } from '@/components/UI/Button';
import { useToast } from '@/components/UI/Toast';

export default function OwnerLoginSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priceText, setPriceText] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/settings/login-banner');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب الإعدادات');

      if (data.banner) {
        setTitle(data.banner.title || '');
        setContent(data.banner.content || '');
        setPriceText(data.banner.priceText || '');
        setBadgeText(data.banner.badgeText || '');
        setIsActive(data.banner.isActive !== undefined ? Boolean(data.banner.isActive) : true);
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/owner/settings/login-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          priceText,
          badgeText,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ الإعدادات');

      toast.success(data.message || 'تم حفظ التغييرات بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      {/* 1. Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            إعدادات ورسالة صفحة تسجيل الدخول
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          تحكم ديناميكي كامل في رسالة العرض، السعر المعروض، ونصوص الترويج التي تظهر لجميع المعلمين في شاشة الدخول.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={2} type="card" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Settings Form */}
          <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-amber-500" />
                <span>تخصيص محتوى بطاقة العرض والأسعار</span>
              </h3>

              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isActive ? '🟢 مفعلة وظاهرة' : '⚪ مخفية'}
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Toggle switch */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    إظهار بطاقة العرض في صفحة تسجيل الدخول
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    عند التعطيل، لن تظهر أي بطاقة عروض أو أسعار للمعلم في صفحة الدخول.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isActive ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان الرسالة / العرض الرئيسي:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: 🎉 عرض الإطلاق الحصري للمعلمين"
                  className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Badge & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نص الشارة العلوية (Badge):
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="مثال: ⚡ لفترة محدودة"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    النص السعري / الترويجي:
                  </label>
                  <input
                    type="text"
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                    placeholder="مثال: 50 ر.س لمرة واحدة"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تفاصيل الرسالة ومزايا الاشتراك:
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب نص المزايا والتفاصيل..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="primary" size="md" type="submit" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                معاينة حية كما تظهر في صفحة Login
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-indigo-500/10 to-purple-500/10 border border-amber-400/40 space-y-3">
              {badgeText && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{badgeText}</span>
                </div>
              )}

              <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                {title || 'عنوان العرض الترويجي'}
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                {content || 'تفاصيل الرسالة والمزايا ستظهر هنا للمعلم في شاشة الدخول.'}
              </p>

              {priceText && (
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">السعر المعروض:</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">{priceText}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
