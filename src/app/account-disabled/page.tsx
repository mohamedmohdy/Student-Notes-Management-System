'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogOut, ShieldAlert } from 'lucide-react';
import { heroTheme } from '@/lib/heroui-theme';

export default function AccountDisabledPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/10 via-slate-50 dark:via-slate-950 to-slate-100 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-rose-950/10 border border-rose-200/80 dark:border-rose-900/40 p-8 space-y-7 animate-in fade-in zoom-in-95 duration-300 text-slate-900 dark:text-white text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 via-rose-700 to-red-600 text-white shadow-xl shadow-rose-500/25">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-extrabold text-xs border border-rose-300 dark:border-rose-800 inline-block">
            🔴 تم تعطيل الحساب (Disabled)
          </span>
          <h1 className="text-2xl font-black tracking-tight">الحساب معطل مؤقتاً</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            تم تعطيل هذا الحساب بواسطة إدارة المنصة. علماً بأن كافة بياناتك وطلابك وملاحظاتك محفوظة بالكامل ولم يتم حذفها.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          لإعادة تفعيل الحساب، يرجى التواصل مع مالك المنصة أو الدعم الفني.
        </div>

        <button
          onClick={handleLogout}
          className={heroTheme.button.danger + ' w-full py-3.5'}
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
