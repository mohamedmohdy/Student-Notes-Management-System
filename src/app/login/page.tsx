'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Sparkles, Flame, ShieldCheck, ArrowLeft } from 'lucide-react';
import { AuthShell, AuthBrand, PasswordInput } from '@/components/Auth';
import { Button } from '@/components/UI/Button';
import { useToast } from '@/components/UI/Toast';
import { LoginBannerSettings } from '@/lib/types';

export default function LoginPage() {
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
    if (!email.trim() || !password) {
      toast.error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');

      toast.success('أهلاً بك، تم تسجيل الدخول بنجاح');
      const target = data.redirectUrl || '/dashboard';
      window.location.href = target;
    } catch (err: any) {
      toast.error(err.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {/* Brand Header */}
      <AuthBrand />

      {/* Dynamic Promotion Banner (Managed by Owner) */}
      {banner && banner.isActive && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2 text-right">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{banner.badgeText || 'عرض خاص'}</span>
            </span>
            {banner.priceText && (
              <span className="text-xs font-black text-amber-700 dark:text-amber-300 font-mono">
                {banner.priceText}
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <h2 className="text-xs font-black text-slate-900 dark:text-slate-100">
              {banner.title}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              {banner.content}
            </p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5 text-right">
          <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            البريد الإلكتروني
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.edu"
              className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-left dir-ltr"
            />
          </div>
        </div>

        {/* Password */}
        <PasswordInput
          id="password"
          label="كلمة المرور"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {/* Submit CTA */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </Button>
        </div>
      </form>

      {/* Footer Info */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold space-y-1">
        <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>نظام تسجيل المعلمين المعتمد</span>
        </div>
        <p className="text-[11px] text-slate-400">
          يتم تفعيل الحسابات بعد إتمام الشراء عبر إدارة المنصة.
        </p>
      </div>

      <div className="text-center pt-1">
        <Link
          href="/register"
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          كيفية الحصول على حساب جديد؟
        </Link>
      </div>
    </AuthShell>
  );
}
