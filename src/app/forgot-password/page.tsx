'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, KeyRound, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الرمز');

      toast.success(data.message);
      setStep('otp');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      toast.error('يرجى إدخال رمز التحقق المكون من 6 أرقام المستلم على بريدك');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'رمز التحقق غير صحيح أو انتهت صلاحيته');

      toast.success('تم تأكيد رمز التحقق بنجاح');
      setStep('newPassword');
    } catch (err: any) {
      toast.error(err.message || 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('يجب أن تكون كلمة المرور 6 خانات على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تعيين كلمة المرور');

      toast.success('تم تعيين كلمة المرور الجديدة بنجاح! جاري التوجيه لتسجيل الدخول...');
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
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
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">استعادة حساب المعلم الآمن</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              إرسال رمز تحقق سري ومشفر مباشرة إلى حساب الجيميل
            </p>
          </div>
        </div>

        {/* Step 1: Input Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني المسجل في المنصة</label>
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
              <p className="text-[11px] text-slate-400 mt-1">سيتم إرسال رمز التحقق المكون من 6 أرقام إلى هذا البريد.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={heroTheme.button.primary + ' w-full py-3.5'}
            >
              {loading ? 'جاري إرسال الرمز للبريد...' : 'إرسال رمز التحقق إلى Gmail'}
              {!loading && <ArrowLeft className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* Step 2: Input 6-Digit OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-center space-y-1">
              <p className="text-xs text-indigo-950 font-bold">
                تم إرسال رمز التحقق بنجاح إلى:
              </p>
              <p className="text-xs font-mono font-bold text-indigo-600">{email}</p>
              <p className="text-[11px] text-slate-500">يرجى فتح بريدك الإلكتروني وإدخال الرمز المكون من 6 أرقام هنا.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">رمز التحقق السري (6 أرقام)</label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.5em] text-2xl font-black py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={heroTheme.button.primary + ' w-full py-3.5'}
            >
              {loading ? 'جاري التحقق من الرمز...' : 'تأكيد الرمز والمتابعة'}
              {!loading && <ArrowLeft className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              تغيير البريد الإلكتروني
            </button>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === 'newPassword' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور الجديدة</label>
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
              className={heroTheme.button.success + ' w-full py-3.5'}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
              {!loading && <CheckCircle2 className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* Back to login */}
        <div className="text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
          تذكرت كلمة المرور؟{' '}
          <Link href="/login" className="font-bold text-indigo-600 hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
