'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, RefreshCw, LogOut, CreditCard, CheckCircle2 } from 'lucide-react';
import { AuthShell, AuthBrand } from '@/components/Auth';
import { Button } from '@/components/UI/Button';
import { useToast } from '@/components/UI/Toast';

export default function PendingActivationPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
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
    } catch {
      toast.error('تعذر التحقق من حالة الحساب');
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <AuthShell maxWidth="lg">
      {/* Header */}
      <AuthBrand
        title={`أهلاً بك يا ${user?.name || 'أستاذنا الفاضل'}`}
        subtitle="تم تسجيل حسابك بنجاح وهو الآن بانتظار التفعيل من قِبل مسؤول المنصة."
        icon={<Clock className="w-7 h-7" />}
      />

      {/* Details Box */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-3 text-xs text-right">
        <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300">
          <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>تفاصيل التفعيل والاشتراك:</span>
        </div>
        <ul className="space-y-2 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>رسوم المنصة: <strong>50 ريال سعودي لمرة واحدة فقط مدى الحياة</strong>.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>بمجرد تأكيد المعاملة سيتحول حسابك تلقائياً إلى <strong>نشط 🟢</strong>.</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={checkStatus}
          disabled={loading}
          variant="primary"
          size="lg"
          className="w-full"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          {loading ? 'جاري التحقق من التفعيل...' : 'تحديث حالة الحساب الآن'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج والعودة لاحقاً</span>
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
