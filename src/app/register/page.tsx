'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpenCheck, ShieldCheck, ArrowLeft, CreditCard } from 'lucide-react';
import { heroTheme } from '@/lib/heroui-theme';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-950/10 border border-slate-200/80 dark:border-slate-800 p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-xl shadow-indigo-500/25 mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">تسجيل وتفعيل حسابات المعلمين</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            يتم إنشاء وتفعيل حسابات المعلمين حصرياً من قِبل إدارة المنصة (Owner) بعد تأكيد سداد رسوم الاستخدام لمرة واحدة (50 ريال سعودي دائم).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300 font-semibold text-right space-y-2">
          <div className="flex items-center gap-2 font-black">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>كيفية الحصول على حساب مفعل:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
            <li>سداد رسوم المنصة (50 ريال دفعة واحدة مدى الحياة).</li>
            <li>يقوم مالك المنصة بإنشاء حسابك وإرسال بيانات الدخول إليك مباشرة.</li>
            <li>لا يمكن التسجيل الذاتي للحفاظ على خصوصية المنظومة.</li>
          </ul>
        </div>

        <Link
          href="/login"
          className={heroTheme.button.primary + ' w-full py-3.5'}
        >
          <span>العودة لصفحة تسجيل الدخول</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
