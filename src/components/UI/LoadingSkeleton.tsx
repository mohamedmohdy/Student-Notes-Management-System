'use client';

import React from 'react';

export interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'table' | 'profile' | 'metric' | 'list';
}

export function LoadingSkeleton({ count = 3, type = 'card' }: LoadingSkeletonProps) {
  if (type === 'metric') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
        {Array.from({ length: count || 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/4" />
        <div className="space-y-2.5">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-1/2" />
          <div className="h-8 bg-slate-100 dark:bg-slate-800/40 rounded-xl w-full" />
        </div>
      ))}
    </div>
  );
}
