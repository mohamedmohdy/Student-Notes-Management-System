'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Search, Plus, Bell, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { requestNotificationPermission, sendLocalNotification } from '@/lib/notifications';
import { useToast } from '@/components/UI/Toast';
import { ThemeToggle } from '@/components/UI/ThemeProvider';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenAddNote: () => void;
  user: any;
}

export function Header({ onToggleSidebar, onOpenSearch, onOpenAddNote, user }: HeaderProps) {
  const toast = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('تم تثبيت التطبيق بنجاح على جهازك!');
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      toast.info('لتثبيت التطبيق على الهاتف: اضغط خيارات المتصفح (⋮) ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen)');
    }
  };

  const handleNotificationClick = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sendLocalNotification('سجل الطالب الإلكتروني 🔔', {
        body: 'تم تفعيل التنبيهات بنجاح! ستتلقى إشعارات فورية بكل المتابعات اليومية ومواعيد الملاحظات.',
      });
      toast.success('تم تفعيل التنبيهات بنجاح وإرسال إشعار تجريبي');
    } else {
      toast.error('يرجى السماح بالإشعارات من إعدادات المتصفح');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden transition"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Global Search Bar trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-medium transition w-48 sm:w-80 justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition" />
            <span className="text-xs sm:text-sm">بحث سريع عن طالب...</span>
          </div>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
            Ctrl + K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Dark Mode Switcher */}
        <ThemeToggle />

        {/* PWA Mobile Install button */}
        <button
          onClick={handleInstallPwa}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-xs font-bold transition"
          title="تثبيت التطبيق على الهاتف أو الجهاز"
        >
          <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>تثبيت التطبيق 📱</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={handleNotificationClick}
          className="relative p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition"
          title="تفعيل وتفقد الإشعارات والتنبيهات"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>

        {/* Quick Add Note Button */}
        <button
          onClick={onOpenAddNote}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-indigo-200 dark:shadow-none transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">إضافة ملاحظة</span>
          <span className="sm:hidden">ملاحظة</span>
        </button>
      </div>
    </header>
  );
}
