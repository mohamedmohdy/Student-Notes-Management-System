'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpenCheck, Lock, Mail, ArrowLeft, KeyRound, Sparkles, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('يرجى إدخال البريد وكلمة المرور');
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
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('teacher@school.edu');
    setPassword('teacher123');
    toast.info('تم تعبئة بيانات حساب المعلم التجريبي');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-950/10 border border-slate-200/80 p-8 space-y-7 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-xl shadow-indigo-500/25">
            <BookOpenCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">سجل الطالب الإلكتروني</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              المنظومة الاحترافية لمتابعة الصفوف والطلاب والملاحظات
            </p>
          </div>
        </div>

        {/* Demo Fast Login Helper */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
          <div className="text-xs">
            <p className="font-bold text-indigo-950">حساب تجريبي جاهز للمعلم</p>
            <p className="text-indigo-600 text-[11px]">teacher@school.edu</p>
          </div>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className={heroTheme.button.flat}
          >
            تعبئة تلقائية
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">كلمة المرور</label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
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

        {/* Register Link */}
        <div className="text-center text-xs text-slate-500 font-medium">
          ليس لديك حساب بعد؟{' '}
          <Link href="/register" className="font-bold text-indigo-600 hover:underline">
            إنشاء حساب معلم جديد
          </Link>
        </div>
      </div>
    </div>
  );
}
