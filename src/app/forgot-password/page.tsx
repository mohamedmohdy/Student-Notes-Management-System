'use client';

import React from 'react';
import Link from 'next/link';
import { KeyRound, ArrowLeft, ShieldAlert } from 'lucide-react';
import { AuthShell, AuthBrand } from '@/components/Auth';
import { Button } from '@/components/UI/Button';

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      {/* Header */}
      <AuthBrand
        title="استعادة كلمة المرور"
        subtitle="إجراءات استعادة الدخول إلى حسابك التعليمي"
        icon={<KeyRound className="w-7 h-7" />}
      />

      {/* Info Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-medium space-y-2 text-right leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>سياسة الأمان والخصوصية:</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          لحماية بيانات وسجلات الطلاب، يتم تعيين وإعادة ضبط كلمات المرور بواسطة إدارة المنصة المركزية (Owner). يرجى التواصل مع مسؤول مدرستك لإعادة ضبط كلمة المرور.
        </p>
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
