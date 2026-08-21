import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { heroTheme } from '@/lib/heroui-theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple';
  href?: string;
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
    bg: 'bg-cyan-50 dark:bg-cyan-950/60',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-100 dark:border-cyan-900/60',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-900/60',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo', href }: StatCardProps) {
  const c = colorStyles[color];

  const content = (
    <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-500/40 transition-all duration-300 flex items-center justify-between gap-4 group">
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        {subtitle && <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">{subtitle}</p>}
      </div>

      <div className={`w-12 h-12 rounded-2xl ${c.bg} ${c.text} ${c.border} border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
