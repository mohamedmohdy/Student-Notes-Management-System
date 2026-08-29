'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpenCheck, Lock, Mail, ArrowLeft, ShieldCheck, Sparkles, Flame, Tag } from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';
import { PricingInfo, LoginBannerSettings } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<LoginBannerSettings | null>(null);

  useEffect(() => {
    fetch('/api/settings/login-banner')
      .then((res) => res.json())
      .then((data) => {
        if (data.banner) setBanner(data.banner);
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');

      toast.success('أهلاً بك، تم تسجيل الدخول بنجاح');
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-950/10 border border-slate-200/80 dark:border-slate-800 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-xl shadow-indigo-500/25">
            <BookOpenCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">سجل الطالب الإلكتروني</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              المنظومة الاحترافية لمتابعة الصفوف والطلاب والملاحظات
            </p>
          </div>
        </div>

        {/* Dynamic Pricing & Offer Card Managed from Owner Dashboard */}
        {banner && banner.isActive && (
          <div className="animate-in fade-in duration-300">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-2 text-right shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>{banner.badgeText || 'عرض خاص'}</span>
                </span>
                {banner.priceText && (
                  <div className="flex items-center gap-1 text-xs font-black text-amber-700 dark:text-amber-300">
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                    <span>{banner.priceText}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {banner.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  {banner.content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className={heroTheme.input}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={heroTheme.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={heroTheme.button.primary + ' w-full py-3.5'}
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            {!loading && <ArrowLeft className="w-4 h-4" />}
          </button>
        </form>

        {/* Admin Provisioning Notice */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold space-y-1">
          <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>نظام تسجيل المعلمين المعتمد</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            يتم تفعيل الحسابات بعد إتمام الشراء عبر إدارة المنصة.
          </p>
        </div>
      </div>
    </div>
  );
}
