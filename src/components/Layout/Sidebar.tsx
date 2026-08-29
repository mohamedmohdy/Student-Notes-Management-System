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
  School,
  LifeBuoy,
} from 'lucide-react';
import { useToast } from '../UI/Toast';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const navItems = [
  { label: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard, tourKey: 'dashboard' },
  { label: 'الصفوف والفصول', href: '/grades', icon: GraduationCap, tourKey: 'grades' },
  { label: 'دليل الطلاب', href: '/students', icon: Users, tourKey: 'students' },
  { label: 'سجل الملاحظات', href: '/notes', icon: FileText, tourKey: 'notes' },
  { label: 'المتابعات المستمرة', href: '/follow-ups', icon: Clock, tourKey: 'follow-ups' },
  { label: 'التقارير والتصدير', href: '/reports', icon: BarChart3, tourKey: 'reports' },
  { label: 'الإعدادات والبيانات', href: '/settings', icon: Settings, tourKey: 'settings' },
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
                data-tour={item.tourKey}
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

          {/* Quick link for Class Notes in sidebar */}
          <Link
            href="/grades"
            onClick={onClose}
            data-tour="class-notes"
            className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all duration-200"
          >
            <School className="w-5 h-5 shrink-0 text-slate-400 dark:text-slate-500" />
            <span>ملاحظات الفصل</span>
          </Link>

          {/* Highlighted Glowing Technical Support Item */}
          <div className="pt-2">
            <Link
              href="/support"
              onClick={onClose}
              data-tour="support"
              className={`group relative flex items-center justify-between p-3.5 rounded-2xl font-black text-sm transition-all duration-300 border shadow-lg ${
                pathname === '/support'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white border-indigo-400 shadow-indigo-500/30'
                  : 'bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-indigo-50/90 dark:from-indigo-950/50 dark:via-purple-950/30 dark:to-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200/90 dark:border-indigo-800/80 hover:shadow-indigo-500/25 hover:border-indigo-400 hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
                    <LifeBuoy className="w-4 h-4 animate-pulse group-hover:rotate-45 transition duration-300" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
                </div>
                <div className="text-right">
                  <span className="block leading-none text-xs font-black">🛟 الدعم الفني</span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    نحن هنا لمساعدتك 🤝
                  </span>
                </div>
              </div>

              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-extrabold shadow-xs">
                متاح دائماً
              </span>
            </Link>
          </div>
        </nav>

        {/* User Footer & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-3 p-2 rounded-2xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200 dark:border-indigo-800">
                {user?.name?.charAt(0) || 'م'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {user?.name || 'المعلم'}
                </p>
                <p className="text-[11px] font-medium text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition shrink-0"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
