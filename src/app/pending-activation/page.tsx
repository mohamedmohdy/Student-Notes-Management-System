'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ShieldCheck, RefreshCw, LogOut, CheckCircle2, AlertCircle, Sparkles, CreditCard, School } from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

export default function PendingActivationPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);

      if (data.user.role?.toUpperCase() === 'OWNER') {
        router.push('/owner');
      } else if (data.user.status === 'active') {
        toast.success('مبارك! تم تفعيل حسابك بنجاح. جاري نقلك للوحة التحكم...');
        setTimeout(() => router.push('/dashboard'), 1000);
      } else if (data.user.status === 'disabled') {
        router.push('/account-disabled');
      } else {
        toast.info('حسابك ما زال قيد المراجعة من قِبل مالك المنصة');
      }
    } catch (e) {
      toast.error('تعذر التحقق من حالة الحساب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-50 dark:via-slate-950 to-slate-100 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-amber-950/10 border border-amber-200/80 dark:border-amber-900/40 p-8 space-y-7 animate-in fade-in zoom-in-95 duration-300 text-slate-900 dark:text-white">
        {/* Status Icon Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-500 text-white shadow-xl shadow-amber-500/25 animate-pulse">
            <Clock className="w-10 h-10" />
          </div>
          <div>
            <span className="px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-xs border border-amber-300 dark:border-amber-800 inline-block mb-2">
              🟡 الحساب قيد المراجعة والتفعيل (Pending)
            </span>
            <h1 className="text-2xl font-black tracking-tight">أهلاً بك يا {user?.name || 'أستاذنا الفاضل'}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              تم تسجيل حسابك بنجاح وهو الآن بانتظار مراجعة عملية الشراء وتفعيله من قِبل مالك المنصة
            </p>
          </div>
        </div>

        {/* Purchase Policy Notice Card */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300">
            <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>تفاصيل تفعيل المنصة:</span>
          </div>
          <ul className="space-y-2 text-slate-700 dark:text-slate-300 font-medium list-disc list-inside">
            <li>رسوم المنصة: <strong>50 ريال سعودي لمرة واحدة فقط</strong>.</li>
            <li><strong>تفعيل دائم مدى الحياة:</strong> لا توجد أي اشتراكات شهرية أو سنوية ولا تاريخ انتهاء.</li>
            <li>بمجرد مراجعة عملية السداد من قِبل مالك المنصة، سيتحول حسابك تلقائياً إلى <strong>Active 🟢</strong>.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={checkStatus}
            disabled={loading}
            className={heroTheme.button.primary + ' w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-500/20'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'جاري التحقق من التفعيل...' : 'تحديث حالة الحساب الآن'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج والعودة لاحقاً</span>
          </button>
        </div>
      </div>
    </div>
  );
}
