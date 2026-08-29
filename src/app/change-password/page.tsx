'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Lock, CheckCircle2, ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

export default function ChangePasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('يجب أن تتكون كلمة المرور من 6 خانات على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة المرور');

      toast.success(data.message);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-50 dark:via-slate-950 to-slate-100 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-amber-950/10 border border-amber-200/80 dark:border-amber-900/40 p-8 space-y-7 animate-in fade-in zoom-in-95 duration-300 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-500 text-white shadow-xl shadow-amber-500/25">
            <KeyRound className="w-8 h-8" />
          </div>
          <div>
            <span className="px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-xs border border-amber-300 dark:border-amber-800 inline-block mb-2">
              🔒 يلزم تعيين كلمة مرور جديدة
            </span>
            <h1 className="text-2xl font-black tracking-tight">تعيين كلمة المرور الدائمة</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              تم تسجيل دخولك بكلمة مرور مؤقتة من إدارة المنصة. يرجى إنشاء كلمة مرور جديدة وخاصة بك للمتابعة.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={heroTheme.input}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              تأكيد كلمة المرور الجديدة
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={heroTheme.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={heroTheme.button.primary + ' w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-500/20'}
          >
            {loading ? 'جاري الحفظ والتفعيل...' : 'حفظ كلمة المرور والدخول للمنصة'}
            {!loading && <CheckCircle2 className="w-4 h-4" />}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>تسجيل الخروج والعودة لاحقاً</span>
        </button>
      </div>
    </div>
  );
}
