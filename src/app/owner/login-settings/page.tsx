'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  CheckCircle2,
  Eye,
  Tag,
  Flame,
  LayoutTemplate,
  Sliders,
} from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

export default function OwnerLoginSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priceText, setPriceText] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSettings = async () => {
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
        if (data.banner.updatedAt) {
          setLastUpdated(data.banner.updatedAt);
        }
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
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
      if (data.banner?.updatedAt) {
        setLastUpdated(data.banner.updatedAt);
      }
    } catch (err) {
      toast.error(err.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500">جاري تحميل إعدادات صفحة تسجيل الدخول...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 text-white shadow-xl shadow-amber-950/15 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-amber-100">
            <Sliders className="w-3.5 h-3.5" />
            <span>إعدادات الواجهة العامة (Global Platform Settings)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            إعدادات ورسالة صفحة تسجيل دخول المعلمين 🎨
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 font-semibold max-w-2xl leading-relaxed">
            تحكم ديناميكي كامل في رسالة العرض، السعر المعروض، ونصوص الترويج التي تظهر لجميع المعلمين في شاشة الدخول بدون تعديل أي كود.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-amber-500" />
                <span>تخصيص محتوى بطاقة العرض والأسعار</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                يتم حفظ هذه البيانات في قاعدة بيانات PostgreSQL وتنعكس فورياً على صفحة Login
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isActive ? '🟢 مفعلة وظاهرة' : '⚪ مخفية'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Status Switch Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
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
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isActive ? '-translate-x-5' : 'translate-x-0'}`}
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
                className={heroTheme.input}
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
                  required
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="مثال: عرض خاص، سعر التفعيل، إعلان هام"
                  className={heroTheme.input}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  السعر المعروض (Price Display):
                </label>
                <input
                  type="text"
                  required
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  placeholder="مثال: 50 ريال سعودي، 100 ريال، مجاني"
                  className={heroTheme.input}
                />
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تفاصيل ونص الرسالة الكامل:
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="مثال: احصل على التفعيل الكامل للمنظومة لمرة واحدة مدى الحياة بدون أي اشتراكات دورية لأول 5 مشتركين."
                className={heroTheme.input}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-400 font-semibold">
                {lastUpdated && (
                  <span>آخر تحديث: {new Date(lastUpdated).toLocaleDateString('ar-SA')} - {new Date(lastUpdated).toLocaleTimeString('ar-SA')}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className={heroTheme.button.primary + ' w-full sm:w-auto px-8 py-3.5 shadow-md shadow-amber-600/20 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات الآن'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300">
            <Eye className="w-4 h-4 text-amber-500" />
            <span>معاينة حية ومباشرة (Live Preview)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
              تحديث فوري
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-slate-100/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                صفحة تسجيل الدخول (/login)
              </p>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">سجل الطالب الإلكتروني</h4>
            </div>

            {isActive ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-2 text-right shadow-xs animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>{badgeText || 'عرض خاص'}</span>
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-700 dark:text-amber-300">
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                    <span>السعر: {priceText || '50 ريال'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {title || 'عنوان العرض الترويجي'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    {content || 'تفاصيل الرسالة والعرض الترويجي...'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 text-center space-y-1">
                <Eye className="w-6 h-6 text-slate-400 mx-auto opacity-50" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">البطاقة مخفية حالياً</p>
                <p className="text-[10px] text-slate-400">لن تظهر أي رسائل ترويجية للمعلمين في صفحة تسجيل الدخول.</p>
              </div>
            )}

            {/* Fake login inputs preview */}
            <div className="space-y-2 opacity-60 pointer-events-none">
              <div className="h-9 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 flex items-center text-[10px] text-slate-400">
                البريد الإلكتروني: teacher@school.edu
              </div>
              <div className="h-9 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 flex items-center text-[10px] text-slate-400">
                كلمة المرور: ••••••••
              </div>
              <div className="h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-xs">
                تسجيل الدخول
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}