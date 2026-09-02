'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import { ownerNavItems, isRouteActive } from '@/components/Layout/navigation.config';
import { ThemeToggle } from '@/components/UI/ThemeProvider';
import { useToast } from '@/components/UI/Toast';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => {
        if (!d.user) {
          router.push('/login');
          return;
        }
        const role = d.user.role?.toUpperCase();
        if (role !== 'OWNER' && role !== 'ADMIN') {
          toast.error('غير مصرح لك بالوصول: هذه اللوحة لمالك المنصة فقط');
          router.push('/dashboard');
          return;
        }
        setUser(d.user);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router, toast]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.info('تم تسجيل الخروج');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">جاري التحقق من صلاحيات المالك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Owner Sidebar */}
      <aside
        className={`fixed md:static top-0 bottom-0 right-0 z-50 w-64 lg:w-72 bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out select-none ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                لوحة المالك
              </h1>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">الإدارة المركزية للمنصة</p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 md:hidden rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Owner Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {ownerNavItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(pathname, item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                  active
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-extrabold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Owner Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                👑
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">مالك المنصة</p>
            </div>

            <button
              onClick={handleLogout}
              className="min-h-[40px] min-w-[40px] p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition flex items-center justify-center"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header for Owner Mobile / Actions */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 min-h-[44px] min-w-[44px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden transition flex items-center justify-center"
              aria-label="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-slate-700 dark:text-slate-300 md:hidden">لوحة المالك</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-12 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
