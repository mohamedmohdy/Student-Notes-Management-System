'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface GradeBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function GradeBreadcrumb({ items }: GradeBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 overflow-x-auto py-1">
      <Link
        href="/grades"
        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span>الصفوف والفصول</span>
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronLeft className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-700" />
            {isLast || !item.href ? (
              <span className="text-slate-800 dark:text-slate-200 truncate shrink-0">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate shrink-0"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
