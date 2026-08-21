'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  FileText,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  BookOpenCheck,
} from 'lucide-react';
import { useToast } from '../UI/Toast';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const navItems = [
  { label: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
  { label: 'الصفوف والفصول', href: '/grades', icon: GraduationCap },
  { label: 'دليل الطلاب', href: '/students', icon: Users },
  { label: 'سجل الملاحظات', href: '/notes', icon: FileText },
  { label: 'المتابعات المستمرة', href: '/follow-ups', icon: Clock },
  { label: 'التقارير والتصدير', href: '/reports', icon: BarChart3 },
  { label: 'الإعدادات والبيانات', href: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.info('تم تسجيل الخروج');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 right-0 z-50 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200/80 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg text-slate-900 dark:text-white tracking-tight leading-none">
              Student Notes
            </h1>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">سجل الطالب الإلكتروني</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs mb-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center shrink-0 text-sm">
                {user?.name ? user.name.charAt(0) : 'م'}
              </div>
              <div className="truncate">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{user?.name || 'المعلم'}</p>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 truncate">{user?.email || 'teacher@school.edu'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40 transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
