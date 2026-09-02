'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'flat' | 'bordered';
}

export function Card({
  className = '',
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs',
    interactive: 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-sm transition-all duration-150',
    flat: 'bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl',
    bordered: 'bg-transparent border border-slate-200 dark:border-slate-800 rounded-2xl',
  };

  return (
    <div className={`${variants[variant]} p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
