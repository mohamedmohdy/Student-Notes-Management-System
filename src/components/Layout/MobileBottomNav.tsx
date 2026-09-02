'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { teacherMobileBottomItems, isRouteActive } from './navigation.config';
import { MobileMoreDrawer } from './MobileMoreDrawer';

export interface MobileBottomNavProps {
  user: any;
}

export function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Check if current route is in the "More" section
  const isMoreActive =
    pathname.startsWith('/grades') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/support');

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 md:hidden flex items-center justify-around px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-lg select-none"
        aria-label="التنقل الرئيسي للهاتف"
      >
        {teacherMobileBottomItems.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(pathname, item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all duration-150 active:scale-95 ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  active ? 'bg-indigo-50 dark:bg-indigo-950/60' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-xs mt-0.5 tracking-tight font-bold">{item.label}</span>
            </Link>
          );
        })}

        {/* More Trigger Button */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          aria-label="المزيد من خيارات التنقل والخدمات"
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all duration-150 active:scale-95 ${
            isMoreActive
              ? 'text-indigo-600 dark:text-indigo-400 font-black'
              : 'text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1 rounded-lg transition-colors ${
              isMoreActive ? 'bg-indigo-50 dark:bg-indigo-950/60' : 'bg-transparent'
            }`}
          >
            <Menu className="w-5 h-5 shrink-0" />
          </div>
          <span className="text-xs mt-0.5 tracking-tight font-bold">المزيد</span>
        </button>
      </nav>

      {/* Slide-up More Drawer */}
      <MobileMoreDrawer isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} user={user} />
    </>
  );
}
