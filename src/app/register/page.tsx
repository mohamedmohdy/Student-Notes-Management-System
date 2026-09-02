'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthShell, AuthBrand } from '@/components/Auth';
import { Button } from '@/components/UI/Button';

export default function RegisterPage() {
  return (
    <AuthShell>
      {/* Brand Header */}
      <AuthBrand
        title="تسجيل وتفعيل حسابات المعلمين"
        subtitle="المنظومة التعليمية المتكاملة لإدارة ومتابعة الطلاب"
        icon={<ShieldCheck className="w-7 h-7" />}
      />

      {/* Explanation Box */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-3 text-right">
        <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300">
          <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>آلية إنشاء وتفعيل الحساب:</span>
        </div>
        <ul className="space-y-2 text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>رسوم استخدام المنصة: <strong>50 ريال سعودي لمرة واحدة مدى الحياة</strong>.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>يقوم مسؤول المنصة (Owner) بإنشاء حسابك وإرسال بيانات الدخول مباشرة.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>لا يتطلب التسجيل أي اشتراكات دورية أو تجديد سنوي.</span>
          </li>
        </ul>
      </div>

      {/* Return to Login */}
      <div className="pt-2">
        <Link href="/login" className="block w-full">
          <Button variant="primary" size="lg" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            العودة لصفحة تسجيل الدخول
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}
