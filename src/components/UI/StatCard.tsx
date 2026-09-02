'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  variant?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple';
  href?: string;
  trend?: string;
  badge?: string;
}

const colorStyles = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-100 dark:border-indigo-900/60',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/60',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900/60',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-100 dark:border-rose-900/60',
  },
  cyan: {
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-100 dark:border-sky-900/60',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-900/60',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  description,
  variant,
  icon: Icon,
  color = 'indigo',
  href,
  badge,
}: StatCardProps) {
  const c = colorStyles[color] || colorStyles.indigo;

  const content = (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-150 flex items-center justify-between gap-3 group">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{title}</p>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {value}
        </p>
        {(subtitle || description) && (
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
            {subtitle || description}
          </p>
        )}
      </div>

      <div
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border ${c.bg} ${c.text} ${c.border} group-hover:scale-105 transition-transform duration-150`}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`${title}: ${value} ${subtitle || description || ''}`}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}
