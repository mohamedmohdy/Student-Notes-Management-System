'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bot, Bell } from 'lucide-react';
import { ThemeToggle } from '../UI/ThemeProvider';
import { AIDataAnalystModal } from '../AI/AIDataAnalystModal';
import { requestNotificationPermission, sendLocalNotification } from '@/lib/notifications';
import { useToast } from '../UI/Toast';

export interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenSearch: () => void;
  onOpenAddNote?: () => void;
  user: any;
}

export function Header({ onOpenSearch, user }: HeaderProps) {
  const toast = useToast();
  const [isAIAnalystOpen, setIsAIAnalystOpen] = useState(false);

  const handleNotificationClick = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sendLocalNotification('سجل الطالب الإلكتروني 🔔', {
        body: 'تم تفعيل التنبيهات بنجاح للمتابعات اليومية ومواعيد الملاحظات.',
      });
      toast.success('تم تفعيل التنبيهات بنجاح وإرسال إشعار تجريبي');
    } else {
      toast.error('يرجى السماح بالإشعارات من إعدادات المتصفح');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 transition-colors">
        {/* Global Search Trigger */}
        <div className="flex items-center flex-1 max-w-md">
          <button
            type="button"
            onClick={onOpenSearch}
            data-tour="search"
            className="flex items-center gap-2.5 px-3.5 py-2 min-h-[44px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-xs sm:text-sm font-semibold transition w-full justify-between group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition" />
              <span>بحث سريع عن طالب...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AI Assistant Trigger */}
          <button
            type="button"
            onClick={() => setIsAIAnalystOpen(true)}
            data-tour="ai-analyst"
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
            title="التحليل الذكي لبيانات المعلم"
          >
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">التحليل الذكي</span>
          </button>

          {/* Notifications Permission */}
          <button
            type="button"
            onClick={handleNotificationClick}
            className="min-h-[44px] min-w-[44px] p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-center"
            title="تفعيل الإشعارات"
            aria-label="تفعيل الإشعارات"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* AI Analyst Modal */}
      <AIDataAnalystModal isOpen={isAIAnalystOpen} onClose={() => setIsAIAnalystOpen(false)} />
    </>
  );
}
