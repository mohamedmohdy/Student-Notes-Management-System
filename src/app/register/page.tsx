'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpenCheck, Lock, Mail, User, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }
    if (password.length < 6) {
      toast.error('يجب أن تكون كلمة المرور 6 خانات على الأقل');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء الحساب');

      toast.success('تم إنشاء الحساب بنجاح! جاري التوجيه للوحة التحكم...');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'البريد الإلكتروني مسجل مسبقاً');
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إنشاء حساب معلم جديد</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              ابدأ في تنظيم صفوفك وفصولك ومتابعة طلابك إلكترونياً
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المعلم الكامل</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أ. محمد بن عبد الله الشمري"
                className={heroTheme.input}
              />
            </div>
          </div>

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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور (6 خانات على الأقل)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
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
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب وبدء الاستخدام'}
            {!loading && <ArrowLeft className="w-4 h-4" />}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center text-xs text-slate-500 font-medium">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="font-bold text-indigo-600 hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
