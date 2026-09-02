'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  GraduationCap,
  BarChart3,
  Settings,
  LifeBuoy,
  LogOut,
  User,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { ThemeToggle } from '../UI/ThemeProvider';
import { useToast } from '../UI/Toast';
import { isRouteActive } from './navigation.config';

export interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function MobileMoreDrawer({ isOpen, onClose, user }: MobileMoreDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.info('تم تسجيل الخروج بنجاح');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const moreLinks = [
    { label: 'الصفوف والفصول', href: '/grades', icon: GraduationCap },
    { label: 'التقارير والتصدير', href: '/reports', icon: BarChart3 },
    { label: 'الإعدادات والبيانات', href: '/settings', icon: Settings },
    { label: 'الدعم الفني والمساعدة', href: '/support', icon: LifeBuoy },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between pt-1 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center border border-indigo-200/80 dark:border-indigo-800/60">
              {user?.name ? user.name.charAt(0) : <User className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{user?.name || 'المعلم'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{user?.email || 'حساب نشط'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition flex items-center justify-center"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* More Navigation Links */}
        <div className="space-y-1 py-1">
          {moreLinks.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-4 py-3 min-h-[48px] rounded-xl font-bold text-sm transition ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </Link>
            );
          })}
        </div>

        {/* Logout Action */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-sm hover:bg-rose-100 transition active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>
      </div>
    </div>
  );
}
