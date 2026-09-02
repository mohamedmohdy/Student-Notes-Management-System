'use client';

import React from 'react';

export interface AuthShellProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export function AuthShell({ children, maxWidth = 'md' }: AuthShellProps) {
  const maxWClass = maxWidth === 'sm' ? 'max-w-sm' : maxWidth === 'lg' ? 'max-w-lg' : 'max-w-md';

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      <div className={`w-full ${maxWClass} bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200`}>
        {children}
      </div>
    </main>
  );
}
